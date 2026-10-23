import { clear as clearObjectStore, createStore, del, get, set } from "idb-keyval";

export type OfflineScopedJsonStore = {
  get: <T>(scopeKey: string, recordKey: string) => Promise<T | null>;
  set: (scopeKey: string, recordKey: string, value: unknown) => Promise<void>;
  remove: (scopeKey: string, recordKey: string) => Promise<void>;
  list: <T>(scopeKey: string) => Promise<Array<{ recordKey: string; value: T }>>;
  clear: (scopeKey: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

export class OfflineStorageError extends Error {
  public readonly code: "CREDENTIAL_PAYLOAD" | "INVALID_PAYLOAD";

  constructor(code: OfflineStorageError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "OfflineStorageError";
  }
}

export class MemoryScopedJsonStore implements OfflineScopedJsonStore {
  private readonly scopes = new Map<string, Map<string, unknown>>();

  async get<T>(scopeKey: string, recordKey: string) {
    return clone(this.scopes.get(scopeKey)?.get(recordKey) as T | undefined) ?? null;
  }

  async set(scopeKey: string, recordKey: string, value: unknown) {
    assertOfflineSafeJson(value);
    const records = this.scopes.get(scopeKey) ?? new Map<string, unknown>();
    records.set(recordKey, clone(value));
    this.scopes.set(scopeKey, records);
  }

  async remove(scopeKey: string, recordKey: string) {
    const records = this.scopes.get(scopeKey);
    if (!records) return;
    records.delete(recordKey);
    if (!records.size) this.scopes.delete(scopeKey);
  }

  async list<T>(scopeKey: string) {
    return Array.from(this.scopes.get(scopeKey)?.entries() ?? []).map(([recordKey, value]) => ({
      recordKey,
      value: clone(value) as T,
    }));
  }

  async clear(scopeKey: string) {
    this.scopes.delete(scopeKey);
  }

  async clearAll() {
    this.scopes.clear();
  }
}

type PersistedEnvelope = {
  schemaVersion: 1;
  algorithm: "AES-GCM";
  iv: string;
  ciphertext: string;
};

export class EncryptedIndexedDbScopedJsonStore implements OfflineScopedJsonStore {
  private readonly dataStore;
  private readonly keyStore;

  constructor(collection = "offline-scoped-json-v1") {
    this.dataStore = createStore("erg-system", collection);
    this.keyStore = createStore("erg-system", `${collection}-keys`);
  }

  async get<T>(scopeKey: string, recordKey: string) {
    const records = await this.load(scopeKey);
    return clone(records[recordKey] as T | undefined) ?? null;
  }

  async set(scopeKey: string, recordKey: string, value: unknown) {
    assertOfflineSafeJson(value);
    const records = await this.load(scopeKey);
    records[recordKey] = clone(value);
    await this.save(scopeKey, records);
  }

  async remove(scopeKey: string, recordKey: string) {
    const records = await this.load(scopeKey);
    if (!(recordKey in records)) return;
    delete records[recordKey];
    if (Object.keys(records).length) await this.save(scopeKey, records);
    else await this.clear(scopeKey);
  }

  async list<T>(scopeKey: string) {
    const records = await this.load(scopeKey);
    return Object.entries(records).map(([recordKey, value]) => ({
      recordKey,
      value: clone(value) as T,
    }));
  }

  async clear(scopeKey: string) {
    await del(dataKey(scopeKey), this.dataStore);
    await del(keyDataKey(scopeKey), this.keyStore);
  }

  async clearAll() {
    await clearObjectStore(this.dataStore);
    await clearObjectStore(this.keyStore);
  }

  private async load(scopeKey: string): Promise<Record<string, unknown>> {
    const envelope = await get<PersistedEnvelope>(dataKey(scopeKey), this.dataStore);
    if (!envelope) return {};
    try {
      const key = await this.getKey(scopeKey);
      const plaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromBase64(envelope.iv) },
        key,
        fromBase64(envelope.ciphertext),
      );
      const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as unknown;
      if (!isRecord(parsed)) throw new Error("Offline record must be an object.");
      assertOfflineSafeJson(parsed);
      return parsed;
    } catch {
      await this.clear(scopeKey);
      return {};
    }
  }

  private async save(scopeKey: string, records: Record<string, unknown>) {
    assertOfflineSafeJson(records);
    const key = await this.getKey(scopeKey);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(records));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
    await set(dataKey(scopeKey), {
      schemaVersion: 1,
      algorithm: "AES-GCM",
      iv: toBase64(iv),
      ciphertext: toBase64(new Uint8Array(ciphertext)),
    } satisfies PersistedEnvelope, this.dataStore);
  }

  private async getKey(scopeKey: string) {
    const existing = await get<CryptoKey>(keyDataKey(scopeKey), this.keyStore);
    if (existing) return existing;
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    await set(keyDataKey(scopeKey), key, this.keyStore);
    return key;
  }
}

export function createOfflineScopedJsonStore(collection?: string): OfflineScopedJsonStore {
  if (typeof indexedDB === "undefined" || !globalThis.crypto?.subtle) {
    return new MemoryScopedJsonStore();
  }
  return new EncryptedIndexedDbScopedJsonStore(collection);
}

export function assertOfflineSafeJson(value: unknown, path = "payload"): void {
  if (value === null || value === undefined || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertOfflineSafeJson(item, `${path}[${index}]`));
    return;
  }
  if (
    value instanceof Uint8Array ||
    value instanceof ArrayBuffer ||
    (typeof Blob !== "undefined" && value instanceof Blob)
  ) {
    throw new OfflineStorageError("INVALID_PAYLOAD", `${path} must be JSON serializable.`);
  }
  for (const [key, item] of Object.entries(value)) {
    if (/(access[_-]?token|refresh[_-]?token|id[_-]?token|authorization|cookie|password|secret|credential|private[_-]?key)/i.test(key)) {
      throw new OfflineStorageError("CREDENTIAL_PAYLOAD", `${path}.${key} cannot be stored offline.`);
    }
    assertOfflineSafeJson(item, `${path}.${key}`);
  }
}

function dataKey(scopeKey: string) {
  return `erg-offline-scoped:${scopeKey}`;
}

function keyDataKey(scopeKey: string) {
  return `erg-offline-scoped-key:${scopeKey}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function clone<T>(value: T): T | undefined {
  if (value === undefined) return undefined;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

function toBase64(value: Uint8Array) {
  let binary = "";
  for (let index = 0; index < value.length; index += 0x8000) {
    binary += String.fromCharCode(...value.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
