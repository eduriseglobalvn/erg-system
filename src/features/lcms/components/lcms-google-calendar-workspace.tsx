"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Stack from "@mui/material/Stack";

import {
  ErgCalendarWorkspace,
  type ErgCalendarEvent,
  type ErgCalendarLaneSummary,
  type ErgCalendarResolvedTone,
  type ErgCalendarVisibleRange,
  type ErgScheduleCatalog,
  type ErgScheduleDraft,
} from "@/components/shared/erg-calendar-workspace";
import type { MenuItem as ErgMenuItem } from "@/components/portal/ErgPortalLayout";
import {
  createTeachingSchedule,
  createTeachingScheduleRoom,
  deleteTeachingScheduleEvent,
  deleteTeacherSchedule,
  loadLcmsTeachingCalendarWorkspace,
  loadTeachingCalendarReferenceCatalog,
  mapScheduleDraftToBulkInput,
  mapTeachingCalendarCatalog,
  mapTeachingCalendarEvents,
  mergeTeachingCalendarCatalog,
  previewTeachingSchedule,
  publishTeachingScheduleBatch,
  teachingCalendarQueryKeys,
  TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS,
  TEACHING_CALENDAR_WORKSPACE_STALE_TIME_MS,
  type TeachingCalendarViewMode,
  type TeachingCalendarWorkspaceInput,
  updateTeachingScheduleEvent,
} from "@/features/teaching-calendar/api/teaching-calendar-api";
import { createInitialCalendarRange } from "@/features/teaching-calendar/components/calendar-date-range";
import { TeachingCalendarEventActions } from "@/features/teaching-calendar/components/teaching-calendar-event-actions";
import { DeleteTeacherScheduleDialog } from "@/features/teaching-calendar/components/delete-teacher-schedule-dialog";
import { TeachingScheduleBatchPanel } from "@/features/teaching-calendar/components/teaching-schedule-batch-panel";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";

const lcmsCalendarLanes = ["Lịch theo trường", "Lịch theo giáo viên"];

const schoolTones: ErgCalendarResolvedTone[] = [
  { background: "#D3E3FD", border: "#1A73E8", text: "#174EA6" },
  { background: "#CEEAD6", border: "#188038", text: "#137333" },
  { background: "#FAD2CF", border: "#D93025", text: "#B3261E" },
  { background: "#E8DEF8", border: "#9334E6", text: "#7B1FA2" },
  { background: "#FEEFC3", border: "#E37400", text: "#B06000" },
];

const teacherTones: ErgCalendarResolvedTone[] = [
  { background: "#E8F2FF", border: "#0B5CAD", text: "#094C91" },
  { background: "#EAF7EF", border: "#167242", text: "#116136" },
  { background: "#FFF2E2", border: "#B06000", text: "#8A4600" },
  { background: "#F3EAFE", border: "#7C3AED", text: "#5B21B6" },
  { background: "#E7F8F8", border: "#0A6B6F", text: "#075D61" },
  { background: "#FFECEC", border: "#D93025", text: "#9A1D13" },
];

const emptyScheduleCatalog: ErgScheduleCatalog = {
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
  activeItem: ErgMenuItem | null;
}) {
  const queryClient = useQueryClient();
  const { session } = useAuthSession("lcms");
  const tenantId = session?.tenantId ?? "";
  const [initialRange] = useState(() => createInitialCalendarRange("month"));
  const [visibleRange, setVisibleRange] = useState<ErgCalendarVisibleRange>(() => ({
    activeLane: "Táº¥t cáº£",
    from: initialRange.from,
    mode: "month",
    selectedScopeId: "",
    selectedScopeLabel: "",
    to: initialRange.to,
  }));

  const workspaceInput = useMemo<TeachingCalendarWorkspaceInput>(() => ({
    from: visibleRange.from,
    schoolIds: visibleRange.activeLane === lcmsCalendarLanes[0] && visibleRange.selectedScopeId ? [visibleRange.selectedScopeId] : undefined,
    statuses: ["DRAFT", "PUBLISHED"],
    teacherIds: visibleRange.activeLane === lcmsCalendarLanes[1] && visibleRange.selectedScopeId ? [visibleRange.selectedScopeId] : undefined,
    tenantId,
    to: visibleRange.to,
    viewMode: mapLcmsLaneToViewMode(visibleRange.activeLane),
  }), [tenantId, visibleRange.activeLane, visibleRange.from, visibleRange.selectedScopeId, visibleRange.to]);

  const workspaceQueryKey = useMemo(
    () => teachingCalendarQueryKeys.workspace("lcms", "workspace", workspaceInput),
    [workspaceInput],
  );

  const workspaceQuery = useQuery({
    enabled: Boolean(tenantId),
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
    enabled: Boolean(tenantId),
    gcTime: TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS,
    queryFn: () => loadTeachingCalendarReferenceCatalog("lcms"),
    queryKey: teachingCalendarQueryKeys.referenceCatalog("lcms", tenantId),
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
  const [stableScheduleCatalog, setStableScheduleCatalog] = useState<ErgScheduleCatalog | undefined>();

  useEffect(() => {
    if (scheduleCatalog) {
      setStableScheduleCatalog(scheduleCatalog);
    }
  }, [scheduleCatalog]);

  const calendarCatalog = scheduleCatalog ?? stableScheduleCatalog ?? emptyScheduleCatalog;
  const canCreateSchedule = workspaceQuery.data?.permissions?.canCreate === true;
  const createScheduleMutation = useMutation({
    mutationFn: (draft: ErgScheduleDraft) => createTeachingSchedule(mapScheduleDraftToBulkInput(draft, { tenantId }), "lcms"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
    },
  });
  const createRoomMutation = useMutation({
    mutationFn: (input: { roomName: string; schoolId: string }) => createTeachingScheduleRoom({ ...input, tenantId }, "lcms"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
    },
  });
  const previewScheduleMutation = useMutation({
    mutationFn: (draft: ErgScheduleDraft) => previewTeachingSchedule(mapScheduleDraftToBulkInput({ ...draft, resolveMode: "REJECT" }, { tenantId }), "lcms"),
  });
  const publishScheduleMutation = useMutation({
    mutationFn: (batchId: string) => publishTeachingScheduleBatch(batchId, tenantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
    },
  });
  const updateEventMutation = useMutation({
    mutationFn: ({ event, update }: { event: ErgCalendarEvent; update: { note?: string; roomId?: string; roomName?: string } }) =>
      updateTeachingScheduleEvent({ eventId: event.id, tenantId, ...update }, "lcms"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
    },
  });
  const deleteEventMutation = useMutation({
    mutationFn: (event: ErgCalendarEvent) => deleteTeachingScheduleEvent({ eventId: event.id, tenantId }, "lcms"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
    },
  });
  const deleteTeacherScheduleMutation = useMutation({
    mutationFn: (input: { dateFrom?: string; dateTo?: string; schoolIds?: string[]; teacherUserId: string }) =>
      deleteTeacherSchedule({ ...input, tenantId }, "lcms"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lcms", tenantId) });
    },
  });
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

  return (
    <Stack spacing={2}>
      <TeachingScheduleBatchPanel permissions={workspaceQuery.data?.permissions} tenantId={tenantId} />
      {workspaceQuery.data?.permissions?.canDelete ? (
        <DeleteTeacherScheduleDialog
          onDelete={(input) => deleteTeacherScheduleMutation.mutateAsync(input)}
          schools={calendarCatalog.schools}
          teachers={calendarCatalog.teachers}
        />
      ) : null}
      <ErgCalendarWorkspace
      calendarListTitle="Danh sách trường"
      createButtonLabel="Tạo lịch giảng dạy"
      emptyDayLabel="Không có lịch dạy trong ngày này."
      events={events}
      filterEventsByLane={false}
      filterEventsByScope={false}
      errorMessage={workspaceQuery.error instanceof Error ? workspaceQuery.error.message : referenceCatalogQuery.error instanceof Error ? referenceCatalogQuery.error.message : undefined}
      initialDate={initialRange.initialDate}
      initialMode="month"
      isLoading={!tenantId || workspaceQuery.isPending || referenceCatalogQuery.isPending || createScheduleMutation.isPending || previewScheduleMutation.isPending || publishScheduleMutation.isPending}
      lanes={lcmsCalendarLanes}
      monthCountLabel="lịch dạy"
      monthCountOverride={workspaceQuery.data?.events.length}
      onCreateSchedule={async (draft) => {
        return createScheduleMutation.mutateAsync(draft);
      }}
      onCreateRoom={(input) => createRoomMutation.mutateAsync(input)}
      onPublishScheduleBatch={async (batchId) => {
        await publishScheduleMutation.mutateAsync(batchId);
      }}
      onPreviewSchedule={(draft) => previewScheduleMutation.mutateAsync(draft)}
      onRetry={() => void Promise.all([workspaceQuery.refetch(), referenceCatalogQuery.refetch()])}
      onVisibleRangeChange={handleVisibleRangeChange}
      permissions={workspaceQuery.data?.permissions}
      renderEventActions={(event) => (
        <TeachingCalendarEventActions
          event={event}
          onDelete={(selectedEvent) => deleteEventMutation.mutateAsync(selectedEvent).then(() => undefined)}
          onUpdate={(selectedEvent, update) => updateEventMutation.mutateAsync({ event: selectedEvent, update }).then(() => undefined)}
          permissions={workspaceQuery.data?.permissions}
        />
      )}
      resolveCalendarListTitle={resolveLcmsCalendarListTitle}
      resolveEventScopeLabel={resolveLcmsEventScopeLabel}
      resolveEventSummaryLabel={resolveLcmsEventSummaryLabel}
      resolveEventTone={resolveLcmsEventTone}
      resolveLaneScopeOptions={(activeLane, laneEvents) => resolveLcmsLaneScopeOptions(activeLane, laneEvents, calendarCatalog)}
      resolveLaneSummaries={(activeLane, laneEvents) => resolveLcmsLaneSummaries(activeLane, laneEvents, calendarCatalog)}
      resolveScopeSelectLabel={resolveLcmsScopeSelectLabel}
      scheduleCatalog={calendarCatalog}
      showCreateButton={canCreateSchedule}
      todayDate={initialRange.initialDate}
      />
    </Stack>
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

function resolveLcmsEventScopeLabel(event: ErgCalendarEvent, activeLane: string) {
  if (activeLane === lcmsCalendarLanes[0]) return getEventSchool(event);
  if (activeLane === lcmsCalendarLanes[1]) return getEventTeacher(event);
  return getEventSchool(event);
}

function resolveLcmsEventSummaryLabel(event: ErgCalendarEvent, activeLane: string) {
  if (activeLane === lcmsCalendarLanes[0]) return getEventTeacher(event);
  if (activeLane === lcmsCalendarLanes[1]) return getEventSchool(event);
  return getEventSchool(event);
}

function resolveLcmsEventTone(event: ErgCalendarEvent, activeLane: string) {
  if (activeLane === lcmsCalendarLanes[0]) return getTeacherTone(getEventTeacher(event));
  return getSchoolTone(getEventSchool(event));
}

function resolveLcmsLaneScopeOptions(activeLane: string, events: ErgCalendarEvent[], catalog: ErgScheduleCatalog): ErgCalendarLaneSummary[] {
  if (activeLane === lcmsCalendarLanes[0]) {
    return buildEntitySummaries(getSchoolLabels(catalog, events), events, getEventSchool, getSchoolTone);
  }

  if (activeLane === lcmsCalendarLanes[1]) {
    return buildEntitySummaries(getTeacherLabels(catalog, events), events, getEventTeacher, getTeacherTone);
  }

  return buildEntitySummaries(getSchoolLabels(catalog, events), events, getEventSchool, getSchoolTone);
}

function resolveLcmsLaneSummaries(activeLane: string, events: ErgCalendarEvent[], catalog: ErgScheduleCatalog): ErgCalendarLaneSummary[] {
  if (activeLane === lcmsCalendarLanes[0]) {
    return buildEntitySummaries(getTeacherLabels(catalog, events), events, getEventTeacher, getTeacherTone);
  }

  return buildEntitySummaries(getSchoolLabels(catalog, events), events, getEventSchool, getSchoolTone);
}

function getSchoolLabels(catalog: ErgScheduleCatalog, events: ErgCalendarEvent[]) {
  const catalogLabels = catalog.schools.map((school) => ({ id: school.id, label: school.name })).filter((school) => school.label);
  if (catalogLabels.length) return catalogLabels;
  return Array.from(new Set(events.map(getEventSchool))).map((label) => ({ id: label, label }));
}

function getTeacherLabels(catalog: ErgScheduleCatalog, events: ErgCalendarEvent[]) {
  const catalogTeachers = catalog.teachers ?? [];
  const catalogAssistantTeachers = catalog.assistantTeachers ?? [];
  const teachers = catalogTeachers.length ? catalogTeachers : catalogAssistantTeachers;
  const catalogLabels = teachers.map((teacher) => ({ id: teacher.id, label: teacher.name })).filter((teacher) => teacher.label);
  if (catalogLabels.length) return catalogLabels;
  return Array.from(new Set(events.map(getEventTeacher))).map((label) => ({ id: label, label }));
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

function getEventTeacher(event: ErgCalendarEvent) {
  return event.teacher?.trim() || "Chưa phân công";
}

function getSchoolTone(schoolName = "Chưa xác định") {
  return getStableTone(schoolName, schoolTones);
}

function getTeacherTone(teacherName = "Chưa phân công") {
  return getStableTone(teacherName, teacherTones);
}

function getStableTone(value: string, tones: ErgCalendarResolvedTone[]) {
  const hash = Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0);
  return tones[hash % tones.length];
}
