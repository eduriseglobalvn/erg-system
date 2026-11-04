import { queryOptions } from "@tanstack/react-query";

import { loadSeoCrmWorkspace } from "@/features/crm/seo/api/seo-crm-transport";
import { persistedQueryMeta, QUERY_POLICIES } from "@/lib/query-policy";

export type SeoCrmQueryScope = { tenantId: string; accountId: string };

function normalized(value: string, fallback: string) {
  return value.trim() || fallback;
}

export const seoCrmQueryKeys = {
  root: ["crm"] as const,
  workspace: ({ tenantId, accountId }: SeoCrmQueryScope) => [
    ...seoCrmQueryKeys.root,
    "workspace",
    "crm",
    normalized(tenantId, "default"),
    normalized(accountId, "anonymous"),
  ] as const,
};

export function seoCrmWorkspaceQueryOptions(scope: SeoCrmQueryScope) {
  return queryOptions({
    queryKey: seoCrmQueryKeys.workspace(scope),
    meta: persistedQueryMeta(normalized(scope.tenantId, "default"), normalized(scope.accountId, "anonymous")),
    queryFn: ({ signal }) => loadSeoCrmWorkspace(signal),
    staleTime: QUERY_POLICIES.offlineCore.staleTime,
    gcTime: QUERY_POLICIES.offlineCore.gcTime,
  });
}
