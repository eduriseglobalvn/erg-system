import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { listAccessScopes, type AccessScopeOption, type AccessScopeType } from "@/features/lcms/admin-operations/api/access-management-api";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import { queryKeys } from "@/lib/query-keys";
import { QUERY_POLICIES } from "@/lib/query-policy";

/** Loads the scope options (center/branch/...) for the policy draft's selected scope type. */
export function useAccessScopeResults({
  accountId,
  onError,
  scopeType,
  search,
  tenantId,
}: {
  accountId: string;
  onError: (message: string) => void;
  scopeType: AccessScopeType | "";
  search: string;
  tenantId: string;
}) {
  const queryClient = useQueryClient();
  const paceStateUpdate = usePacedStateBatch();
  const [scopeResults, setScopeResults] = useState<AccessScopeOption[]>([]);
  const [scopeTotal, setScopeTotal] = useState(0);
  const [loadingScopes, setLoadingScopes] = useState(false);

  useEffect(() => {
    if (!scopeType) {
      paceStateUpdate(() => {
        setScopeResults([]);
        setScopeTotal(0);
      });
      return;
    }

    let cancelled = false;
    paceStateUpdate(() => {
      if (!cancelled) setLoadingScopes(true);
    });
    queryClient
      .fetchQuery({
        queryKey: queryKeys.adminOperations.userAccess.scopes(scopeType, search, tenantId, accountId),
        queryFn: ({ signal }) => listAccessScopes({ scopeType, search, page: 1, limit: 20 }, signal),
        staleTime: QUERY_POLICIES.transactional.staleTime,
      })
      .then((result) => {
        if (cancelled) return;
        setScopeResults(result.items);
        setScopeTotal(result.total);
      })
      .catch((err) => {
        if (!cancelled) onError(err instanceof Error ? err.message : "Không thể tải phạm vi cấp quyền.");
      })
      .finally(() => {
        if (!cancelled) setLoadingScopes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accountId, onError, paceStateUpdate, queryClient, scopeType, search, tenantId]);

  return { loadingScopes, scopeResults, scopeTotal };
}
