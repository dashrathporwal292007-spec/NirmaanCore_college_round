// lib/tools/tag_contacts.ts
import { z } from 'zod'
import type { Tool } from '../agent/types'
import { logEvents } from '../agent/log'

const schema = z.object({ contact_ids: z.array(z.string().uuid()).max(500), tag: z.string().min(1).max(40) })

export const tagContacts: Tool<z.infer<typeof schema>, { tagged: string[] }, { contact_ids: string[]; tag: string }> = {
  name: 'tag_contacts',
  description: 'Add a tag to a list of contacts.',
  argsHelp: 'contact_ids (array of ids, usually "$stepN.contact_ids"), tag (string).',
  schema, reversibility: 'reversible', requiredRole: 'marketer', minutesSaved: 3,
  async execute({ contact_ids, tag }, ctx) {
    const r = await ctx.db.query(
      `update contacts set tags = array_append(tags, $2::text)
       where id = any($1::uuid[]) and not ($2::text = any(tags)) returning id, name`, [contact_ids, tag])
    const ids = r.rows.map(x => x.id)
    await logEvents(ctx, ids, 'tag_added', { tag })
    return {
      result: { tagged: ids },
      effects: [{ entity: 'contact', action: `tag "${tag}" added`, count: ids.length, sample: r.rows.slice(0, 3).map(x => x.name) }],
      compensation: { contact_ids: ids, tag },          // only the rows we really changed
    }
  },
  async compensate({ contact_ids, tag }, ctx) {
    await ctx.db.query(`update contacts set tags = array_remove(tags, $2::text) where id = any($1::uuid[])`, [contact_ids, tag])
    await logEvents(ctx, contact_ids, 'tag_removed', { tag })
  },
}
