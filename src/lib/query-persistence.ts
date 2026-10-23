import type { Query } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { createStore, del, get, set } from "idb-keyval";

// Bump whenever persisted query eligibility or serialized shapes change.
export const QUERY_CACHE_BUSTER = "erg-query-cache-v6";
export const QUERY_CACHE_STORAGE_KEY = `ERG_QUERY_CACHE:${QUERY_CACHE_BUSTER}`;

type QueryLike = Pick<Query<unknown, unknown>, "queryKey">;

export function isPersistableQuery(query: QueryLike) {
  const [family, ...rest] = query.queryKey;
  const normalized = rest.map((part) => String(part).toLowerCase()).join(":");
  if (/(auth|security|notification|token|credential|session)/.test(normalized)) return false;
  if (family === "student-dashboard") {
    const [tenantId, accountId] = rest;
    return typeof tenantId === "string" && tenantId.trim().length > 0 &&
      typeof accountId === "string" && accountId.trim().length > 0 && accountId !== "anonymous";
  }
  if (family === "student-engagement") {
    return rest[0] === "feed" && hasPersistedIdentity(rest[1], rest[2]);
  }
  if (family === "lms-teacher-shell") {
    return rest[0] === "teacher-homework-workspace" && hasPersistedIdentity(rest[1], rest[2]);
  }
  if (family === "crm") {
    return rest[0] === "workspace" && rest[1] === "crm" && hasPersistedIdentity(rest[2], rest[3]);
  }
  if (family !== "lms") return false;
  const requiredKeyParts: Record<string, number> = {
    "assignment-progress-workspace": 4,
    "class-workspace": 6,
    attendance: 4,
    homework: 4,
    scores: 4,
    "student-groups": 4,
  };
  const minimumParts = requiredKeyParts[String(rest[0])];
  return typeof minimumParts === "number" && rest.length >= minimumParts &&
    hasPersistedIdentity(rest[1], rest[2]);
}

function hasPersistedIdentity(tenantId: unknown, accountId: unknown) {
  return typeof tenantId === "string" && tenantId.trim().length > 0 &&
    typeof accountId === "string" && accountId.trim().length > 0 &&
    accountId.trim().toLowerCase() !== "anonymous";
}

export function queryCacheScopeKey(scope: { portal: string; workspace?: string; tenantId: string; accountId: string }) {
  const portalScope = scope.workspace ? `${scope.portal}:${scope.workspace}` : scope.portal;
  return `${portalScope}:${scope.tenantId}:${scope.accountId}`;
}

type AsyncStorage = {
  getItem: (key: string) => Promise<string | undefined>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

function memoryStorage(): AsyncStorage {
  let value: string | undefined;
  return {
    getItem: async () => value,
    setItem: async (_key, next) => { value = next; },
    removeItem: async () => { value = undefined; },
  };
}

function indexedDbStorage(scopeKey: string): AsyncStorage {
  const store = createStore("erg-system", "query-cache");
  const key = `ERG_QUERY_CACHE:${scopeKey}`;
  const fallback = memoryStorage();
  return {
    getItem: async () => {
      try { return (await get<string>(key, store)) ?? await fallback.getItem(key); } catch { return fallback.getItem(key); }
    },
    setItem: async (_key, value) => {
      try { await set(key, value, store); } catch { await fallback.setItem(key, value); }
    },
    removeItem: async () => {
      try { await del(key, store); } catch { /* storage is best effort */ }
      await fallback.removeItem(key);
    },
  };
}

export function createQueryPersister(scopeKey = "anonymous") {
  const storage = typeof indexedDB === "undefined" ? memoryStorage() : indexedDbStorage(scopeKey);
  return createAsyncStoragePersister({
    storage,
    key: QUERY_CACHE_STORAGE_KEY,
    throttleTime: 1_000,
  });
}

export async function clearPersistedQueryScope(scopeKey: string) {
  if (typeof indexedDB === "undefined") return;
  try {
    await del(`ERG_QUERY_CACHE:${scopeKey}`, createStore("erg-system", "query-cache"));
  } catch {
    // Cache is best effort; a storage failure must not block logout.
  }
}
