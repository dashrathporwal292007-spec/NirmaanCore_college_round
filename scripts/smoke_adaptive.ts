// scripts/smoke_adaptive.ts   run: npx tsx --env-file=.env.local scripts/smoke_adaptive.ts
import assert from 'node:assert/strict'
import { pool, withTx } from '../lib/db'
import { seed, USERS } from './seed'
import { demoPlan } from '../lib/agent/planner'
import { propose, decide } from '../lib/agent/runner'
import { registerContacts, optOut, activateSubscription, closeWebinar } from '../lib/services/adaptive'
import { cancelIfBlocked } from '../lib/rules/evaluate'
import { previewPending, approvePending } from '../lib/services/pending'
import { testWorkflow } from '../lib/services/scenario'
import { tick } from './worker'

const OWNER = { id: USERS.owner, role: 'owner' as const }
const MARKETER = { id: USERS.marketer, role: 'marketer' as const }
const q = async (sql: string, p: any[] = []) => (await pool.query(sql, p)).rows
const n = async (sql: string, p: any[] = []) => Number((await q(sql, p))[0].n)
const statusOf = async (contact: string, kind: string) => (await q(
  `select o.status, o.cancel_reason->>'ruleId' as rule from outbox o join campaigns c on c.id = o.campaign_id
   where o.contact_id = $1 and c.kind = $2 order by o.dispatch_after limit 1`, [contact, kind]))[0]
const pick = async (kind: string, skip: string[] = [], limit = 1) => (await q(
  `select o.contact_id from outbox o join campaigns c on c.id = o.campaign_id join contacts k on k.id = o.contact_id
   where c.kind = $1 and not k.unsubscribed and o.contact_id <> all($2::uuid[]) order by o.contact_id limit $3`,
  [kind, skip, limit])).map(r => r.contact_id as string)
const decisionsFor = (c: string) => n(`select count(*) n from contact_events where contact_id = $1 and type = 'automation_decision'`, [c])

async function main() {
  await seed()
  const p: any = await propose('demo', demoPlan(), MARKETER)
  assert.equal((await decide(p.runId, OWNER, 'approved') as any).status, 'completed')
  const webinar = (await q(`select id from webinars limit 1`))[0].id as string
  assert.equal(await n(`select count(*) n from outbox where status = 'queued'`), 74)   // 37 invites + 37 reminders
  const [X, Y, Z] = await pick('invite', [], 3)

  // 1. Registering cancels the pending reminder, with a recorded reason
  await withTx(db => registerContacts(db, webinar, [X]))
  const xr = await statusOf(X, 'reminder')
  assert.equal(xr.status, 'cancelled'); assert.equal(xr.rule, 'REMINDER_REQUIRES_UNREGISTERED')
  assert.equal((await statusOf(X, 'invite')).status, 'queued')
  const d1 = await decisionsFor(X); assert.equal(d1, 1)
  console.log('ok 1  registration cancelled the reminder, reason recorded')

  // 2. A repeat request creates nothing new
  assert.equal((await withTx(db => registerContacts(db, webinar, [X]))).length, 0)
  assert.equal(await decisionsFor(X), d1)
  console.log('ok 2  repeat registration is harmless')

  // 3. The worker rechecks consent at dispatch, even when no hook ran
  await q(`update contacts set unsubscribed = true where id = $1`, [Y])                  // simulate a missed hook
  await q(`update outbox set dispatch_after = now() - interval '1 minute'
           where campaign_id in (select id from campaigns where kind = 'invite')`)
  await tick()
  const yi = await statusOf(Y, 'invite')
  assert.equal(yi.status, 'cancelled'); assert.equal(yi.rule, 'OPTED_OUT_BLOCKS_PROMO')
  assert.equal(await n(`select count(*) n from contact_events where contact_id = $1 and type = 'campaign_received'`, [Y]), 0)
  assert.equal(await n(`select count(*) n from outbox o join campaigns c on c.id = o.campaign_id
                        where c.kind = 'invite' and o.status = 'sent'`), 36)
  console.log('ok 3  dispatch-time recheck blocked the opted-out contact, 36 sent')

  // 4. A cancellation that arrives after the send is recorded as too late
  await q(`update contacts set unsubscribed = true where id = $1`, [Z])
  const zRow = (await q(`select o.id from outbox o join campaigns c on c.id = o.campaign_id
                         where o.contact_id = $1 and c.kind = 'invite'`, [Z]))[0].id
  assert.equal(await withTx(db => cancelIfBlocked(db, zRow)), 'too_late')
  assert.equal(await n(`select count(*) n from contact_events where contact_id = $1 and payload->>'decision' = 'too_late'`, [Z]), 1)
  console.log('ok 4  too late is reported honestly')

  // 5. End webinar drafts offers for attendees and a different follow-up for no-shows
  const group = await pick('invite', [X, Y, Z], 10)
  await withTx(db => registerContacts(db, webinar, group))
  const attended = group.slice(0, 6)
  await q(`update registrations set attended = true where webinar_id = $1 and contact_id = any($2::uuid[])`, [webinar, attended])
  await withTx(db => closeWebinar(db, webinar))
  assert.equal(await n(`select count(*) n from pending_actions where kind = 'offer'`), 6)
  assert.equal(await n(`select count(*) n from pending_actions where kind = 'followup'`), 5)   // 4 no-shows + X
  assert.equal((await withTx(db => closeWebinar(db, webinar))).drafted, 0)                     // repeat: nothing new
  console.log('ok 5  drafts created once')

  // 6. Opting out withdraws a drafted offer
  await withTx(db => optOut(db, attended[0]))
  assert.equal(await n(`select count(*) n from pending_actions where kind = 'offer' and status = 'awaiting_approval'`), 5)
  console.log('ok 6  opt-out withdrew the draft')

  // 7. Approval is bound to the fingerprint and to the owner
  const prev = await withTx(db => previewPending(db, webinar, 'offer'))
  assert.equal(prev.recipients.length, 5)
  await withTx(db => optOut(db, attended[1]))                                          // audience changes after the preview
  const stale: any = await withTx(db => approvePending(db, OWNER, webinar, 'offer', prev.fingerprint))
  assert.equal(stale.stale, true)
  await assert.rejects(withTx(db => approvePending(db, MARKETER, webinar, 'offer', stale.preview.fingerprint)), /Owner/)
  const ok: any = await withTx(db => approvePending(db, OWNER, webinar, 'offer', stale.preview.fingerprint))
  assert.equal(ok.approved, 4)
  console.log('ok 7  stale approval refused, owner-only, fresh approval worked')

  // 8. Simulated checkout cancels that customer's pending offer and bills once
  const C = attended[2]
  await withTx(db => activateSubscription(db, C, 'Social Growth'))
  const co = await statusOf(C, 'offer')
  assert.equal(co.status, 'cancelled'); assert.equal(co.rule, 'PROMO_REQUIRES_NOT_SUBSCRIBED')
  await withTx(db => activateSubscription(db, C, 'Social Growth'))
  assert.equal(await n(`select count(*) n from invoices`), 1)
  console.log('ok 8  checkout cancelled the offer, one invoice')

  // 9. The scenario tester changes nothing
  const snap = async () => ({
    events: await n(`select count(*) n from contact_events`),
    queued: await n(`select count(*) n from outbox where status = 'queued'`),
    unsub: await n(`select count(*) n from contacts where unsubscribed`),
  })
  const before = await snap()
  const [T] = await pick('reminder', [X, Y, Z, ...group])
  const t = await testWorkflow(webinar, 'opts_out', T)
  assert.ok(t.messages.some((m: any) => m.status === 'cancelled'))
  assert.deepEqual(await snap(), before)
  console.log('ok 9  scenario tester left the database untouched')

  // 10. An agent run whose audience changes after the preview must be re-approved
  const p2: any = await propose('demo again', demoPlan(), MARKETER)
  assert.equal(p2.status, 'awaiting_approval')
  const W = (await q(`select id from contacts where 'trial' = any(tags) and not unsubscribed order by id desc limit 1`))[0].id
  await withTx(db => optOut(db, W))
  assert.equal((await decide(p2.runId, OWNER, 'approved') as any).changed, true)
  assert.equal((await decide(p2.runId, OWNER, 'approved') as any).status, 'completed')
  console.log('ok 10 stale agent preview refused, second approval ran')

  console.log('ALL GREEN')
}

main().then(() => pool.end()).catch(e => { console.error(e); process.exit(1) })
