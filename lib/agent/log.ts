// lib/agent/log.ts
import type { Ctx } from './types'

export async function logEvents(ctx: Ctx, contactIds: string[], type: string, payload: object = {}) {
  if (!contactIds.length) return
  await ctx.db.query(
    `insert into contact_events (contact_id, type, payload, run_id)
     select unnest($1::uuid[]), $2, $3::jsonb, $4`,
    [contactIds, type, JSON.stringify(payload), ctx.runId])
}

export async function audit(ctx: Ctx, action: string, entity: string, before: any, after: any) {
  await ctx.db.query(
    `insert into audit_log (actor, run_id, action, entity, before, after)
     values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
    [`agent(user:${ctx.user.id})`, ctx.runId, action, entity,
     JSON.stringify(before), JSON.stringify(after)])
}
