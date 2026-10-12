import { SectionTitle } from './parts';

const PRINCIPLES = [
  'Personal ownership: you control memory, permissions and retention.',
  'Least privilege: read-only by default; every write needs your approval of the exact content.',
  'Hyper-local memory: encrypted summaries and pointers, never raw email or chat bodies.',
  'No codebase access: repos, diffs, CI logs and secrets are excluded.',
  'No autonomous Blue-to-Blue behavior.',
  'Support, not surveillance: no manager view, no mood inference, no scores.',
  'Explainability: every recommendation shows its source, confidence and reason.',
  'User control: pause, mute, inspect, export, reset, delete.',
];

export default function About() {
  return (
    <div>
      <SectionTitle title="About Blue" hint="My Blue is my Blue, not your Blue." />
      <p className="text-sm text-ink">Version 0.1.0 · Built for the Google Cloud AI Builder Cup 2026 (Future of Work &amp; Enterprise Productivity).</p>
      <ul className="mt-4 space-y-2 text-sm text-muted list-disc pl-5">
        {PRINCIPLES.map((p) => <li key={p}>{p}</li>)}
      </ul>
      <p className="mt-5 text-xs text-muted">Demo prototype: all workspace data is fictional and sending is simulated.</p>
    </div>
  );
}
