import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getSchoolDirectory, getSchoolOperations, schoolManagementQueryKeys } from "@/features/lcms/school-management/api/school-management-api";
import type { PartnerSchool } from "@/features/lcms/school-management/types/school-management-types";
import { lmsAssignmentReadQueryKeys, useLmsStudentGroupsQuery } from "@/features/lms/api/lms-assignment-command-query";
import { loadLmsTeacherHomeworkWorkspace } from "@/features/lms/api/lms-teacher-homework-api";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { getCurrentAccountId } from "@/platform/auth/api/auth-storage";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";

import type { AudienceScope } from "../model/audience-draft";
import type { ComposePortalKind } from "../model/campaign-paths";

export type AudienceOption = { id: string; label: string };

export type AudienceDirectory = {
  schools: AudienceOption[];
  /** Grade CODES ("7"), the value the backend matches on academic_classes.grade. */
  grades: AudienceOption[];
  classes: AudienceOption[];
  groups: AudienceOption[];
  loading: boolean;
  error: unknown;
};

// shortcut: classes and grades come from one operations request per school (same cache as Quản lý trường học, max 20 schools); needs a backend list past that.
const MAX_SCHOOLS = 20;
const NO_SCHOOLS: never[] = [];

const byLabel = (a: AudienceOption, b: AudienceOption) => a.label.localeCompare(b.label, "vi", { numeric: true });

function combineSchools(results: Array<{ data?: PartnerSchool; isPending: boolean; error: unknown }>) {
  return { schools: results.flatMap((r) => (r.data ? [r.data] : [])), pending: results.some((r) => r.isPending), error: results.find((r) => r.error)?.error ?? null };
}

/** Admin: every school / grade / class in the tenant. */
function useAdminDirectory(scope: AudienceScope, enabled: boolean) {
  const tenantId = getDefaultTenantId();
  const accountId = getCurrentAccountId("lcms");
  const needsDirectory = enabled && ["SCHOOL", "GRADE", "CLASS"].includes(scope);
  const directory = useQuery({
    queryKey: schoolManagementQueryKeys.directory(tenantId, accountId),
    queryFn: ({ signal }) => getSchoolDirectory("", signal),
    enabled: needsDirectory,
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
  const directoryItems = (needsDirectory ? directory.data?.items : undefined) ?? NO_SCHOOLS;
  const details = useQueries({
    queries: (scope === "GRADE" || scope === "CLASS" ? directoryItems.slice(0, MAX_SCHOOLS) : []).map((school) => ({
      queryKey: schoolManagementQueryKeys.operations(tenantId, accountId, school.id),
      queryFn: ({ signal }: { signal: AbortSignal }) => getSchoolOperations(school.id, signal),
      staleTime: QUERY_POLICIES.realtime.staleTime,
      gcTime: QUERY_POLICIES.realtime.gcTime,
    })),
    combine: combineSchools,
  });
  const lists = useMemo(() => {
    const codes = new Set(details.schools.flatMap((s) => [...s.grades, ...s.classes.map((c) => c.grade)]).filter(Boolean));
    return {
      schools: directoryItems.map((s) => ({ id: s.id, label: s.name || s.id })).sort(byLabel),
      grades: [...codes].map((code) => ({ id: code, label: `Khối ${code}` })).sort(byLabel),
      classes: details.schools.flatMap((s) => s.classes.map((c) => ({ id: c.id, label: `${c.name} · ${s.name}` }))).sort(byLabel),
    };
  }, [details.schools, directoryItems]);
  return { ...lists, loading: directory.isFetching || details.pending, error: directory.error ?? details.error };
}

/** Teacher: only the classes they teach (the backend's own list, 403 otherwise). */
function useTeacherClasses(enabled: boolean) {
  const { account, session } = useAuthSession("lms");
  const tenantId = session?.tenantId ?? "";
  const workspace = useQuery({
    queryKey: lmsAssignmentReadQueryKeys.homeworkWorkspace(tenantId, account?.id),
    queryFn: ({ signal }) => loadLmsTeacherHomeworkWorkspace({ page: 0, size: 50, status: "active", tenantId }, signal),
    enabled: enabled && Boolean(tenantId),
    staleTime: QUERY_POLICIES.offlineCore.staleTime,
    gcTime: QUERY_POLICIES.offlineCore.gcTime,
    refetchOnWindowFocus: false,
  });
  const classes = useMemo(
    () => (workspace.data?.classOptions ?? []).map((c) => ({ id: c.id, label: c.name || c.id })).sort(byLabel),
    [workspace.data],
  );
  return { classes, loading: workspace.isFetching, error: workspace.error };
}

/** Options for the scope selectors; only the data the active scope needs is fetched. */
export function useAudienceDirectory(kind: ComposePortalKind, scope: AudienceScope): AudienceDirectory {
  const admin = kind === "admin";
  const adminData = useAdminDirectory(scope, admin);
  const teacher = useTeacherClasses(!admin && (scope === "CLASS" || scope === "GROUP"));
  const groupsQuery = useLmsStudentGroupsQuery(undefined, null, { enabled: scope === "GROUP" });
  const groups = useMemo(() => {
    const taught = admin ? null : new Set(teacher.classes.map((c) => c.id));
    return (groupsQuery.data?.groups ?? [])
      .filter((g) => !taught || (g.classId && taught.has(g.classId)))
      .map((g) => ({ id: g.id, label: g.name }))
      .sort(byLabel);
  }, [admin, groupsQuery.data, teacher.classes]);
  const base = admin ? adminData : { schools: [], grades: [], classes: teacher.classes, loading: teacher.loading, error: teacher.error };
  return {
    ...base,
    groups,
    loading: base.loading || (scope === "GROUP" && groupsQuery.isFetching),
    error: base.error ?? (scope === "GROUP" ? groupsQuery.error : null),
  };
}
