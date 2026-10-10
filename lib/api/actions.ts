import { z } from 'zod'
import { pool, withTx } from '../db'
import { makePlan, PlannerError } from '../agent/planner'
import { PlanSchema } from '../agent/plan'
import { propose, decide, rewind, type Actor } from '../agent/runner'
import { can } from '../agent/types'
import { closeWebinar, activateSubscription, registerContacts } from '../services/adaptive'
import { previewPending, approvePending } from '../services/pending'
import { cancelPending } from '../services/cancel_pending'
import { lockAdaptive } from '../rules/evaluate'
import { tick } from '../../scripts/worker'
import { actor, body, endpoint, HttpError, idOf, slugOf, uuid, requireRun, requireWebinar, type IdContext, type SlugContext } from './http'

export const plan = endpoint(async (req: Request) => {
  const user = await actor(req)
  const input = await body(req, z.object({ instruction: z.string().trim().min(5).max(2000), plan: PlanSchema.optional() }).strict())
  let planned
  try { planned = input.plan ? { plan: input.plan, source: 'supplied' as const, plannerMode: 'supplied' as const, fallbackReason: null } : await makePlan(input.instruction) }
  catch (error) { throw new HttpError(422, 'PLAN_FAILED', error instanceof PlannerError ? error.message : 'Planning failed',
    error instanceof PlannerError ? { plannerCode: error.code } : undefined) }
  const { plan: proposed, source, plannerMode, fallbackReason } = planned
  if (proposed.clarification) return { clarification: proposed.clarification, summary: proposed.summary, source, plannerMode, fallbackReason }
  const result = await propose(input.instruction, proposed, user)
  if (result.status === 'refused' || result.status === 'failed') throw new HttpError(result.status === 'refused' ? 403 : 422,
    result.status === 'refused' ? 'FORBIDDEN' : 'PLAN_FAILED', 'error' in result ? String(result.error) : 'Plan failed', { runId: result.runId })
  return { ...result, summary: proposed.summary, deferred: proposed.deferred, source, plannerMode, fallbackReason }
})

const decisionBody = z.object({ decision: z.enum(['approved', 'rejected']), typed: z.string().max(20).optional() }).strict()
async function decision(id: string, user: Actor, input: z.infer<typeof decisionBody>) {
  const run = await requireRun(id)
  if (!can(user.role, run.required_role ?? 'marketer')) throw new HttpError(403, 'FORBIDDEN', `Needs ${run.required_role ?? 'marketer'} approval`)
  if (run.status === 'completed' && input.decision === 'approved') return { runId: id, status: 'completed', duplicate: true }
  if (run.status !== 'awaiting_approval') throw new HttpError(409, 'CONFLICT', 'Run is not awaiting approval')
  if (run.risk === 'HIGH' && run.user_id === user.id) throw new HttpError(403, 'FORBIDDEN', 'The requester cannot approve their own high-risk run')
  if (run.risk === 'HIGH' && input.decision === 'approved' && input.typed !== 'CONFIRM') throw new HttpError(400, 'INVALID_INPUT', 'Type CONFIRM to approve a high-risk run')
  let result
  try { result = await decide(id, user, input.decision, input.typed) }
  catch (error) {
    const fresh = await requireRun(id)
    if (fresh.status === 'completed' && input.decision === 'approved') return { runId: id, status: 'completed', duplicate: true }
    throw new HttpError(409, 'CONFLICT', error instanceof Error ? error.message : 'Run decision conflicted')
  }
  if (result.status === 'failed') throw new HttpError(422, 'PLAN_FAILED', 'error' in result ? String(result.error) : 'Execution failed', { runId: id })
  return result
}
export const approve = endpoint(async (req: Request) => {
  const user = await actor(req)
  const input = await body(req, decisionBody.extend({ run_id: uuid }))
  return decision(input.run_id, user, { decision: input.decision, typed: input.typed })
})
export const runDecision = endpoint(async (req: Request, ctx: IdContext) => {
  const user = await actor(req)
  return decision(await idOf(ctx), user, await body(req, decisionBody))
})
export const runRewind = endpoint(async (req: Request, ctx: IdContext) => {
  const user = await actor(req)
  const id = await idOf(ctx), run = await requireRun(id)
  if (!can(user.role, run.required_role ?? 'marketer')) throw new HttpError(403, 'FORBIDDEN', 'Insufficient role to rewind')
  if (run.status !== 'completed') throw new HttpError(409, 'CONFLICT', 'Only completed runs can be rewound')
  try { return await rewind(id, user) }
  catch (error) { if (error instanceof Error && error.message === 'Only completed runs can be rewound') throw new HttpError(409, 'CONFLICT', error.message); throw error }
})
export const webinarClose = endpoint(async (req: Request, ctx: IdContext) => {
  const user = await actor(req, 'marketer'), id = await idOf(ctx)
  await requireWebinar(id)
  return withTx(async db => {
    await lockAdaptive(db)
    const w = (await db.query('select status from webinars where id = $1 for update', [id])).rows[0]
    if (!w || w.status === 'archived') throw new HttpError(409, 'CONFLICT', 'Webinar is archived or unavailable')
    const result = await closeWebinar(db, id)
    await db.query(`insert into audit_log (actor,action,entity,after) values ($1,'close_webinar','webinar',$2::jsonb)`,
      [`user:${user.id}`, JSON.stringify({ webinar_id: id, ...result })])
    return result
  })
})
const kindSchema = z.enum(['offer', 'followup'])
export const pending = endpoint(async (req: Request, ctx: IdContext) => {
  await actor(req, 'marketer')
  const id = await idOf(ctx); await requireWebinar(id)
  const kind = kindSchema.parse(new URL(req.url).searchParams.get('kind'))
  return withTx(db => previewPending(db, id, kind))
})
export const pendingApprove = endpoint(async (req: Request, ctx: IdContext) => {
  const user = await actor(req, 'owner'), id = await idOf(ctx); await requireWebinar(id)
  const input = await body(req, z.object({ kind: kindSchema, fingerprint: z.string().regex(/^[a-f0-9]{64}$/) }).strict())
  return withTx(db => approvePending(db, user, id, input.kind, input.fingerprint))
})
export const checkout = endpoint(async (req: Request) => {
  const user = await actor(req, 'owner')
  const input = await body(req, z.object({ contact_id: uuid, plan: z.string().min(1).max(120) }).strict())
  return withTx(async db => {
    await lockAdaptive(db)
    if (!(await db.query('select id from contacts where id = $1', [input.contact_id])).rowCount ||
      !(await db.query('select id from plans where name = $1', [input.plan])).rowCount) throw new HttpError(404, 'NOT_FOUND', 'Contact or plan not found')
    const result = await activateSubscription(db, input.contact_id, input.plan)
    await db.query(`insert into audit_log (actor,action,entity,after) values ($1,'simulated_checkout','subscription',$2::jsonb)`,
      [`user:${user.id}`, JSON.stringify({ contact_id: input.contact_id, plan: input.plan, ...result })])
    return result
  })
})
export const runCancelPending = endpoint(async (req: Request, ctx: IdContext) => {
  const user = await actor(req, 'marketer'), id = await idOf(ctx); await requireRun(id)
  return withTx(db => cancelPending(db, id, user))
})
export const workerTick = endpoint(async (req: Request) => {
  const user = await actor(req, 'owner'), result = await tick()
  await pool.query(`insert into audit_log (actor,action,entity,after) values ($1,'worker_tick','outbox',$2::jsonb)`,
    [`user:${user.id}`, JSON.stringify(result)])
  return result
})

export const publicRegister = endpoint(async (req: Request, ctx: SlugContext) => {
  const slug = await slugOf(ctx)
  const input = await body(req, z.object({ name: z.string().trim().min(1).max(100), email: z.string().trim().email().max(200).transform(s => s.toLowerCase()) }).strict())
  return withTx(async db => {
    await lockAdaptive(db)
    const w = (await db.query(`select w.id from webinars w join pages p on p.id=w.page_id
      where p.slug=$1 and p.status='published' and w.status='scheduled' for update of w, p`, [slug])).rows[0]
    if (!w) throw new HttpError(404, 'NOT_FOUND', 'Registration page not found or closed')
    const c = (await db.query(`insert into contacts (name,email,source) values ($1,$2,'website')
      on conflict ((lower(email))) do update set name=contacts.name returning id`, [input.name,input.email])).rows[0]
    const ids = await registerContacts(db, w.id, [c.id])
    if (ids.length) await db.query(`insert into audit_log (actor,action,entity,after)
      values ('public:registration','register','webinar',$1::jsonb)`, [JSON.stringify({ webinar_id:w.id, contact_id:c.id })])
    return { registered: ids.length === 1 }
  })
})
