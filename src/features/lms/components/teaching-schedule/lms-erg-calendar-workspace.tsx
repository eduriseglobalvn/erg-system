import { useCallback, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { ErgButton } from "@/components/erg-mui/erg-actions";

import {
  ErgCalendarWorkspace,
  type ErgCalendarEvent,
  type ErgCalendarLaneSummary,
  type ErgCalendarResolvedTone,
  type ErgCalendarVisibleRange,
  type ErgScheduleCatalog,
} from "@/components/shared/erg-calendar-workspace";
import type { ClassroomSnapshot } from "@/domain/school/classroom-types";
import {
  loadLmsMyTeachingCalendar,
  loadTeachingCalendarReferenceCatalog,
  mapTeachingCalendarCatalog,
  mapTeachingCalendarEvents,
  mergeTeachingCalendarCatalog,
  teachingCalendarQueryKeys,
  TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS,
  TEACHING_CALENDAR_WORKSPACE_STALE_TIME_MS,
  type MyTeachingCalendarInput,
  type TeachingCalendarViewMode,
} from "@/features/teaching-calendar/api/teaching-calendar-api";
import { createInitialCalendarRange } from "@/domain/calendar/calendar-date-range";
import { formatDateVi, todayInput } from "@/domain/formatters/format-date";
import { ScheduleNoticeBanner, TeacherDayTabs, TeacherRoleToggle, TeacherSidePanel } from "@/features/teaching-calendar/components/teacher/teacher-calendar-extras";
import { useScheduleNotice } from "@/features/teaching-calendar/components/teacher/use-schedule-notice";
import { buildIcs, icsFileName } from "@/features/teaching-calendar/domain/ics";
import { addDaysToDate, dayLabel, weekStartOf } from "@/features/teaching-calendar/domain/schedule-copy";
import { decorateTeacherEvents, filterByRole, parseRoleFilter, roleCounts, type TeacherRoleFilter } from "@/features/teaching-calendar/domain/teacher-events";
import { useLmsMobileBreakpoint } from "@/features/lms/mobile";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";

const TEACHER_CALENDAR_STALE_TIME_MS = 60_000;

const lmsCalendarLanes = ["Lịch theo trường", "Lịch theo môn"];

const schoolTones: ErgCalendarResolvedTone[] = [
  { background: "#D3E3FD", border: "#1A73E8", text: "#174EA6" },
  { background: "#CEEAD6", border: "#188038", text: "#137333" },
  { background: "#FEEFC3", border: "#E37400", text: "#B06000" },
  { background: "#E8DEF8", border: "#9334E6", text: "#7B1FA2" },
  { background: "#FAD2CF", border: "#D93025", text: "#B3261E" },
];

const classTones: ErgCalendarResolvedTone[] = [
  { background: "#E7F8F8", border: "#0A6B6F", text: "#075D61" },
  { background: "#EAF7EF", border: "#167242", text: "#116136" },
  { background: "#FFF2E2", border: "#A35200", text: "#8A4600" },
  { background: "#F3EAFE", border: "#6E42C1", text: "#5933A0" },
  { background: "#FFECEC", border: "#B42318", text: "#9A1D13" },
  { background: "#E8F2FF", border: "#0B5CAD", text: "#094C91" },
];

const subjectTones: ErgCalendarResolvedTone[] = [
  { background: "#E8F2FF", border: "#0B5CAD", text: "#094C91" },
  { background: "#EAF7EF", border: "#167242", text: "#116136" },
  { background: "#FFF2E2", border: "#B06000", text: "#8A4600" },
  { background: "#F3EAFE", border: "#7C3AED", text: "#5B21B6" },
  { background: "#E7F8F8", border: "#0A6B6F", text: "#075D61" },
  { background: "#FFECEC", border: "#D93025", text: "#9A1D13" },
];

export function LmsErgCalendarWorkspace({
  isBootstrapLoading = false,
  selectedClass,
  teacherName: _teacherName,
}: {
  isBootstrapLoading?: boolean;
  selectedClass?: ClassroomSnapshot;
  teacherName: string;
}) {
  const { session } = useAuthSession("lms");
  const isMobile = useLmsMobileBreakpoint();
  const tenantId = session?.tenantId ?? "";
  const [initialRange] = useState(() => createInitialCalendarRange(isMobile ? "month" : "week"));
  const [visibleRange, setVisibleRange] = useState<ErgCalendarVisibleRange>(() => ({
    activeLane: "Tất cả",
    from: initialRange.from,
    mode: isMobile ? "schedule" : "week",
    selectedScopeId: "",
    selectedScopeLabel: "",
    to: initialRange.to,
  }));
  const workspaceInput = useMemo<MyTeachingCalendarInput>(() => createLmsCalendarWorkspaceInput({
    selectedClass,
    tenantId,
    visibleRange,
  }), [selectedClass, tenantId, visibleRange]);
  const workspaceQueryKey = useMemo(
    () => teachingCalendarQueryKeys.workspace("lms", "teacher", workspaceInput),
    [workspaceInput],
  );
  const workspaceQuery = useQuery({
    enabled: !isBootstrapLoading && Boolean(tenantId),
    gcTime: TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS,
    queryFn: ({ signal }) => loadLmsMyTeachingCalendar(workspaceInput, signal),
    queryKey: workspaceQueryKey,
    refetchOnReconnect: false,
    // FE-6 (6.10): lich vua xuat ban phai hien ngay, nen 60 s va refetch khi quay lai tab (push cung invalidate).
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: TEACHER_CALENDAR_STALE_TIME_MS,
  });
  const navigate = useNavigate();
  const notice = useScheduleNotice(!isBootstrapLoading && Boolean(tenantId));
  const role = parseRoleFilter(new URLSearchParams(useLocation().searchStr).get("role"));
  const rawEvents = workspaceQuery.data?.events;
  const counts = useMemo(() => roleCounts(rawEvents ?? []), [rawEvents]);
  const visibleRaw = useMemo(() => filterByRole(rawEvents ?? [], counts.assistant ? role : "all"), [counts.assistant, rawEvents, role]);
  const displayedEvents = useMemo(
    () => decorateTeacherEvents(visibleRaw, mapTeachingCalendarEvents(visibleRaw), notice.newBatchIds),
    [notice.newBatchIds, visibleRaw],
  );
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const shownEvents = useMemo(() => (isMobile && pickedDay ? displayedEvents.filter((event) => event.date === pickedDay) : displayedEvents), [displayedEvents, isMobile, pickedDay]);
  const setRole = (next: TeacherRoleFilter) => {
    const params = new URLSearchParams(window.location.search);
    if (next === "all") params.delete("role"); else params.set("role", next);
    const query = params.toString();
    void navigate({ href: `${window.location.pathname}${query ? `?${query}` : ""}`, replace: true });
  };
  const exportIcs = async () => {
    try {
      const from = todayInput();
      const data = await loadLmsMyTeachingCalendar({ from, statuses: ["PUBLISHED"], tenantId, to: addDaysToDate(from, 70) });
      const ics = buildIcs(data.events.map((event) => ({
        date: event.date, description: event.myRole === "ASSISTANT" ? `Trợ giảng cho ${event.mainTeacherName ?? ""}`.trim() : undefined, endTime: event.endTime, id: event.id,
        location: [event.roomName, event.schoolName].filter(Boolean).join(", "), startTime: event.startTime,
        summary: `${event.className} · Tiết ${event.periodStart}${event.myRole === "ASSISTANT" ? " · Trợ giảng" : ""}`,
      })));
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
      link.download = icsFileName(formatDateVi(from));
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      toast.error("Chưa tạo được file lịch. Thử lại sau.");
    }
  };
  const apiCatalog = useMemo(() => mapTeachingCalendarCatalog(workspaceQuery.data?.catalog, workspaceQuery.data?.filterOptions), [workspaceQuery.data?.catalog, workspaceQuery.data?.filterOptions]);
  const referenceCatalogQuery = useQuery({
    enabled: !isBootstrapLoading && Boolean(tenantId),
    queryFn: ({ signal }) => loadTeachingCalendarReferenceCatalog("lms", signal),
    gcTime: TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS,
    queryKey: teachingCalendarQueryKeys.referenceCatalog("lms", tenantId),
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
  // Giu danh muc da thay khi query dang nap lai: dieu chinh state ngay trong render (khong dung effect).
  const [stableScheduleCatalog, setStableScheduleCatalog] = useState<ErgScheduleCatalog | undefined>();
  const [seenScheduleCatalog, setSeenScheduleCatalog] = useState<ErgScheduleCatalog | undefined>();
  if (scheduleCatalog && scheduleCatalog !== seenScheduleCatalog) {
    setSeenScheduleCatalog(scheduleCatalog);
    setStableScheduleCatalog(mergeTeachingCalendarCatalog(scheduleCatalog, stableScheduleCatalog));
  }
  const createScheduleCatalog = useMemo(
    () => mergeTeachingCalendarCatalog(scheduleCatalog, stableScheduleCatalog),
    [scheduleCatalog, stableScheduleCatalog],
  );
  const handleVisibleRangeChange = useCallback((nextRange: ErgCalendarVisibleRange) => {
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

  const host = (
    <ErgCalendarWorkspace
      createButtonLabel="Tạo lịch dạy"
      emptyDayLabel="Không có lịch dạy trong ngày này."
      events={shownEvents}
      filterEventsByLane={false}
      filterEventsByScope={false}
      errorMessage={workspaceQuery.error instanceof Error ? workspaceQuery.error.message : referenceCatalogQuery.error instanceof Error ? referenceCatalogQuery.error.message : undefined}
      initialDate={initialRange.initialDate}
      initialMode={isMobile ? "schedule" : "week"}
      isLoading={isBootstrapLoading || workspaceQuery.isLoading || referenceCatalogQuery.isLoading}
      lanes={lmsCalendarLanes}
      mobileLayout={isMobile}
      monthCountLabel="lịch dạy"
      monthCountOverride={workspaceQuery.data?.events.length}
      onRetry={() => void Promise.all([workspaceQuery.refetch(), referenceCatalogQuery.refetch()])}
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
      showCreateButton={false}
      todayDate={initialRange.initialDate}
    />
  );

  return (
    <Stack spacing={1.5}>
      {isMobile ? <Typography sx={{ color: "text.secondary", typography: "caption" }}>{dayLabel(initialRange.initialDate)}/{initialRange.initialDate.slice(0, 4)}</Typography> : null}
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography component="h1" variant="h1">{isMobile ? "Lịch dạy" : "Lịch dạy của tôi"}</Typography>
        {isMobile ? null : <ErgButton onClick={() => void exportIcs()} variant="outlined">Thêm vào lịch điện thoại</ErgButton>}
      </Stack>
      <ScheduleNoticeBanner compact={isMobile} notice={notice.latest} onSeen={notice.markSeen} others={notice.others} />
      {isMobile ? <TeacherDayTabs events={visibleRaw} onSelect={setPickedDay} selected={pickedDay} weekStart={weekStartOf(initialRange.initialDate)} /> : null}
      <TeacherRoleToggle counts={counts} onChange={setRole} value={role} />
      <Stack direction={{ md: "row", xs: "column" }} spacing={2} sx={{ alignItems: "flex-start" }}>
        <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>{host}</Box>
        {isMobile ? null : <TeacherSidePanel events={visibleRaw} />}
      </Stack>
    </Stack>
  );
}

export function createLmsCalendarWorkspaceInput({
  selectedClass,
  tenantId,
  visibleRange,
}: {
  selectedClass?: Pick<ClassroomSnapshot, "id" | "schoolId">;
  tenantId: string;
  visibleRange: ErgCalendarVisibleRange;
}): MyTeachingCalendarInput {
  const viewMode = mapLmsLaneToViewMode(visibleRange.activeLane);
  const isAggregateView = viewMode === "ALL";

  return {
    classIds: isAggregateView && selectedClass?.id ? [selectedClass.id] : undefined,
    from: visibleRange.from,
    schoolIds: viewMode === "BY_SCHOOL"
      ? visibleRange.selectedScopeId ? [visibleRange.selectedScopeId] : undefined
      : isAggregateView && selectedClass?.schoolId ? [selectedClass.schoolId] : undefined,
    statuses: ["PUBLISHED"],
    subjectIds: viewMode === "BY_SUBJECT" && visibleRange.selectedScopeId
      ? [visibleRange.selectedScopeId]
      : undefined,
    tenantId,
    to: visibleRange.to,
    viewMode,
  };
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

function resolveLmsEventScopeLabel(event: ErgCalendarEvent, activeLane: string) {
  if (activeLane === lmsCalendarLanes[0]) return getEventSchool(event);
  if (activeLane === lmsCalendarLanes[1]) return getEventSubject(event);
  return getEventSchool(event);
}

function resolveLmsEventTone(event: ErgCalendarEvent, activeLane: string) {
  if (activeLane === lmsCalendarLanes[0]) return getSubjectTone(getEventSubject(event));
  if (activeLane === lmsCalendarLanes[1]) return getClassTone(getEventClassName(event));
  return getSchoolTone(getEventSchool(event));
}

function resolveLmsEventSummaryLabel(event: ErgCalendarEvent, activeLane: string) {
  if (activeLane === lmsCalendarLanes[0]) return getEventSubject(event);
  if (activeLane === lmsCalendarLanes[1]) return getEventClassName(event);
  return getEventSchool(event);
}

function resolveLmsLaneScopeOptions(activeLane: string, events: ErgCalendarEvent[], catalog?: ErgScheduleCatalog): ErgCalendarLaneSummary[] {
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

function resolveLmsLaneSummaries(activeLane: string, events: ErgCalendarEvent[], catalog?: ErgScheduleCatalog): ErgCalendarLaneSummary[] {
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

function getSchoolLabels(catalog: ErgScheduleCatalog | undefined, events: ErgCalendarEvent[]) {
  const catalogLabels = catalog?.schools.map((school) => ({ id: school.id, label: school.name })).filter((school) => school.label) ?? [];
  if (catalogLabels.length) return catalogLabels;
  return Array.from(new Set(events.map(getEventSchool))).map((label) => ({ id: label, label }));
}

function getSubjectLabels(catalog: ErgScheduleCatalog | undefined, events: ErgCalendarEvent[]) {
  const catalogLabels = (catalog?.subjects ?? []).map((subject) => ({ id: getOptionId(subject), label: optionLabel(subject) })).filter((subject) => subject.label);
  if (catalogLabels.length) return catalogLabels;
  return Array.from(new Set(events.map(getEventSubject))).map((label) => ({ id: label, label }));
}

function getClassLabels(catalog: ErgScheduleCatalog | undefined, events: ErgCalendarEvent[]) {
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
  events: ErgCalendarEvent[],
  resolveLabel: (event: ErgCalendarEvent) => string,
  resolveTone: (label: string) => ErgCalendarResolvedTone,
) {
  return options.filter((option, index, source) => option.label && source.findIndex((item) => item.id === option.id) === index).map((option) => ({
    color: resolveTone(option.label).border,
    count: events.filter((event) => resolveLabel(event) === option.label).length,
    id: option.id,
    label: option.label,
  }));
}

function getEventSchool(event: ErgCalendarEvent) {
  return event.school?.trim() || "Chưa xác định";
}

function getEventClassName(event: ErgCalendarEvent) {
  return event.className?.trim() || "Chưa có lớp";
}

function getEventSubject(event: ErgCalendarEvent) {
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

function getStableTone(value: string, tones: ErgCalendarResolvedTone[]) {
  const hash = Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0);
  return tones[hash % tones.length];
}
