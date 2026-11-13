import { describe, expect, test } from "vitest";

import { QUERY_PERSIST_MAX_AGE_MS, QUERY_POLICIES, shouldRetryQuery } from "@/lib/query-policy";

describe("query policy", () => {
  test("classifies cache volatility and persistence", () => {
    expect(QUERY_POLICIES.realtime.persist).toBe(false);
    expect(QUERY_POLICIES.reference.staleTime).toBeGreaterThan(QUERY_POLICIES.transactional.staleTime);
    expect(QUERY_POLICIES.offlineCore.persist).toBe(true);
    expect(QUERY_POLICIES.sensitive.persist).toBe(false);
  });

  test("does not retry client, auth, or aborted errors", () => {
    expect(shouldRetryQuery(1, { status: 422 })).toBe(false);
    expect(shouldRetryQuery(1, { status: 401 })).toBe(false);
    expect(shouldRetryQuery(1, { name: "AbortError" })).toBe(false);
    expect(shouldRetryQuery(1, { status: 503 })).toBe(true);
    expect(shouldRetryQuery(2, { status: 503 })).toBe(false);
  });
});

describe("persisted query policy consistency", () => {
  test("persisted tier keeps queries in memory at least as long as the persister maxAge", () => {
    expect(QUERY_POLICIES.offlineCore.gcTime).toBeGreaterThanOrEqual(QUERY_PERSIST_MAX_AGE_MS);
    for (const policy of Object.values(QUERY_POLICIES)) {
      if (policy.persist) expect(policy.gcTime).toBeGreaterThanOrEqual(QUERY_PERSIST_MAX_AGE_MS);
    }
  });

  test("every query factory using persistedQueryMeta takes its gcTime from the offlineCore policy", () => {
    const sources = import.meta.glob("/src/**/*.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
    const users = Object.entries(sources).filter(([path, text]) => !/\.test\.ts$/.test(path) && !path.endsWith("/lib/query-policy.ts") && text.includes("persistedQueryMeta("));
    expect(users.length).toBeGreaterThan(0);
    for (const [path, text] of users) {
      expect(text, path).toMatch(/offlineCore\.gcTime|_GC_TIME/);
    }
  });
});

test("leaves 429 to the API client instead of retrying on top of it", () => {
  expect(shouldRetryQuery(0, { status: 429 })).toBe(false);
});
