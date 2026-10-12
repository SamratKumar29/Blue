import type { CompleteArgs, ModelProvider } from './aiTypes';
import { DATA_CLOSE, DATA_OPEN } from './prompts';
import messages from '../../data/messages.json';
import emails from '../../data/emails.json';
import team from '../../data/team.json';
import type { Fact, TriageTask } from './schemas';

// Deterministic "Offline demo mode" provider. Used in unit tests and when no real model is reachable.

const ALL_ITEMS: Record<string, { channel?: string; from: string; text: string }> = {};
for (const m of messages) ALL_ITEMS[m.id] = { channel: m.channel, from: m.from, text: m.text };
for (const e of emails) ALL_ITEMS[e.id] = { from: e.from, text: `${e.subject}. ${e.body}` };

interface Rule { test: RegExp; task?: string; blocker?: string; decision?: string; effort?: 'easy' | 'medium' | 'deep'; est?: number; helper?: string }

const RULES: Rule[] = [
  { test: /production bug|health checks/i, task: 'Resolve production bug #471 (DevOps input needed)', blocker: 'Needs DevOps and infra input on the gateway health checks', effort: 'deep', est: 120, helper: 'incident' },
  { test: /make it faster/i, task: 'Clarify the "make it faster" requirement', blocker: 'The target metric is unclear and needs product confirmation', effort: 'easy', est: 30, helper: 'product' },
  { test: /can't take|full capacity/i, decision: 'A teammate is at capacity this sprint' },
  { test: /read-replica|access request/i, task: 'Follow up on the database access request', blocker: 'Admin approval is still pending', effort: 'medium', est: 30 },
  { test: /sandbox credential|API_KEY/i, task: 'Move the sandbox credential out of the local debug config', effort: 'easy', est: 20 },
  { test: /design (mockup|review)|review feedback/i, task: 'Review design mockup feedback', effort: 'easy', est: 15 },
  { test: /draft the initial|api integration spec/i, task: 'Draft the API integration spec', effort: 'medium', est: 60 },
  { test: /sprint demo (feedback|&)|sprint demo and retro|sprint-demo/i, task: 'Respond to the sprint demo invite', effort: 'easy', est: 5 },
  { test: /action items/i, task: 'Address sprint demo action items for Atlas', effort: 'medium', est: 45 },
];

const words = (s: string, n: number) => s.split(/\s+/).slice(0, n).join(' ');
const findHelper = (kind?: string) =>
  kind === 'incident' ? team.find((t) => t.expertise.some((e) => /incident/i.test(e)))?.id
  : kind === 'product' ? team.find((t) => t.expertise.some((e) => /product/i.test(e)))?.id
  : undefined;

function extract(prompt: string): any {
  const a = prompt.indexOf(DATA_OPEN);
  const b = prompt.lastIndexOf(DATA_CLOSE);
  if (a < 0 || b < 0) return {};
  try { return JSON.parse(prompt.slice(a + DATA_OPEN.length, b)); } catch { return {}; }
}

function facts(data: any): unknown {
  const items: Fact[] = (data.items ?? []).map((it: any) => {
    const text: string = it.text ?? '';
    const rule = RULES.find((r) => r.test.test(text));
    return {
      ref: it.ref,
      tasks: rule?.task ? [rule.task] : [],
      blockers: rule?.blocker ? [rule.blocker] : [],
      decisions: rule?.decision ? [rule.decision] : [],
      dates: (text.match(/\b\d{1,2}(:\d{2})?\s?(am|pm)\b|\b(Mon|Tues|Wednes|Thurs|Fri)day\b/gi) ?? []).slice(0, 2),
      shortSummary: `${it.from ?? 'Someone'}: ${words(text.replace(/@\w+/g, '').trim(), 7)}…`,
    };
  });
  return { items };
}

function triage(data: any): unknown {
  const tasks: TriageTask[] = [];
  for (const f of (data.facts ?? []) as Fact[]) {
    const item = ALL_ITEMS[f.ref];
    const rule = RULES.find((r) => r.task && f.tasks.includes(r.task));
    if (!f.tasks.length) continue;
    const isEmail = f.ref.startsWith('email');
    const blocked = f.blockers.length > 0;
    const effort = rule?.effort ?? 'medium';
    const est = rule?.est ?? 45;
    const group = blocked ? 'needs_senior' : est < 30 ? 'easy_wins' : 'next_up';
    const helper = data.team && blocked ? findHelper(rule?.helper) : undefined;
    tasks.push({
      title: f.tasks[0],
      project: /orion/i.test(`${item?.channel ?? ''} ${item?.from ?? ''} ${f.tasks[0]}`) ? 'Orion Billing' : 'Atlas',
      estimateMin: est,
      effort: blocked ? 'deep' : effort,
      group,
      urgency: blocked ? 'high' : est < 30 ? 'low' : 'med',
      ...(blocked ? { blocker: f.blockers[0] } : {}),
      ...(helper ? { suggestedHelperId: helper } : {}),
      explanation: {
        sourceCategory: isEmail ? 'email' : 'chat',
        confidence: blocked ? 0.9 : 0.8,
        reason: blocked ? `Blocked: ${f.blockers[0].toLowerCase()}.` : est < 30 ? 'Quick task with no dependencies.' : 'Needs focused time but nothing is blocking it.',
      },
      provenance: { source: isEmail ? 'demo-gmail' : 'demo-slack', ref: f.ref },
    });
  }
  const order = { easy_wins: 0, next_up: 1, needs_senior: 2 } as const;
  const urg = { high: 0, med: 1, low: 2 } as const;
  tasks.sort((a, b) => order[a.group] - order[b.group] || urg[a.urgency] - urg[b.urgency]);
  return { tasks };
}

function roundup(data: any): unknown {
  const order = { easy_wins: 0, next_up: 1, needs_senior: 2 } as const;
  const tasks = [...(data.tasks ?? [])].sort((a: any, b: any) => order[a.group as keyof typeof order] - order[b.group as keyof typeof order]);
  return {
    lines: tasks.slice(0, 8).map((t: any) => ({
      text: t.group === 'needs_senior' ? `${t.title}: worth asking for senior input early.` : `${t.title} (about ${t.estimateMin} min).`,
      source: t.provenance?.source ?? 'manual',
      ref: t.provenance?.ref ?? t.id ?? 'manual',
      group: t.group,
    })),
  };
}

const ANGRY = /\b(stupid|hate|useless|done with|sick of|fed up|ridiculous|ugh|damn)\b/i;

export class MockProvider implements ModelProvider {
  id = 'offline-demo' as const;
  label = 'Offline demo mode';
  dataLeavesDevice = false;
  async isAvailable() { return { ok: true }; }

  async complete({ system, prompt }: CompleteArgs): Promise<string> {
    const feature = /\[\[blue:(\w+)\]\]/.exec(system)?.[1];
    const d = extract(prompt);
    switch (feature) {
      case 'facts': return JSON.stringify(facts(d));
      case 'triage': return JSON.stringify(triage(d));
      case 'roundup': return JSON.stringify(roundup(d));
      case 'helpDraft': {
        const t = d.task ?? {};
        return JSON.stringify({
          context: `I'm working on "${t.title ?? 'a task'}"${t.blocker ? ` and ${String(t.blocker).toLowerCase()}` : ''}.`,
          tried: ['Reviewed the available notes and the related thread', 'Listed the open questions I can answer myself', 'Drafted a first approach to react to'],
          ask: `Could you spend a few minutes helping me with ${t.title ?? 'this'}${d.helper?.name ? `, ${String(d.helper.name).split(' ')[0]}` : ''}?`,
          nextStep: 'A 15-minute call to agree the next step and who owns what.',
          timing: 'Today if possible; the task is time-sensitive.',
        });
      }
      case 'capacity':
        return JSON.stringify({
          options: [
            { kind: 'split', text: 'Split the task and ask them for just the smallest part they can fit.' },
            { kind: 'reduce_scope', text: 'Reduce the scope for this sprint or move the deadline by a few days.' },
            { kind: 'new_helper', text: d.team ? `Ask ${(d.team as any[])[0]?.name ?? 'another teammate'} who works in a similar area.` : 'Ask another approved teammate with similar skills.' },
          ],
          replyDraft: `Thanks for letting me know, ${d.person ?? 'there'}. That's helpful to plan around. I'll look at splitting it up or moving the date.`,
        });
      case 'steps': return JSON.stringify({ steps: [`Write down what "done" looks like for ${d.task ?? 'the task'}`, 'List the three smallest pieces', 'Do the quickest piece for 15 minutes', 'Note what is left and pick the next piece'] });
      case 'bullets': {
        const sentences = String(d.text ?? '').split(/(?<=[.!?])\s+/).filter(Boolean);
        return JSON.stringify({ bullets: sentences.slice(0, 3).map((s) => words(s, 16)) });
      }
      case 'draft': return JSON.stringify({ body: `Hi${d.recipient ? ` ${String(d.recipient).split(' ')[0]}` : ''},\n\n${d.intent}\n\nThanks,\n${String(d.userName ?? '').split(' ')[0]}` });
      case 'praise': return `You closed "${d.title}" and cleared the way for what comes next.`;
      case 'chat': {
        const msg: string = d.message ?? '';
        if (ANGRY.test(msg)) return "That sounds frustrating, and it's okay to feel that way. Want to take a short pause, or pick the smallest next step and leave the rest for later?";
        const best = (d.policy ?? [])[0];
        if (best) return `${String(best.text).split(/(?<=[.!?])\s/)[0]} [${best.doc}]`;
        return `Here's where things stand: ${(d.taskTitles ?? []).slice(0, 3).join('; ') || 'no tasks yet'}. Tell me which one you'd like to start with.`;
      }
      default: return '{}';
    }
  }
}

export const mockProvider = new MockProvider();
