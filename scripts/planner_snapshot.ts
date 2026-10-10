import { pool } from '../lib/db'
// Compare all stored business/audit rows without printing contact data or credentials.
const tables = ['users','contacts','contact_events','pages','webinars','registrations','campaigns','outbox',
  'engagement','plans','subscriptions','usage_events','invoices','agent_runs','run_steps','approvals','audit_log','pending_actions']
export async function snapshot() {
  return (await pool.query(tables.map(t=>`select '${t}' name, count(*)::int count,
    md5(coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text)::text,'')) digest from ${t} t`).join(' union all '))).rows
}
