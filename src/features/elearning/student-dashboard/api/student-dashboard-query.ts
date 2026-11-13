import { gradeLabelFromClassName, loadStudentDashboardData } from "@/features/elearning/student-dashboard/api/student-dashboard-api";
import type { StudentDashboardProfile } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { persistedQueryMeta, QUERY_POLICIES } from "@/lib/query-policy";

const STUDENT_DASHBOARD_STALE_MS = 30_000;

export type StudentDashboardQueryScope = {
  accountId?: string | null;
  tenantId: string;
};

type StudentDashboardLoadingViewer = {
  className?: string;
  id?: string;
  name?: string;
  schoolName?: string;
  title?: string;
  viewerKind?: "student" | "teacher";
};

export function createStudentDashboardLoadingProfile(
  viewer: StudentDashboardLoadingViewer | null | undefined,
): StudentDashboardProfile {
  return {
    id: viewer?.id ?? "",
    name: viewer?.name ?? "",
    className: viewer?.className ?? "",
    gradeLabel: gradeLabelFromClassName(viewer?.className),
    schoolName: viewer?.schoolName ?? "",
    homeroomTeacher: "",
    averageScore: 0,
    completedAssignments: 0,
    totalAssignments: 0,
    motivationPoints: 0,
    weeklyGoalProgress: 0,
  };
}

function normalizeTenantId(tenantId: string) {
  return tenantId.trim() || getDefaultTenantId();
}

function normalizeAccountId(accountId: string | null | undefined) {
  return accountId?.trim() || "anonymous";
}

export const studentDashboardQueryKeys = {
  root: ["student-dashboard"] as const,
  workspace: ({ accountId, tenantId }: StudentDashboardQueryScope) => [
    ...studentDashboardQueryKeys.root,
    normalizeTenantId(tenantId),
    normalizeAccountId(accountId),
  ] as const,
};

export function studentDashboardQueryOptions(scope: StudentDashboardQueryScope) {
  const tenantId = normalizeTenantId(scope.tenantId);
  return {
    gcTime: QUERY_POLICIES.offlineCore.gcTime,
    queryFn: ({ signal }: { signal: AbortSignal }) => loadStudentDashboardData({ signal, tenantId }),
    meta: persistedQueryMeta(tenantId, normalizeAccountId(scope.accountId)),
    queryKey: studentDashboardQueryKeys.workspace(scope),
    // A teacher can assign while this tab is open: refetch when the student comes back to it, and treat data as fresh for 30s only.
    refetchOnWindowFocus: true,
    staleTime: STUDENT_DASHBOARD_STALE_MS,
  };
}
