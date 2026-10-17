import type { TaskGroup } from '../core/types';

export const GROUP_ORDER: TaskGroup[] = ['today', 'this_week', 'needs_senior', 'later'];

export const GROUP_META: Record<TaskGroup, { label: string; dot: string }> = {
  today: { label: 'Today', dot: 'bg-blue-500' },
  this_week: { label: 'This week', dot: 'bg-emerald-500' },
  needs_senior: { label: 'Needs a teammate', dot: 'bg-amber-500' },
  later: { label: 'Later', dot: 'bg-slate-400' },
};

export function formatMin(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

export function EffortBadge({ effort }: { effort: 'small' | 'medium' | 'large' }) {
  const labels = { small: 'S', medium: 'M', large: 'L' };
  const colors = { small: 'bg-emerald-50 text-emerald-700', medium: 'bg-amber-50 text-amber-700', large: 'bg-rose-50 text-rose-700' };
  return <span className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${colors[effort]}`} aria-label={`${effort} effort`}>{labels[effort]}</span>;
}