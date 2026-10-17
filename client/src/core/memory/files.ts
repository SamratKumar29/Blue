import { put, getAll, del } from './db';
import { redactSecrets, isCodebaseContent } from '../connectors/filters';

// User-uploaded files, stored encrypted in local memory. Only plain-text formats keep their text
// (so Blue can search them); other files keep metadata only.

export interface UploadedFile { id: string; name: string; size: number; type: string; addedAt: string; text?: string; skipped?: string }

const TEXT_EXT = /\.(txt|md|markdown|csv|json|log)$/i;
const MAX_TEXT = 200_000;

export async function saveUpload(f: File): Promise<UploadedFile> {
  const rec: UploadedFile = {
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: f.name, size: f.size, type: f.type || 'application/octet-stream', addedAt: new Date().toISOString(),
  };
  if (TEXT_EXT.test(f.name) || f.type.startsWith('text/')) {
    const raw = (await f.text()).slice(0, MAX_TEXT);
    if (isCodebaseContent(raw)) rec.skipped = 'Looks like code, so Blue will not read it.';
    else rec.text = redactSecrets(raw);
  } else {
    rec.skipped = 'Only text files (.txt, .md, .csv) can be searched for now.';
  }
  await put('files', rec.id, rec);
  return rec;
}

export const listUploads = async () => (await getAll<UploadedFile>('files')).sort((a, b) => b.addedAt.localeCompare(a.addedAt));
export const removeUpload = (id: string) => del('files', id);
