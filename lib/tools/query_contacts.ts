// lib/tools/query_contacts.ts
import { z } from 'zod'
import type { Tool } from '../agent/types'

const schema = z.object({
  tag: z.string().optional(),
  status: z.enum(['new', 'engaged', 'registered', 'customer']).optional(),
  webinar_id: z.string().uuid().optional(),
  attended: z.boolean().optional(),          // only with webinar_id
})

export const queryContacts: Tool<z.infer<typeof schema>> = {
  name: 'query_contacts',
  description: 'Find contacts by tag, status, or webinar registration/attendance. Read only.',
  argsHelp: 'tag?, status?, webinar_id?, attended? (boolean, needs webinar_id). Returns contact_ids, count, unsubscribed.',
  schema, reversibility: 'reversible', requiredRole: 'viewer', minutesSaved: 5,
  async execute(a, ctx) {
    const p: any[] = [], where: string[] = ['true']
    let from = 'contacts c'
    if (a.tag) { p.push(a.tag); where.push(`$${p.length}::text = any(c.tags)`) }
    if (a.status) { p.push(a.status); where.push(`c.status = $${p.length}`) }
    if (a.webinar_id) {
      p.push(a.webinar_id)
      from = `contacts c join registrations r on r.contact_id = c.id and r.webinar_id = $${p.length}::uuid`
      if (a.attended !== undefined) { p.push(a.attended); where.push(`r.attended = $${p.length}`) }
    }
    const r = await ctx.db.query(
      `select c.id, c.name, c.unsubscribed from ${from} where ${where.join(' and ')} order by c.name`, p)
    const ids = r.rows.map(x => x.id)
    return {
      result: { contact_ids: ids, count: ids.length, unsubscribed: r.rows.filter(x => x.unsubscribed).length },
      effects: [{ entity: 'contact', action: 'matched filter (read only)', count: ids.length,
                 sample: r.rows.slice(0, 3).map(x => x.name) }],
      compensation: null,
    }
  },
}
