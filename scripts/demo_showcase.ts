// Fictional judging activity, created through existing HTTP workflows only.
// Does not reset data, modify seed, write SQL or create attendance fixtures.
import { request, start, cleanup } from './http-demo'
import { DEMO_SENTENCE } from '../lib/agent/planner'
async function main() {
  await start()
  const launch = await request('/api/agent/plan','POST',{instruction:DEMO_SENTENCE})
  if (!launch.runId) throw new Error('No plan was created')
  await request('/api/agent/approve','POST',{run_id:launch.runId,decision:'approved'})
  const detail = await request(`/api/runs/${launch.runId}`)
  const webinar = detail.steps.find((s:{tool:string})=>s.tool==='create_webinar').result
  const publish = await request('/api/agent/plan','POST',{instruction:'Publish the registration page',plan:{summary:'Publish demo workshop registration',deferred:[],steps:[{tool:'publish_page',args:{page_id:webinar.page_id}}]}})
  await request('/api/agent/approve','POST',{run_id:publish.runId,decision:'approved'})
  const {contacts} = await request('/api/contacts?limit=200')
  const people = contacts.filter((c:{unsubscribed:boolean;tags:string[]})=>!c.unsubscribed&&c.tags.includes('trial')).slice(0,10)
  for (const person of people) await request(`/s/${webinar.slug}/register`,'POST',{name:person.name,email:person.email},null)
  await request(`/api/webinars/${webinar.webinar_id}/close`,'POST')
  const pending = await request(`/api/webinars/${webinar.webinar_id}/pending?kind=followup`)
  console.log(JSON.stringify({fictional:true,runId:launch.runId,webinarId:webinar.webinar_id,publicPage:`/register/${webinar.slug}`,registered:people.length,followupsAwaitingApproval:pending.recipients.length,messagesScheduled:launch.diff.totals.recipients}))
  console.log('SHOWCASE READY: real stored previews, approvals, registration decisions and untouched follow-up drafts. No attendance, reset, payment or external delivery.')
}
main().catch(e=>{console.error(e.message);process.exitCode=1}).finally(cleanup)
