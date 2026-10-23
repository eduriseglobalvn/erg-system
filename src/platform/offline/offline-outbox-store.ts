import { createStore, del, get, set } from "idb-keyval";

import {
  migrateEntries,
  OFFLINE_OUTBOX_SCHEMA_VERSION,
  type OfflineMutation,
  type OfflineOutboxStore,
} from "./offline-outbox";

type PersistedEnvelope =
  | { schemaVersion: 1; entries: OfflineMutation[] }
  | { schemaVersion: typeof OFFLINE_OUTBOX_SCHEMA_VERSION; algorithm: "AES-GCM"; iv: string; ciphertext: string };

export class MemoryOfflineOutboxStore implements OfflineOutboxStore {
  private readonly values = new Map<string, OfflineMutation[]>();

  async load(scopeKey: string) {
    return clone(this.values.get(scopeKey) ?? []);
  }

  async save(scopeKey: string, entries: OfflineMutation[]) {
    this.values.set(scopeKey, clone(entries));
  }

  async clear(scopeKey: string) {
    this.values.delete(scopeKey);
  }
}

export function createOfflineOutboxStore(): OfflineOutboxStore {
  if (typeof indexedDB === "undefined" || !globalThis.crypto?.subtle) return new MemoryOfflineOutboxStore();
  return new EncryptedIndexedDbOutboxStore();
}

export class EncryptedIndexedDbOutboxStore implements OfflineOutboxStore {
  private readonly dataStore = createStore("erg-system", "offline-outbox");
  private readonly keyStore = createStore("erg-system", "offline-outbox-keys");

  async load(scopeKey: string) {
    const record = await get<PersistedEnvelope>(dataKey(scopeKey), this.dataStore);
    if (!record) return [];
    try {
      if (record.schemaVersion === 1) {
        const migrated = migrateEntries(record.entries);
        await this.save(scopeKey, migrated);
        return migrated;
      }
      const key = await this.getKey(scopeKey);
      const plaintext = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromBase64(record.iv) },
        key,
        fromBase64(record.ciphertext),
      );
      const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as { entries?: OfflineMutation[] };
      return migrateEntries(parsed.entries ?? []);
    } catch {
      await this.clear(scopeKey);
      return [];
    }
  }

  async save(scopeKey: string, entries: OfflineMutation[]) {
    const key = await this.getKey(scopeKey);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify({ schemaVersion: OFFLINE_OUTBOX_SCHEMA_VERSION, entries }));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
    const record: PersistedEnvelope = {
      schemaVersion: OFFLINE_OUTBOX_SCHEMA_VERSION,
      algorithm: "AES-GCM",
      iv: toBase64(iv),
      ciphertext: toBase64(new Uint8Array(ciphertext)),
    };
    await set(dataKey(scopeKey), record, this.dataStore);
  }

  async clear(scopeKey: string) {
    await del(dataKey(scopeKey), this.dataStore);
    await del(keyDataKey(scopeKey), this.keyStore);
  }

  private async getKey(scopeKey: string) {
    const existing = await get<CryptoKey>(keyDataKey(scopeKey), this.keyStore);
    if (existing) return existing;
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    await set(keyDataKey(scopeKey), key, this.keyStore);
    return key;
  }
}

function dataKey(scopeKey: string) {
  return `erg-offline-outbox:${scopeKey}`;
}

function keyDataKey(scopeKey: string) {
  return `erg-offline-key:${scopeKey}`;
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

function clone<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}
