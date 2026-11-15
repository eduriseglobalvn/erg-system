import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { todayInput } from "@/domain/formatters/format-date";
import { teachingScheduleErrorCode } from "@/features/teaching-calendar/api/teaching-calendar-document";
import { loadSchoolPeriodAssignments, saveSchoolPeriodTimes, type SchoolPeriodAssignment } from "@/features/teaching-calendar/api/teaching-calendar-period-times-api";
import { loadTeachingOverviewSchools } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { loadTeachingPeriodTemplates } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { periodIssueMessage, slotsFromRows, templateName, type PeriodRow } from "@/features/teaching-calendar/domain/period-times-model";
import { weekStartOf } from "@/features/teaching-calendar/domain/schedule-copy";
import { getDefaultTenantId } from "@/lib/graphql-client";

export type SchoolEntry = { assignments: SchoolPeriodAssignment[]; schoolId: string; schoolName: string };

/** Truong that (danh sach bang tong) + cac bang gio da nhap + cac mau gio. Truong chua co bang gio -> `assignments` rong. */
export function useSchoolPeriods() {
  const tenantId = getDefaultTenantId();
  const weekStart = weekStartOf(todayInput());
  const schools = useQuery({ queryFn: ({ signal }) => loadTeachingOverviewSchools({ page: 0, size: 200, weekStart }, signal), queryKey: teachingCalendarQueryKeys.overview(tenantId, "schools", { page: 0, size: 200, weekStart }), staleTime: 60_000 });
  const assignments = useQuery({ queryFn: ({ signal }) => loadSchoolPeriodAssignments(undefined, signal), queryKey: teachingCalendarQueryKeys.periodAssignments(tenantId), staleTime: 60_000 });
  const templates = useQuery({ queryFn: ({ signal }) => loadTeachingPeriodTemplates(signal), queryKey: teachingCalendarQueryKeys.periodTemplates(tenantId), staleTime: 5 * 60_000 });
  const entries = useMemo<SchoolEntry[]>(() => {
    const byId = new Map<string, SchoolEntry>();
    for (const school of schools.data?.items ?? []) byId.set(school.schoolId, { assignments: [], schoolId: school.schoolId, schoolName: school.schoolName });
    for (const assignment of assignments.data ?? []) {
      const entry = byId.get(assignment.schoolId) ?? { assignments: [], schoolId: assignment.schoolId, schoolName: assignment.schoolName };
      byId.set(assignment.schoolId, { ...entry, assignments: [...entry.assignments, assignment] });
    }
    return [...byId.values()].sort((a, b) => a.schoolName.localeCompare(b.schoolName, "vi"));
  }, [assignments.data, schools.data]);
  return {
    entries, isError: schools.isError || assignments.isError || templates.isError, isPending: schools.isPending || assignments.isPending || templates.isPending,
    refetch: () => { void schools.refetch(); void assignments.refetch(); void templates.refetch(); },
    templates: templates.data ?? [],
  };
}

/** «Lưu giờ tiết»: tao bang gio moi + gan cho truong tu `effectiveFrom` (saveSchoolPeriodTimes). */
export function useSaveSchoolPeriods(school: { schoolId: string; schoolName: string }) {
  const queryClient = useQueryClient();
  const save = useMutation({
    meta: { silent: true },
    mutationFn: ({ effectiveFrom, rows }: { effectiveFrom: string; rows: readonly PeriodRow[] }) => saveSchoolPeriodTimes({
      effectiveFrom, name: templateName(school.schoolName, effectiveFrom), schoolId: school.schoolId, slots: slotsFromRows(rows),
    }),
    onSuccess: async () => {
      toast.success(`Đã lưu giờ tiết ${school.schoolName}`);
      await queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", getDefaultTenantId()) });
    },
  });
  return { error: save.isError ? periodIssueMessage(teachingScheduleErrorCode(save.error)) : undefined, pending: save.isPending, reset: save.reset, save: save.mutate };
}
