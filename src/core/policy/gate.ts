import type { ApprovalRequest } from '../types';

export async function hashAction(request: ApprovalRequest) {
  const input = new TextEncoder().encode(JSON.stringify(request));
  const digest = await crypto.subtle.digest('SHA-256', input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}