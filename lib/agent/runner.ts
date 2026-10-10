import { lockAdaptive } from '../rules/evaluate'
// lib/agent/runner.ts
import { createHash, randomUUID } from 'crypto'
import type { PoolClient } from 'pg'
import { pool, withTx, withRollback } from '../db'
import { registry } from '../tools/registry'
import { Ctx, Effect, Role, Tool, ToolOutput, can } from './types'
import { Plan, PlanError, resolveRefs, validatePlan } from './plan'
import { computeRisk, requiredRoleFor } from './risk'
import { audit } from './log'

export interface Actor { id: string; role: Role }
export interface Diff {
  lines: (Effect & { tool: string; step: number })[]
  totals: { distinctRecipients: number; recipients: number; moneyInr: number; publicVisible: boolean }
}

/** The ONE place plans execute. Dry-run and commit both call this. */
async function executePlan(
  db: PoolClient, plan: Plan, user: Actor, runId: string, dry: boolean,
  record?: (ctx: Ctx, i: number, tool: Tool, args: any, out: ToolOutput) => Promise<void>,
) {
  validatePlan(plan, user.role)
  const ctx: Ctx = { db, user, runId, dry, now: new Date() }
  const recipients = new Set<string>()
  const results: any[] = []
  const stepEffects: { tool: string; effects: Effect[] }[] = []
  for (let i = 0; i < plan.steps.length; i++) {
    const tool = registry[plan.steps[i].tool]
    const args = tool.schema.parse(resolveRefs(plan.steps[i].args, results))   // refs resolve to REAL ids
    if (!dry && process.env.FORCE_FAIL_STEP === String(i + 1))
      throw new Error(`Forced failure at step ${i + 1} (${tool.name}) for the demo`)
    const out = await tool.execute(args, ctx)
    for (const id of out.recipientIds ?? []) recipients.add(id)
    results.push(out.result)
    stepEffects.push({ tool: tool.name, effects: out.effects })
    if (record) await record(ctx, i, tool, args, out)
  }
  return { stepEffects, distinctRecipients: recipients.size }
}

function buildDiff(stepEffects: { tool: string; effects: Effect[] }[], distinctRecipients: number): Diff {
  const lines = stepEffects.flatMap((s, i) => s.effects.map(e => ({ ...e, tool: s.tool, step: i + 1 })))
  return {
    lines,
    totals: {
      distinctRecipients,
      recipients: lines.reduce((n, l) => n + (l.recipients ?? 0), 0),
      moneyInr: lines.reduce((n, l) => n + (l.moneyInr ?? 0), 0),
      publicVisible: lines.some(l => l.publicVisible),
    },
  }
}

/** Hash of what the plan WOULD do. Names and ids are excluded; counts and actions are included. */
function hashPlan(plan: Plan, diff: Diff) { const stable = (v: any): any => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, stable(v[k])])) : v  // jsonb loses key order, so hash a sorted-key form
  const shape = { steps: plan.steps, lines: diff.lines.map(l => [l.tool, l.action, l.count, l.recipients ?? 0, l.skipped ?? 0, l.fingerprint ?? '', l.moneyInr ?? 0, l.publicVisible ?? false]) }
  return createHash('sha256').update(JSON.stringify(stable(shape))).digest('hex')
}

/** Run the whole plan inside a transaction that is ALWAYS rolled back. */
export async function dryRun(plan: Plan, actor: Actor, runId: string = randomUUID()) {
  validatePlan(plan, actor.role)
  const { stepEffects, distinctRecipients } = await withRollback(async db => { await lockAdaptive(db); return executePlan(db, plan, actor, runId, true) })
  const diff = buildDiff(stepEffects, distinctRecipients)
  return { diff, risk: computeRisk(plan, diff), planHash: hashPlan(plan, diff) }
}

/** Instruction -> stored run with preview. LOW risk auto-commits; otherwise waits for approval. */
export async function propose(instruction: string, plan: Plan, actor: Actor) {
  const runId = randomUUID()
  let preview
  try {
    preview = await dryRun(plan, actor, runId)
  } catch (e: any) {
    const status = e instanceof PlanError && e.code === 'forbidden' ? 'refused' : 'failed'
    const r = await pool.query(
      `insert into agent_runs (user_id, instruction, plan, status, error) values ($1,$2,$3::jsonb,$4,$5) returning id`,
      [actor.id, instruction, JSON.stringify(plan), status, e.message])
    await pool.query(`insert into audit_log (actor, run_id, action, entity, after) values ($1,$2,$3,'agent_run',$4::jsonb)`,
      [`user:${actor.id}`, r.rows[0].id, status === 'refused' ? 'instruction_refused' : 'dry_run_failed', JSON.stringify({ reason: e.message })])
    return { runId: r.rows[0].id as string, status, error: e.message as string }
  }
  const needs = requiredRoleFor(plan, preview.risk)
  const auto = preview.risk === 'LOW'
  const run = (await pool.query(
    `insert into agent_runs (user_id, instruction, plan, diff, risk, plan_hash, required_role, status, id)
     values ($1,$2,$3::jsonb,$4::jsonb,$5,$6,$7,$8,$9) returning id`,
    [actor.id, instruction, JSON.stringify(plan), JSON.stringify(preview.diff), preview.risk,
     preview.planHash, needs, auto ? 'approved' : 'awaiting_approval', runId])).rows[0]
  // audit the dry-run from OUTSIDE the rolled-back transaction
  await pool.query(`insert into audit_log (actor, run_id, action, entity, after) values ($1,$2,'dry_run','agent_run',$3::jsonb)`,
    [`user:${actor.id}`, run.id, JSON.stringify({ risk: preview.risk, totals: preview.diff.totals })])
  if (auto) return commit(run.id, actor)
  await pool.query(`insert into approvals (run_id, required_role, requested_by) values ($1,$2,$3)`, [run.id, needs, actor.id])
  return { runId: run.id as string, status: 'awaiting_approval', diff: preview.diff, risk: preview.risk, requiredRole: needs }
}

export async function decide(runId: string, approver: Actor, decision: 'approved' | 'rejected', typed?: string) {
  const run = (await pool.query(`select * from agent_runs where id = $1`, [runId])).rows[0]
  if (!run || run.status !== 'awaiting_approval') throw new Error('Run is not awaiting approval')
  if (!can(approver.role, run.required_role)) throw new Error(`Needs ${run.required_role} approval`)
  if (run.risk === 'HIGH' && run.user_id === approver.id) throw new Error('The requester cannot approve their own high-risk run')
  if (run.risk === 'HIGH' && decision === 'approved' && typed !== 'CONFIRM') throw new Error('Type CONFIRM to approve a high-risk run')

  if (decision === 'rejected') {
    await withTx(async db => {
      const r = await db.query(`update agent_runs set status = 'rejected' where id = $1 and status = 'awaiting_approval' returning id`, [runId])
      if (!r.rowCount) throw new Error('Run was already decided')
      await db.query(`update approvals set decision = 'rejected', decided_by = $2, decided_at = now() where run_id = $1 and decision is null`, [runId, approver.id])
      await db.query(`insert into audit_log (actor, run_id, action, entity) values ($1,$2,'run_rejected','agent_run')`, [`user:${approver.id}`, runId])
    })
    return { runId, status: 'rejected' }
  }

  // The AI inherits the REQUESTER's permissions, so re-check the plan as the requester.
  const requester = (await pool.query(`select id, role from users where id = $1`, [run.user_id])).rows[0] as Actor
  const fresh = await dryRun(run.plan, requester, runId)
  if (fresh.planHash !== run.plan_hash) {
    const required = requiredRoleFor(run.plan, fresh.risk)
    await withTx(async db => {
      await db.query(`update agent_runs set diff = $2::jsonb, risk = $3, plan_hash = $4, required_role = $5 where id = $1 and status = 'awaiting_approval'`,
        [runId, JSON.stringify(fresh.diff), fresh.risk, fresh.planHash, required])
      await db.query(`update approvals set required_role = $2 where run_id = $1 and decision is null`, [runId, required])
    })
    return { runId, status: 'awaiting_approval', changed: true, diff: fresh.diff, risk: fresh.risk }   // human must look again
  }
  await withTx(async db => {
    const claimed = await db.query(
      `update agent_runs set status = 'approved' where id = $1 and status = 'awaiting_approval' and plan_hash = $2 returning id`, [runId, fresh.planHash])
    if (!claimed.rowCount) throw new Error('Run was already decided or preview changed')
    await db.query(`update approvals set decision = 'approved', decided_by = $2, decided_at = now() where run_id = $1 and decision is null`, [runId, approver.id])
  })
  return commit(runId, requester)
}

/** Real execution: one transaction, steps recorded with compensations. */
export async function commit(runId: string, requester: Actor) {
  const run = (await pool.query(`select * from agent_runs where id = $1`, [runId])).rows[0]
  if (!run || run.status !== 'approved') throw new Error('Run is not approved')
  try {
    const outcome = await withTx(async db => {
      const locked = (await db.query(`select * from agent_runs where id = $1 for update`, [runId])).rows[0]
      if (!locked || locked.status !== 'approved') return { runId, status: locked?.status ?? 'failed' }
      if (locked.user_id !== requester.id) throw new Error('Only the requester can execute this run')
      const current = (await db.query(`select id, role from users where id = $1`, [requester.id])).rows[0] as Actor
      if (!current) throw new Error('Requester not found')
      await lockAdaptive(db)
      // Prototype-wide write locks keep re-preview and commit on the same business state.
      await db.query('LOCK TABLE contacts, pages, webinars, campaigns, registrations, subscriptions, plans IN SHARE ROW EXCLUSIVE MODE')
      await db.query('SAVEPOINT approval_preview')
      const check = await executePlan(db, locked.plan, current, runId, true)
      const freshDiff = buildDiff(check.stepEffects, check.distinctRecipients)
      await db.query('ROLLBACK TO SAVEPOINT approval_preview')
      await db.query('RELEASE SAVEPOINT approval_preview')
      const freshHash = hashPlan(locked.plan, freshDiff)
      if (freshHash !== locked.plan_hash) {
        const risk = computeRisk(locked.plan, freshDiff)
        const required = requiredRoleFor(locked.plan, risk)
        await db.query(`update agent_runs set status = 'awaiting_approval', diff = $2::jsonb, risk = $3, required_role = $4, plan_hash = $5 where id = $1`, [runId, JSON.stringify(freshDiff), risk, required, freshHash])
        const reset = await db.query(`update approvals set decision = null, decided_by = null, decided_at = null, required_role = $2 where run_id = $1 returning id`, [runId, required])
        if (!reset.rowCount) await db.query(`insert into approvals (run_id, required_role, requested_by) values ($1,$2,$3)`, [runId, required, requester.id])
        return { runId, status: 'awaiting_approval', changed: true, diff: freshDiff, risk }
      }
      await executePlan(db, locked.plan, current, runId, false, async (ctx, i, tool, args, out) => {
        await db.query(
          `insert into run_steps (run_id, seq, tool, args, result, compensation, idempotency_key, status)
           values ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8)`,
          [runId, i + 1, tool.name, JSON.stringify(args), JSON.stringify(out.result), JSON.stringify(out.compensation),
           `${runId}:${i + 1}`, tool.reversibility === 'irreversible' ? 'cannot_rewind' : 'done'])
        await audit(ctx, `step:${tool.name}`, 'run_step', null, { effects: out.effects })
      })
      await db.query(`update agent_runs set status = 'completed', completed_at = now() where id = $1`, [runId])
      return { runId, status: 'completed' as const }
    })
    return outcome
  } catch (e: any) {
    // Everything the run did is already rolled back. Record why, outside the transaction.
    await pool.query(`update agent_runs set status = 'failed', error = $2 where id = $1 and status = 'approved'`, [runId, e.message])
    await pool.query(`insert into audit_log (actor, run_id, action, entity, after) values ($1,$2,'run_failed','agent_run',$3::jsonb)`,
      [`user:${requester.id}`, runId, JSON.stringify({ error: e.message, note: 'all changes rolled back' })])
    return { runId, status: 'failed' as const, error: e.message as string }
  }
}

/** Undo a completed run: compensations in reverse order, in one transaction. */
export async function rewind(runId: string, actor: Actor) {
  const run = (await pool.query(`select * from agent_runs where id = $1`, [runId])).rows[0]
  if (!run || run.status !== 'completed') throw new Error('Only completed runs can be rewound')
  if (!can(actor.role, run.required_role ?? 'marketer')) throw new Error(`Needs ${run.required_role} to rewind this run`)
  const notes: string[] = []
  await withTx(async db => {
    const locked = (await db.query(`select status from agent_runs where id = $1 for update`, [runId])).rows[0]
    if (locked?.status !== 'completed') throw new Error('Only completed runs can be rewound')
    await lockAdaptive(db)
    const ctx: Ctx = { db, user: actor, runId, dry: false, now: new Date() }
    const steps = (await db.query(`select * from run_steps where run_id = $1 order by seq desc`, [runId])).rows
    for (const s of steps) {
      const tool = registry[s.tool]
      if (tool.reversibility === 'irreversible' || (s.compensation != null && !tool.compensate)) {
        notes.push(`Step ${s.seq} (${s.tool}) cannot be rewound.`)
        await db.query(`update run_steps set status = 'cannot_rewind' where id = $1`, [s.id])
        continue
      }
      if (s.compensation == null) continue                       // read-only step: nothing to undo
      const out = await tool.compensate!(s.compensation, ctx)
      if (out && 'note' in out) notes.push(out.note)
      await db.query(`update run_steps set status = $2 where id = $1`, [s.id, out && 'note' in out ? 'cannot_rewind' : 'rewound'])
    }
    await db.query(`update agent_runs set status = 'rewound' where id = $1`, [runId])
    await audit(ctx, 'run_rewound', 'agent_run', { status: 'completed' }, { status: 'rewound', notes })
  })
  return { runId, status: 'rewound' as const, notes }
}
