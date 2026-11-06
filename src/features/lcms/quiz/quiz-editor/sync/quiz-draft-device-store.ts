import { createStore, del, get, keys, set, type UseStore } from "idb-keyval";

import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";

export type DeviceDraftRecord = {
  /** quizId, or "new-quiz:<course>:<level>:<topic>" before the quiz exists. */
  key: string;
  quizId: string | null;
  /** Created once with the first write and reused for every create call. */
  createIdempotencyKey: string;
  baseDocVersion: number;
  document: QuizEditorDraftDocument;
  dirty: boolean;
  /** +1 per edit. */
  revision: number;
  /** Revision of the latest successful send. */
  syncedRevision: number;
  editedAt: string;
  syncedAt: string | null;
  /** Id of the tab that wrote this record. */
  writerId: string;
};

export type DeviceDraftBackup = {
  key: string;
  reason: "conflict-mine" | "conflict-server" | "other-tab";
  document: QuizEditorDraftDocument;
  createdAt: string;
};

export interface QuizDraftDeviceStore {
  readonly persistent: boolean;
  get(scope: string, key: string): Promise<DeviceDraftRecord | null>;
  /** Throws DeviceStorageFullError when the device is out of space. */
  put(scope: string, record: DeviceDraftRecord): Promise<void>;
  remove(scope: string, key: string): Promise<void>;
  list(scope: string): Promise<DeviceDraftRecord[]>;
  addBackup(scope: string, backup: DeviceDraftBackup): Promise<void>;
  listBackups(scope: string, key: string): Promise<DeviceDraftBackup[]>;
  prune(scope: string, now: Date): Promise<void>;
}

export class DeviceStorageFullError extends Error {
  override name = "DeviceStorageFullError";
}

export const SYNCED_DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const BACKUP_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function quizDraftScope(tenantId: string, accountId: string | undefined): string {
  return `${tenantId}:${accountId ?? "anonymous"}`;
}

const draftKey = (scope: string, key: string) => `${scope}|draft|${key}`;
const draftPrefix = (scope: string) => `${scope}|draft|`;
const backupKey = (scope: string, key: string, createdAt: string) => `${scope}|backup|${key}|${createdAt}`;
const backupPrefix = (scope: string, key = "") => `${scope}|backup|${key}`;

const isStale = (record: DeviceDraftRecord, now: Date) =>
  !record.dirty && record.syncedAt !== null && now.getTime() - new Date(record.syncedAt).getTime() > SYNCED_DRAFT_MAX_AGE_MS;
const isOldBackup = (backup: DeviceDraftBackup, now: Date) =>
  now.getTime() - new Date(backup.createdAt).getTime() > BACKUP_MAX_AGE_MS;

export function createMemoryQuizDraftDeviceStore(): QuizDraftDeviceStore {
  const data = new Map<string, DeviceDraftRecord | DeviceDraftBackup>();
  const withPrefix = <T>(prefix: string) =>
    [...data.entries()].filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k, structuredClone(v) as T] as const);
  return {
    persistent: false,
    async get(scope, key) {
      const v = data.get(draftKey(scope, key));
      return v ? (structuredClone(v) as DeviceDraftRecord) : null;
    },
    async put(scope, record) {
      data.set(draftKey(scope, record.key), structuredClone(record));
    },
    async remove(scope, key) {
      data.delete(draftKey(scope, key));
    },
    async list(scope) {
      return withPrefix<DeviceDraftRecord>(draftPrefix(scope)).map(([, v]) => v);
    },
    async addBackup(scope, backup) {
      data.set(backupKey(scope, backup.key, backup.createdAt), structuredClone(backup));
    },
    async listBackups(scope, key) {
      return withPrefix<DeviceDraftBackup>(`${backupPrefix(scope, key)}|`).map(([, v]) => v);
    },
    async prune(scope, now) {
      for (const [k, v] of withPrefix<DeviceDraftRecord>(draftPrefix(scope))) if (isStale(v, now)) data.delete(k);
      for (const [k, v] of withPrefix<DeviceDraftBackup>(backupPrefix(scope))) if (isOldBackup(v, now)) data.delete(k);
    },
  };
}

function createIdbQuizDraftDeviceStore(store: UseStore): QuizDraftDeviceStore {
  const keysWithPrefix = async (prefix: string) =>
    (await keys<string>(store)).filter((k) => typeof k === "string" && k.startsWith(prefix));
  const readAll = async <T>(prefix: string): Promise<Array<[string, T]>> => {
    const rows: Array<[string, T]> = [];
    for (const k of await keysWithPrefix(prefix)) {
      const v = await get<T>(k, store);
      if (v !== undefined) rows.push([k, v]);
    }
    return rows;
  };
  // Re-check inside one readwrite transaction so an edit another tab wrote meanwhile is never deleted.
  const deleteIf = <T>(k: string, shouldDelete: (value: T) => boolean) =>
    store("readwrite", (os) =>
      new Promise<void>((resolve, reject) => {
        const req = os.get(k);
        req.onsuccess = () => {
          if (req.result !== undefined && shouldDelete(req.result as T)) os.delete(k);
        };
        os.transaction.oncomplete = () => resolve();
        os.transaction.onerror = () => reject(os.transaction.error);
        os.transaction.onabort = () => reject(os.transaction.error);
      }),
    );
  const putChecked = async (k: string, value: unknown) => {
    try {
      await set(k, value, store);
    } catch (error) {
      if (error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")) throw new DeviceStorageFullError("Device storage is full", { cause: error });
      throw error;
    }
  };
  return {
    persistent: true,
    async get(scope, key) {
      return (await get<DeviceDraftRecord>(draftKey(scope, key), store)) ?? null;
    },
    put: (scope, record) => putChecked(draftKey(scope, record.key), record),
    remove: (scope, key) => del(draftKey(scope, key), store),
    async list(scope) {
      return (await readAll<DeviceDraftRecord>(draftPrefix(scope))).map(([, v]) => v);
    },
    addBackup: (scope, backup) => putChecked(backupKey(scope, backup.key, backup.createdAt), backup),
    async listBackups(scope, key) {
      return (await readAll<DeviceDraftBackup>(`${backupPrefix(scope, key)}|`)).map(([, v]) => v);
    },
    async prune(scope, now) {
      for (const k of await keysWithPrefix(draftPrefix(scope))) await deleteIf<DeviceDraftRecord>(k, (r) => isStale(r, now));
      for (const k of await keysWithPrefix(backupPrefix(scope))) await deleteIf<DeviceDraftBackup>(k, (r) => isOldBackup(r, now));
    },
  };
}

const PROBE_KEY = "probe";

/**
 * IndexedDB when it works, else tab memory (spec §9.1). Old Firefox private mode and blocked site data reject every
 * request although `indexedDB` exists, so the first call writes and reads a probe key once and the result sticks.
 */
export function createQuizDraftDeviceStore(): QuizDraftDeviceStore {
  if (typeof indexedDB === "undefined") return createMemoryQuizDraftDeviceStore();
  // A separate database: idb-keyval creates one object store per database and "erg-system" is already taken.
  const store = createStore("erg-quiz-editor", "drafts");
  let active = createIdbQuizDraftDeviceStore(store);
  let probe: Promise<void> | null = null;
  const ready = () =>
    (probe ??= (async () => {
      try {
        await set(PROBE_KEY, 1, store);
        if ((await get(PROBE_KEY, store)) !== 1) throw new Error("IndexedDB probe read back nothing");
        await del(PROBE_KEY, store);
      } catch (error) {
        console.error("IndexedDB is unavailable; quiz drafts are kept in this tab only", error);
        active = createMemoryQuizDraftDeviceStore();
      }
    })());
  const via = <K extends Exclude<keyof QuizDraftDeviceStore, "persistent">>(name: K) =>
    (async (...args: unknown[]) => {
      await ready();
      return (active[name] as (...a: unknown[]) => unknown)(...args);
    }) as QuizDraftDeviceStore[K];
  return {
    get persistent() {
      return active.persistent;
    },
    get: via("get"),
    put: via("put"),
    remove: via("remove"),
    list: via("list"),
    addBackup: via("addBackup"),
    listBackups: via("listBackups"),
    prune: via("prune"),
  };
}
