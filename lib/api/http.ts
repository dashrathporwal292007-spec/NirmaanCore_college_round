import { unstable_rethrow } from 'next/navigation'
import { z } from 'zod'
import { pool } from '../db'
import type { Actor } from '../agent/runner'
import { can, type Role } from '../agent/types'

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message) }
}
export const uuid = z.string().uuid()
export type IdContext = { params: Promise<{ id: string }> }
export type SlugContext = { params: Promise<{ slug: string }> }
export const idOf = async (ctx: IdContext) => uuid.parse((await ctx.params).id)
export const slugOf = async (ctx: SlugContext) => z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).parse((await ctx.params).slug)
export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}
export function endpoint<A extends unknown[]>(fn: (...args: A) => Promise<unknown>) {
  return async (...args: A): Promise<Response> => {
    try {
      const req = args[0] as Request
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const origin = req.headers.get('origin')
        if (origin && origin !== new URL(req.url).origin) throw new HttpError(403, 'FORBIDDEN', 'Cross-origin writes are not allowed')
      }
      return json(await fn(...args))
    } catch (error) {
      unstable_rethrow(error)
      if (error instanceof z.ZodError) return json({ error: { code: 'INVALID_INPUT', message: 'Invalid input',
        details: error.issues.map(i => ({ path: i.path.join('.'), message: i.message })) } }, 400)
      if (error instanceof HttpError) return json({ error: { code: error.code, message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }) } }, error.status)
      console.error('API request failed', error instanceof Error ? error.name : 'Unknown error')
      return json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }, 500)
    }
  }
}
export async function body<T extends z.ZodType>(req: Request, schema: T): Promise<z.output<T>> {
  let data: unknown
  try {
    const text = await req.text()
    if (text.length > 100_000) throw new Error('too large')
    data = JSON.parse(text)
  } catch { throw new HttpError(400, 'INVALID_INPUT', 'Invalid JSON body') }
  return schema.parse(data)
}
export async function actor(req: Request, role: Role = 'viewer'): Promise<Actor> {
  const cookie = req.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith('uid='))?.slice(4)
  let id: string | undefined
  try { id = cookie ? decodeURIComponent(cookie) : undefined } catch { /* malformed cookie is unauthenticated */ }
  if (!z.guid().safeParse(id).success) throw new HttpError(401, 'UNAUTHENTICATED', 'Not signed in')
  const user = (await pool.query('select id, role from users where id = $1', [id])).rows[0] as Actor | undefined
  if (!user) throw new HttpError(401, 'UNAUTHENTICATED', 'Not signed in')
  if (!can(user.role, role)) throw new HttpError(403, 'FORBIDDEN', `Needs ${role} role`)
  return user
}
export function paging(req: Request) {
  const p = new URL(req.url).searchParams
  return z.object({ limit: z.coerce.number().int().min(1).max(200), offset: z.coerce.number().int().min(0).max(2147483647) })
    .parse({ limit: p.get('limit') ?? 50, offset: p.get('offset') ?? 0 })
}
export async function requireRun(id: string) {
  const run = (await pool.query('select * from agent_runs where id = $1', [id])).rows[0]
  if (!run) throw new HttpError(404, 'NOT_FOUND', 'Run not found')
  return run
}
export async function requireWebinar(id: string) {
  const webinar = (await pool.query('select id, status from webinars where id = $1', [id])).rows[0]
  if (!webinar) throw new HttpError(404, 'NOT_FOUND', 'Webinar not found')
  return webinar
}
