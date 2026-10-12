import messages from '../../data/messages.json';
import emails from '../../data/emails.json';
import calendar from '../../data/calendar.json';
import type { CalendarItem, EmailItem, MessageItem } from '../types';
import { guard } from '../policy/useGate';
import { useBlueStore, type SourceKey } from '../../store';

export interface Approved {
  messages: MessageItem[];
  emails: EmailItem[];
  events: CalendarItem[];
  denied: string[];
}

/** Reads each approved demo source through the policy gate, one call per source. */
export async function fetchApproved(): Promise<Approved> {
  const out: Approved = { messages: [], emails: [], events: [], denied: [] };
  const { meta, markAccess } = useBlueStore.getState();
  const sources: [SourceKey, () => void][] = [
    ['demo-slack', () => { out.messages = messages as MessageItem[]; }],
    ['demo-gmail', () => { out.emails = emails as EmailItem[]; }],
    ['demo-calendar', () => { out.events = calendar as CalendarItem[]; }],
  ];
  for (const [key, load] of sources) {
    if (!meta.sources[key]) continue;
    const r = await guard({ type: 'read_source', source: key, effect: 'Read source' }, () => load());
    if (r.ok) await markAccess(key);
    else out.denied.push(r.reason);
  }
  return out;
}

export const CHANNEL_BY_REF: Record<string, string> = Object.fromEntries((messages as MessageItem[]).map((m) => [m.id, m.channel]));
export const SOURCE_CHIP: Record<string, string> = {
  'demo-slack': 'Slack',
  'demo-gmail': 'Gmail',
  'demo-calendar': 'Calendar',
  policy: 'Policy',
  manual: 'You',
};

export function chipLabel(source: string, ref: string): string {
  const where = source === 'demo-slack' ? CHANNEL_BY_REF[ref] : undefined;
  return where ? `${SOURCE_CHIP[source]} · ${where}` : (SOURCE_CHIP[source] ?? source);
}
