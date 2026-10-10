import assert from 'node:assert/strict'
import { pool, withRollback } from '../lib/db'
import { registerContacts, activateSubscription, closeWebinar } from '../lib/services/adaptive'
import { cancelIfBlocked } from '../lib/rules/evaluate'
import { recordUsage, meteredAmount } from '../lib/services/usage'
import { tick } from './worker'

async function main() {
  assert.equal(typeof tick, 'function') // importing the worker must not start its timer
  await withRollback(async db => {
    const row = (await db.query(`select o.id, o.contact_id, c.webinar_id from outbox o
      join campaigns c on c.id = o.campaign_id join contacts k on k.id = o.contact_id
      where c.kind = 'reminder' and o.status = 'queued' and not k.unsubscribed
      and not exists (select 1 from registrations r where r.webinar_id = c.webinar_id and r.contact_id = o.contact_id)
      and not exists (select 1 from contact_events e where e.contact_id = o.contact_id and e.type = 'automation_decision')
      and not exists (select 1 from subscriptions s where s.contact_id = o.contact_id and s.status = 'active')
      order by o.id limit 1`)).rows[0]
    assert.ok(row, 'Run smoke:adaptive first to provide eligible fixtures')
    await registerContacts(db, row.webinar_id, [row.contact_id])
    const reminder = (await db.query('select status, cancel_reason from outbox where id = $1', [row.id])).rows[0]
    const decisions = Number((await db.query(`select count(*) n from contact_events
      where contact_id = $1 and type = 'automation_decision'`, [row.contact_id])).rows[0].n)
    assert.equal(reminder.status, 'cancelled')
    assert.equal(reminder.cancel_reason.ruleId, 'REMINDER_REQUIRES_UNREGISTERED')
    assert.equal(decisions, 1)
    console.log(JSON.stringify({ contact_id: row.contact_id, reminder_status: reminder.status,
      ruleId: reminder.cancel_reason.ruleId, automation_decision_count: decisions }))
    await registerContacts(db, row.webinar_id, [row.contact_id])
    await activateSubscription(db, row.contact_id, 'Social Growth')
    await activateSubscription(db, row.contact_id, 'Social Growth')
    assert.equal(Number((await db.query(`select count(*) n from contact_events where contact_id = $1 and type = 'subscribed'`, [row.contact_id])).rows[0].n), 1)
    const sub = (await db.query(`select s.id, p.included_units from subscriptions s join plans p on p.id = s.plan_id where s.contact_id = $1 and s.status = 'active'`, [row.contact_id])).rows[0]
    await db.query('update plans set unit_price_inr = 3 where id = (select plan_id from subscriptions where id = $1)', [sub.id])
    await recordUsage(db, sub.id, sub.included_units + 7)
    assert.equal(await meteredAmount(db, sub.id), 21)
    assert.throws(() => recordUsage(db, sub.id, -1), /positive integer/)
    await db.query('update registrations set attended = true where contact_id = $1 and webinar_id = $2', [row.contact_id, row.webinar_id])
    await closeWebinar(db, row.webinar_id)
    assert.equal(Number((await db.query(`select count(*) n from pending_actions where contact_id = $1 and kind = 'offer'`, [row.contact_id])).rows[0].n), 0)
    // Repeated late cancellation reports one decision, even when called twice.
    await db.query(`update outbox set status = 'sent' where id = $1`, [row.id])
    assert.equal(await cancelIfBlocked(db, row.id), 'too_late')
    assert.equal(await cancelIfBlocked(db, row.id), 'too_late')
    assert.equal(Number((await db.query(`select count(*) n from contact_events where contact_id = $1 and payload->>'decision' = 'too_late'`, [row.contact_id])).rows[0].n), 1)
    console.log('ok supplemental: checkout idempotency, metering, subscriber exclusion, repeated late cancellation')
  })
  console.log('ALL GREEN (verification transaction rolled back)')
}
main().then(() => pool.end()).catch(async error => { console.error(error); await pool.end(); process.exitCode = 1 })
