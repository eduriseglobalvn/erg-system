import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { QUERY_POLICIES, shouldRetryQuery } from "@/lib/query-policy";

// Failures nobody handled must not vanish: mutations without their own onError
// (and not flagged meta.silent) surface a toast instead of an unhandled rejection.
export function reportUnhandledMutationError(error: unknown, options: { onError?: unknown; meta?: Record<string, unknown> }) {
  if (options.onError || options.meta?.silent) return;
  toast.error(error instanceof Error && error.message ? error.message : "Thao tác không thành công. Vui lòng thử lại.");
}

export const appQueryClient = new QueryClient({
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
