import Modal from './Modal';
import { useUi } from '../ui';

export const SHORTCUTS: { key: string; label: string }[] = [
  { key: 'H', label: 'Go to Home' },
  { key: 'M', label: 'Go to Chat (messages)' },
  { key: 'T', label: 'Go to Tasks' },
  { key: 'B', label: 'Go to Team (buddies)' },
  { key: 'C', label: 'Go to Calendar' },
  { key: 'F', label: 'Go to Files' },
  { key: 'A', label: 'Go to Apps' },
  { key: 'O', label: 'Go to Outbox' },
  { key: 'R', label: 'Open Morning Roundup' },
  { key: 'D', label: 'Toggle light / dark theme' },
  { key: 'S', label: 'Open Settings' },
  { key: '?', label: 'Show keyboard shortcuts' },
  { key: 'Esc', label: 'Close dialog' },
];

export default function KeyboardShortcutsModal() {
  const open = useUi((s) => s.shortcutsOpen);
  const setOpen = useUi((s) => s.setShortcutsOpen);
  if (!open) return null;
  return (
    <Modal title="Keyboard shortcuts" subtitle="Shortcuts are paused while you type." onClose={() => setOpen(false)}>
      <ul className="divide-y divide-slate-100 dark:divide-[#1e2d5a]">
        {SHORTCUTS.map((s) => (
          <li key={s.key} className="flex items-center justify-between py-2 text-sm">
            <span className="text-ink">{s.label}</span>
            <kbd className="min-w-[2rem] rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-center font-mono text-xs text-ink dark:border-[#1e2d5a] dark:bg-[#0f1729]">{s.key}</kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
