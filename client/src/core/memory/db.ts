import { openDB, IDBPDatabase } from 'idb';
import { encryptJson, decryptJson, EncryptedPayload, destroyKey } from './crypto';

const DB_NAME = 'blue-local-memory';
const DB_VERSION = 2;

export type MemoryStoreName = 'settings' | 'tasks' | 'summaries' | 'audit' | 'outbox' | 'meta' | 'files';

const STORES: MemoryStoreName[] = ['settings', 'tasks', 'summaries', 'audit', 'outbox', 'meta', 'files'];

let dbPromise: Promise<IDBPDatabase> | null = null;

export async function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store);
          }
        }
      },
    });
  }
  return dbPromise;
}

export function closeDb(): void {
  if (dbPromise) {
    dbPromise.then((db) => db.close());
    dbPromise = null;
  }
}

interface StoredEncryptedRecord extends EncryptedPayload {
  _id: string;
}

/**
 * Put an object into an encrypted store.
 * Encrypts everything before persisting (except the 'meta' store).
 */
export async function put<T>(store: MemoryStoreName, id: string, obj: T): Promise<void> {
  const db = await getDb();
  if (store === 'meta') {
    await db.put(store, obj, id);
    return;
  }

  const encrypted = await encryptJson(obj);
  const record: StoredEncryptedRecord = {
    _id: id,
    iv: encrypted.iv,
    data: encrypted.data,
  };
  await db.put(store, record, id);
}

/**
 * Retrieve and decrypt an object by ID from the specified store.
 */
export async function get<T>(store: MemoryStoreName, id: string): Promise<T | undefined> {
  const db = await getDb();
  const raw = await db.get(store, id);
  if (!raw) return undefined;

  if (store === 'meta') {
    return raw as T;
  }

  const encrypted = raw as StoredEncryptedRecord;
  return decryptJson<T>({ iv: encrypted.iv, data: encrypted.data });
}

/**
 * Retrieve and decrypt all items stored in the specified store.
 */
export async function getAll<T>(store: MemoryStoreName): Promise<T[]> {
  const db = await getDb();
  const rawList = await db.getAll(store);
  if (!rawList || rawList.length === 0) return [];

  if (store === 'meta') {
    return rawList as T[];
  }

  const decrypted: T[] = [];
  for (const raw of rawList) {
    const encrypted = raw as StoredEncryptedRecord;
    const item = await decryptJson<T>({ iv: encrypted.iv, data: encrypted.data });
    decrypted.push(item);
  }
  return decrypted;
}

/**
 * Delete a specific record by ID.
 */
export async function del(store: MemoryStoreName, id: string): Promise<void> {
  const db = await getDb();
  await db.delete(store, id);
}

/**
 * Clear all records from all stores (My Blue data wipe).
 */
export async function clearAll(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORES, 'readwrite');
  for (const store of STORES) {
    await tx.objectStore(store).clear();
  }
  await tx.done;
  await destroyKey();
}
