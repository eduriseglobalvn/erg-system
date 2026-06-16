import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import {
  CenterUpCalendarWorkspace,
  type CenterUpCalendarEvent,
  type CenterUpCalendarLaneSummary,
  type CenterUpCalendarResolvedTone,
  type CenterUpCalendarVisibleRange,
  type CenterUpScheduleCatalog,
  type CenterUpScheduleDraft,
} from "@/components/shared/centerup-calendar-workspace";
import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import {
  createTeachingSchedule,
  loadLmsMyTeachingCalendar,
  loadTeachingCalendarReferenceCatalog,
  mapScheduleDraftToBulkInput,
  mapTeachingCalendarCatalog,
  mapTeachingCalendarEvents,
  mergeTeachingCalendarCatalog,
  previewTeachingSchedule,
  TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS,
  TEACHING_CALENDAR_WORKSPACE_STALE_TIME_MS,
  workspaceInputKey,
  type MyTeachingCalendarInput,
  type TeachingCalendarViewMode,
} from "@/features/teaching-calendar/api/teaching-calendar-api";

const lmsCalendarLanes = ["Lịch theo trường", "Lịch theo môn"];

const schoolTones: CenterUpCalendarResolvedTone[] = [
  { background: "#D3E3FD", border: "#1A73E8", text: "#174EA6" },
  { background: "#CEEAD6", border: "#188038", text: "#137333" },
  { background: "#FEEFC3", border: "#E37400", text: "#B06000" },
  { background: "#E8DEF8", border: "#9334E6", text: "#7B1FA2" },
  { background: "#FAD2CF", border: "#D93025", text: "#B3261E" },
];

const classTones: CenterUpCalendarResolvedTone[] = [
  { background: "#E7F8F8", border: "#0A6B6F", text: "#075D61" },
  { background: "#EAF7EF", border: "#167242", text: "#116136" },
  { background: "#FFF2E2", border: "#A35200", text: "#8A4600" },
  { background: "#F3EAFE", border: "#6E42C1", text: "#5933A0" },
  { background: "#FFECEC", border: "#B42318", text: "#9A1D13" },
  { background: "#E8F2FF", border: "#0B5CAD", text: "#094C91" },
];

const subjectTones: CenterUpCalendarResolvedTone[] = [
  { background: "#E8F2FF", border: "#0B5CAD", text: "#094C91" },
  { background: "#EAF7EF", border: "#167242", text: "#116136" },
  { background: "#FFF2E2", border: "#B06000", text: "#8A4600" },
  { background: "#F3EAFE", border: "#7C3AED", text: "#5B21B6" },
  { background: "#E7F8F8", border: "#0A6B6F", text: "#075D61" },
  { background: "#FFECEC", border: "#D93025", text: "#9A1D13" },
];

export function LmsCenterUpCalendarWorkspace({
  isBootstrapLoading = false,
  selectedClass,
  teacherName: _teacherName,
}: {
  isBootstrapLoading?: boolean;
  selectedClass?: ClassroomSnapshot;
  teacherName: string;
}) {
  const queryClient = useQueryClient();
  const [visibleRange, setVisibleRange] = useState<CenterUpCalendarVisibleRange>(() => ({
    activeLane: "Tất cả",
    from: "2026-06-08",
    mode: "week",
    selectedScopeId: "",
    selectedScopeLabel: "",
    to: "2026-06-14",
  }));
  const workspaceInput = useMemo<MyTeachingCalendarInput>(() => ({
    classIds: selectedClass?.id ? [selectedClass.id] : undefined,
    from: visibleRange.from,
    schoolIds: visibleRange.activeLane === lmsCalendarLanes[0] && visibleRange.selectedScopeId ? [visibleRange.selectedScopeId] : selectedClass?.schoolId ? [selectedClass.schoolId] : undefined,
    statuses: ["DRAFT", "PUBLISHED"],
    subjectIds: visibleRange.activeLane === lmsCalendarLanes[1] && visibleRange.selectedScopeId ? [visibleRange.selectedScopeId] : undefined,
    to: visibleRange.to,
    viewMode: mapLmsLaneToViewMode(visibleRange.activeLane),
  }), [selectedClass?.id, selectedClass?.schoolId, visibleRange.activeLane, visibleRange.from, visibleRange.selectedScopeId, visibleRange.to]);
  const workspaceQueryKey = useMemo(
    () => ["teaching-calendar", "lms", "teacher", ...workspaceInputKey(workspaceInput)] as const,
    [workspaceInput],
  );
  const workspaceQuery = useQuery({
    enabled: !isBootstrapLoading,
    gcTime: TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS,
    queryFn: () => loadLmsMyTeachingCalendar(workspaceInput),
    queryKey: workspaceQueryKey,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: TEACHING_CALENDAR_WORKSPACE_STALE_TIME_MS,
  });
  const apiEvents = useMemo(() => mapTeachingCalendarEvents(workspaceQuery.data?.events ?? []), [workspaceQuery.data?.events]);
  const displayedEvents = apiEvents;
  const apiCatalog = useMemo(() => mapTeachingCalendarCatalog(workspaceQuery.data?.catalog, workspaceQuery.data?.filterOptions), [workspaceQuery.data?.catalog, workspaceQuery.data?.filterOptions]);
  const referenceCatalogQuery = useQuery({
    enabled: !isBootstrapLoading,
    queryFn: () => loadTeachingCalendarReferenceCatalog("lms"),
    gcTime: TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS,
    queryKey: ["teaching-calendar", "lms", "reference-catalog"],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: TEACHING_CALENDAR_WORKSPACE_STALE_TIME_MS,
  });
  const scheduleCatalog = useMemo(
    () => {
      const mergedCatalog = mergeTeachingCalendarCatalog(apiCatalog, referenceCatalogQuery.data);
      if (!mergedCatalog || !referenceCatalogQuery.data?.schools.length) return mergedCatalog;
      return {
        ...mergedCatalog,
        schools: referenceCatalogQuery.data.schools,
      };
    },
    [apiCatalog, referenceCatalogQuery.data],
  );
  const [stableScheduleCatalog, setStableScheduleCatalog] = useState<CenterUpScheduleCatalog | undefined>();
  useEffect(() => {
    if (scheduleCatalog) {
      setStableScheduleCatalog(scheduleCatalog);
    }
  }, [scheduleCatalog]);
  const createScheduleCatalog = scheduleCatalog ?? stableScheduleCatalog;
  const canCreateSchedule = workspaceQuery.data?.permissions?.canCreate !== false;
  const createScheduleMutation = useMutation({
    mutationFn: (draft: CenterUpScheduleDraft) => createTeachingSchedule(mapScheduleDraftToBulkInput(draft), "lms"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teaching-calendar", "lms", "teacher"] });
    },
  });
  const previewScheduleMutation = useMutation({
    mutationFn: (draft: CenterUpScheduleDraft) => previewTeachingSchedule(mapScheduleDraftToBulkInput({ ...draft, resolveMode: "REJECT" }), "lms"),
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
      createButtonLabel="Tạo lịch dạy"
      emptyDayLabel="Không có lịch dạy trong ngày này."
      events={displayedEvents}
      filterEventsByLane={false}
      filterEventsByScope={false}
      initialDate="2026-06-12"
      initialMode="week"
      isLoading={isBootstrapLoading || workspaceQuery.isFetching || referenceCatalogQuery.isFetching || createScheduleMutation.isPending || previewScheduleMutation.isPending}
      lanes={lmsCalendarLanes}
      monthCountLabel="lịch dạy"
      monthCountOverride={workspaceQuery.data?.events.length}
      onCreateSchedule={async (draft) => {
        await createScheduleMutation.mutateAsync(draft);
      }}
      onPreviewSchedule={(draft) => previewScheduleMutation.mutateAsync(draft)}
      onVisibleRangeChange={handleVisibleRangeChange}
      permissions={workspaceQuery.data?.permissions}
      resolveCalendarListTitle={resolveLmsCalendarListTitle}
      resolveEventScopeLabel={resolveLmsEventScopeLabel}
      resolveEventSummaryLabel={resolveLmsEventSummaryLabel}
      resolveEventTone={resolveLmsEventTone}
      resolveLaneScopeOptions={(activeLane, events) => resolveLmsLaneScopeOptions(activeLane, events, createScheduleCatalog)}
      resolveLaneSummaries={(activeLane, events) => resolveLmsLaneSummaries(activeLane, events, createScheduleCatalog)}
      resolveScopeSelectLabel={resolveLmsScopeSelectLabel}
      scheduleCatalog={createScheduleCatalog}
      showCreateButton={canCreateSchedule}
      todayDate="2026-06-13"
    />
  );
}

function mapLmsLaneToViewMode(activeLane: string): TeachingCalendarViewMode {
  if (activeLane === lmsCalendarLanes[0]) return "BY_SCHOOL";
  if (activeLane === lmsCalendarLanes[1]) return "BY_SUBJECT";
  return "ALL";
}

function resolveLmsCalendarListTitle(activeLane: string) {
  if (activeLane === lmsCalendarLanes[0]) return "Danh sách môn";
  if (activeLane === lmsCalendarLanes[1]) return "Danh sách lớp";
  return "Danh sách trường";
}

function resolveLmsScopeSelectLabel(activeLane: string) {
  if (activeLane === lmsCalendarLanes[0]) return "Chọn trường";
  if (activeLane === lmsCalendarLanes[1]) return "Chọn môn";
  return activeLane;
}

function resolveLmsEventScopeLabel(event: CenterUpCalendarEvent, activeLane: string) {
  if (activeLane === lmsCalendarLanes[0]) return getEventSchool(event);
  if (activeLane === lmsCalendarLanes[1]) return getEventSubject(event);
  return getEventSchool(event);
}

function resolveLmsEventTone(event: CenterUpCalendarEvent, activeLane: string) {
  if (activeLane === lmsCalendarLanes[0]) return getSubjectTone(getEventSubject(event));
  if (activeLane === lmsCalendarLanes[1]) return getClassTone(getEventClassName(event));
  return getSchoolTone(getEventSchool(event));
}

function resolveLmsEventSummaryLabel(event: CenterUpCalendarEvent, activeLane: string) {
  if (activeLane === lmsCalendarLanes[0]) return getEventSubject(event);
  if (activeLane === lmsCalendarLanes[1]) return getEventClassName(event);
  return getEventSchool(event);
}

function resolveLmsLaneScopeOptions(activeLane: string, events: CenterUpCalendarEvent[], catalog?: CenterUpScheduleCatalog): CenterUpCalendarLaneSummary[] {
  if (activeLane === lmsCalendarLanes[0]) {
    return buildEntitySummaries(
      getSchoolLabels(catalog, events),
      events,
      getEventSchool,
      getSchoolTone,
    );
  }

  if (activeLane === lmsCalendarLanes[1]) {
    return buildEntitySummaries(
      getSubjectLabels(catalog, events),
      events,
      getEventSubject,
      getSubjectTone,
    );
  }

  return buildEntitySummaries(
    getSchoolLabels(catalog, events),
    events,
    getEventSchool,
    getSchoolTone,
  );
}

function resolveLmsLaneSummaries(activeLane: string, events: CenterUpCalendarEvent[], catalog?: CenterUpScheduleCatalog): CenterUpCalendarLaneSummary[] {
  if (activeLane === lmsCalendarLanes[0]) {
    return buildEntitySummaries(
      getSubjectLabels(catalog, events),
      events,
      getEventSubject,
      getSubjectTone,
    );
  }

  if (activeLane === lmsCalendarLanes[1]) {
    return buildEntitySummaries(
      getClassLabels(catalog, events),
      events,
      getEventClassName,
      getClassTone,
    );
  }

  return buildEntitySummaries(
    getSchoolLabels(catalog, events),
    events,
    getEventSchool,
    getSchoolTone,
  );
}

function getSchoolLabels(catalog: CenterUpScheduleCatalog | undefined, events: CenterUpCalendarEvent[]) {
  const catalogLabels = catalog?.schools.map((school) => ({ id: school.id, label: school.name })).filter((school) => school.label) ?? [];
  if (catalogLabels.length) return catalogLabels;
  return Array.from(new Set(events.map(getEventSchool))).map((label) => ({ id: label, label }));
}

function getSubjectLabels(catalog: CenterUpScheduleCatalog | undefined, events: CenterUpCalendarEvent[]) {
  const catalogLabels = (catalog?.subjects ?? []).map((subject) => ({ id: getOptionId(subject), label: optionLabel(subject) })).filter((subject) => subject.label);
  if (catalogLabels.length) return catalogLabels;
  return Array.from(new Set(events.map(getEventSubject))).map((label) => ({ id: label, label }));
}

function getClassLabels(catalog: CenterUpScheduleCatalog | undefined, events: CenterUpCalendarEvent[]) {
  const catalogLabels = catalog?.classes.map((classroom) => ({ id: classroom.id, label: classroom.name })).filter((classroom) => classroom.label) ?? [];
  if (catalogLabels.length) return catalogLabels;
  return Array.from(new Set(events.map(getEventClassName))).map((label) => ({ id: label, label }));
}

function optionLabel(option: string | { name: string }) {
  return typeof option === "string" ? option : option.name;
}

function getOptionId(option: string | { id: string; name: string }) {
  return typeof option === "string" ? option : option.id;
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

function getEventClassName(event: CenterUpCalendarEvent) {
  return event.className?.trim() || "Chưa có lớp";
}

function getEventSubject(event: CenterUpCalendarEvent) {
  return event.subject?.trim() || event.title.trim() || "Chưa có môn";
}

function getSchoolTone(schoolName = "Chưa xác định") {
  return getStableTone(schoolName, schoolTones);
}

function getClassTone(className = "Chưa có lớp") {
  return getStableTone(className, classTones);
}

function getSubjectTone(subjectName = "Chưa có môn") {
  return getStableTone(subjectName, subjectTones);
}

function getStableTone(value: string, tones: CenterUpCalendarResolvedTone[]) {
  const hash = Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0);
  return tones[hash % tones.length];
}
