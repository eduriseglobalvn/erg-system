import { expect, test } from "vitest";

import { shouldDehydratePersistedMutation, shouldDehydratePersistedQuery, queryCacheScopeKey, QUERY_CACHE_BUSTER, QUERY_CACHE_STORAGE_KEY } from "@/lib/query-persistence";
import { persistedQueryMeta } from "@/lib/query-policy";

test("dehydrates only successful queries flagged with meta.persist", () => {
  expect(shouldDehydratePersistedQuery({ meta: { persist: true }, state: { status: "success" } } as never)).toBe(true);
  expect(shouldDehydratePersistedQuery({ meta: { persist: true }, state: { status: "pending" } } as never)).toBe(false);
  expect(shouldDehydratePersistedQuery({ meta: { persist: "yes" }, state: { status: "success" } } as never)).toBe(false);
  expect(shouldDehydratePersistedQuery({ meta: undefined, state: { status: "success" } } as never)).toBe(false);
});

test("persistedQueryMeta refuses anonymous and blank scopes", () => {
  expect(persistedQueryMeta("tenant-a", "account-a")).toEqual({ persist: true });
  expect(persistedQueryMeta("tenant-a", " Anonymous ")).toBeUndefined();
  expect(persistedQueryMeta("tenant-a", "")).toBeUndefined();
  expect(persistedQueryMeta(" ", "account-a")).toBeUndefined();
});

test("creates a scope key that isolates portal tenant and account", () => {
  expect(queryCacheScopeKey({ portal: "lms", tenantId: "tenant-a", accountId: "account-a" })).toBe("lms:tenant-a:account-a");
  expect(queryCacheScopeKey({ portal: "lms", workspace: "ADMIN", tenantId: "tenant-a", accountId: "account-a" })).toBe("lms:ADMIN:tenant-a:account-a");
});

test("versions the persisted cache key so schema changes migrate instead of hydrating stale data", () => {
  expect(QUERY_CACHE_STORAGE_KEY).toBe(`ERG_QUERY_CACHE:${QUERY_CACHE_BUSTER}`);
  expect(QUERY_CACHE_BUSTER).toBe("erg-query-cache-v6");
});

test("persister returns real promises and restores a persisted client", async () => {
  const { createQueryPersister } = await import("@/lib/query-persistence");
  const persister = createQueryPersister("test-scope");
  const client = {
    timestamp: Date.now(),
    buster: QUERY_CACHE_BUSTER,
    clientState: { mutations: [], queries: [] },
  };
  const persisting = persister.persistClient(client);
  expect(typeof (persisting as Promise<void>).then).toBe("function");
  await persisting;
  const restoring = persister.restoreClient();
  expect(typeof (restoring as Promise<unknown>).then).toBe("function");
  expect(await restoring).toEqual(client);
  await persister.removeClient();
  expect(await persister.restoreClient()).toBeUndefined();
});

test("never persists timekeeping clock/today queries or any mutation, even paused ones", () => {
  const persisted = { meta: { persist: true }, state: { status: "success" } };
  expect(shouldDehydratePersistedQuery({ ...persisted, queryKey: ["timekeeping", "today"] } as never)).toBe(false);
  expect(shouldDehydratePersistedQuery({ ...persisted, queryKey: ["timekeeping", "clock"] } as never)).toBe(false);
  expect(shouldDehydratePersistedQuery({ ...persisted, queryKey: ["timekeeping", "month", "2026-11"] } as never)).toBe(true);
  expect(shouldDehydratePersistedMutation()).toBe(false);
});
