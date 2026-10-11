// lib/db.ts
import { Pool, PoolClient } from 'pg'

const g = globalThis as typeof globalThis & { __pool?: Pool }
function getPool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required; no default database is assumed.')
  return g.__pool ?? (g.__pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 }))
}

// Importing a route must not need a database. Resolve the pool on first use,
// retaining pg's promise/callback signatures and binding methods to the real pool.
export const pool: Pool = new Proxy(Object.create(Pool.prototype) as Pool, {
  get(_target, property) {
    if (property === 'query' || property === 'connect') {
      return (...args: unknown[]) => {
        const real = getPool()
        return Reflect.apply(Reflect.get(real, property), real, args)
      }
    }
    if (property === 'end') return (...args: unknown[]) => {
      if (g.__pool) return Reflect.apply(g.__pool.end, g.__pool, args)
      const callback = args[0]
      if (typeof callback === 'function') { callback(); return }
      return Promise.resolve()
    }
    const real = getPool()
    const value = Reflect.get(real, property, real)
    return typeof value === 'function' ? value.bind(real) : value
  },
})

async function begin(db: PoolClient) {
  await db.query('BEGIN')
  await db.query("SET LOCAL statement_timeout = '8000'")
}

/** Commits on success, rolls back on any throw. */
export async function withTx<T>(fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await pool.connect()
  try {
    await begin(db)
    const out = await fn(db)
    await db.query('COMMIT')
    return out
  } catch (e) {
    await db.query('ROLLBACK').catch(() => {})
    throw e
  } finally {
    db.release()
  }
}

/** ALWAYS rolls back. This is the dry-run primitive. */
export async function withRollback<T>(fn: (db: PoolClient) => Promise<T>): Promise<T> {
  const db = await pool.connect()
  try {
    await begin(db)
    return await fn(db)
  } finally {
    await db.query('ROLLBACK').catch(() => {})
    db.release()
  }
}
