import assert from 'node:assert/strict'
import { request, start, cleanup, base, getServerOutput } from './http-demo'
import { pool } from '../lib/db'
import { seed, USERS } from './seed'
import { DEMO_SENTENCE, demoPlan } from '../lib/agent/planner'
import type { Plan } from '../lib/agent/plan'

const OTHER_OWNER = '00000000-0000-0000-0000-000000000004'
const sql = async (query: string, values: unknown[] = []) => (await pool.query(query, values)).rows
const count = async (query: string, values: unknown[] = []) => Number((await sql(query, values))[0].n)
async function submit(plan: Plan, uid: string = USERS.marketer) {
  return request('/api/agent/plan','POST',{ instruction:'HTTP tool composer test',plan },uid)
}
async function approve(runId: string, uid: string = USERS.owner, typed?: string) {
  return request('/api/agent/approve','POST',{run_id:runId,decision:'approved',...(typed ? {typed}: {})},uid)
}
async function main() {
  await start()
  await seed()
  await request('/api/runs','GET',undefined,null,401)
  await request('/api/runs','GET',undefined,'not-a-uuid',401)
  await request('/api/runs/not-a-uuid','GET',undefined,USERS.owner,400)
  await request('/api/runs/ffffffff-ffff-4fff-8fff-ffffffffffff','GET',undefined,USERS.owner,404)
  await request('/api/worker/tick','POST',undefined,USERS.marketer,403)
  await request('/api/agent/plan','POST',{instruction:DEMO_SENTENCE},USERS.owner,403,{Origin:'https://untrusted.example'})
  const bad = await fetch(base+'/api/agent/plan',{method:'POST',headers:{Cookie:`uid=${USERS.owner}`,'Content-Type':'application/json'},body:'{',signal:AbortSignal.timeout(5000)})
  assert.equal(bad.status,400);assert.equal((await bad.json()).error.code,'INVALID_INPUT')
  const beforePlannerError = await sql(`select (select count(*) from agent_runs) runs,(select count(*) from audit_log) audit`)
  const plannerFailure = await request('/api/agent/plan','POST',{instruction:'Unsupported rehearsal prompt'},USERS.marketer,422)
  assert.equal(plannerFailure.error.details.plannerCode,'demo_unsupported')
  assert.deepEqual(await sql(`select (select count(*) from agent_runs) runs,(select count(*) from audit_log) audit`),beforePlannerError)
  console.log('ok 1 HTTP auth, roles, validation, cross-origin and missing resource errors')

  const p = await request('/api/agent/plan','POST',{instruction:DEMO_SENTENCE},USERS.marketer)
  assert.equal(p.diff.totals.distinctRecipients,37); assert.equal(p.diff.totals.recipients,74)
  assert.equal(p.status,'awaiting_approval'); assert.equal(p.source,'fallback');assert.equal(p.plannerMode,'demo');assert.equal(p.fallbackReason,null)
  assert.equal(await count('select count(*) n from webinars'),0)
  assert.equal(await count('select count(*) n from outbox'),0)
  const refused=await request('/api/agent/plan','POST',{instruction:DEMO_SENTENCE},USERS.viewer,403)
  assert.ok(refused.error.details.runId)
  assert.equal((await approve(p.runId)).status,'completed')
  const before=await count('select count(*) n from outbox')
  assert.equal(before,74)
  assert.equal((await request(`/api/outbox?run_id=${p.runId}&limit=200`)).outbox.length,74)
  const duplicates=await Promise.all([approve(p.runId),approve(p.runId)])
  assert.ok(duplicates.every(x=>x.duplicate===true))
  assert.equal(await count('select count(*) n from outbox'),before)
  assert.equal((await request(`/api/runs/${p.runId}/decision`,'POST',{decision:'approved'})).duplicate,true)
  const rewind=await request(`/api/runs/${p.runId}/rewind`,'POST')
  assert.equal(rewind.status,'rewound');assert.deepEqual(rewind.notes,[])
  assert.equal(await count(`select count(*) n from outbox where status='queued'`),0)
  console.log('ok 2 HTTP plan, dry-run isolation, refusal, approve, duplicate approve and rewind')

  const launch=demoPlan();launch.steps.push({tool:'publish_page',args:{page_id:'$step3.page_id'}})
  const published=await submit(launch)
  const slug=`ai-content-for-local-brands-${published.runId}`
  await request(`/s/${slug}`,'GET',undefined,null,404)
  assert.equal((await approve(published.runId)).status,'completed')
  const page=await request(`/s/${slug}`,'GET',undefined,null)
  assert.equal(page.registration_open,true);assert.ok(page.page.blocks.length)
  const webinar=page.webinar.id
  const contact=(await sql(`select k.id,k.name,k.email from contacts k join outbox o on o.contact_id=k.id
    join campaigns c on c.id=o.campaign_id where c.webinar_id=$1 and c.kind='reminder' and o.status='queued' order by k.id limit 1`,[webinar]))[0]
  await request(`/s/${slug}/register`,'POST',{name:'Visitor',email:'invalid'},null,400)
  assert.equal((await request(`/s/${slug}/register`,'POST',{name:'Untrusted form text',email:contact.email.toUpperCase()},null)).registered,true)
  assert.equal((await request(`/s/${slug}/register`,'POST',{name:'Repeat',email:contact.email},null)).registered,false)
  const timeline=await request(`/api/contacts/${contact.id}/timeline`,'GET',undefined,USERS.viewer)
  const decisions=timeline.events.filter((e: {type:string;rule_id:string})=>e.type==='automation_decision' && e.rule_id==='REMINDER_REQUIRES_UNREGISTERED')
  assert.equal(decisions.length,1);assert.ok(decisions[0].reason);assert.ok(decisions[0].payload.evidence.registered_at)
  assert.equal((await sql('select name from contacts where id=$1',[contact.id]))[0].name,contact.name)
  // A genuinely new public visitor is added to the CRM, still no model input.
  assert.equal((await request(`/s/${slug}/register`,'POST',{name:'New visitor',email:'http.visitor@example.com'},null)).registered,true)
  console.log('ok 3 public JSON page, registration/deduplication and adaptive rule on HTTP timeline')

  assert.equal((await request(`/api/webinars/${webinar}/close`,'POST',undefined,USERS.marketer)).drafted,2)
  assert.equal((await request(`/api/webinars/${webinar}/close`,'POST',undefined,USERS.marketer)).drafted,0)
  await request(`/s/${slug}/register`,'POST',{name:'Closed',email:'closed@example.com'},null,404)
  const pending=await request(`/api/webinars/${webinar}/pending?kind=followup`,'GET',undefined,USERS.marketer)
  assert.equal(pending.recipients.length,2)
  await request(`/api/webinars/${webinar}/pending/approve`,'POST',{kind:'followup',fingerprint:pending.fingerprint},USERS.marketer,403)
  assert.equal((await request(`/api/webinars/${webinar}/pending/approve`,'POST',{kind:'followup',fingerprint:'0'.repeat(64)})).stale,true)
  assert.equal((await request(`/api/webinars/${webinar}/pending/approve`,'POST',{kind:'followup',fingerprint:pending.fingerprint})).approved,2)
  assert.equal((await request(`/api/webinars/${webinar}/pending/approve`,'POST',{kind:'followup',fingerprint:pending.fingerprint})).stale,true)
  // Move synthetic fixture due times via SQL; HTTP tick must still enforce its evaluator.
  await sql(`update outbox set dispatch_after=now()-interval '1 minute' where status='queued'`)
  const tick=await request('/api/worker/tick','POST')
  assert.equal(tick.simulated,true);assert.ok(tick.sent>0)
  const cancelled=await request(`/api/outbox?contact_id=${contact.id}&webinar_id=${webinar}&status=cancelled`,'GET',undefined,USERS.viewer)
  assert.equal(cancelled.outbox[0].cancel_reason.ruleId,'REMINDER_REQUIRES_UNREGISTERED')
  const cancellation=await request(`/api/runs/${published.runId}/cancel-pending`,'POST',undefined,USERS.marketer)
  assert.equal(cancellation.cancelled,0);assert.ok(cancellation.already_sent>0)
  const checkout=await request('/api/billing/checkout','POST',{contact_id:contact.id,plan:'Social Growth'})
  assert.equal(checkout.simulated,true);assert.equal(checkout.amount_inr,8000)
  assert.equal((await request('/api/billing/checkout','POST',{contact_id:contact.id,plan:'Social Growth'})).invoice_created,false)
  console.log('ok 4 close/pending approval, stale fingerprint, real worker tick, outbox and simulated checkout')

  // Test all requested tools via the HTTP pipeline, not direct execute calls.
  const pages=await submit({summary:'Page composer',deferred:[],steps:[
    {tool:'create_page',args:{title:'HTTP Business Page',template:'business',headline:'Local brands'}},
    {tool:'publish_page',args:{page_id:'$step1.page_id'}}]})
  assert.equal(pages.status,'awaiting_approval');assert.equal((await approve(pages.runId)).status,'completed')
  const pageDetail=await request(`/api/runs/${pages.runId}`)
  const businessSlug=pageDetail.steps[0].result.slug
  assert.equal((await request(`/s/${businessSlug}`,'GET',undefined,null)).webinar,null)
  await request(`/api/runs/${pages.runId}/rewind`,'POST')
  await request(`/s/${businessSlug}`,'GET',undefined,null,404)
  const followup=await submit({summary:'Draft no-show follow-up',deferred:[],steps:[{tool:'draft_followup',args:{webinar_id:webinar,audience:'no_show'}}]})
  assert.equal(followup.status,'completed')
  await request(`/api/runs/${followup.runId}/rewind`,'POST')
  const eligible=(await sql(`select id from contacts where not unsubscribed and 'trial'=any(tags) and id<>$1 order by id limit 1`,[contact.id]))[0].id
  const offer=await submit({summary:'Offer a subscription',deferred:[],steps:[{tool:'offer_subscription',args:{plan_name:'Social Growth',contact_ids:[eligible]}}]},USERS.owner)
  assert.equal((await approve(offer.runId)).status,'completed')
  await request(`/api/runs/${offer.runId}/rewind`,'POST')
  assert.equal(await count('select count(*) n from subscriptions where contact_id=$1',[eligible]),0)
  await sql(`insert into users(id,name,email,role) values($1,'Second demo owner','second.owner@example.com','owner')`,[OTHER_OWNER])
  const activation=await submit({summary:'Simulated activation',deferred:[],steps:[{tool:'activate_subscription',args:{contact_id:eligible,plan_name:'Social Growth'}}]},USERS.owner)
  assert.equal(activation.risk,'HIGH')
  assert.equal(await count('select count(*) n from subscriptions where contact_id=$1',[eligible]),0)
  await request('/api/agent/approve','POST',{run_id:activation.runId,decision:'approved',typed:'CONFIRM'},USERS.owner,403)
  await request('/api/agent/approve','POST',{run_id:activation.runId,decision:'approved'},OTHER_OWNER,400)
  await sql(`update plans set price_inr=8500 where name='Social Growth'`)
  const priceChanged=await approve(activation.runId,OTHER_OWNER,'CONFIRM')
  assert.equal(priceChanged.changed,true);assert.equal(priceChanged.diff.totals.moneyInr,8500)
  assert.equal(await count('select count(*) n from subscriptions where contact_id=$1',[eligible]),0)
  assert.equal((await approve(activation.runId,OTHER_OWNER,'CONFIRM')).status,'completed')
  await sql(`update plans set price_inr=8000 where name='Social Growth'`)
  const irreversible=await request(`/api/runs/${activation.runId}/rewind`,'POST',undefined,OTHER_OWNER)
  assert.ok(irreversible.notes.length>0)
  assert.equal(await count(`select count(*) n from subscriptions where contact_id=$1 and status='active'`,[eligible]),1)
  console.log('ok 5 page/follow-up/offer tools, activation HIGH permissions, typed confirmation and irreversible notes')

  const cancellable=await request('/api/agent/plan','POST',{instruction:DEMO_SENTENCE},USERS.marketer)
  await approve(cancellable.runId)
  const cancel=await request(`/api/runs/${cancellable.runId}/cancel-pending`,'POST',undefined,USERS.marketer)
  assert.ok(cancel.cancelled>0)
  assert.equal((await request(`/api/runs/${cancellable.runId}/cancel-pending`,'POST',undefined,USERS.marketer)).cancelled,0)
  const userDecisions=await request(`/api/contacts/${eligible}/timeline`)
  assert.ok(userDecisions.events.some((e: {rule_id:string;reason:string})=>e.rule_id==='CANCELLED_BY_USER' && e.reason))
  const runList=await request('/api/runs?limit=2','GET',undefined,USERS.viewer)
  assert.equal(runList.runs.length,2)
  const contacts=await request('/api/contacts?tag=trial&limit=200','GET',undefined,USERS.viewer)
  assert.equal(contacts.contacts.length,40)
  const metrics=await request('/api/analytics/summary','GET',undefined,USERS.viewer)
  assert.equal(metrics.funnel.leads,await count('select count(*) n from contacts'))
  assert.equal(metrics.funnel.subscribed,await count(`select count(distinct contact_id) n from subscriptions where status='active'`))
  assert.ok(metrics.savings_are_estimates);assert.ok(metrics.automation.estimated_minutes_saved>0)
  console.log('ok 6 cancellation idempotency, read APIs and computed analytics')
  console.log('ALL GREEN')
}
main().catch(error=>{console.error(error);if(getServerOutput()) console.error(getServerOutput());process.exitCode=1}).finally(async () => { await cleanup(); await pool.end() })
