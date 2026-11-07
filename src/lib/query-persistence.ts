import type { Query } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { createStore, del, get, set } from "idb-keyval";

// Bump whenever persisted query eligibility or serialized shapes change.
export const QUERY_CACHE_BUSTER = "erg-query-cache-v6";
export const QUERY_CACHE_STORAGE_KEY = `ERG_QUERY_CACHE:${QUERY_CACHE_BUSTER}`;

// Punch state is only true right now: never restore it from disk, even if a query opts in by mistake.
const NEVER_PERSISTED_TIMEKEEPING_QUERIES = new Set(["clock", "today"]);

export function shouldDehydratePersistedQuery(query: Pick<Query, "meta" | "state"> & { queryKey?: readonly unknown[] }) {
  const [root, name] = query.queryKey ?? [];
  if (root === "timekeeping" && typeof name === "string" && NEVER_PERSISTED_TIMEKEEPING_QUERIES.has(name)) return false;
  return query.state.status === "success" && query.meta?.persist === true;
}

// The library default dehydrates paused mutations so they replay after reload. A punch queued offline must not be sent later.
export function shouldDehydratePersistedMutation() {
  return false;
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
