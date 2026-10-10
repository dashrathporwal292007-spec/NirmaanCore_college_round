// lib/fingerprint.ts
import { createHash } from 'crypto'
/** Exactly who gets exactly what. Any change to recipients, subject or body changes it. */
export const fingerprint = (contactIds: string[], subject: string, body: string) =>
  createHash('sha256').update(JSON.stringify([[...contactIds].sort(), subject, body])).digest('hex')
