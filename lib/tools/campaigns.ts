// lib/tools/campaigns.ts   draft_campaign + schedule_campaign (Adaptive Launch version)
import { z } from 'zod'
import type { Tool } from '../agent/types'
import { logEvents } from '../agent/log'
import { fingerprint } from '../fingerprint'          // section 27

const draftSchema = z.object({
  name: z.string().min(3), subject: z.string().min(3), body: z.string().min(10),
  tag: z.string().min(1),                              // the audience: contacts carrying this tag
  webinar_id: z.string().uuid().optional(),            // body may use {{join_url}} and {{webinar_title}}
  kind: z.enum(['invite', 'reminder']).optional(),     // reminders skip people who have registered (rule engine)
})
export const draftCampaign: Tool<z.infer<typeof draftSchema>> = {
  name: 'draft_campaign',
  description: 'Create an email campaign draft aimed at contacts with a tag. Does not send. Use kind "reminder" for a reminder that should only reach people who have not registered.',
  argsHelp: 'name, subject, body (may contain {{join_url}}, {{webinar_title}}), tag (audience), webinar_id?, kind? ("invite" by default, or "reminder"). Returns campaign_id.',
  schema: draftSchema, reversibility: 'reversible', requiredRole: 'marketer', minutesSaved: 20,
  async execute(a, ctx) {
    const kind = a.kind ?? 'invite'
    let body = a.body
    if (a.webinar_id) {
      const w = (await ctx.db.query(`select title, join_url from webinars where id = $1`, [a.webinar_id])).rows[0]
      if (!w) throw new Error('webinar not found')
      body = body.replaceAll('{{join_url}}', w.join_url).replaceAll('{{webinar_title}}', w.title)
    }
    const c = (await ctx.db.query(
      `insert into campaigns (name, segment, subject, body, webinar_id, kind)
       values ($1, $2::jsonb, $3, $4, $5, $6) returning id`,
      [a.name, JSON.stringify({ tag: a.tag }), a.subject, body, a.webinar_id ?? null, kind])).rows[0]
    return {
      result: { campaign_id: c.id },
      effects: [{ entity: 'campaign', action: `${kind} draft created (nothing sent)`, count: 1, sample: [a.subject] }],
      compensation: { campaign_id: c.id },
    }
  },
  async compensate(c, ctx) {
    await ctx.db.query(`update campaigns set status = 'cancelled' where id = $1 and status = 'draft'`, [c.campaign_id])
  },
}

const schedSchema = z.object({
  campaign_id: z.string().uuid(),
  delay_minutes: z.number().int().min(0).max(1440).optional(),   // extra delay after the hold window (reminders)
})
export const scheduleCampaign: Tool<z.infer<typeof schedSchema>> = {
  name: 'schedule_campaign',
  description: 'Queue a drafted campaign for sending. Emails are held in the outbox before dispatch. delay_minutes postpones a reminder.',
  argsHelp: 'campaign_id (usually "$stepN.campaign_id"), delay_minutes? (extra minutes after the hold window, for reminders).',
  schema: schedSchema, reversibility: 'compensable', requiredRole: 'marketer', minutesSaved: 15,
  async execute({ campaign_id, delay_minutes }, ctx) {
    const c = (await ctx.db.query(`select * from campaigns where id = $1 for update`, [campaign_id])).rows[0]
    if (!c) throw new Error('campaign not found')
    if (c.status !== 'draft') throw new Error(`campaign is ${c.status}; only drafts can be scheduled`)
    const tag: string | undefined = c.segment?.tag
    if (!tag) throw new Error('campaign has no audience tag; refusing to send to everyone')

    const hold = Number(process.env.HOLD_MINUTES ?? 2) + (delay_minutes ?? 0)
    const dispatchAfter = new Date(ctx.now.getTime() + hold * 60_000).toISOString()
    const rows = (await ctx.db.query(
      `select id, name, unsubscribed from contacts where $1::text = any(tags) order by id`, [tag])).rows
    const targets = rows.filter(r => !r.unsubscribed)
    const fp = fingerprint(targets.map(t => t.id), c.subject, c.body)   // goes into the plan hash

    const ins = await ctx.db.query(
      `insert into outbox (campaign_id, contact_id, payload, dispatch_after)
       select $1::uuid, x, jsonb_build_object('subject', $2::text, 'body', $3::text), $4::timestamptz
       from unnest($5::uuid[]) as x returning id`,
      [campaign_id, c.subject, c.body, dispatchAfter, targets.map(t => t.id)])
    await ctx.db.query(`update campaigns set status = 'scheduled', scheduled_at = $2 where id = $1`, [campaign_id, dispatchAfter])
    await logEvents(ctx, targets.map(t => t.id), 'campaign_queued', { campaign_id, name: c.name, kind: c.kind })
    const outbox_ids = ins.rows.map(r => r.id)
    return {
      recipientIds: targets.map(t => t.id),
      result: { campaign_id, outbox_ids, recipients: targets.length },
      effects: [{ entity: 'email', action: `${c.kind} queued, held ${hold} min before sending`, count: targets.length,
                 recipients: targets.length, skipped: rows.length - targets.length, fingerprint: fp,
                 sample: targets.slice(0, 3).map(t => t.name) }],
      compensation: { campaign_id, outbox_ids },
    }
  },
  async compensate({ campaign_id, outbox_ids }, ctx) {
    // Cancel only what is still queued. Rows the automation already cancelled stay cancelled.
    const r = await ctx.db.query(
      `update outbox set status = 'cancelled', cancel_reason = '{"rule":"RUN_REWOUND"}'::jsonb
       where id = any($1::uuid[]) and status = 'queued' returning contact_id`, [outbox_ids])
    const sent = (await ctx.db.query(
      `select count(*)::int as n from outbox where id = any($1::uuid[]) and status = 'sent'`, [outbox_ids])).rows[0].n
    await ctx.db.query(`update campaigns set status = $2 where id = $1`, [campaign_id, sent > 0 ? 'sent' : 'cancelled'])
    await logEvents(ctx, r.rows.map(x => x.contact_id), 'campaign_cancelled', { campaign_id })
    if (sent > 0)
      return { note: `${sent} of ${outbox_ids.length} emails were already sent and cannot be recalled. Draft a correction email.` }
  },
}
