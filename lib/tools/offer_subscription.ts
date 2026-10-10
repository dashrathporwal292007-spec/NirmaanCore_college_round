import { z } from 'zod'
import type { Tool } from '../agent/types'
import { logEvents } from '../agent/log'

const schema = z.object({ plan_name: z.string().min(1), contact_ids: z.array(z.string().uuid()).max(500) })
export const offerSubscription: Tool<z.infer<typeof schema>> = {
  name: 'offer_subscription', description: 'Offer a plan without charging money or activating it.',
  argsHelp: 'plan_name, contact_ids. Returns subscription_ids.', schema,
  reversibility: 'compensable', requiredRole: 'owner', minutesSaved: 10,
  async execute(a, ctx) {
    const plan = (await ctx.db.query(`select id from plans where name = $1`, [a.plan_name])).rows[0]
    if (!plan) throw new Error('Plan not found')
    const r = await ctx.db.query(
      `insert into subscriptions (contact_id, plan_id)
       select id, $2::uuid from contacts where id = any($1::uuid[]) and not unsubscribed
       on conflict (contact_id, plan_id) do nothing returning id, contact_id`, [a.contact_ids, plan.id])
    await logEvents(ctx, r.rows.map(x => x.contact_id), 'subscription_offered', { plan: a.plan_name })
    return { result: { subscription_ids: r.rows.map(x => x.id) },
      effects: [{ entity: 'subscription', action: `offered ${a.plan_name} (no charge)`, count: r.rows.length, moneyInr: 0 }],
      compensation: { subscription_ids: r.rows.map(x => x.id) } }
  },
  async compensate(c, ctx) {
    const active = await ctx.db.query(`select id from subscriptions where id = any($1::uuid[]) and status = 'active'`, [c.subscription_ids])
    await ctx.db.query(`delete from subscriptions where id = any($1::uuid[]) and status = 'offered'`, [c.subscription_ids])
    if (active.rowCount) return { note: 'Activated subscriptions were preserved.' }
  },
}
