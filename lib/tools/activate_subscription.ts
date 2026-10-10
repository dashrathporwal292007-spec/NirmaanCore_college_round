import { z } from 'zod'
import type { Tool } from '../agent/types'
import { logEvents } from '../agent/log'
import { activateSubscription } from '../services/adaptive'

const schema = z.object({ contact_id: z.string().uuid(), plan_name: z.string().min(1).max(120) })
export const activateSubscriptionTool: Tool<z.infer<typeof schema>> = {
  name: 'activate_subscription', description: 'SIMULATED activation and invoice. Irreversible; requires separate owner approval and CONFIRM.',
  argsHelp: 'contact_id, plan_name. Returns subscription_id, invoice_id, invoice_created, amount_inr, simulated.',
  schema, reversibility: 'irreversible', requiredRole: 'owner', minutesSaved: 10,
  async execute(a, ctx) {
    const exists = await ctx.db.query('select id from contacts where id = $1', [a.contact_id])
    if (!exists.rowCount) throw new Error('Contact not found')
    const result = await activateSubscription(ctx.db, a.contact_id, a.plan_name)
    await logEvents(ctx, [a.contact_id], 'subscription_activated', { ...result, plan: a.plan_name })
    return { result, effects: [{ entity: 'subscription', action: `activated ${a.plan_name} (Simulated)`,
      count: 1, moneyInr: result.amount_inr }], compensation: null }
  },
}
