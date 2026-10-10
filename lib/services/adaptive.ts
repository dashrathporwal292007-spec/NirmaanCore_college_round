// lib/services/adaptive.ts
import type { PoolClient } from 'pg'
import { reevaluateQueued, recordDecision, lockAdaptive } from '../rules/evaluate'

export async function registerContacts(db: PoolClient, webinarId: string, contactIds: string[]) {
  await lockAdaptive(db)
  const r = await db.query(
    `insert into registrations (webinar_id, contact_id)
     select $1::uuid, x from unnest($2::uuid[]) as x
     on conflict (webinar_id, contact_id) do nothing returning contact_id`, [webinarId, contactIds])
  const ids: string[] = r.rows.map(x => x.contact_id)
  if (!ids.length) return ids                            // repeat request: no new rows, no second decision
  await db.query(`update contacts set status = 'registered' where id = any($1::uuid[]) and status in ('new','engaged')`, [ids])
  await db.query(
    `insert into contact_events (contact_id, type, payload)
     select unnest($1::uuid[]), 'webinar_registered', jsonb_build_object('webinar_id', $2::text)`, [ids, webinarId])
  for (const id of ids) await reevaluateQueued(db, id)
  return ids
}

export async function optOut(db: PoolClient, contactId: string) {
  await lockAdaptive(db)
  const r = await db.query(`update contacts set unsubscribed = true where id = $1 and not unsubscribed returning id`, [contactId])
  if (!r.rowCount) return                                // already opted out
  await db.query(`insert into contact_events (contact_id, type) values ($1, 'opted_out')`, [contactId])
  const w = await db.query(
    `update pending_actions set status = 'withdrawn' where contact_id = $1 and status = 'awaiting_approval' returning id, kind`, [contactId])
  for (const p of w.rows)
    await recordDecision(db, contactId, null, 'withdrawn', {
      ruleId: 'OPTED_OUT_BLOCKS_PROMO', reason: `Drafted ${p.kind} withdrawn because the contact opted out`, evidence: { pending_action_id: p.id } })
  await reevaluateQueued(db, contactId)
}

/** SIMULATED checkout: no card, no payment provider. Label it as simulated in the UI. */
export async function activateSubscription(db: PoolClient, contactId: string, planName: string) {
  await lockAdaptive(db)
  const plan = (await db.query(`select id, price_inr from plans where name = $1`, [planName])).rows[0]
  if (!plan) throw new Error(`plan "${planName}" not found`)
  const prior = (await db.query(`select status from subscriptions where contact_id = $1 and plan_id = $2`, [contactId, plan.id])).rows[0]
  const sub = (await db.query(
    `insert into subscriptions (contact_id, plan_id, status, started_at) values ($1, $2, 'active', now())
     on conflict (contact_id, plan_id) do update
       set status = 'active', started_at = coalesce(subscriptions.started_at, now())
     returning id`, [contactId, plan.id])).rows[0]
  const inv = await db.query(
    `insert into invoices (subscription_id, amount_inr, status, period)
     values ($1, $2, 'simulated_paid', to_char(now(), 'YYYY-MM'))
     on conflict (subscription_id, period) do nothing returning id`, [sub.id, plan.price_inr])
  await db.query(`update contacts set status = 'customer' where id = $1`, [contactId])
  if (prior?.status !== 'active' || inv.rowCount) await db.query(`insert into contact_events (contact_id, type, payload) values ($1, 'subscribed', $2::jsonb)`,
    [contactId, JSON.stringify({ plan: planName, simulated: true, invoice_created: !!inv.rowCount })])
  const w = await db.query(
    `update pending_actions set status = 'withdrawn' where contact_id = $1 and kind = 'offer' and status = 'awaiting_approval' returning id`, [contactId])
  for (const p of w.rows)
    await recordDecision(db, contactId, null, 'withdrawn', {
      ruleId: 'PROMO_REQUIRES_NOT_SUBSCRIBED', reason: 'Drafted offer withdrawn because the contact subscribed', evidence: { subscription_id: sub.id, pending_action_id: p.id } })
  await reevaluateQueued(db, contactId)
}

/** "End webinar": attendees get a drafted offer, no-shows a different drafted follow-up. Nothing is sent. */
export async function closeWebinar(db: PoolClient, webinarId: string) {
  await lockAdaptive(db)
  await db.query(`update webinars set status = 'done' where id = $1`, [webinarId])
  const rows = (await db.query(
    `select r.contact_id, r.attended from registrations r join contacts c on c.id = r.contact_id
     where r.webinar_id = $1 and not c.unsubscribed
       and (not r.attended or not exists (select 1 from subscriptions s where s.contact_id = r.contact_id and s.status = 'active'))`, [webinarId])).rows
  let drafted = 0
  for (const r of rows) {
    const kind = r.attended ? 'offer' : 'followup'
    const ruleId = r.attended ? 'ATTENDED_PREPARES_OFFER' : 'MISSED_PREPARES_FOLLOWUP'
    const ins = await db.query(
      `insert into pending_actions (kind, contact_id, webinar_id, rule_id, evidence)
       values ($1, $2, $3, $4, $5::jsonb) on conflict do nothing returning id`,
      [kind, r.contact_id, webinarId, ruleId, JSON.stringify({ webinar_id: webinarId, attended: r.attended })])
    if (ins.rowCount) {
      drafted++
      await recordDecision(db, r.contact_id, null, 'drafted', {
        ruleId, reason: r.attended ? 'Attended the webinar: subscription offer drafted for approval'
                                   : 'Registered but did not attend: follow-up drafted for approval',
        evidence: { webinar_id: webinarId, attended: r.attended } })
    }
  }
  return { drafted }
}
