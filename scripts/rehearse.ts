import assert from 'node:assert/strict'
import { pool } from '../lib/db'
import { USERS } from './seed'
import { resetDemo } from './demo_reset'
import { request, start, cleanup, getServerOutput } from './http-demo'
import { DEMO_SENTENCE, DEMO_PROMPTS } from '../lib/agent/planner'

const q = async (sql:string, values:unknown[]=[]) => (await pool.query(sql,values)).rows
const n = async (sql:string, values:unknown[]=[]) => Number((await q(sql,values))[0].n)
const approve = (run_id:string) => request('/api/agent/approve','POST',{run_id,decision:'approved'})
async function main() {
  await start()
  await resetDemo()
  const launch=await request('/api/agent/plan','POST',{instruction:DEMO_SENTENCE},USERS.marketer)
  assert.equal(launch.plannerMode,'demo');assert.equal(launch.status,'awaiting_approval')
  const {distinctRecipients,...existingTotals}=launch.diff.totals
  assert.deepEqual(existingTotals,{recipients:74,moneyInr:0,publicVisible:false})
  assert.equal(distinctRecipients,37)
  assert.equal(await n('select count(*) n from outbox'),0)
  assert.equal((await approve(launch.runId)).status,'completed')
  assert.equal((await approve(launch.runId)).duplicate,true)
  assert.equal(await n(`select count(*) n from outbox where status='queued'`),74)
  console.log('PASS plan -> preview -> approval: 74 queued simulated messages')

  const detail=await request(`/api/runs/${launch.runId}`)
  const webinar=detail.steps.find((s:{tool:string})=>s.tool==='create_webinar').result
  const publish=await request('/api/agent/plan','POST',{instruction:'Publish the registration page',plan:{summary:'Publish workshop page',deferred:[],
    steps:[{tool:'publish_page',args:{page_id:webinar.page_id}}]}},USERS.marketer)
  assert.equal(publish.status,'awaiting_approval');assert.equal((await approve(publish.runId)).status,'completed')
  const publicPage=await request(`/s/${webinar.slug}`,'GET',undefined,null)
  assert.equal(publicPage.registration_open,true)
  const people=await q(`select k.id,k.name,k.email from contacts k join outbox o on o.contact_id=k.id
    join campaigns c on c.id=o.campaign_id where c.webinar_id=$1 and c.kind='reminder' and o.status='queued' order by k.id limit 10`,[webinar.webinar_id])
  assert.equal(people.length,10)
  for (const person of people) {
    assert.equal((await request(`/s/${webinar.slug}/register`,'POST',{name:person.name,email:person.email},null)).registered,true)
    assert.equal((await request(`/s/${webinar.slug}/register`,'POST',{name:person.name,email:person.email},null)).registered,false)
    const timeline=await request(`/api/contacts/${person.id}/timeline`)
    const decisions=timeline.events.filter((e:{rule_id:string})=>e.rule_id==='REMINDER_REQUIRES_UNREGISTERED')
    assert.equal(decisions.length,1);assert.ok(decisions[0].reason);assert.ok(decisions[0].payload.evidence.registered_at)
  }
  assert.equal(await n(`select count(*) n from outbox o join campaigns c on c.id=o.campaign_id where c.webinar_id=$1 and c.kind='reminder' and o.status='cancelled'`,[webinar.webinar_id]),10)
  // Deterministic stand-in for attendance feed; only synthetic fixtures, never a live integration.
  await q(`update registrations set attended=true where webinar_id=$1 and contact_id=any($2::uuid[])`,[webinar.webinar_id,people.slice(0,6).map(p=>p.id)])
  await q(`insert into contact_events(contact_id,type,payload) select unnest($1::uuid[]),'webinar_attended',jsonb_build_object('webinar_id',$2::text,'simulated',true)`,[people.slice(0,6).map(p=>p.id),webinar.webinar_id])
  console.log('PASS public registration: 10 reminders cancelled once; 6 simulated attendees')

  assert.equal((await request(`/api/webinars/${webinar.webinar_id}/close`,'POST',undefined,USERS.marketer)).drafted,10)
  assert.equal((await request(`/api/webinars/${webinar.webinar_id}/close`,'POST',undefined,USERS.marketer)).drafted,0)
  for (const [kind,expected] of [['offer',6],['followup',4]] as const) {
    const preview=await request(`/api/webinars/${webinar.webinar_id}/pending?kind=${kind}`,'GET',undefined,USERS.marketer)
    assert.equal(preview.recipients.length,expected)
    assert.equal((await request(`/api/webinars/${webinar.webinar_id}/pending/approve`,'POST',{kind,fingerprint:preview.fingerprint})).approved,expected)
  }
  const paid=await request('/api/billing/checkout','POST',{contact_id:people[0].id,plan:'Social Growth'})
  assert.equal(paid.simulated,true);assert.equal(paid.amount_inr,8000)
  assert.equal((await request('/api/billing/checkout','POST',{contact_id:people[0].id,plan:'Social Growth'})).invoice_created,false)
  assert.equal(await n(`select count(*) n from outbox o join campaigns c on c.id=o.campaign_id where c.kind='offer' and o.status='cancelled' and o.cancel_reason->>'ruleId'='PROMO_REQUIRES_NOT_SUBSCRIBED'`),1)
  console.log('PASS close -> owner-approved drafts: 6 offers + 4 follow-ups; checkout cancels 1 offer')

  // Move only synthetic messages past their hold window; still call the real HTTP worker/evaluator.
  await q(`update outbox set dispatch_after=now()-interval '1 minute' where status='queued'`)
  const tick=await request('/api/worker/tick','POST')
  assert.deepEqual(tick,{simulated:true,sent:73,blocked:0})
  assert.deepEqual(await request('/api/worker/tick','POST'),{simulated:true,sent:0,blocked:0})
  assert.equal(await n(`select count(*) n from contact_events where type='campaign_received'`),73)
  await request(`/api/runs/${publish.runId}/rewind`,'POST')
  const rewound=await request(`/api/runs/${launch.runId}/rewind`,'POST')
  assert.equal(rewound.status,'rewound');assert.equal(rewound.notes.length,2)
  assert.ok(rewound.notes.every((note:string)=>note.includes('already sent')))
  assert.equal(await n(`select count(*) n from contacts where 'webinar-friday'=any(tags)`),0)
  assert.equal(await n('select count(*) n from registrations'),10)
  assert.equal(await n(`select count(*) n from subscriptions where status='active'`),1)
  assert.equal(await n('select count(*) n from invoices'),1)
  await request(`/s/${webinar.slug}`,'GET',undefined,null,404)
  const vip=await request('/api/agent/plan','POST',{instruction:DEMO_PROMPTS[1]},USERS.marketer)
  assert.equal(vip.plannerMode,'demo');assert.equal(vip.status,'completed')
  assert.equal(await n(`select count(*) n from contacts where 'vip'=any(tags)`),40)
  assert.deepEqual((await request(`/api/runs/${vip.runId}/rewind`,'POST')).notes,[])
  assert.equal(await n(`select count(*) n from contacts where 'vip'=any(tags)`),0)
  console.log('PASS tick -> rewind: 73 simulated deliveries preserved; honest cannot-recall notes; reversible tags restored')
  console.log('REHEARSAL ALL GREEN')
}
main().catch(error=>{console.error('REHEARSAL FAILED',error);if(getServerOutput()) console.error(getServerOutput());process.exitCode=1})
  .finally(async()=>{await cleanup();await pool.end()})
