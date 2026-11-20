import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { lmsAssignmentReadQueryKeys } from "@/features/lms/api/lms-assignment-command-query";
import { loadLmsTeacherHomeworkWorkspace } from "@/features/lms/api/lms-teacher-homework-api";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";

/** The classes this teacher teaches (the same read model the homework workspace uses). */
export function useTeacherClasses() {
  const { account, session } = useAuthSession("lms");
  const tenantId = session?.tenantId ?? "";
  const workspace = useQuery({
    queryKey: lmsAssignmentReadQueryKeys.homeworkWorkspace(tenantId, account?.id),
    queryFn: ({ signal }) => loadLmsTeacherHomeworkWorkspace({ page: 0, size: 50, status: "active", tenantId }, signal),
    enabled: Boolean(tenantId),
    staleTime: QUERY_POLICIES.offlineCore.staleTime,
    gcTime: QUERY_POLICIES.offlineCore.gcTime,
    refetchOnWindowFocus: false,
  });
  const classes = useMemo(() => (workspace.data?.classOptions ?? []).map((c) => ({ id: c.id, label: c.name || c.id })), [workspace.data]);
  return { classes, loading: workspace.isPending };
}
