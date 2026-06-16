"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  CenterUpCalendarWorkspace,
  type CenterUpCalendarEvent,
  type CenterUpCalendarLaneSummary,
  type CenterUpCalendarResolvedTone,
  type CenterUpCalendarVisibleRange,
  type CenterUpScheduleCatalog,
  type CenterUpScheduleDraft,
} from "@/components/shared/centerup-calendar-workspace";
import type { MenuItem as CenterupMenuItem } from "@/components/portal/CenterUpLayout";
import {
  createTeachingSchedule,
  loadLcmsTeachingCalendarWorkspace,
  loadTeachingCalendarReferenceCatalog,
  mapScheduleDraftToBulkInput,
  mapTeachingCalendarCatalog,
  mapTeachingCalendarEvents,
  mergeTeachingCalendarCatalog,
  previewTeachingSchedule,
  TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS,
  TEACHING_CALENDAR_WORKSPACE_STALE_TIME_MS,
  workspaceInputKey,
  type TeachingCalendarViewMode,
  type TeachingCalendarWorkspaceInput,
} from "@/features/teaching-calendar/api/teaching-calendar-api";

const lcmsCalendarLanes = ["Lịch theo trường", "Lịch theo giáo viên"];

const schoolTones: CenterUpCalendarResolvedTone[] = [
  { background: "#D3E3FD", border: "#1A73E8", text: "#174EA6" },
  { background: "#CEEAD6", border: "#188038", text: "#137333" },
  { background: "#FAD2CF", border: "#D93025", text: "#B3261E" },
  { background: "#E8DEF8", border: "#9334E6", text: "#7B1FA2" },
  { background: "#FEEFC3", border: "#E37400", text: "#B06000" },
];

const teacherTones: CenterUpCalendarResolvedTone[] = [
  { background: "#E8F2FF", border: "#0B5CAD", text: "#094C91" },
  { background: "#EAF7EF", border: "#167242", text: "#116136" },
  { background: "#FFF2E2", border: "#B06000", text: "#8A4600" },
  { background: "#F3EAFE", border: "#7C3AED", text: "#5B21B6" },
  { background: "#E7F8F8", border: "#0A6B6F", text: "#075D61" },
  { background: "#FFECEC", border: "#D93025", text: "#9A1D13" },
];

const emptyScheduleCatalog: CenterUpScheduleCatalog = {
  assistantTeachers: [],
  classes: [],
  levels: [],
  rooms: [],
  schools: [],
  subjects: [],
  teachers: [],
};

export default function LcmsGoogleCalendarWorkspace({
  activeItem: _activeItem,
}: {
  activeItem: CenterupMenuItem | null;
}) {
  const queryClient = useQueryClient();
  const [visibleRange, setVisibleRange] = useState<CenterUpCalendarVisibleRange>(() => ({
    activeLane: "Tất cả",
    from: "2026-06-01",
    mode: "month",
    selectedScopeId: "",
    selectedScopeLabel: "",
    to: "2026-06-30",
  }));

  const workspaceInput = useMemo<TeachingCalendarWorkspaceInput>(() => ({
    from: visibleRange.from,
    schoolIds: visibleRange.activeLane === lcmsCalendarLanes[0] && visibleRange.selectedScopeId ? [visibleRange.selectedScopeId] : undefined,
    statuses: ["DRAFT", "PUBLISHED"],
    teacherIds: visibleRange.activeLane === lcmsCalendarLanes[1] && visibleRange.selectedScopeId ? [visibleRange.selectedScopeId] : undefined,
    to: visibleRange.to,
    viewMode: mapLcmsLaneToViewMode(visibleRange.activeLane),
  }), [visibleRange.activeLane, visibleRange.from, visibleRange.selectedScopeId, visibleRange.to]);

  const workspaceQueryKey = useMemo(
    () => ["teaching-calendar", "lcms", "workspace", ...workspaceInputKey(workspaceInput)] as const,
    [workspaceInput],
  );

  const workspaceQuery = useQuery({
    gcTime: TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS,
    queryFn: () => loadLcmsTeachingCalendarWorkspace(workspaceInput),
    queryKey: workspaceQueryKey,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: TEACHING_CALENDAR_WORKSPACE_STALE_TIME_MS,
  });

  const referenceCatalogQuery = useQuery({
    gcTime: TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS,
    queryFn: () => loadTeachingCalendarReferenceCatalog("lcms"),
    queryKey: ["teaching-calendar", "lcms", "reference-catalog"],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: TEACHING_CALENDAR_WORKSPACE_STALE_TIME_MS,
  });

  const events = useMemo(() => mapTeachingCalendarEvents(workspaceQuery.data?.events ?? []), [workspaceQuery.data?.events]);
  const apiCatalog = useMemo(
    () => mapTeachingCalendarCatalog(workspaceQuery.data?.catalog, workspaceQuery.data?.filterOptions),
    [workspaceQuery.data?.catalog, workspaceQuery.data?.filterOptions],
  );
  const scheduleCatalog = useMemo(() => {
    const mergedCatalog = mergeTeachingCalendarCatalog(apiCatalog, referenceCatalogQuery.data);
    if (!mergedCatalog || !referenceCatalogQuery.data?.schools.length) return mergedCatalog;
    return {
      ...mergedCatalog,
      schools: referenceCatalogQuery.data.schools,
    };
  }, [apiCatalog, referenceCatalogQuery.data]);
  const [stableScheduleCatalog, setStableScheduleCatalog] = useState<CenterUpScheduleCatalog | undefined>();

  useEffect(() => {
    if (scheduleCatalog) {
      setStableScheduleCatalog(scheduleCatalog);
    }
  }, [scheduleCatalog]);

  const calendarCatalog = scheduleCatalog ?? stableScheduleCatalog ?? emptyScheduleCatalog;
  const canCreateSchedule = workspaceQuery.data?.permissions?.canCreate !== false;
  const createScheduleMutation = useMutation({
    mutationFn: (draft: CenterUpScheduleDraft) => createTeachingSchedule(mapScheduleDraftToBulkInput(draft), "lcms"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teaching-calendar", "lcms"] });
    },
  });
  const previewScheduleMutation = useMutation({
    mutationFn: (draft: CenterUpScheduleDraft) => previewTeachingSchedule(mapScheduleDraftToBulkInput({ ...draft, resolveMode: "REJECT" }), "lcms"),
  });
  const handleVisibleRangeChange = useCallback((nextRange: CenterUpCalendarVisibleRange) => {
    setVisibleRange((current) => (
      current.activeLane === nextRange.activeLane &&
      current.from === nextRange.from &&
      current.mode === nextRange.mode &&
      current.selectedScopeId === nextRange.selectedScopeId &&
      current.selectedScopeLabel === nextRange.selectedScopeLabel &&
      current.to === nextRange.to
        ? current
        : nextRange
    ));
  }, []);

  return (
    <CenterUpCalendarWorkspace
      calendarListTitle="Danh sách trường"
      createButtonLabel="Tạo lịch giảng dạy"
      emptyDayLabel="Không có lịch dạy trong ngày này."
      events={events}
      filterEventsByLane={false}
      filterEventsByScope={false}
      initialDate="2026-06-12"
      initialMode="month"
      isLoading={workspaceQuery.isFetching || referenceCatalogQuery.isFetching || createScheduleMutation.isPending || previewScheduleMutation.isPending}
      lanes={lcmsCalendarLanes}
      monthCountLabel="lịch dạy"
      monthCountOverride={workspaceQuery.data?.events.length}
      onCreateSchedule={async (draft) => {
        await createScheduleMutation.mutateAsync(draft);
      }}
      onPreviewSchedule={(draft) => previewScheduleMutation.mutateAsync(draft)}
      onVisibleRangeChange={handleVisibleRangeChange}
      permissions={workspaceQuery.data?.permissions}
      resolveCalendarListTitle={resolveLcmsCalendarListTitle}
      resolveEventScopeLabel={resolveLcmsEventScopeLabel}
      resolveEventSummaryLabel={resolveLcmsEventSummaryLabel}
      resolveEventTone={resolveLcmsEventTone}
      resolveLaneScopeOptions={(activeLane, laneEvents) => resolveLcmsLaneScopeOptions(activeLane, laneEvents, calendarCatalog)}
      resolveLaneSummaries={(activeLane, laneEvents) => resolveLcmsLaneSummaries(activeLane, laneEvents, calendarCatalog)}
      resolveScopeSelectLabel={resolveLcmsScopeSelectLabel}
      scheduleCatalog={calendarCatalog}
      showCreateButton={canCreateSchedule}
      todayDate="2026-06-13"
    />
  );
}

function mapLcmsLaneToViewMode(activeLane: string): TeachingCalendarViewMode {
  if (activeLane === lcmsCalendarLanes[0]) return "BY_SCHOOL";
  if (activeLane === lcmsCalendarLanes[1]) return "BY_TEACHER";
  return "ALL";
}

function resolveLcmsCalendarListTitle(activeLane: string) {
  if (activeLane === lcmsCalendarLanes[0]) return "Danh sách giáo viên";
  return "Danh sách trường";
}

function resolveLcmsScopeSelectLabel(activeLane: string) {
  if (activeLane === lcmsCalendarLanes[0]) return "Chọn trường";
  if (activeLane === lcmsCalendarLanes[1]) return "Chọn giáo viên";
  return activeLane;
}

function resolveLcmsEventScopeLabel(event: CenterUpCalendarEvent, activeLane: string) {
  if (activeLane === lcmsCalendarLanes[0]) return getEventSchool(event);
  if (activeLane === lcmsCalendarLanes[1]) return getEventTeacher(event);
  return getEventSchool(event);
}

function resolveLcmsEventSummaryLabel(event: CenterUpCalendarEvent, activeLane: string) {
  if (activeLane === lcmsCalendarLanes[0]) return getEventTeacher(event);
  if (activeLane === lcmsCalendarLanes[1]) return getEventSchool(event);
  return getEventSchool(event);
}

function resolveLcmsEventTone(event: CenterUpCalendarEvent, activeLane: string) {
  if (activeLane === lcmsCalendarLanes[0]) return getTeacherTone(getEventTeacher(event));
  return getSchoolTone(getEventSchool(event));
}

function resolveLcmsLaneScopeOptions(activeLane: string, events: CenterUpCalendarEvent[], catalog: CenterUpScheduleCatalog): CenterUpCalendarLaneSummary[] {
  if (activeLane === lcmsCalendarLanes[0]) {
    return buildEntitySummaries(getSchoolLabels(catalog, events), events, getEventSchool, getSchoolTone);
  }

  if (activeLane === lcmsCalendarLanes[1]) {
    return buildEntitySummaries(getTeacherLabels(catalog, events), events, getEventTeacher, getTeacherTone);
  }

  return buildEntitySummaries(getSchoolLabels(catalog, events), events, getEventSchool, getSchoolTone);
}

function resolveLcmsLaneSummaries(activeLane: string, events: CenterUpCalendarEvent[], catalog: CenterUpScheduleCatalog): CenterUpCalendarLaneSummary[] {
  if (activeLane === lcmsCalendarLanes[0]) {
    return buildEntitySummaries(getTeacherLabels(catalog, events), events, getEventTeacher, getTeacherTone);
  }

  return buildEntitySummaries(getSchoolLabels(catalog, events), events, getEventSchool, getSchoolTone);
}

function getSchoolLabels(catalog: CenterUpScheduleCatalog, events: CenterUpCalendarEvent[]) {
  const catalogLabels = catalog.schools.map((school) => ({ id: school.id, label: school.name })).filter((school) => school.label);
  if (catalogLabels.length) return catalogLabels;
  return Array.from(new Set(events.map(getEventSchool))).map((label) => ({ id: label, label }));
}

function getTeacherLabels(catalog: CenterUpScheduleCatalog, events: CenterUpCalendarEvent[]) {
  const catalogTeachers = catalog.teachers ?? [];
  const catalogAssistantTeachers = catalog.assistantTeachers ?? [];
  const teachers = catalogTeachers.length ? catalogTeachers : catalogAssistantTeachers;
  const catalogLabels = teachers.map((teacher) => ({ id: teacher.id, label: teacher.name })).filter((teacher) => teacher.label);
  if (catalogLabels.length) return catalogLabels;
  return Array.from(new Set(events.map(getEventTeacher))).map((label) => ({ id: label, label }));
}

function buildEntitySummaries(
  options: Array<{ id: string; label: string }>,
  events: CenterUpCalendarEvent[],
  resolveLabel: (event: CenterUpCalendarEvent) => string,
  resolveTone: (label: string) => CenterUpCalendarResolvedTone,
) {
  return options.filter((option, index, source) => option.label && source.findIndex((item) => item.id === option.id) === index).map((option) => ({
    color: resolveTone(option.label).border,
    count: events.filter((event) => resolveLabel(event) === option.label).length,
    id: option.id,
    label: option.label,
  }));
}

function getEventSchool(event: CenterUpCalendarEvent) {
  return event.school?.trim() || "Chưa xác định";
}

function getEventTeacher(event: CenterUpCalendarEvent) {
  return event.teacher?.trim() || "Chưa phân công";
}

function getSchoolTone(schoolName = "Chưa xác định") {
  return getStableTone(schoolName, schoolTones);
}

function getTeacherTone(teacherName = "Chưa phân công") {
  return getStableTone(teacherName, teacherTones);
}

function getStableTone(value: string, tones: CenterUpCalendarResolvedTone[]) {
  const hash = Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0);
  return tones[hash % tones.length];
}
