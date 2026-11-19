import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getSchoolStudents, schoolManagementQueryKeys } from "@/features/lcms/school-management/api/school-management-api";
import type { SchoolStudentFilters } from "@/features/lcms/school-management/api/school-management-api";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { getCurrentAccountId } from "@/platform/auth/api/auth-storage";

/** One server-side page of a school's students; the previous page stays on screen while the next loads. */
export function useSchoolStudents(schoolId: string | undefined, filters: SchoolStudentFilters, page: number, size = 20) {
  const tenantId = getDefaultTenantId();
  const accountId = getCurrentAccountId("lcms");
  return useQuery({
    queryKey: [...schoolManagementQueryKeys.students(tenantId, accountId, schoolId ?? ""), filters, page, size],
    queryFn: ({ signal }) => getSchoolStudents(schoolId ?? "", filters, page, size, signal),
    enabled: Boolean(schoolId),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
    placeholderData: keepPreviousData,
  });
}
