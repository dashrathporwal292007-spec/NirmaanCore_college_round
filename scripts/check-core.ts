import assert from 'node:assert/strict'
import { pool } from '../lib/db'
import { seed, USERS } from './seed'
import { demoPlan, DEMO_SENTENCE, makePlan } from '../lib/agent/planner'
import { decide, dryRun, propose } from '../lib/agent/runner'
import { validatePlan } from '../lib/agent/plan'
import { computeRisk } from '../lib/agent/risk'

const owner = { id: USERS.owner, role: 'owner' as const }
const marketer = { id: USERS.marketer, role: 'marketer' as const }
async function main() {
  await seed()
  const a = await makePlan(DEMO_SENTENCE)
  assert.equal(a.source, 'fallback')
  await assert.rejects(makePlan('Unsupported demo instruction'), /Demo mode/)
  const p = await propose('stale audience', demoPlan(), marketer)
  await pool.query(`update contacts set unsubscribed = true where id =
    (select id from contacts where 'trial' = any(tags) and not unsubscribed order by id limit 1)`)
  const stale = await decide(p.runId, owner, 'approved')
  assert.ok('changed' in stale && stale.changed)
  assert.equal(stale.status, 'awaiting_approval')
  assert.equal(Number((await pool.query('select count(*) as n from outbox')).rows[0].n), 0)
  const attempts = await Promise.allSettled([
    decide(p.runId, owner, 'approved'), decide(p.runId, owner, 'approved'),
  ])
  assert.ok(attempts.some(x => x.status === 'fulfilled' && x.value.status === 'completed'))
  assert.equal(Number((await pool.query('select count(*) as n from outbox')).rows[0].n), 72)
  assert.equal(Number((await pool.query('select count(*) as n from webinars')).rows[0].n), 1)
  const rejected = await propose('reject', demoPlan(), marketer)
  assert.equal((await decide(rejected.runId, owner, 'rejected')).status, 'rejected')
  assert.equal(Number((await pool.query('select count(*) as n from outbox')).rows[0].n), 72)
  assert.throws(() => validatePlan({ summary: 'bad', deferred: [], steps: [
    { tool: 'tag_contacts', args: { contact_ids: '$step2.contact_ids', tag: 'x' } },
  ] }, 'marketer'), /earlier step/)
  assert.throws(() => validatePlan({ summary: 'bad', deferred: [], steps: [
    { tool: 'constructor', args: {} },
  ] }, 'owner'), /Unknown tool/)
  const preview = await dryRun(demoPlan(), marketer)
  assert.equal(computeRisk(demoPlan(), { ...preview.diff,
    totals: { ...preview.diff.totals, recipients: 120 } }), 'HIGH')
  console.log('Core checks passed: cached planner, stale audience, concurrent approval, rejection, reference validation, tool allowlist, HIGH risk.')
}
main().catch(e => { console.error(e); process.exitCode = 1 }).finally(() => pool.end())
