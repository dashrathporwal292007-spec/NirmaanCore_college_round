import assert from 'node:assert/strict'
import { pool } from '../lib/db'
import { createPlanner, DEMO_PROMPTS, DEMO_SENTENCE, demoPlan, PlannerError } from '../lib/agent/planner'
import { snapshot } from './planner_snapshot'

async function main() {
  const before = await snapshot()
  const unrelated = 'Find contacts tagged wholesale'
  const cfg = {demoMode:false,apiKey:'synthetic-test-key',timeoutMs:1000}
  let calls=0, contextCalls=0
  const context=async()=>{contextCalls++;return 'Synthetic planner context'}
  for (const [label, reply, code] of [
    ['malformed JSON','{','invalid_json'],
    ['invalid tool',JSON.stringify({summary:'bad',deferred:[],steps:[{tool:'delete_everything',args:{}}]}),'invalid_plan'],
    ['invalid arguments',JSON.stringify({summary:'bad',deferred:[],steps:[{tool:'create_page',args:{title:'x'}}]}),'invalid_plan'],
  ] as const) {
    calls=0
    const planner=createPlanner({buildSystemPrompt:context,getConfig:()=>cfg,callModel:async()=>{calls++;return reply}})
    await assert.rejects(planner(unrelated),(e:unknown)=>e instanceof PlannerError && e.code===code)
    assert.equal(calls,2)
    const fallback=await planner(DEMO_SENTENCE)
    assert.equal(fallback.plannerMode,'fallback');assert.equal(fallback.fallbackReason,code)
    assert.deepEqual(await snapshot(),before)
    console.log(`ok ${label}: one repair retry, clear error/canned fallback, database unchanged`)
  }
  let aborted=false
  const timeout=createPlanner({buildSystemPrompt:context,getConfig:()=>({...cfg,timeoutMs:30}),callModel:async r=>{
    r.signal.addEventListener('abort',()=>{aborted=true},{once:true});return new Promise<string>(()=>{})
  }})
  const started=Date.now()
  await assert.rejects(timeout(unrelated),(e:unknown)=>e instanceof PlannerError && e.code==='timeout')
  assert.ok(Date.now()-started<1000);assert.ok(aborted)
  const timedFallback=await timeout(DEMO_SENTENCE);assert.equal(timedFallback.fallbackReason,'timeout')
  console.log('ok timeout: bounded total deadline, aborted transport and canned fallback')
  calls=0
  const missing=createPlanner({buildSystemPrompt:context,getConfig:()=>({...cfg,apiKey:undefined}),callModel:async()=>{calls++;throw new Error('must not call')}})
  await assert.rejects(missing(unrelated),/GEMINI_API_KEY/)
  assert.equal((await missing(DEMO_SENTENCE)).fallbackReason,'missing_key');assert.equal(calls,0)
  const offline=createPlanner({buildSystemPrompt:async()=>{throw new Error('must not read context')},getConfig:()=>({...cfg,demoMode:true}),callModel:async()=>{throw new Error('must not call network')}})
  for (const prompt of DEMO_PROMPTS) assert.equal((await offline(prompt)).plannerMode,'demo')
  calls=0
  const repaired=createPlanner({buildSystemPrompt:context,getConfig:()=>cfg,callModel:async()=>++calls===1 ? '{' : JSON.stringify(demoPlan())})
  assert.equal((await repaired(DEMO_SENTENCE)).plannerMode,'gemini');assert.equal(calls,2)
  const down=createPlanner({buildSystemPrompt:context,getConfig:()=>cfg,callModel:async()=>{throw new Error('provider transport failed')}})
  await assert.rejects(down(unrelated),/unavailable/)
  assert.equal((await down(DEMO_SENTENCE)).fallbackReason,'unavailable')
  assert.deepEqual(await snapshot(),before)
  assert.ok(contextCalls>0)
  console.log('ok missing key, all five offline prompts, repaired JSON and provider failure; database unchanged')
  console.log('ALL GREEN')
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>pool.end())
