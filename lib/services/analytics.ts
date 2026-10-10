import { withTx } from '../db'
import { registry } from '../tools/registry'

export async function analytics() {
  return withTx(async db => {
    await db.query('set transaction isolation level repeatable read, read only')
    const funnel = (await db.query(`select (select count(*)::int from contacts) leads,
      (select count(distinct contact_id)::int from registrations) registered,
      (select count(distinct contact_id)::int from registrations where attended) attended,
      (select count(distinct contact_id)::int from subscriptions where status = 'active') subscribed`)).rows[0]
    const campaigns = (await db.query(`select count(*) filter (where status = 'queued')::int queued,
      count(*) filter (where status = 'sent')::int sent, count(*) filter (where status = 'cancelled')::int cancelled,
      count(*) filter (where status = 'failed')::int failed,
      (select count(*)::int from engagement where opened) opened,
      (select count(*)::int from engagement where clicked) clicked from outbox`)).rows[0]
    const billing = (await db.query(`select
      (select coalesce(sum(p.price_inr),0)::int from subscriptions s join plans p on p.id=s.plan_id where s.status='active' and p.type='flat') mrr_inr,
      (select coalesce(sum(units),0)::int from usage_events) usage_units,
      (select coalesce(sum(amount_inr),0)::int from invoices where status='simulated_paid') invoiced_inr`)).rows[0]
    const steps = (await db.query(`select s.run_id, s.tool from run_steps s join agent_runs r on r.id=s.run_id
      where r.status='completed' and s.status in ('done','cannot_rewind') order by r.created_at desc, s.seq`)).rows
    const minutes = new Map<string, number>()
    for (const s of steps) minutes.set(s.run_id, (minutes.get(s.run_id) ?? 0) + (registry[s.tool]?.minutesSaved ?? 0))
    const by_run = [...minutes].map(([run_id, estimated_minutes]) => ({ run_id, estimated_minutes }))
    return { funnel, campaigns, billing, automation: { estimated_minutes_saved: by_run.reduce((n,r) => n+r.estimated_minutes,0), by_run },
      simulated: true, savings_are_estimates: true }
  })
}
