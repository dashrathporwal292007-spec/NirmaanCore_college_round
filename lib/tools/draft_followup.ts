import { z } from 'zod'
import type { Tool } from '../agent/types'
import { tagContacts } from './tag_contacts'
import { draftCampaign } from './campaigns'

const schema = z.object({ webinar_id: z.string().uuid(), audience: z.enum(['attended', 'no_show']) })
export const draftFollowup: Tool<z.infer<typeof schema>> = {
  name: 'draft_followup', description: 'Draft a follow-up for webinar attendees or no-shows. Does not send.',
  argsHelp: 'webinar_id, audience (attended or no_show). Returns campaign_id.', schema,
  reversibility: 'reversible', requiredRole: 'marketer', minutesSaved: 15,
  async execute(a, ctx) {
    const webinar = (await ctx.db.query(`select title from webinars where id = $1`, [a.webinar_id])).rows[0]
    if (!webinar) throw new Error('Webinar not found')
    const rows = (await ctx.db.query(
      `select r.contact_id from registrations r join contacts c on c.id = r.contact_id
       where r.webinar_id = $1 and r.attended = $2 and not c.unsubscribed`, [a.webinar_id, a.audience === 'attended'])).rows
    const tag = `${a.audience === 'attended' ? 'attended' : 'noshow'}-${a.webinar_id.slice(0, 6)}`
    const tagged = await tagContacts.execute({ contact_ids: rows.map(x => x.contact_id), tag }, ctx)
    const campaign = await draftCampaign.execute({ name: `${a.audience}: ${webinar.title}`,
      subject: a.audience === 'attended' ? 'Thanks for attending' : 'Sorry we missed you',
      body: a.audience === 'attended' ? 'Thanks for attending our workshop. We hope you found it useful.' : 'We missed you at the workshop. We would love to welcome you next time.',
      tag, webinar_id: a.webinar_id, kind: 'invite' }, ctx)
    await ctx.db.query(`update campaigns set kind = 'followup' where id = $1`, [campaign.result.campaign_id])
    return { result: campaign.result, effects: [...tagged.effects, ...campaign.effects],
      compensation: { tagged: tagged.compensation, campaign: campaign.compensation } }
  },
  async compensate(c, ctx) {
    if (c.tagged) await tagContacts.compensate!(c.tagged, ctx)
    if (c.campaign) await draftCampaign.compensate!(c.campaign, ctx)
  },
}
