interface AuditEntry {
  action: string;
  allowed: boolean;
  details: string;
  at: string;
}

export async function logAudit(action: string, allowed: boolean, details: string) {
  if (typeof localStorage === 'undefined') return;
  try {
    const stored = localStorage.getItem('blue-audit-log');
    const entries = stored ? JSON.parse(stored) as AuditEntry[] : [];
    entries.push({ action, allowed, details, at: new Date().toISOString() });
    localStorage.setItem('blue-audit-log', JSON.stringify(entries.slice(-200)));
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}