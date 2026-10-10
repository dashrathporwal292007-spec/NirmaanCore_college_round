// lib/agent/plan.ts
import { z } from 'zod'
import { registry } from '../tools/registry'
import { Role, can } from './types'

export const PlanSchema = z.object({
  summary: z.string().max(300),
  clarification: z.string().nullable().optional(),   // set when required info is missing; steps then empty
  deferred: z.array(z.string()).default([]),          // asked for, but cannot happen yet (e.g. offer to attendees)
  steps: z.array(z.object({ tool: z.string(), args: z.record(z.string(), z.any()) })).max(10),
})
export type Plan = z.infer<typeof PlanSchema>

export class PlanError extends Error {
  constructor(public code: 'invalid' | 'forbidden', message: string) { super(message) }
}

const REF = /^\$step(\d+)\.([A-Za-z_]\w*)$/

function walk(v: any, fn: (s: string) => void) {
  if (typeof v === 'string') fn(v)
  else if (Array.isArray(v)) v.forEach(x => walk(x, fn))
  else if (v && typeof v === 'object') Object.values(v).forEach(x => walk(x, fn))
}

export function validatePlan(plan: Plan, role: Role) {
  const parsed = PlanSchema.safeParse(plan)
  if (!parsed.success) throw new PlanError('invalid', parsed.error.message)
  if (plan.clarification) throw new PlanError('invalid', 'Clarification must be answered before execution')
  if (!plan.steps.length) throw new PlanError('invalid', 'Plan has no steps')
  plan.steps.forEach((s, i) => {
    const tool = registry[s.tool]
    if (!Object.hasOwn(registry, s.tool)) throw new PlanError('invalid', `Unknown tool "${s.tool}"`)
    if (!can(role, tool.requiredRole))
      throw new PlanError('forbidden', `Your role (${role}) cannot use ${s.tool}; it needs ${tool.requiredRole}`)
    walk(s.args, str => {
      const m = str.match(REF)
      if (m && (Number(m[1]) < 1 || Number(m[1]) > i))     // $stepN is 1-based; must point to an EARLIER step
        throw new PlanError('invalid', `Step ${i + 1} references ${str}, which is not an earlier step`)
    })
  })
}

export function resolveRefs(v: any, results: any[]): any {
  if (typeof v === 'string') {
    const m = v.match(REF)
    if (!m) return v
    const r = results[Number(m[1]) - 1]
    if (!r || !Object.hasOwn(r, m[2])) throw new Error(`Reference ${v} did not resolve`)
    return r[m[2]]
  }
  if (Array.isArray(v)) return v.map(x => resolveRefs(x, results))
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resolveRefs(x, results)]))
  return v
}
