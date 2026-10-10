// lib/agent/types.ts
import type { PoolClient } from 'pg'
import type { ZodType } from 'zod'

export type Role = 'owner' | 'marketer' | 'viewer'
export type Reversibility = 'reversible' | 'compensable' | 'irreversible'
export const RANK: Record<Role, number> = { viewer: 0, marketer: 1, owner: 2 }
export const can = (have: Role, need: Role) => RANK[have] >= RANK[need]

export interface Ctx {
  db: PoolClient
  user: { id: string; role: Role }
  runId: string
  dry: boolean
  now: Date
}

/** What a step changed. The diff shown to the human is built from these. */
export interface Effect {
  entity: string            // 'contact' | 'webinar' | 'page' | 'campaign' | 'email' | 'subscription'
  action: string            // human text: 'tag "webinar-friday" added'
  count: number
  sample?: string[]         // up to 3 names, so the diff shows real people
  recipients?: number       // external recipients (emails)
  skipped?: number          // e.g. unsubscribed
  moneyInr?: number         // money that moves NOW (0 for an offer)
  fingerprint?: string; publicVisible?: boolean   // e.g. a published page
}

export interface ToolOutput<R = any, C = any> {
  recipientIds?: string[]  // Internal resolved delivery targets; never exposed in effects.
  result: R                 // later steps can reference this: $step1.contact_ids
  effects: Effect[]
  compensation: C | null    // stored on run_steps, used by rewind
}

export interface Tool<A = any, R = any, C = any> {
  name: string
  description: string       // goes into the planner prompt
  argsHelp: string          // one line: argument names and meaning, for the prompt
  schema: ZodType<A>
  reversibility: Reversibility
  requiredRole: Role
  minutesSaved: number      // estimated manual minutes, for the savings metric
  execute(args: A, ctx: Ctx): Promise<ToolOutput<R, C>>
  compensate?(comp: C, ctx: Ctx): Promise<void | { note: string }>
}
