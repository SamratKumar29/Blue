import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { getKey, encryptJson, decryptJson } from './crypto';
import { put, get, getAll, del, clearAll, getDb } from './db';
import { logAudit, listAudit, clearAudit } from './audit';
import { Task } from '../types';

describe('S2.3 Encrypted Memory (WebCrypto + IndexedDB)', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('generates a valid CryptoKey and encrypts/decrypts JSON objects', async () => {
    const key = await getKey();
    expect(key).toBeDefined();
    expect(key.algorithm.name).toBe('AES-GCM');
    expect(key.extractable).toBe(false);

    const sensitiveData = { secret: 'Confidential client data 4821', amount: 5000 };
    const encrypted = await encryptJson(sensitiveData, key);

    expect(encrypted.iv).toBeDefined();
    expect(encrypted.data).toBeDefined();
    // Verify ciphertext does not contain plaintext string
    expect(encrypted.data).not.toContain('Confidential client data 4821');

    const decrypted = await decryptJson<typeof sensitiveData>(encrypted, key);
    expect(decrypted).toEqual(sensitiveData);
  });

  it('puts and gets typed objects from encrypted store, storing only encrypted blobs', async () => {
    const task: Task = {
      id: 'task_001',
      title: 'Resolve Atlas memory regression',
      project: 'Atlas',
      estimateMin: 45,
      effort: 'medium',
      group: 'next_up',
      urgency: 'high',
      status: 'todo',
      explanation: {
        sourceCategory: 'chat',
        confidence: 0.95,
        reason: 'Flagged by Marcus in team sync',
      },
      createdAt: new Date().toISOString(),
    };

    await put<Task>('tasks', task.id, task);

    // Retrieve via db API (decrypted)
    const retrieved = await get<Task>('tasks', task.id);
    expect(retrieved).toBeDefined();
    expect(retrieved).toEqual(task);

    // Verify raw IndexedDB record is encrypted
    const db = await getDb();
    const rawRecord = await db.get('tasks', task.id);
    expect(rawRecord).toBeDefined();
    expect(rawRecord.iv).toBeDefined();
    expect(rawRecord.data).toBeDefined();
    // Raw record data should not contain title text
    expect(JSON.stringify(rawRecord)).not.toContain('Resolve Atlas memory regression');
  });

  it('supports getAll, del, and clearAll across encrypted stores', async () => {
    const task1: Task = {
      id: 't_1',
      title: 'Task Alpha',
      project: 'Atlas',
      estimateMin: 15,
      effort: 'easy',
      group: 'easy_wins',
      urgency: 'low',
      status: 'todo',
      explanation: { sourceCategory: 'manual', confidence: 1, reason: 'Self assigned' },
      createdAt: new Date().toISOString(),
    };
    const task2: Task = {
      id: 't_2',
      title: 'Task Beta',
      project: 'Orion',
      estimateMin: 30,
      effort: 'medium',
      group: 'next_up',
      urgency: 'med',
      status: 'todo',
      explanation: { sourceCategory: 'email', confidence: 0.9, reason: 'Email request' },
      createdAt: new Date().toISOString(),
    };

    await put<Task>('tasks', task1.id, task1);
    await put<Task>('tasks', task2.id, task2);

    const allTasks = await getAll<Task>('tasks');
    expect(allTasks.length).toBe(2);
    expect(allTasks.map(t => t.id).sort()).toEqual(['t_1', 't_2']);

    await del('tasks', 't_1');
    const remaining = await getAll<Task>('tasks');
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('t_2');

    await clearAll();
    const cleared = await getAll<Task>('tasks');
    expect(cleared.length).toBe(0);
  });
});

describe('S2.4 Audit Log', () => {
  beforeEach(async () => {
    await clearAudit();
  });

  it('writes 3 entries and reads them back newest first', async () => {
    const e1 = await logAudit('read_source', true, 'read demo-slack');
    // slight delay for deterministic timestamp ordering
    await new Promise((r) => setTimeout(r, 10));
    const e2 = await logAudit('send_message', false, 'blocked send (write access disabled)');
    await new Promise((r) => setTimeout(r, 10));
    const e3 = await logAudit('cloud_inference', true, 'Gemini 3.8 Flash triage completion');

    const logs = await listAudit();
    expect(logs.length).toBe(3);
    expect(logs[0].id).toBe(e3.id);
    expect(logs[1].id).toBe(e2.id);
    expect(logs[2].id).toBe(e1.id);
  });

  it('clears audit entries', async () => {
    await logAudit('test_action', true, 'test detail');
    let logs = await listAudit();
    expect(logs.length).toBe(1);

    await clearAudit();
    logs = await listAudit();
    expect(logs.length).toBe(0);
  });
});
