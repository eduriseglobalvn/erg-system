import { MutationCache, QueryCache, QueryClient, type Query } from "@tanstack/react-query";
import { toast } from "sonner";

import { rateLimitMessage } from "@/lib/api-client/errors";
import { QUERY_POLICIES, shouldRetryQuery } from "@/lib/query-policy";

// One toast however many requests hit the rate limit at once.
const RATE_LIMIT_TOAST_ID = "rate-limited";

// Failures nobody handled must not vanish: mutations without their own onError
// (and not flagged meta.silent) surface a toast instead of an unhandled rejection.
export function reportUnhandledMutationError(error: unknown, options: { onError?: unknown; meta?: Record<string, unknown> }) {
  if (options.onError || options.meta?.silent) return;
  const busy = rateLimitMessage(error);
  if (busy) return void toast.error(busy, { id: RATE_LIMIT_TOAST_ID });
  toast.error(error instanceof Error && error.message ? error.message : "Thao tác không thành công. Vui lòng thử lại.");
}

// A failed first load is shown by the page itself; a toast is only for failures the page
// cannot show: a background refetch over data already on screen, or meta.toastOnError.
// Toast id = queryHash, so repeated failures of one query replace instead of stacking.
export function reportQueryError(error: unknown, query: Pick<Query<unknown, unknown>, "queryHash" | "meta" | "state">) {
  if (query.meta?.silent) return;
  const busy = rateLimitMessage(error);
  if (busy) return void toast.error(busy, { id: RATE_LIMIT_TOAST_ID });
  if ((error as { status?: number } | null)?.status === 401) return; // auth refresh owns 401
  if (query.state.data === undefined && !query.meta?.toastOnError) return;
  toast.error("Không thể cập nhật dữ liệu. Vui lòng thử lại sau.", { id: `query-error:${query.queryHash}` });
}

export const appQueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: reportQueryError }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => reportUnhandledMutationError(error, mutation.options),
  }),
  defaultOptions: {
    queries: {
      staleTime: QUERY_POLICIES.transactional.staleTime,
      gcTime: QUERY_POLICIES.transactional.gcTime,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: shouldRetryQuery,
    },
  },
});
