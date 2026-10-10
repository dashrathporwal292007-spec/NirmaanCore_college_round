// lib/db.ts
import { Pool, PoolClient } from 'pg'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required; no default database is assumed.')
const g = globalThis as typeof globalThis & { __pool?: Pool }
export const pool: Pool = g.__pool ?? (g.__pool = new Pool({
  connectionString: process.env.DATABASE_URL, max: 10,
}))

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
