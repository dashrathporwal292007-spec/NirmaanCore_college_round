// lib/agent/risk.ts
import { registry } from '../tools/registry'
import { RANK, Role } from './types'
import type { Plan } from './plan'
import type { Diff } from './runner'

export type Risk = 'LOW' | 'MEDIUM' | 'HIGH'

export function computeRisk(plan: Plan, diff: Diff): Risk {
  const tools = plan.steps.map(s => registry[s.tool])
  let score = 0
  if (tools.some(t => t.reversibility === 'irreversible')) score += 3
  else if (tools.some(t => t.reversibility === 'compensable')) score += 1
  const r = diff.totals.recipients
  if (r > 100) score += 3
  else if (r >= 10) score += 1
  if (diff.totals.moneyInr > 0) score += 3
  if (diff.totals.publicVisible) score = Math.max(score, 1)
  return score >= 3 ? 'HIGH' : score >= 1 ? 'MEDIUM' : 'LOW'
}

/** HIGH needs the owner; otherwise the strictest role any tool in the plan requires. */
export function requiredRoleFor(plan: Plan, risk: Risk): Role {
  if (risk === 'HIGH') return 'owner'
  const floor: Role = risk === 'LOW' ? 'viewer' : 'marketer'
  return plan.steps.map(s => registry[s.tool].requiredRole)
    .reduce((a, b) => (RANK[a] >= RANK[b] ? a : b), floor)
}
