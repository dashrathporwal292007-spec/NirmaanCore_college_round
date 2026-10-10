// scripts/smoke.ts   run: npx tsx --env-file=.env.local scripts/smoke.ts
import assert from 'node:assert/strict'
import { pool } from '../lib/db'
import { seed, USERS } from './seed'
import { demoPlan } from '../lib/agent/planner'
import { dryRun, propose, decide, rewind } from '../lib/agent/runner'

const OWNER = { id: USERS.owner, role: 'owner' as const }
const MARKETER = { id: USERS.marketer, role: 'marketer' as const }
const VIEWER = { id: USERS.viewer, role: 'viewer' as const }

const n = async (sql: string) => Number((await pool.query(sql)).rows[0].n)
const snapshot = async () => ({
  webinars: await n(`select count(*) n from webinars`),
  pages: await n(`select count(*) n from pages`),
  campaigns: await n(`select count(*) n from campaigns`),
  outbox: await n(`select count(*) n from outbox`),
  tagged: await n(`select count(*) n from contacts where 'webinar-friday' = any(tags)`),
  events: await n(`select count(*) n from contact_events`),
})

async function main() {
  await seed()
  assert.equal(await n(`select count(*) n from contacts`), 50, 'seed: 50 contacts')
  const before = await snapshot()

  // 1. Dry-run leaves the database untouched and reports MEDIUM risk
  const preview = await dryRun(demoPlan(), MARKETER)
  assert.deepEqual(await snapshot(), before, 'dry-run must change nothing')
  assert.equal(preview.risk, 'MEDIUM')
  assert.equal(preview.diff.totals.recipients, 74)   // 37 invite + 37 reminder
  console.log('ok 1  dry-run is clean:', preview.diff.totals)

  // 2. A viewer is refused and the refusal is logged
  const refused: any = await propose('demo', demoPlan(), VIEWER)
  assert.equal(refused.status, 'refused')
  assert.ok(await n(`select count(*) n from audit_log where action = 'instruction_refused'`) >= 1)
  assert.deepEqual(await snapshot(), before, 'a refusal must change nothing')
  console.log('ok 2  viewer refused, logged')

  // 3. Propose, approve, commit
  const p: any = await propose('demo', demoPlan(), MARKETER)
  assert.equal(p.status, 'awaiting_approval')
  const done: any = await decide(p.runId, OWNER, 'approved')
  assert.equal(done.status, 'completed')
  const after = await snapshot()
  assert.equal(after.webinars, before.webinars + 1)
  assert.equal(after.tagged, 40)
  assert.equal(after.outbox, 74)
  console.log('ok 3  committed:', after)

  // 4. A second approval click does nothing
  await assert.rejects(decide(p.runId, OWNER, 'approved'), /not awaiting approval/)
  assert.deepEqual(await snapshot(), after, 'double approve must not duplicate anything')
  console.log('ok 4  double approve is harmless')

  // 5. Rewind restores state; emails are cancelled, webinar archived
  await rewind(p.runId, OWNER)
  const post = await snapshot()
  assert.equal(post.tagged, 0)
  assert.equal(await n(`select count(*) n from outbox where status = 'cancelled'`), 74)
  assert.equal(await n(`select count(*) n from webinars where status = 'archived'`), 1)
  console.log('ok 5  rewound')

  // 6. A failure at step 4 rolls the whole run back
  process.env.FORCE_FAIL_STEP = '4'
  const f: any = await propose('demo', demoPlan(), MARKETER)
  const failed: any = await decide(f.runId, OWNER, 'approved')
  process.env.FORCE_FAIL_STEP = ''
  assert.equal(failed.status, 'failed')
  assert.deepEqual(await snapshot(), post, 'a failed run must leave no trace')
  console.log('ok 6  failure rolled back everything')

  console.log('ALL GREEN')
}

main().then(() => pool.end()).catch(e => { console.error(e); process.exit(1) })
