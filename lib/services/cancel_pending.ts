import type { PoolClient } from 'pg'
import type { Actor } from '../agent/runner'
import { lockAdaptive } from '../rules/evaluate'

export async function cancelPending(db: PoolClient, runId: string, actor: Actor) {
  await lockAdaptive(db)
  const ids = (await db.query(`select jsonb_array_elements_text(result->'outbox_ids')::uuid id
    from run_steps where run_id = $1 and tool = 'schedule_campaign'`, [runId])).rows.map(r => r.id)
  const reason = { ruleId: 'CANCELLED_BY_USER', reason: 'User cancelled pending messages for this run',
    evidence: { run_id: runId, user_id: actor.id } }
  const cancelled = (await db.query(`update outbox set status = 'cancelled', cancel_reason = $2::jsonb
    where id = any($1::uuid[]) and status = 'queued' returning id, contact_id`, [ids, JSON.stringify(reason)])).rows
  for (const row of cancelled) await db.query(`insert into contact_events (contact_id, type, payload, run_id)
    values ($1, 'automation_decision', $2::jsonb, $3)`, [row.contact_id, JSON.stringify({ decision: 'cancelled',
      rule_id: reason.ruleId, reason: reason.reason, evidence: reason.evidence, outbox_id: row.id }), runId])
  const already_sent = Number((await db.query(`select count(*) n from outbox where id = any($1::uuid[]) and status = 'sent'`, [ids])).rows[0].n)
  await db.query(`update campaigns set status = case when exists (select 1 from outbox s where s.campaign_id = campaigns.id and s.status = 'sent') then 'sent' else 'cancelled' end
    where id in (select campaign_id from outbox where id = any($1::uuid[])) and status = 'scheduled'
      and not exists (select 1 from outbox q where q.campaign_id = campaigns.id and q.status = 'queued')`, [ids])
  await db.query(`insert into audit_log (actor, run_id, action, entity, after)
    values ($1, $2, 'cancel_pending', 'outbox', $3::jsonb)`, [`user:${actor.id}`, runId, JSON.stringify({ cancelled: cancelled.length, already_sent, ...reason })])
  return { cancelled: cancelled.length, already_sent }
}
