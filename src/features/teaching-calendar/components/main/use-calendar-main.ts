import { useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import { loadTeachingScheduleBatches } from "@/features/teaching-calendar/api/teaching-calendar-batch-api";
import { loadTeachingOverviewSchools, loadTeachingOverviewTeachers } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { loadTeachingScheduleDraft } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import { loadLcmsTeachingCalendarWorkspace } from "@/features/teaching-calendar/api/teaching-calendar-workspace-query-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { addDaysToDate, weekStartOf } from "@/features/teaching-calendar/domain/schedule-copy";
import { todayInput } from "@/domain/formatters/format-date";
import { getDefaultTenantId } from "@/lib/graphql-client";

export type CalendarMode = "day" | "week" | "month";

/** Khoang ngay cua che do xem: ngay, tuan Thu 2 - CN, thang (luoi 6 tuan). */
export function visibleRange(mode: CalendarMode, anchor: string) {
  if (mode === "day") return { from: anchor, to: anchor };
  if (mode === "week") { const from = weekStartOf(anchor); return { from, to: addDaysToDate(from, 6) }; }
  const first = weekStartOf(`${anchor.slice(0, 7)}-01`);
  return { from: first, to: addDaysToDate(first, 41) };
}

/** Du lieu trang Lich giang day: su kien theo bo loc truong, ten ngan truong, cac dot nhap + xung dot. */
export function useCalendarMain() {
  const tenantId = getDefaultTenantId();
  const [mode, setMode] = useState<CalendarMode>("week");
  const [anchor, setAnchor] = useState(() => todayInput());
  const [schoolIds, setSchoolIds] = useState<string[]>([]);
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const range = visibleRange(mode, anchor);
  const weekStart = weekStartOf(anchor);

  const workspace = useQuery({
    queryFn: ({ signal }) => loadLcmsTeachingCalendarWorkspace({ ...range, schoolIds: schoolIds.length ? schoolIds : undefined, statuses: ["DRAFT", "PUBLISHED"], tenantId }, signal),
    queryKey: teachingCalendarQueryKeys.workspace("lcms", "main", { ...range, schoolIds, statuses: ["DRAFT", "PUBLISHED"], tenantId }),
    staleTime: 60_000,
  });
  const schools = useQuery({
    queryFn: ({ signal }) => loadTeachingOverviewSchools({ page: 0, size: 200, weekStart }, signal),
    queryKey: teachingCalendarQueryKeys.overview(tenantId, "schools", { page: 0, size: 200, weekStart }),
    staleTime: 60_000,
  });
  // Moi tai khoan giao vien trong pham vi (ten that), ke ca nguoi chua co tiet nao trong khoang dang xem.
  const accounts = useQuery({
    queryFn: ({ signal }) => loadTeachingOverviewTeachers({ page: 0, size: 200, weekStart }, signal),
    queryKey: teachingCalendarQueryKeys.overview(tenantId, "teachers", { page: 0, size: 200, weekStart }),
    staleTime: 60_000,
  });
  const batches = useQuery({
    queryFn: ({ signal }) => loadTeachingScheduleBatches({ page: 0, size: 20, status: "DRAFT", tenantId }, signal),
    queryKey: teachingCalendarQueryKeys.batches("lcms", { page: 0, size: 20, status: "DRAFT", tenantId }),
    staleTime: 60_000,
  });
  const drafts = useQueries({
    queries: (batches.data?.items ?? []).map((batch) => ({
      queryFn: ({ signal }: { signal: AbortSignal }) => loadTeachingScheduleDraft(batch.id, signal),
      queryKey: teachingCalendarQueryKeys.scheduleDraft(tenantId, batch.id),
      staleTime: 60_000,
    })),
  });

  const all = workspace.data?.events;
  const events = useMemo<TeachingCalendarEvent[]>(() => (all ?? []).filter((event) => !teacherIds.length || event.teachers.some((teacher) => teacherIds.includes(teacher.userId))), [all, teacherIds]);
  const shortNames = useMemo(() => new Map((schools.data?.items ?? []).map((school) => [school.schoolId, school.schoolShortName])), [schools.data]);
  const conflicts = useMemo(() => drafts.flatMap((query) => query.data?.conflicts ?? []), [drafts]);
  const draftCards = useMemo(() => drafts.flatMap((query) => (query.data ? [query.data] : [])), [drafts]);
  // Dot nhap co ngay ap dung + so tuan lap; dot da xuat ban chua co trong hop dong su kien nen khong co dong «Hằng tuần».
  const repeatUntilOf = (batchId?: string | null) => {
    const batch = draftCards.find((card) => card.batch.id === batchId)?.batch;
    return batch?.applyFrom && batch.repeatWeeks ? addDaysToDate(batch.applyFrom, batch.repeatWeeks * 7 - 1) : undefined;
  };
  const teacherCounts = useMemo(() => {
    const counts = new Map<string, { count: number; id: string; name: string }>();
    for (const account of accounts.data?.items ?? []) counts.set(account.teacherId, { count: 0, id: account.teacherId, name: account.teacherName });
    for (const event of all ?? []) for (const teacher of event.teachers) {
      const entry = counts.get(teacher.userId) ?? { count: 0, id: teacher.userId, name: teacher.displayName };
      counts.set(teacher.userId, { ...entry, count: entry.count + 1 });
    }
    return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [accounts.data, all]);

  // Danh sach rong = tat ca; bo chon 1 muc khi dang «tat ca» -> chon moi muc con lai (chuc nang cua hop kiem).
  const toggle = (setter: typeof setSchoolIds, all: readonly string[]) => (id: string) => setter((current) => {
    const effective = current.length ? current : all;
    const next = effective.includes(id) ? effective.filter((item) => item !== id) : [...effective, id];
    return next.length === all.length || !next.length ? [] : next;
  });
  return {
    anchor, canDelete: Boolean(workspace.data?.permissions.canDelete), catalog: workspace.data?.catalog, conflicts, draftCards, events,
    error: workspace.error, loading: workspace.isPending, mode, range, refetch: () => void workspace.refetch(), repeatUntilOf,
    schoolIds, schoolOptions: schools.data?.items ?? [], setAnchor, setMode, setSchoolIds, shortNames, teacherCounts, teacherIds,
    toggleSchool: toggle(setSchoolIds, (schools.data?.items ?? []).map((school) => school.schoolId)), toggleTeacher: toggle(setTeacherIds, teacherCounts.map((teacher) => teacher.id)), weekStart,
  };
}
