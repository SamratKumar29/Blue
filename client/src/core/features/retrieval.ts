import { useBlueStore } from '../../store';
import { guard } from '../policy/useGate';
import { logAudit } from '../memory/audit';

const modules = import.meta.glob('../../data/policies/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const brief = import.meta.glob('../../data/project_brief.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export interface Chunk { doc: string; text: string }
export interface Hit extends Chunk { score: number }

const STOP = new Set('a an and are as at be by for from has have how i in is it its of on or our that the their there this to was we what when where which who whom why will with you your do does'.split(' '));
const tokenize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));

export function chunkText(doc: string, text: string, target = 120): Chunk[] {
  const paras = text.split(/\n\s*\n/).map((p) => p.replace(/^#+\s*/gm, '').trim()).filter(Boolean);
  const chunks: Chunk[] = [];
  let buf = '';
  for (const p of paras) {
    if ((buf + ' ' + p).split(/\s+/).length > target && buf) { chunks.push({ doc, text: buf.trim() }); buf = p; }
    else buf = buf ? `${buf}\n${p}` : p;
  }
  if (buf) chunks.push({ doc, text: buf.trim() });
  return chunks;
}

function allChunks(): Chunk[] {
  const out: Chunk[] = [];
  for (const [path, text] of [...Object.entries(modules), ...Object.entries(brief)]) {
    out.push(...chunkText(path.split('/').pop()!.replace(/\.md$/, ''), text));
  }
  return out;
}

export const DOC_NAMES = (): string[] => [...new Set(allChunks().map((c) => c.doc))];
export function docText(doc: string): string {
  return allChunks().filter((c) => c.doc === doc).map((c) => c.text).join('\n\n');
}

/** Plain BM25 over paragraph chunks. No external service. */
export function bm25(query: string, chunks: Chunk[], k = 3): Hit[] {
  const q = tokenize(query);
  if (!q.length || !chunks.length) return [];
  const docs = chunks.map((c) => tokenize(c.text + ' ' + c.doc.replace(/-/g, ' ')));
  const avg = docs.reduce((n, d) => n + d.length, 0) / docs.length;
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const k1 = 1.5, b = 0.75;
  return chunks
    .map((c, i) => {
      const tf = new Map<string, number>();
      for (const t of docs[i]) tf.set(t, (tf.get(t) ?? 0) + 1);
      let score = 0;
      for (const t of q) {
        const f = tf.get(t) ?? 0;
        if (!f) continue;
        const idf = Math.log(1 + (docs.length - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
        score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * docs[i].length) / avg)));
      }
      return { ...c, score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, k);
}

export function retrieve(query: string, k = 3): Hit[] {
  return bm25(query, allChunks(), k);
}

export function canUsePolicy(): boolean {
  const { settings, meta } = useBlueStore.getState();
  return !settings.paused && (settings.allowTeamContext || (settings.allowConnectors && meta.sources.policy));
}

/** Approved-documents-only retrieval; the read is audited. */
export async function retrieveApproved(query: string, k = 3): Promise<Hit[]> {
  const { settings, markAccess } = useBlueStore.getState();
  if (!canUsePolicy()) return [];
  if (settings.allowConnectors) {
    const r = await guard({ type: 'read_source', source: 'policy', effect: 'Read policy docs' }, () => retrieve(query, k));
    if (!r.ok) return [];
    await markAccess('policy');
    return r.value;
  }
  await logAudit('read_source', true, 'allowed: policy docs (team context)');
  await markAccess('policy');
  return retrieve(query, k);
}
