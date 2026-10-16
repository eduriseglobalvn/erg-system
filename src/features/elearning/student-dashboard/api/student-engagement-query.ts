import { loadStudentDiscussionFeed } from "@/features/elearning/student-dashboard/api/student-engagement-api";
import { QUERY_POLICIES } from "@/lib/query-policy";

export type StudentEngagementScope = {
  tenantId: string;
  accountId?: string | null;
  page?: number;
  size?: number;
};

function normalized(scope: StudentEngagementScope) {
  return {
    accountId: scope.accountId?.trim() || "anonymous",
    page: Number.isInteger(scope.page) && (scope.page ?? 0) >= 0 ? scope.page! : 0,
    size: Number.isInteger(scope.size) && (scope.size ?? 20) > 0 ? scope.size! : 20,
    tenantId: scope.tenantId.trim(),
  };
}

export const studentEngagementQueryKeys = {
  root: ["student-engagement"] as const,
  feed: (scope: StudentEngagementScope) => {
    const value = normalized(scope);
    return [...studentEngagementQueryKeys.root, "feed", value.tenantId, value.accountId, value.page, value.size] as const;
  },
};

export function studentDiscussionFeedQueryOptions(scope: StudentEngagementScope) {
  const value = normalized(scope);
  return {
    enabled: value.accountId !== "anonymous" && Boolean(value.tenantId),
    gcTime: QUERY_POLICIES.offlineCore.gcTime,
    queryFn: ({ signal }: { signal: AbortSignal }) => loadStudentDiscussionFeed({ ...value, signal }),
    queryKey: studentEngagementQueryKeys.feed(scope),
    refetchOnWindowFocus: false,
    staleTime: QUERY_POLICIES.offlineCore.staleTime,
  };
}
