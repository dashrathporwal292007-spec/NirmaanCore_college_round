// lib/rules/evaluate.ts
import type { PoolClient } from 'pg'

export type Decision =
  | { allow: true }
  | { allow: false; ruleId: string; reason: string; evidence: Record<string, unknown> }
// Single-workspace prototype: serialize adaptive mutations until each transaction ends.
export async function lockAdaptive(db: PoolClient) {
  await db.query('select pg_advisory_xact_lock(726238, 2)')
}

type Denied = { ruleId: string; reason: string; evidence: Record<string, unknown> }

const deny = (ruleId: string, reason: string, evidence: Record<string, unknown>): Decision =>
  ({ allow: false, ruleId, reason, evidence })

export async function evaluateOutbox(db: PoolClient, outboxId: string): Promise<Decision> {
  const row = (await db.query(
    `select o.contact_id, c.kind, c.webinar_id, k.unsubscribed
     from outbox o join campaigns c on c.id = o.campaign_id join contacts k on k.id = o.contact_id
     where o.id = $1`, [outboxId])).rows[0]
  if (!row) throw new Error('outbox row not found')

  // 1. Consent beats everything else.
  if (row.unsubscribed)
    return deny('OPTED_OUT_BLOCKS_PROMO', 'Contact has opted out of promotional messages',
                { contact_id: row.contact_id, unsubscribed: true })

  // 2. A reminder is only for people who have not registered.
  if (row.kind === 'reminder' && row.webinar_id) {
    const r = await db.query(
      `select registered_at from registrations where webinar_id = $1 and contact_id = $2`, [row.webinar_id, row.contact_id])
    if (r.rowCount)
      return deny('REMINDER_REQUIRES_UNREGISTERED', 'Contact already registered for this webinar',
                  { webinar_id: row.webinar_id, registered_at: r.rows[0].registered_at })
  }

  // 3. An offer is not for someone who already subscribed.
  if (row.kind === 'offer') {
    const s = await db.query(`select id from subscriptions where contact_id = $1 and status = 'active' limit 1`, [row.contact_id])
    if (s.rowCount)
      return deny('PROMO_REQUIRES_NOT_SUBSCRIBED', 'Contact already has an active subscription', { subscription_id: s.rows[0].id })
  }
  return { allow: true }
}

/** One timeline row (the visible reason) plus one audit row (actor = the rule, never a person). */
export async function recordDecision(
  db: PoolClient, contactId: string, outboxId: string | null,
  decision: 'cancelled' | 'too_late' | 'drafted' | 'approved' | 'withdrawn', d: Denied,
) {
  await db.query(
    `insert into contact_events (contact_id, type, payload) values ($1, 'automation_decision', $2::jsonb)`,
    [contactId, JSON.stringify({ decision, rule_id: d.ruleId, reason: d.reason, evidence: d.evidence, outbox_id: outboxId })])
  await db.query(
    `insert into audit_log (actor, action, entity, after) values ($1, $2, 'outbox', $3::jsonb)`,
    [`automation:${d.ruleId}`, `decision:${decision}`, JSON.stringify({ contact_id: contactId, outbox_id: outboxId, evidence: d.evidence })])
}

/** Cancel one queued message if a rule now blocks it. Safe to call repeatedly. */
export async function cancelIfBlocked(db: PoolClient, outboxId: string): Promise<'ok' | 'cancelled' | 'too_late' | 'noop'> {
  await lockAdaptive(db)
  await db.query('select id from outbox where id = $1 for update', [outboxId])
  const d = await evaluateOutbox(db, outboxId)
  if (d.allow) return 'ok'
  const denied: Denied = { ruleId: d.ruleId, reason: d.reason, evidence: d.evidence }
  const r = await db.query(
    `update outbox set status = 'cancelled', cancel_reason = $2::jsonb where id = $1 and status = 'queued' returning contact_id`,
    [outboxId, JSON.stringify(d)])
  if (r.rowCount) { await recordDecision(db, r.rows[0].contact_id, outboxId, 'cancelled', denied); return 'cancelled' }
  // Not queued any more: the worker got there first (it holds the row lock while it sends).
  const o = (await db.query(`select contact_id, status from outbox where id = $1`, [outboxId])).rows[0]
  if (o.status !== 'sent') return 'noop'
  const prior = await db.query(`select 1 from contact_events where contact_id = $1 and type = 'automation_decision'
    and payload->>'outbox_id' = $2 and payload->>'decision' = 'too_late' and payload->>'rule_id' = $3`,
    [o.contact_id, outboxId, denied.ruleId])
  if (prior.rowCount) return 'too_late'
  await recordDecision(db, o.contact_id, outboxId, 'too_late', { ...denied, reason: `${denied.reason}, but the message had already been sent` })
  return 'too_late'
}

/** Hook body: a customer changed, so re-check everything still queued for them. */
export async function reevaluateQueued(db: PoolClient, contactId: string) {
  const rows = (await db.query(
    `select id from outbox where contact_id = $1 and status = 'queued' order by dispatch_after`, [contactId])).rows
  const out: { outboxId: string; result: string }[] = []
  for (const r of rows) out.push({ outboxId: r.id, result: await cancelIfBlocked(db, r.id) })
  return out
}
