import { FileText, Lock } from 'lucide-react';

const DOCS = [
  { id: 'd1', name: 'Leave and Hours Policy', path: 'policies/leave-and-hours.md', size: '3 KB' },
  { id: 'd2', name: 'Incident Escalation Policy', path: 'policies/incident-escalation.md', size: '2 KB' },
  { id: 'd3', name: 'Code Review Norms', path: 'policies/code-review-norms.md', size: '2.5 KB' },
  { id: 'd4', name: 'Atlas Project Brief', path: 'project_brief.md', size: '4 KB' },
];

export default function Files() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink">Approved Documents</h1>
        <span className="pill bg-blue-50 text-blue-600">
          <Lock size={11} /> Read-only
        </span>
      </div>

      <p className="text-muted text-sm mb-4">
        Blue can only access policy and project documents you've approved — never source code or personal files.
      </p>

      <div className="space-y-2">
        {DOCS.map(doc => (
          <div key={doc.id}
               className="card px-5 py-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText size={18} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink text-sm">{doc.name}</p>
              <p className="text-xs text-muted mt-0.5">{doc.path} · {doc.size}</p>
            </div>
            <Lock size={14} className="text-muted flex-shrink-0" aria-label="Read-only" />
          </div>
        ))}
      </div>

      <div className="mt-6 card p-4 text-center text-muted text-sm">
        <p>🔒 No codebase access. Repos, diffs, CI logs, and secrets are always excluded.</p>
      </div>
    </div>
  );
}
