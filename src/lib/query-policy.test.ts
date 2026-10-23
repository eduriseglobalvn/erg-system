import { describe, expect, test } from "vitest";

import { QUERY_POLICIES, shouldRetryQuery } from "@/lib/query-policy";

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
