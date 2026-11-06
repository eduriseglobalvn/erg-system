export type QueryPolicyName = "realtime" | "transactional" | "reference" | "offlineCore" | "sensitive";

export type QueryPolicy = Readonly<{
  staleTime: number;
  gcTime: number;
  persist: boolean;
}>;

/** Persister maxAge (App.tsx); persisted queries must stay in memory at least this long or hydration is GC'd at once. */
export const QUERY_PERSIST_MAX_AGE_MS = 24 * 60 * 60_000;

export const QUERY_POLICIES: Record<QueryPolicyName, QueryPolicy> = {
  realtime: { staleTime: 15_000, gcTime: 2 * 60_000, persist: false },
  transactional: { staleTime: 60_000, gcTime: 10 * 60_000, persist: false },
  reference: { staleTime: 10 * 60_000, gcTime: 30 * 60_000, persist: false },
  offlineCore: { staleTime: 5 * 60_000, gcTime: QUERY_PERSIST_MAX_AGE_MS, persist: true },
  sensitive: { staleTime: 0, gcTime: 60_000, persist: false },
};

const isConcrete = (value: string) => value.trim().length > 0;

/** Single source of "this query is persisted": spread into query options as `meta`. Anonymous/blank scopes are never persisted. */
export function persistedQueryMeta(tenantId: string, accountId: string) {
  if (!QUERY_POLICIES.offlineCore.persist || !isConcrete(tenantId) || !isConcrete(accountId)) return undefined;
  if (accountId.trim().toLowerCase() === "anonymous") return undefined;
  return { persist: true } as const;
}

type RetryableError = { status?: number; name?: string; code?: string };

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 2 || !error || typeof error !== "object") return false;
  const candidate = error as RetryableError;
  if (candidate.name === "AbortError" || candidate.code === "ABORT_ERR") return false;
  if (typeof candidate.status === "number") return candidate.status >= 500;
  return true;
}
