import { RotateCcw, X, ShieldCheck } from 'lucide-react';
import BlueMascot from '../BlueMascot';
import { btnGhost, btnPrimary } from '../Modal';

export function RedoConfirm({ onRedo, onContinue }: { onRedo: () => void; onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <BlueMascot size={120} mood="thinking" float />
      <h3 className="mt-4 text-xl font-bold text-ink">Would you like to redo?</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">I can go back and make changes, or we can move forward with this plan.</p>
      <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
        <button onClick={onRedo} className={`${btnPrimary} flex items-center justify-between`}>
          <span className="flex items-center gap-2"><RotateCcw size={16} /> Yes, redo</span><span className="text-xs font-normal opacity-80">Go back to edit the plan →</span>
        </button>
        <button onClick={onContinue} className={`${btnGhost} flex items-center justify-between`}>
          <span className="flex items-center gap-2"><X size={16} /> No, continue</span><span className="text-xs font-normal text-muted">Move to the next step →</span>
        </button>
      </div>
    </div>
  );
}

export function Aborted({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="relative">
        <BlueMascot size={120} mood="calm" />
        <span aria-hidden="true" className="absolute -right-6 top-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-500 shadow-card">✕ Task aborted ✨</span>
      </div>
      <h3 className="mt-4 text-xl font-bold text-ink">Task aborted</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">No worries! I won't take any action. I'll ask for your permission for the next one.</p>
      <div className="mt-5 flex max-w-sm items-start gap-3 rounded-2xl bg-blue-50 p-4 text-left text-sm text-blue-700">
        <ShieldCheck size={20} className="mt-0.5 flex-shrink-0" />
        <p><strong>Your control matters.</strong> You're always in charge. I'll wait for your permission before doing anything else.</p>
      </div>
      <button onClick={onDone} className={`${btnPrimary} mt-6`}>Back to Dashboard</button>
    </div>
  );
}
