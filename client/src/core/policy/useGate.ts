import { decide, verifyApproval, type ActionRequest } from './gate';
import { useBlueStore } from '../../store';
import { logAudit } from '../memory/audit';

export type GuardResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string; cancelled?: boolean };

function describe(r: ActionRequest): string {
  const base = r.effect ?? r.type;
  return r.recipient ? `${base} to ${r.recipient}` : r.source ? `${base} (${r.source})` : base;
}

async function audit(action: string, allowed: boolean, detail: string) {
  await logAudit(action, allowed, detail);
  await useBlueStore.getState().refreshAudit();
}

function askApproval(request: ActionRequest, editable: boolean) {
  return new Promise<{ approved: boolean; request: ActionRequest; hash?: string }>((resolve) => {
    useBlueStore.getState().setApproval({ request, editable, resolve });
  });
}

/**
 * The single entry point for any action that touches data, the cloud or the outside world.
 * Deterministic: the model can never skip this.
 */
export async function guard<T>(
  request: ActionRequest,
  run: (finalRequest: ActionRequest) => T | Promise<T>,
  opts: { editable?: boolean } = {},
): Promise<GuardResult<T>> {
  const store = useBlueStore.getState();
  const decision = await decide(request, store.settings);

  if (decision.result === 'deny') {
    await audit(request.type, false, `blocked: ${decision.reason} (${describe(request)})`);
    return { ok: false, reason: decision.reason };
  }

  if (decision.result === 'allow') {
    await audit(request.type, true, `allowed: ${describe(request)}`);
    return { ok: true, value: await run(request) };
  }

  const answer = await askApproval(request, opts.editable ?? false);
  if (!answer.approved || !answer.hash) {
    await audit(request.type, false, `cancelled by user: ${describe(request)}`);
    return { ok: false, reason: 'Cancelled.', cancelled: true };
  }

  // Re-check immediately before running: settings may have changed, content may have been edited.
  const finalRequest = answer.request;
  const recheck = await decide(finalRequest, useBlueStore.getState().settings);
  if (recheck.result === 'deny') {
    await audit(request.type, false, `blocked after approval: ${recheck.reason}`);
    return { ok: false, reason: recheck.reason };
  }
  if (!(await verifyApproval(finalRequest, answer.hash))) {
    await audit(request.type, false, `approval no longer matches content: ${describe(finalRequest)}`);
    return { ok: false, reason: 'The content changed after approval. Please review it again.' };
  }

  if (finalRequest.type === 'cloud_inference') {
    await useBlueStore.getState().updateSettings({ cloudConsentGiven: true });
  }
  await audit(request.type, true, `approved: ${describe(finalRequest)} (hash ${answer.hash.slice(0, 6)}…)`);
  return { ok: true, value: await run(finalRequest) };
}
