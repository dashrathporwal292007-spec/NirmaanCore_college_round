import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { pool } from '../lib/db'
import { makePlan, DEMO_PROMPTS, PlannerError } from '../lib/agent/planner'
import { snapshot } from './planner_snapshot'

async function main() {
  process.env.DEMO_MODE='0' // process only; never edits .env.local
  const before=await snapshot()
  const lines=['# Live Gemini planner rehearsal','',`Model: ${process.env.GEMINI_MODEL?.trim() || 'gemini-flash-latest'}. Key present: ${!!process.env.GEMINI_API_KEY?.trim()}.`,
    'Only planner calls were made; no runs were proposed or committed. Raw provider errors and credentials are never recorded.','']
  let live=0
  for (const [i,prompt] of DEMO_PROMPTS.entries()) {
    const started=Date.now()
    try {
      const result=await makePlan(prompt)
      if (result.plannerMode==='gemini') live++
      const outcome=result.plan.clarification ? `Clarification: ${result.plan.clarification}` : `Valid plan (${result.plan.steps.length} steps): ${result.plan.steps.map(s=>s.tool).join(', ')}`
      const status=`${result.plannerMode}; ${outcome}; fallbackReason=${result.fallbackReason ?? 'none'}; ${Date.now()-started} ms`
      console.log(`Prompt ${i+1}: ${status}`)
      lines.push(`## Prompt ${i+1}`,prompt,'',status,'')
    } catch (error) {
      const code=error instanceof PlannerError ? error.code : 'unexpected_error'
      console.log(`Prompt ${i+1}: failed (${code})`);lines.push(`## Prompt ${i+1}`,prompt,'',`Failed: ${code}`,'')
    }
    assert.deepEqual(await snapshot(),before,'Planner must never change stored database rows')
  }
  lines.push(`Actual Gemini responses: ${live}/5. Full database row snapshots unchanged after every prompt.`)
  await writeFile('docs/GEMINI_REPORT.md',lines.join('\n')+'\n')
  console.log(`Live Gemini responses: ${live}/5; database unchanged`)
  if (live!==5) process.exitCode=1
}
main().catch(error=>{console.error(error instanceof PlannerError ? error.message : 'Live planner verification failed');process.exitCode=1}).finally(()=>pool.end())
