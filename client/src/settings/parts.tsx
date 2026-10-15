import type { ReactNode } from 'react';
import { Toggle } from '../components/Toggle';

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      {hint && <p className="text-sm text-muted mt-0.5">{hint}</p>}
    </div>
  );
}

export function Field({ label, children, hint, htmlFor }: { label: string; children: ReactNode; hint?: string; htmlFor?: string }) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted mt-1.5">{hint}</p>}
    </div>
  );
}

export const inputCls =
  'w-full rounded-xl border border-slate-200 dark:border-[#1e2d5a] bg-white dark:bg-[#0f1729] px-3.5 py-2.5 text-sm text-ink focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

export function ToggleRow({ title, hint, checked, onChange }: { title: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 dark:border-[#1e2d5a] last:border-0">
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        {hint && <p className="text-xs text-muted mt-0.5 max-w-sm">{hint}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

export function Segmented<T extends string>({
  value, options, onChange, label,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-slate-100 dark:bg-[#0f1729] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            value === o.value ? 'bg-white dark:bg-navy-800 text-blue-600 shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const TIMEZONES: { value: string; label: string }[] = [
  { value: 'Asia/Kolkata', label: '(GMT+5:30) India Standard Time' },
  { value: 'Asia/Singapore', label: '(GMT+8:00) Singapore Time' },
  { value: 'Asia/Tokyo', label: '(GMT+9:00) Japan Standard Time' },
  { value: 'Asia/Dubai', label: '(GMT+4:00) Gulf Standard Time' },
  { value: 'Australia/Sydney', label: 'Sydney (Australian Eastern Time)' },
  { value: 'Europe/London', label: 'London (UK Time)' },
  { value: 'America/New_York', label: 'New York (US Eastern Time)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (US Pacific Time)' },
  { value: 'UTC', label: '(GMT+0:00) UTC' },
];
