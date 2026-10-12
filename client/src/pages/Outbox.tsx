import { Send, Info } from 'lucide-react';

interface OutboxItem {
  id: string;
  to: string;
  preview: string;
  at: string;
}

const SAMPLE_OUTBOX: OutboxItem[] = [];

export default function Outbox() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Send size={20} className="text-blue-500" />
        <h1 className="text-xl font-semibold text-ink">Outbox</h1>
      </div>

      <div className="card mb-4 p-4 flex items-start gap-3 bg-amber-50 border border-amber-100">
        <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          <strong>Demo: nothing is actually sent.</strong> When you approve a draft message, it appears here as a simulation. No real messages leave this app.
        </p>
      </div>

      {SAMPLE_OUTBOX.length === 0 ? (
        <div className="card p-12 text-center">
          <Send size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-medium text-ink">No approved messages yet</p>
          <p className="text-muted text-sm mt-1">
            When you approve a draft through Blue, it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {SAMPLE_OUTBOX.map(item => (
            <div key={item.id} className="card px-5 py-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-ink text-sm">To: {item.to}</span>
                <span className="text-xs text-muted">{item.at}</span>
              </div>
              <p className="text-sm text-muted truncate">{item.preview}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
