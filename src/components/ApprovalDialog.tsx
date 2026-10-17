import { useRef, useState } from 'react';
import { ShieldCheck, Cloud, X } from 'lucide-react';
import { useBlueStore } from '../store';
import { hashAction } from '../core/policy/gate';
import { useFocusTrap } from './useFocusTrap';
import BlueMascot from './BlueMascot';

/** Mounted once in App. Shows whatever guard() asked the user to approve. */
export default function ApprovalDialog() {
  const pending = useBlueStore((s) => s.pendingApproval);
  const setApproval = useBlueStore((s) => s.setApproval);
  if (!pending) return null;
  return <Inner key={pending.request.type + (pending.request.recipient ?? '')} pending={pending} close={() => setApproval(null)} />;
}

function Inner({ pending, close }: { pending: NonNullable<ReturnType<typeof useBlueStore.getState>['pendingApproval']>; close: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState(pending.request.content ?? '');
  const isCloud = pending.request.type === 'cloud_inference';

  const cancel = () => {
    pending.resolve({ approved: false, request: pending.request });
    close();
  };
  useFocusTrap(ref, cancel);

  const approve = async () => {
    const final = { ...pending.request, content: pending.editable ? content : pending.request.content };
    const hash = await hashAction(final);
    pending.resolve({ approved: true, request: final, hash });
    close();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/50 backdrop-blur-sm p-4">
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="approval-title"
        aria-describedby="approval-desc"
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 animate-pop"
      >
        <div className="flex items-start gap-4">
          <BlueMascot size={72} mood={isCloud ? 'thinking' : 'encouraging'} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 id="approval-title" className="text-lg font-semibold text-ink">
                {isCloud ? 'Use Gemini in the cloud?' : 'Approve this action?'}
              </h2>
              <button onClick={cancel} aria-label="Cancel" className="p-1 rounded-lg text-muted hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <p id="approval-desc" className="text-sm text-muted mt-1">
              {isCloud
                ? 'Cloud mode: selected content is sent to Google Cloud (Gemini) for processing. Raw messages, secrets and code are filtered out first.'
                : 'I will not do anything until you approve the exact text below. Changing it asks you again.'}
            </p>
          </div>
        </div>

        {!isCloud && (
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex gap-3">
              <dt className="w-20 text-muted">Action</dt>
              <dd className="font-medium text-ink">{pending.request.effect ?? pending.request.type}</dd>
            </div>
            {pending.request.recipient && (
              <div className="flex gap-3">
                <dt className="w-20 text-muted">To</dt>
                <dd className="font-medium text-ink">{pending.request.recipient}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted mb-1">Exact content</dt>
              <dd>
                {pending.editable ? (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    aria-label="Exact content to approve"
                    rows={8}
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm font-sans">{pending.request.content}</pre>
                )}
              </dd>
            </div>
          </dl>
        )}

        <p className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-600">
          {isCloud ? <Cloud size={14} /> : <ShieldCheck size={14} />}
          {isCloud ? 'You can switch back to Local mode in Settings at any time.' : 'Demo: nothing is actually sent.'}
        </p>

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={cancel} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-ink hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={approve} disabled={!isCloud && !content.trim()} className="btn-primary disabled:opacity-40">
            {isCloud ? 'Allow cloud mode' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}
