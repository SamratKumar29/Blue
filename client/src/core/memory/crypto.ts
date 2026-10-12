import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'blue-crypto-meta';
const STORE_NAME = 'keys';
const KEY_NAME = 'aes-gcm-master-key';

let cachedKey: CryptoKey | null = null;

async function getMetaDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

/**
 * Retrieve or generate the non-extractable AES-GCM 256 CryptoKey.
 * Stored in IndexedDB as a non-extractable CryptoKey object.
 */
export async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const db = await getMetaDb();
  const existing = await db.get(STORE_NAME, KEY_NAME);

  if (existing && existing instanceof CryptoKey) {
    cachedKey = existing;
    return cachedKey;
  }

  // Generate non-extractable AES-GCM 256-bit key
  const newKey = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // non-extractable
    ['encrypt', 'decrypt']
  );

  await db.put(STORE_NAME, newKey, KEY_NAME);
  cachedKey = newKey;
  return newKey;
}

export function resetKeyCache(): void {
  cachedKey = null;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export interface EncryptedPayload {
  iv: string;   // base64 12-byte initialization vector
  data: string; // base64 encrypted ciphertext
}

/**
 * Encrypt any JSON-serializable object into an AES-GCM payload with random 12-byte IV.
 */
export async function encryptJson<T>(obj: T, key?: CryptoKey): Promise<EncryptedPayload> {
  const cryptoKey = key || (await getKey());
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(JSON.stringify(obj));

  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    cryptoKey,
    encodedData
  );

  return {
    iv: bufferToBase64(iv.buffer),
    data: bufferToBase64(cipherBuffer),
  };
}

/**
 * Decrypt an AES-GCM payload back into the original typed JSON object.
 */
export async function decryptJson<T>(payload: EncryptedPayload, key?: CryptoKey): Promise<T> {
  const cryptoKey = key || (await getKey());
  const ivBuffer = base64ToBuffer(payload.iv);
  const cipherBuffer = base64ToBuffer(payload.data);

  const plainBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(ivBuffer),
    },
    cryptoKey,
    cipherBuffer
  );

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(plainBuffer);
  return JSON.parse(jsonString) as T;
}
