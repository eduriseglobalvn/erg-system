import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { loadLmsDashboardBootstrap } from "@/features/lms/infrastructure/lms-dashboard-api";
import { queryKeys } from "@/lib/query-keys";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { getPersistedJsonValue } from "@/stores/persisted-store";

/**
 * The classes in this teacher's scope: the same bootstrap the teacher shell's class switcher reads (shared cache).
 * The homework workspace's classOptions is not used: it is empty for accounts that are not a class's own teacher.
 */
export function useTeacherClasses() {
  const { account, session } = useAuthSession("lms");
  const tenantId = session?.tenantId ?? "";
  const bootstrap = useQuery({
    queryKey: queryKeys.lmsTeacherShell.bootstrap(tenantId, account?.id),
    queryFn: ({ signal }) => loadLmsDashboardBootstrap(signal),
    enabled: Boolean(tenantId),
    staleTime: QUERY_POLICIES.reference.staleTime,
    gcTime: QUERY_POLICIES.reference.gcTime,
    refetchOnWindowFocus: false,
  });
  const classes = useMemo(() => {
    const all = bootstrap.data?.classes ?? [];
    // Several schools in scope (admin-like accounts): the school name tells two "9A1" apart.
    const manySchools = new Set(all.map((c) => c.schoolId)).size > 1;
    return all.map((c) => ({ id: c.id, label: manySchools ? `${c.className} · ${c.schoolName}` : c.className || c.id }));
  }, [bootstrap.data]);
  return { classes, loading: bootstrap.isPending };
}

/** The class picked in the teacher shell's switcher, "" when none was stored. */
export function shellSelectedClassId(): string {
  return getPersistedJsonValue<{ classId?: string }>("erg:lms-teacher-scope:v1", {}).classId ?? "";
}
