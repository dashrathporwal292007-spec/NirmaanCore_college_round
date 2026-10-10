// lib/services/pending.ts
import type { PoolClient } from 'pg'
import { can, Role } from '../agent/types'
import { lockAdaptive } from '../rules/evaluate'
import { fingerprint } from '../fingerprint'

const TEMPLATES = {
  offer:    { subject: 'Your Social Growth offer',
              body: 'Thanks for joining our session. Here is a Social Growth plan to keep your content going every month.' },
  followup: { subject: 'Sorry we missed you',
              body: 'We missed you at the session. Here is a short summary and a link to the next one.' },
} as const
export type PendingKind = keyof typeof TEMPLATES

export async function previewPending(db: PoolClient, webinarId: string, kind: PendingKind, lock = false) {
  if (lock) await lockAdaptive(db)
  const rows = (await db.query(
    `select p.contact_id, c.name from pending_actions p join contacts c on c.id = p.contact_id
     where p.webinar_id = $1 and p.kind = $2 and p.status = 'awaiting_approval' and not c.unsubscribed
       and ($2 <> 'offer' or not exists (select 1 from subscriptions s where s.contact_id = p.contact_id and s.status = 'active'))
     order by p.contact_id ${lock ? 'for update of p' : ''}`, [webinarId, kind])).rows
  const t = TEMPLATES[kind]
  return {
    recipients: rows.map(r => ({ id: r.contact_id as string, name: r.name as string })),
    subject: t.subject, body: t.body,
    fingerprint: fingerprint(rows.map(r => r.contact_id), t.subject, t.body),
  }
}

export async function approvePending(
  db: PoolClient, approver: { id: string; role: Role }, webinarId: string, kind: PendingKind, shownFingerprint: string,
) {
  if (!can(approver.role, 'owner')) throw new Error('Owner approval required')
  const p = await previewPending(db, webinarId, kind, true)        // recomputed now, row-locked
  if (p.fingerprint !== shownFingerprint) return { stale: true as const, preview: p }
  if (!p.recipients.length) return { approved: 0 }
  const hold = Number(process.env.HOLD_MINUTES ?? 2)
  const ids = p.recipients.map(r => r.id)
  const c = (await db.query(
    `insert into campaigns (name, segment, subject, body, webinar_id, kind, status, scheduled_at)
     values ($1, '{}'::jsonb, $2, $3, $4, $5, 'scheduled', now() + make_interval(mins => $6::int)) returning id`,
    [`${kind} (approved drafts)`, p.subject, p.body, webinarId, kind, hold])).rows[0]
  await db.query(
    `insert into outbox (campaign_id, contact_id, payload, dispatch_after)
     select $1::uuid, x, jsonb_build_object('subject', $2::text, 'body', $3::text), now() + make_interval(mins => $4::int)
     from unnest($5::uuid[]) as x`, [c.id, p.subject, p.body, hold, ids])   // the worker re-checks each row before sending
  await db.query(
    `update pending_actions set status = 'approved'
     where webinar_id = $1 and kind = $2 and status = 'awaiting_approval' and contact_id = any($3::uuid[])`, [webinarId, kind, ids])
  await db.query(
    `insert into contact_events (contact_id, type, payload)
     select unnest($1::uuid[]), 'automation_decision',
            jsonb_build_object('decision', 'approved', 'rule_id', 'OWNER_APPROVED_DRAFT',
              'evidence', jsonb_build_object('webinar_id', $4::text, 'fingerprint', $5::text), 'reason', 'Owner approved the drafted ' || $2::text, 'approved_by', $3::text)`,
    [ids, kind, approver.id, webinarId, p.fingerprint])
  await db.query(`insert into audit_log (actor, action, entity, after) values ($1, 'approve_pending', 'pending_actions', $2::jsonb)`,
    [`user:${approver.id}`, JSON.stringify({ webinarId, kind, recipients: ids.length })])
  return { approved: ids.length }
}
