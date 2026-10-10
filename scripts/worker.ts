// scripts/worker.ts   run with: npx tsx --env-file=.env.local scripts/worker.ts
import { resolve } from 'node:path'
import { withTx } from '../lib/db'
import { evaluateOutbox, recordDecision, lockAdaptive } from '../lib/rules/evaluate'

export async function tick() {
  await withTx(async db => {
    await lockAdaptive(db)
    // Lock the due rows. A rewind or an automation cancel on the same row waits for us, then sees 'sent'.
    const due = (await db.query(
      `select id, contact_id from outbox
       where status = 'queued' and dispatch_after <= now()
       order by dispatch_after limit 200 for update skip locked`)).rows
    let sent = 0, blocked = 0
    for (const row of due) {
      const d = await evaluateOutbox(db, row.id)        // consent and eligibility, re-checked at the last moment
      if (!d.allow) {
        await db.query(`update outbox set status = 'cancelled', cancel_reason = $2::jsonb where id = $1`, [row.id, JSON.stringify(d)])
        await recordDecision(db, row.contact_id, row.id, 'cancelled', d)
        blocked++
        continue
      }
      await db.query(`update outbox set status = 'sent', dispatched_at = now() where id = $1`, [row.id])
      await db.query(
        `insert into contact_events (contact_id, type, payload)
         values ($1, 'campaign_received', jsonb_build_object('outbox_id', $2::text, 'simulated', true))`, [row.contact_id, row.id])
      sent++
    }
    await db.query(
      `update campaigns set status = case
         when exists (select 1 from outbox o where o.campaign_id = campaigns.id and o.status = 'sent') then 'sent'
         else 'cancelled' end
       where status = 'scheduled'
         and not exists (select 1 from outbox o where o.campaign_id = campaigns.id and o.status = 'queued')`)
    if (sent || blocked) console.log(`dispatched ${sent} simulated emails, blocked ${blocked}`)
  })
}
if (process.argv[1] && resolve(process.argv[1]) === resolve('scripts/worker.ts')) {
  let running = false
  setInterval(async () => {
    if (running) return
    running = true
    try { await tick() } catch (error) { console.error(error) } finally { running = false }
  }, 5000)
}
// 'failed' is reserved for a real email-provider adapter; simulated delivery cannot fail.
