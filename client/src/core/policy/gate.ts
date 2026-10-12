import type { Settings } from '../types';

export type ActionType =
  | 'read_source'
  | 'draft_local'
  | 'send_message'
  | 'create_event'
  | 'edit_record'
  | 'delete_record'
  | 'cloud_inference'
  | 'blue_to_blue'
  | 'screen_capture'
  | 'read_codebase';

export interface ActionRequest {
  type: ActionType;
  source?: string;
  recipient?: string;
  content?: string;
  account?: string;
  effect?: string;
}

export type Decision =
  | { result: 'allow' }
  | { result: 'needs_approval'; previewHash: string }
  | { result: 'deny'; reason: string };

const WRITE_ACTIONS: ActionType[] = ['send_message', 'create_event', 'edit_record', 'delete_record'];

export async function hashAction(r: ActionRequest): Promise<string> {
  const payload = JSON.stringify([r.type, r.recipient ?? null, r.content ?? null, r.account ?? null, r.effect ?? null]);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function decide(r: ActionRequest, s: Settings): Promise<Decision> {
  switch (r.type) {
    case 'read_codebase':
      return { result: 'deny', reason: 'Codebase access is never permitted.' };
    case 'blue_to_blue':
      return { result: 'deny', reason: 'Blue-to-Blue is disabled; it needs mutual explicit consent (roadmap).' };
    case 'screen_capture':
      return { result: 'deny', reason: 'Screen capture is off by default and not available in this version.' };
  }

  if (s.paused) return { result: 'deny', reason: 'Blue is paused.' };

  switch (r.type) {
    case 'read_source':
      return s.allowConnectors ? { result: 'allow' } : { result: 'deny', reason: 'Connector access is off.' };
    case 'draft_local':
      return { result: 'allow' };
    case 'cloud_inference':
      return s.cloudConsentGiven ? { result: 'allow' } : { result: 'needs_approval', previewHash: await hashAction(r) };
    case 'send_message':
    case 'create_event':
    case 'edit_record':
    case 'delete_record':
      if (!s.allowWriting) return { result: 'deny', reason: 'Write actions are off.' };
      return { result: 'needs_approval', previewHash: await hashAction(r) };
    default:
      return { result: 'deny', reason: 'Action not recognised.' };
  }
}

export async function verifyApproval(r: ActionRequest, approvedHash: string): Promise<boolean> {
  return (await hashAction(r)) === approvedHash;
}

export function isWriteAction(t: ActionType): boolean {
  return WRITE_ACTIONS.includes(t);
}
