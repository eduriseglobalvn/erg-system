import { useQuery } from "@tanstack/react-query";

import { loadSchoolPeriodAssignments } from "@/features/teaching-calendar/api/teaching-calendar-period-times-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { loadTeachingPeriodTemplates } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { loadTeachingSlotOptions } from "@/features/teaching-calendar/api/teaching-calendar-slot-options-api";
import { loadLcmsTeachingCalendarWorkspace } from "@/features/teaching-calendar/api/teaching-calendar-workspace-query-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { assignmentForDate } from "@/features/teaching-calendar/domain/period-times-model";
import { getDefaultTenantId } from "@/lib/graphql-client";

/** Phong + giao vien trong/ban cua o (ngay, tiet) — loai chinh tiet dang sua de khong tu bao ban. */
export function useSlotOptions(event: TeachingCalendarEvent, date: string, periodNo: number) {
  const input = { batchId: event.batchId ?? undefined, classId: event.classId, date, excludeEventId: event.id, periodNo, schoolId: event.schoolId };
  return useQuery({
    queryFn: ({ signal }) => loadTeachingSlotOptions(input, signal),
    queryKey: teachingCalendarQueryKeys.slotOptions(getDefaultTenantId(), input),
    staleTime: 15_000,
  });
}

/** Cac tiet co gio cua truong tai `date` (bang gio dated cua truong, khong co thi bang mac dinh dau tien). */
export function useSchoolPeriodsOn(schoolId: string, date: string) {
  const tenantId = getDefaultTenantId();
  const templates = useQuery({ queryFn: ({ signal }) => loadTeachingPeriodTemplates(signal), queryKey: teachingCalendarQueryKeys.periodTemplates(tenantId), staleTime: 5 * 60_000 });
  const assignments = useQuery({ queryFn: ({ signal }) => loadSchoolPeriodAssignments([schoolId], signal), queryKey: teachingCalendarQueryKeys.periodAssignments(tenantId, [schoolId]), staleTime: 60_000 });
  const template = templates.data?.find((item) => item.id === assignmentForDate(assignments.data ?? [], date)?.templateId) ?? templates.data?.[0];
  return (template?.slots ?? []).filter((slot) => slot.startTime && slot.endTime).sort((a, b) => a.periodNo - b.periodNo);
}

/** Danh sach mon cua catalog lich (cung nguon voi man xep lich); chi nap khi dialog mo. */
export function useSubjectOptions(event: TeachingCalendarEvent) {
  const input = { from: event.date, schoolIds: [event.schoolId], statuses: ["PUBLISHED" as const], tenantId: getDefaultTenantId(), to: event.date };
  return useQuery({
    queryFn: ({ signal }) => loadLcmsTeachingCalendarWorkspace(input, signal),
    queryKey: teachingCalendarQueryKeys.workspace("lcms", "slot-subjects", input),
    select: (workspace) => workspace.catalog?.subjects ?? [],
    staleTime: 5 * 60_000,
  });
}
