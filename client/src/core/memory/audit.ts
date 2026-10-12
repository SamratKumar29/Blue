import { AuditEntry } from '../types';
import { put, getAll, del, getDb } from './db';

const AUDIT_STORE = 'audit';

/**
 * Log an audit action into local encrypted memory.
 * Rule: `detail` must NEVER contain sensitive message/email bodies or secrets.
 */
export async function logAudit(
  action: string,
  allowed: boolean,
  detail: string
): Promise<AuditEntry> {
  const entry: AuditEntry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    at: new Date().toISOString(),
    action,
    allowed,
    detail,
  };

  await put<AuditEntry>(AUDIT_STORE, entry.id, entry);
  return entry;
}

/**
 * List all audit entries, sorted newest first.
 */
export async function listAudit(): Promise<AuditEntry[]> {
  const entries = await getAll<AuditEntry>(AUDIT_STORE);
  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

/**
 * Clear the audit log.
 */
export async function clearAudit(): Promise<void> {
  const db = await getDb();
  await db.clear(AUDIT_STORE);
}
