import { useEffect, useState } from 'react';
import { SectionTitle, ToggleRow, Segmented } from './parts';

export function applyAppearance() {
  document.documentElement.dataset.compact = localStorage.getItem('blue-compact') === '1' ? '1' : '0';
}

export default function Appearance() {
  const [compact, setCompact] = useState(localStorage.getItem('blue-compact') === '1');
  useEffect(() => {
    localStorage.setItem('blue-compact', compact ? '1' : '0');
    applyAppearance();
  }, [compact]);
  return (
    <div>
      <SectionTitle title="Appearance" hint="Make Blue feel comfortable." />
      <div className="mb-4">
        <p className="text-sm font-medium text-ink mb-1.5">Theme</p>
        <Segmented label="Theme" value="light" onChange={() => undefined} options={[{ value: 'light', label: 'Light' }]} />
        <p className="text-xs text-muted mt-1.5">Dark mode is on the roadmap.</p>
      </div>
      <ToggleRow title="Compact mode" hint="Tighter spacing on the dashboard." checked={compact} onChange={setCompact} />
    </div>
  );
}
