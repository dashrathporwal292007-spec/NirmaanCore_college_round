// lib/tools/create_webinar.ts  (creates the webinar AND its draft landing page)
import { z } from 'zod'
import type { Tool } from '../agent/types'

const schema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  starts_at: z.string().datetime({ offset: true }),   // ISO 8601 with offset
})
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)

export const createWebinar: Tool<z.infer<typeof schema>> = {
  name: 'create_webinar',
  description: 'Create a webinar with a draft registration landing page and a Jitsi join link.',
  argsHelp: 'title, description?, starts_at (ISO 8601 with timezone offset, must be in the future). Returns webinar_id, page_id, join_url.',
  schema, reversibility: 'reversible', requiredRole: 'marketer', minutesSaved: 25,
  async execute(a, ctx) {
    if (new Date(a.starts_at) <= ctx.now) throw new Error('starts_at must be in the future')
    const blocks = [
      { type: 'hero', headline: a.title, sub: a.description ?? '' },
      { type: 'webinar_signup' },          // resolved at render time via pages.id -> webinars.page_id
      { type: 'cta', label: 'Reserve my seat' },
    ]
    const page = (await ctx.db.query(
      `insert into pages (slug, title, blocks, status)
       values ($1::text || '-' || $4::text, $2, $3::jsonb, 'draft')
       returning id, slug`, [slugify(a.title), a.title, JSON.stringify(blocks), ctx.runId])).rows[0]
    const join_url = `https://meet.jit.si/nexus-${page.slug}`
    const w = (await ctx.db.query(
      `insert into webinars (title, description, starts_at, join_url, page_id)
       values ($1, $2, $3, $4, $5) returning id`,
      [a.title, a.description ?? null, a.starts_at, join_url, page.id])).rows[0]
    return {
      result: { webinar_id: w.id, page_id: page.id, join_url, slug: page.slug },
      effects: [
        { entity: 'webinar', action: 'created', count: 1, sample: [a.title] },
        { entity: 'page', action: 'created as draft', count: 1, sample: [`/s/${page.slug}`] },
      ],
      compensation: { webinar_id: w.id, page_id: page.id },
    }
  },
  async compensate(c, ctx) {                // archive, do not delete: keeps history and timeline links valid
    await ctx.db.query(`update webinars set status = 'archived' where id = $1`, [c.webinar_id])
    await ctx.db.query(`update pages set status = 'archived' where id = $1`, [c.page_id])
  },
}
