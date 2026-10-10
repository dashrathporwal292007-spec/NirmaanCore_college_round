import assert from 'node:assert/strict'
import { pool } from '../lib/db'
import { seed } from './seed'
import { resolve } from 'node:path'

export async function assertCleanSeed() {
  const row = (await pool.query(`select (select count(*)::int from contacts) contacts,
    (select count(*)::int from contacts where 'trial'=any(tags)) trial,
    (select count(*)::int from contacts where unsubscribed) unsubscribed,
    (select count(*)::int from agent_runs) runs, (select count(*)::int from outbox) outbox,
    (select count(*)::int from pending_actions) pending, (select count(*)::int from subscriptions) subscriptions,
    (select count(*)::int from invoices) invoices, (select count(*)::int from registrations) registrations`)).rows[0]
  assert.deepEqual(row, {contacts:50,trial:40,unsubscribed:3,runs:0,outbox:0,pending:0,subscriptions:0,invoices:0,registrations:0})
  return row
}
export async function resetDemo() { await seed(); return assertCleanSeed() }
if (process.argv[1] && resolve(process.argv[1]) === resolve('scripts/demo_reset.ts')) {
  resetDemo().then(row=>console.log('DEMO RESET VERIFIED',JSON.stringify(row)))
    .catch(error=>{console.error('DEMO RESET FAILED',error);process.exitCode=1}).finally(()=>pool.end())
}
