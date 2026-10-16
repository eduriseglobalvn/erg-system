import { QueryClient } from "@tanstack/react-query";

import { QUERY_POLICIES, shouldRetryQuery } from "@/lib/query-policy";

export const appQueryClient = new QueryClient({
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
