import type { ReactNode } from 'react';
import type { Effort, TaskGroup } from '../core/types';
import { hourInZone } from '../core/presence/workHours';

export function Card({ children, className = '', ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-white rounded-card shadow-card border border-slate-100 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ icon, title, action }: { icon?: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2.5">
        {icon && <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-500">{icon}</span>}
        <h2 className="font-semibold text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

const EFFORT_STYLE: Record<Effort, { label: string; cls: string }> = {
  easy: { label: 'Easy', cls: 'bg-emerald-50 text-emerald-600' },
  medium: { label: 'Medium', cls: 'bg-amber-50 text-amber-600' },
  deep: { label: 'Hard', cls: 'bg-rose-50 text-rose-500' },
};

export function EffortBadge({ effort }: { effort: Effort }) {
  const s = EFFORT_STYLE[effort];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
      <span aria-hidden="true">●</span> {s.label}
    </span>
  );
}

export const GROUP_META: Record<TaskGroup, { label: string; dot: string; text: string }> = {
  easy_wins: { label: 'Easy wins', dot: 'bg-good', text: 'text-emerald-700' },
  next_up: { label: 'Next up', dot: 'bg-blue-500', text: 'text-blue-600' },
  needs_senior: { label: 'Needs senior help', dot: 'bg-warn', text: 'text-amber-700' },
};

export const GROUP_ORDER: TaskGroup[] = ['easy_wins', 'next_up', 'needs_senior'];

export function formatMin(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <img src="/blue-small.png" alt="" width={72} className="opacity-90 mb-3 animate-float" />
      <p className="font-medium text-ink">{title}</p>
      {hint && <p className="text-sm text-muted mt-1 max-w-xs">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} aria-hidden="true" />;
}

export function greeting(now = new Date(), timeZone?: string): string {
  const h = timeZone ? hourInZone(now, timeZone) : now.getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}
