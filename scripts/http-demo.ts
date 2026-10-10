import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import { createServer } from 'node:net'
import { setTimeout as sleep } from 'node:timers/promises'
import { USERS } from './seed'

let server: ChildProcess | undefined
export let base = process.env.ROUTES_BASE_URL ?? ''
let serverOutput = ''
export const getServerOutput = () => serverOutput
export async function request(path: string, method = 'GET', input?: unknown, uid: string | null = USERS.owner, expected = 200, extra: Record<string,string> = {}) {
  const res = await fetch(base + path, { method, headers: { ...(uid ? { Cookie: `uid=${uid}` } : {}),
    ...(input === undefined ? {} : { 'Content-Type': 'application/json' }), ...extra },
    body: input === undefined ? undefined : JSON.stringify(input), signal: AbortSignal.timeout(20_000) })
  const text = await res.text()
  assert.equal(res.status, expected, `${method} ${path}: ${text}`)
  assert.match(res.headers.get('cache-control') ?? '', /no-store/)
  return JSON.parse(text)
}
export async function start() {
  if (base) {
    const u = new URL(base)
    assert.ok(u.protocol === 'http:' && ['127.0.0.1','localhost','[::1]'].includes(u.hostname), 'ROUTES_BASE_URL must be loopback HTTP')
    base = u.origin
    return
  }
  const probe = createServer()
  await new Promise<void>((resolve,reject) => { probe.once('error',reject); probe.listen(0,'127.0.0.1',resolve) })
  const address = probe.address(); assert.ok(address && typeof address !== 'string')
  const port = address.port
  await new Promise<void>((resolve,reject) => probe.close(e => e ? reject(e) : resolve()))
  base = `http://127.0.0.1:${port}`
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],
    { cwd: process.cwd(), env: { ...process.env, DEMO_MODE: '1' }, stdio: ['ignore','pipe','pipe'] })
  for (const stream of [server.stdout, server.stderr]) stream?.on('data', chunk => { serverOutput = (serverOutput + chunk.toString()).slice(-8000) })
  server.on('error', error => { serverOutput += String(error) })
  for (let i=0;i<150;i++) {
    if (server.exitCode !== null) throw new Error(`HTTP server exited: ${serverOutput}`)
    try { if ((await fetch(base+'/api/runs',{signal:AbortSignal.timeout(1000)})).status === 401) return } catch { /* wait for readiness */ }
    await sleep(200)
  }
  throw new Error(`HTTP server did not become ready: ${serverOutput}`)
}
export async function cleanup() {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM')
    await Promise.race([new Promise<void>(resolve=>server!.once('exit',()=>resolve())),sleep(5000)])
    if (server.exitCode === null) server.kill('SIGKILL')
  }
}
