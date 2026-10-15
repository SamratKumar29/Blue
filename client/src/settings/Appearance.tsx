import { useEffect, useState } from 'react';
import { SectionTitle, ToggleRow, Segmented } from './parts';

export function applyAppearance() {
  document.documentElement.dataset.compact = localStorage.getItem('blue-compact') === '1' ? '1' : '0';
  if (localStorage.getItem('blue-theme') === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export default function Appearance() {
  const [compact, setCompact] = useState(localStorage.getItem('blue-compact') === '1');
  const [theme, setTheme] = useState<'light' | 'dark'>((localStorage.getItem('blue-theme') as 'light' | 'dark') ?? 'light');
  useEffect(() => {
    localStorage.setItem('blue-compact', compact ? '1' : '0');
    applyAppearance();
  }, [compact]);
  useEffect(() => {
    localStorage.setItem('blue-theme', theme);
    applyAppearance();
  }, [theme]);
  return (
    <div>
      <SectionTitle title="Appearance" hint="Make Blue feel comfortable." />
      <div className="mb-4">
        <p className="text-sm font-medium text-ink mb-1.5">Theme</p>
        <Segmented label="Theme" value={theme} onChange={setTheme} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
      </div>
      <ToggleRow title="Compact mode" hint="Tighter spacing on the dashboard." checked={compact} onChange={setCompact} />
    </div>
  );
}
