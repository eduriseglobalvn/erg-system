import { keepPreviousData, useInfiniteQuery, useQuery, type InfiniteData } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { loadTeachingOverviewGrid, type TeachingOverviewSchoolPage, loadTeachingOverviewSchools, loadTeachingOverviewTeachers, loadTeachingScheduleLoadSettings } from "@/features/teaching-calendar/api/teaching-calendar-overview-api";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-query-keys";
import { loadLcmsTeachingCalendarWorkspace } from "@/features/teaching-calendar/api/teaching-calendar-workspace-query-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { MAX_COMPARED_SCHOOLS } from "@/features/teaching-calendar/domain/overview-model";
import { addDaysToDate } from "@/features/teaching-calendar/domain/schedule-copy";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { adminPath } from "@/platform/workspaces/workspace-paths";
import type { OverviewParams } from "./use-overview-params";

export const OVERVIEW_PAGE_SIZE = 50;

/** Du lieu cua 2 tab bang tong. Tab khong dung thi query tat (`enabled`). */
export function useOverviewData(params: OverviewParams) {
  const tenantId = getDefaultTenantId();
  const navigate = useNavigate();
  const [teacherPage, setTeacherPage] = useState(0);
  const { q, quick, sort, tab, week } = params;
  const schoolsTab = tab === "schools";

  const schoolPages = useInfiniteQuery<TeachingOverviewSchoolPage, Error, InfiniteData<TeachingOverviewSchoolPage, number>, readonly unknown[], number>({
    enabled: schoolsTab,
    getNextPageParam: (last, pages, lastParam) => (pages.reduce((sum, page) => sum + page.items.length, 0) < last.total ? lastParam + 1 : undefined),
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => loadTeachingOverviewSchools({ page: pageParam, quick: quick || undefined, search: q || undefined, size: OVERVIEW_PAGE_SIZE, weekStart: week }, signal),
    queryKey: teachingCalendarQueryKeys.overview(tenantId, "schools", { q, quick, week }),
  });
  const schoolItems = useMemo(() => schoolPages.data?.pages.flatMap((page) => page.items) ?? [], [schoolPages.data]);
  const selected = params.schools.length ? params.schools.slice(0, MAX_COMPARED_SCHOOLS) : schoolItems.slice(0, 2).map((school) => school.schoolId);
  const grid = useQuery({
    enabled: schoolsTab && selected.length > 0,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => loadTeachingOverviewGrid({ schoolIds: selected, weekStart: week }, signal),
    queryKey: teachingCalendarQueryKeys.overview(tenantId, "grid", { schoolIds: selected, weekStart: week }),
  });

  const teachers = useQuery({
    enabled: !schoolsTab,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => loadTeachingOverviewTeachers({ page: teacherPage, quick: quick || undefined, search: q || undefined, size: OVERVIEW_PAGE_SIZE, sort, weekStart: week }, signal),
    queryKey: teachingCalendarQueryKeys.overview(tenantId, "teachers", { page: teacherPage, q, quick, sort, week }),
  });
  const settings = useQuery({
    enabled: !schoolsTab,
    queryFn: ({ signal }) => loadTeachingScheduleLoadSettings(signal),
    queryKey: teachingCalendarQueryKeys.loadSettings(tenantId),
    staleTime: 5 * 60_000,
  });
  const schoolFilter = schoolsTab ? selected : undefined;
  const workspaceInput = { from: week, schoolIds: schoolFilter, statuses: ["DRAFT", "PUBLISHED"] as Array<"DRAFT" | "PUBLISHED">, tenantId, to: addDaysToDate(week, 7) };
  const workspace = useQuery({
    enabled: schoolsTab ? selected.length > 0 : true,
    queryFn: ({ signal }) => loadLcmsTeachingCalendarWorkspace(workspaceInput, signal),
    queryKey: teachingCalendarQueryKeys.workspace("lcms", "overview", workspaceInput),
    staleTime: 60_000,
  });
  const eventsById = useMemo(() => new Map<string, TeachingCalendarEvent>((workspace.data?.events ?? []).map((event) => [event.id, event])), [workspace.data]);

  /** Bam doi o / slot: mo trang xep cua dot chua tiet, focus o; o trong thi mo trang xep tuan do cua truong. */
  const openSchedule = (event: TeachingCalendarEvent | undefined, fallback: { date: string; intent?: "edit" | "teacher"; periodNo: number; schoolId?: string }) => {
    const focus = `focus=${event?.date ?? fallback.date}:${event?.periodStart ?? fallback.periodNo}&intent=${fallback.intent ?? "edit"}`;
    const target = event?.batchId ? `batchId=${event.batchId}&${focus}` : `${fallback.schoolId ? `schoolId=${fallback.schoolId}&` : ""}week=${week}&${focus}`;
    void navigate({ href: `${adminPath("/calendar/schedule")}?${target}` });
  };

  return {
    eventsById, grid, loadSettings: settings.data, openSchedule, selected,
    schools: { fetchNext: () => void schoolPages.fetchNextPage(), hasMore: Boolean(schoolPages.hasNextPage), items: schoolItems, query: schoolPages, quickCounts: schoolPages.data?.pages[0]?.quickCounts, total: schoolPages.data?.pages[0]?.total ?? 0 },
    setTeacherPage, teacherPage, teachers,
  };
}
