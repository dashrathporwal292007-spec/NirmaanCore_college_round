import { z } from 'zod'
import type { Tool } from '../agent/types'

const createSchema = z.object({
  title: z.string().min(3).max(120),
  template: z.enum(['business', 'webinar']),
  headline: z.string().min(1).max(160),
  sub: z.string().max(500).default(''),
  cta_label: z.string().min(1).max(80).default('Get started'),
})

export const createPage: Tool<z.infer<typeof createSchema>> = {
  name: 'create_page', description: 'Create a draft page using safe block JSON.',
  argsHelp: 'title, template (business or webinar), headline, sub?, cta_label?. Returns page_id, slug.',
  schema: createSchema, reversibility: 'reversible', requiredRole: 'marketer', minutesSaved: 15,
  async execute(a, ctx) {
    const blocks = [
      { type: 'hero', headline: a.headline, sub: a.sub },
      a.template === 'business' ? { type: 'form', fields: ['name', 'email'] } : { type: 'webinar_signup' },
      { type: 'cta', label: a.cta_label },
    ]
    const slug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
    const p = (await ctx.db.query(
      `insert into pages (slug, title, blocks) values ($1, $2, $3::jsonb) returning id, slug`,
      [`${slug}-${ctx.runId}`, a.title, JSON.stringify(blocks)])).rows[0]
    return { result: { page_id: p.id, slug: p.slug },
      effects: [{ entity: 'page', action: 'created as draft', count: 1, sample: [a.title] }],
      compensation: { page_id: p.id } }
  },
  async compensate(c, ctx) {
    await ctx.db.query(`update pages set status = 'archived' where id = $1`, [c.page_id])
  },
}

const publishSchema = z.object({ page_id: z.string().uuid() })
export const publishPage: Tool<z.infer<typeof publishSchema>> = {
  name: 'publish_page', description: 'Publish an existing page.', argsHelp: 'page_id. Returns page_id.',
  schema: publishSchema, reversibility: 'compensable', requiredRole: 'marketer', minutesSaved: 2,
  async execute({ page_id }, ctx) {
    const p = (await ctx.db.query(`select * from pages where id = $1 for update`, [page_id])).rows[0]
    if (!p || p.status === 'archived') throw new Error('Page not found or archived')
    const changed = p.status !== 'published'
    if (changed) await ctx.db.query(`update pages set status = 'published', version = version + 1 where id = $1`, [page_id])
    return { result: { page_id }, effects: [{ entity: 'page', action: 'published', count: changed ? 1 : 0,
      publicVisible: true, sample: [`/s/${p.slug}`] }],
      compensation: changed ? { page_id, previous_status: p.status, published_version: p.version + 1 } : null }
  },
  async compensate(c, ctx) {
    const r = await ctx.db.query(
      `update pages set status = $2, version = version + 1 where id = $1 and version = $3 returning id`,
      [c.page_id, c.previous_status, c.published_version])
    if (!r.rowCount) return { note: 'Page changed after this run; publication was not reversed.' }
  },
}
