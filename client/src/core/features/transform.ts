import type { Approved } from '../connectors/demoWorkspace';
import { cleanOutput, containsSecret, isCodebaseContent, isSafeOutput, redactSecrets } from '../connectors/filters';
import { aiJson } from '../ai/run';
import { factsPrompt } from '../ai/prompts';
import { isFactsOut, type Fact } from '../ai/schemas';
import { logAudit } from '../memory/audit';
import { useBlueStore } from '../../store';

interface Candidate { ref: string; source: string; from?: string; subject?: string; text: string }

const BATCH = 8;

/**
 * Raw bodies stop here. Codebase items are dropped, secrets redacted, and only extracted facts
 * (with pointers to item ids) leave this function.
 */
export async function toActionableFacts(approved: Approved): Promise<Fact[]> {
  const candidates: Candidate[] = [];
  const excluded: string[] = [];

  for (const m of approved.messages) {
    if (isCodebaseContent(m.text)) { excluded.push(`demo-slack`); continue; }
    candidates.push({ ref: m.id, source: 'demo-slack', from: m.from, text: redactSecrets(m.text) });
  }
  for (const e of approved.emails) {
    const full = `${e.subject}\n${e.body}`;
    if (isCodebaseContent(full)) { excluded.push('demo-gmail'); continue; }
    candidates.push({ ref: e.id, source: 'demo-gmail', from: e.from, subject: redactSecrets(e.subject), text: redactSecrets(e.body) });
  }

  for (const src of excluded) await logAudit('filter', false, `excluded: codebase content from ${src}`);
  const redacted = [...approved.messages.map((m) => m.text), ...approved.emails.map((e) => e.body)].filter(containsSecret).length;
  if (redacted) await logAudit('filter', true, `redacted secrets in ${redacted} item(s) before processing`);
  await useBlueStore.getState().refreshAudit();

  const facts: Fact[] = [];
  const byRef = new Map(candidates.map((c) => [c.ref, c]));
  for (let i = 0; i < candidates.length; i += BATCH) {
    const batch = candidates.slice(i, i + BATCH);
    const out = await aiJson(factsPrompt(batch), isFactsOut);
    for (const f of out.items) {
      const src = byRef.get(f.ref);
      if (!src) continue;
      facts.push(sanitizeFact(f, src));
    }
  }
  return facts;
}

function sanitizeFact(f: Fact, src: Candidate): Fact {
  const keep = (xs: string[]) => xs.map(cleanOutput).filter((x) => x && isSafeOutput(x)).slice(0, 5);
  let summary = cleanOutput(f.shortSummary);
  // A "summary" that is just the original text is a raw body; shorten it.
  if (summary.replace(/\W/g, '') === src.text.replace(/\W/g, '') || summary.length > 160) {
    summary = `${summary.split(/\s+/).slice(0, 8).join(' ')}…`;
  }
  return { ref: f.ref, tasks: keep(f.tasks), blockers: keep(f.blockers), decisions: keep(f.decisions), dates: keep(f.dates), shortSummary: isSafeOutput(summary) ? summary : '' };
}
