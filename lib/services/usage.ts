// lib/services/usage.ts
import type { PoolClient } from 'pg'

export function recordUsage(db: PoolClient, subscriptionId: string, units: number) {
  if (!Number.isSafeInteger(units) || units <= 0) throw new Error('Usage units must be a positive integer')
  return db.query(`insert into usage_events (subscription_id, units) values ($1, $2)`, [subscriptionId, units])
}

/** Units beyond the plan's included units, priced per unit. */
export async function meteredAmount(db: PoolClient, subscriptionId: string) {
  const r = (await db.query(
    `select p.included_units, p.unit_price_inr, coalesce(sum(u.units), 0)::int as used
     from subscriptions s join plans p on p.id = s.plan_id
     left join usage_events u on u.subscription_id = s.id
     where s.id = $1 group by p.included_units, p.unit_price_inr`, [subscriptionId])).rows[0]
  if (!r) throw new Error('Subscription not found')
  return Math.max(r.used - r.included_units, 0) * r.unit_price_inr
}
