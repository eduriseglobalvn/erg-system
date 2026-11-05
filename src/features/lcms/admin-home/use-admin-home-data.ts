import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useEmployees } from "@/features/employee-management/hooks/use-employee-management";
import {
  getSchoolDirectory,
  getSchoolOperations,
  schoolManagementQueryKeys,
} from "@/features/lcms/school-management/api/school-management-api";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { getCurrentAccountId } from "@/platform/auth/api/auth-storage";

import { buildAdminHomeSummary } from "./admin-home-model";

// shortcut: one operations request per school (same cache as Quản lý trường học); fine for a handful of schools, needs a backend summary past ~20.
const MAX_DETAILED_SCHOOLS = 20;

// Module-level so TanStack keeps the combined result stable until a query result changes.
function combineDetails(results: Array<{ data?: PartnerSchool; isPending: boolean }>) {
  const details = new Map<string, PartnerSchool>();
  for (const result of results) if (result.data) details.set(result.data.id, result.data);
  return { details, pending: results.some((result) => result.isPending) };
}

export function useAdminHomeData(tenantId: string) {
  const graphTenantId = getDefaultTenantId();
  const accountId = getCurrentAccountId("lcms");
  const directoryQuery = useQuery({
    queryKey: schoolManagementQueryKeys.directory(graphTenantId, accountId),
    queryFn: ({ signal }) => getSchoolDirectory("", signal),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
  const directory = useMemo(() => directoryQuery.data?.items ?? [], [directoryQuery.data]);

  const detailQuery = useQueries({
    queries: directory.slice(0, MAX_DETAILED_SCHOOLS).map((school) => ({
      queryKey: schoolManagementQueryKeys.operations(graphTenantId, accountId, school.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => getSchoolOperations(school.id, signal),
      staleTime: QUERY_POLICIES.realtime.staleTime,
      gcTime: QUERY_POLICIES.realtime.gcTime,
    })),
    combine: combineDetails,
  });
  const staffQuery = useEmployees(tenantId, { limit: 100, page: 1 });

  const summary = useMemo(() => {
    const staff = staffQuery.data ? { users: staffQuery.data.users, total: staffQuery.data.meta.total } : null;
    return buildAdminHomeSummary(directory, detailQuery.details, staff);
  }, [directory, detailQuery.details, staffQuery.data]);

  return {
    summary,
    loading: directoryQuery.isPending,
    detailsLoading: detailQuery.pending,
    failed: directoryQuery.isError,
    refetch: () => void directoryQuery.refetch(),
    updatedAt: directoryQuery.dataUpdatedAt,
  };
}
