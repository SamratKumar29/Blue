import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { useBlueStore, DEFAULT_SETTINGS } from '../../store';
import { generateRoundup } from './roundup';
import { getAll } from '../memory/db';
import { listAudit } from '../memory/audit';
import messages from '../../data/messages.json';
import emails from '../../data/emails.json';

async function dumpEverything(): Promise<string> {
  const parts: unknown[] = [];
  for (const s of ['settings', 'tasks', 'summaries', 'audit', 'outbox', 'meta'] as const) parts.push(await getAll(s));
  return JSON.stringify(parts);
}

describe('privacy pipeline (offline demo provider)', () => {
  beforeEach(async () => {
    await useBlueStore.getState().clearMyBlue();
    await useBlueStore.getState().loadAll();
    await useBlueStore.getState().updateSettings({ ...DEFAULT_SETTINGS, allowConnectors: true, allowTeamContext: true });
  });

  it('triages the sample workspace into the three groups with explanations', async () => {
    const { tasks } = await generateRoundup();
    expect(tasks.length).toBeGreaterThanOrEqual(6);
    expect(tasks.length).toBeLessThanOrEqual(12);
    for (const g of ['easy_wins', 'next_up', 'needs_senior']) expect(tasks.some((t) => t.group === g)).toBe(true);

    const prod = tasks.find((t) => /production bug/i.test(t.title))!;
    expect(prod.group).toBe('needs_senior');
    expect(prod.suggestedHelperId).toBe('p2');
    expect(prod.explanation.reason.length).toBeGreaterThan(5);
    expect(prod.explanation.confidence).toBeGreaterThan(0);
    expect(prod.explanation.confidence).toBeLessThanOrEqual(1);
  });

  it('omits helper suggestions when team context is off', async () => {
    await useBlueStore.getState().updateSettings({ allowTeamContext: false });
    const { tasks } = await generateRoundup();
    expect(tasks.every((t) => !t.suggestedHelperId)).toBe(true);
  });

  it('never stores secrets, code links or raw message bodies', async () => {
    await generateRoundup();
    const dump = await dumpEverything();
    expect(dump).not.toContain('sk_demo_');
    expect(dump).not.toContain('github.com/acme/atlas/pull');
    expect(dump).not.toContain('@@ -42');
    for (const m of messages) expect(dump).not.toContain(m.text);
    for (const e of emails) expect(dump).not.toContain(e.body);
  });

  it('logs the exclusion of codebase content without a body', async () => {
    await generateRoundup();
    const audit = await listAudit();
    const ex = audit.find((a) => a.detail.startsWith('excluded: codebase content'));
    expect(ex).toBeDefined();
    expect(ex!.detail).not.toMatch(/github|diff/i);
    expect(audit.some((a) => a.action === 'read_source' && a.allowed)).toBe(true);
  });

  it('blocks reads and writes nothing when connectors are off', async () => {
    await useBlueStore.getState().updateSettings({ allowConnectors: false });
    await expect(generateRoundup()).rejects.toThrow(/off/i);
    const audit = await listAudit();
    expect(audit.some((a) => !a.allowed && a.action === 'read_source')).toBe(true);
  });

  it('roundup is at most 120 words and every line has provenance', async () => {
    const { lines, summary } = await generateRoundup();
    expect(lines.length).toBeGreaterThan(0);
    expect(summary.text.split(/\s+/).length).toBeLessThanOrEqual(120);
    expect(summary.sources).toHaveLength(lines.length);
    expect(lines.every((l) => l.ref && l.source)).toBe(true);
  });
});

describe('triage hygiene', () => {
  it('has no duplicate task titles', async () => {
    await useBlueStore.getState().clearMyBlue();
    await useBlueStore.getState().loadAll();
    await useBlueStore.getState().updateSettings({ ...DEFAULT_SETTINGS, allowConnectors: true, allowTeamContext: true });
    const { tasks } = await generateRoundup();
    const titles = tasks.map((t) => t.title.toLowerCase());
    expect(new Set(titles).size).toBe(titles.length);
  });
});
