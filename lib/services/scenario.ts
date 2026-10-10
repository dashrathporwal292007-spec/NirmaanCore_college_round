// lib/services/scenario.ts
import { withRollback } from '../db'
import { registerContacts, optOut, activateSubscription } from './adaptive'

export type Scenario = 'registers' | 'opts_out' | 'subscribes'

export async function testWorkflow(webinarId: string, scenario: Scenario, contactId?: string) {
  if (!['registers', 'opts_out', 'subscribes'].includes(scenario)) throw new Error('Unknown scenario')
  return withRollback(async db => {
    const cid: string | undefined = contactId ?? (await db.query(
      `select o.contact_id from outbox o join campaigns c on c.id = o.campaign_id
       where c.webinar_id = $1 and o.status = 'queued' order by o.contact_id limit 1`, [webinarId])).rows[0]?.contact_id
    if (!cid) throw new Error('No queued messages for this webinar')
    if (scenario === 'registers') await registerContacts(db, webinarId, [cid])
    if (scenario === 'opts_out') await optOut(db, cid)
    if (scenario === 'subscribes') await activateSubscription(db, cid, 'Social Growth')
    const messages = (await db.query(
      `select c.kind, o.status, o.cancel_reason->>'ruleId' as rule, o.cancel_reason->>'reason' as reason
       from outbox o join campaigns c on c.id = o.campaign_id
       where o.contact_id = $1 and c.webinar_id = $2 order by c.kind`, [cid, webinarId])).rows
    return { contact_id: cid, scenario, messages }     // rolled back after this return: nothing changed
  })
}
