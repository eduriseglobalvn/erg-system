export type QueryPolicyName = "realtime" | "transactional" | "reference" | "offlineCore" | "sensitive";

export type QueryPolicy = Readonly<{
  staleTime: number;
  gcTime: number;
  persist: boolean;
}>;

export const QUERY_POLICIES: Record<QueryPolicyName, QueryPolicy> = {
  realtime: { staleTime: 15_000, gcTime: 2 * 60_000, persist: false },
  transactional: { staleTime: 60_000, gcTime: 10 * 60_000, persist: false },
  reference: { staleTime: 10 * 60_000, gcTime: 30 * 60_000, persist: false },
  offlineCore: { staleTime: 5 * 60_000, gcTime: 24 * 60 * 60_000, persist: true },
  sensitive: { staleTime: 0, gcTime: 60_000, persist: false },
};

type RetryableError = { status?: number; name?: string; code?: string };

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 2 || !error || typeof error !== "object") return false;
  const candidate = error as RetryableError;
  if (candidate.name === "AbortError" || candidate.code === "ABORT_ERR") return false;
  if (typeof candidate.status === "number") return candidate.status >= 500;
  return true;
}
