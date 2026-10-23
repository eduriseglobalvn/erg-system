import type { ReactNode } from "react";

export type CalendarMode = "month" | "week" | "three-day" | "day" | "schedule";
export type ErgCalendarTone = "blue" | "green" | "purple" | "orange" | "red" | "teal" | "pink" | "indigo";

export type ErgCalendarEvent = {
  attendees: string; className?: string; date: string; duration: string; endTime?: string; grade?: string;
  id: string; lane: string; location: string; note?: string; periodCount?: number; roomId?: string;
  school?: string; startTime?: string; subject?: string; teacher?: string; time: string; title: string; tone: ErgCalendarTone;
};

export type ErgCalendarLaneSummary = { color: string; count: number; id?: string; label: string };
export type ErgCalendarResolvedTone = { background: string; border: string; text: string };
export type ErgScheduleSchool = { id: string; name: string };
export type ErgScheduleClass = { gradeLabel?: string; id: string; name: string; schoolId: string };
export type ErgScheduleTeacher = { id: string; name: string };
export type ErgScheduleOption = { id: string; name: string; schoolId?: string; subjectId?: string };
export type ErgScheduleCatalog = {
  assistantTeachers?: ErgScheduleTeacher[];
  classes: ErgScheduleClass[];
  levels?: Array<string | ErgScheduleOption>;
  rooms?: Array<string | ErgScheduleOption>;
  schools: ErgScheduleSchool[];
  subjects?: Array<string | ErgScheduleOption>;
  teachers: ErgScheduleTeacher[];
};
export type ErgScheduleDraftRow = {
  assistantTeacherIds: string[]; classIds: string[]; clientRowId: string; endTime: string; levelId?: string;
  note?: string; periodCount: number; periodStart: number; roomId?: string; roomName?: string; session?: string;
  startTime: string; subjectId: string; weekday: number; mainTeacherIds: string[];
};
export type ErgScheduleDraft = { applyFrom: string; note?: string; repeatWeeks: number; resolveMode?: "REJECT" | "DELETE_CONFLICTING"; rows: ErgScheduleDraftRow[]; schoolId: string };
export type ErgSchedulePreviewConflict = { clientRowId?: string | null; code: string; existingEventId?: string | null; message: string; severity: string };
export type ErgSchedulePreviewRowResult = {
  clientRowId: string;
  errors: Array<{ code: string; field?: string | null; message: string }>;
  eventCount: number;
  teacherScheduleCount: number;
  valid: boolean;
  warnings: Array<{ code: string; field?: string | null; message: string }>;
};
export type ErgSchedulePreviewResult = { conflicts: ErgSchedulePreviewConflict[]; previewEventCount: number; rowResults: ErgSchedulePreviewRowResult[]; teacherScheduleCount: number; totalPeriodCount: number; valid: boolean };
export type ErgScheduleCreateResult = { batchId: string | null };
export type ErgCalendarVisibleRange = { activeLane: string; from: string; mode: CalendarMode; selectedScopeId: string; selectedScopeLabel: string; to: string };
export type ErgCalendarPermissions = { canCreate?: boolean; canDelete?: boolean; canPublish?: boolean; canUpdate?: boolean; canViewAggregate?: boolean };

export type ErgCalendarWorkspaceProps = {
  allLaneLabel?: string; calendarListTitle?: string; createButtonLabel?: string; defaultLane?: string; emptyDayLabel?: string;
  events: ErgCalendarEvent[]; filterEventsByLane?: boolean; filterEventsByScope?: boolean; initialDate?: string; lanes: string[];
  laneSummaries?: ErgCalendarLaneSummary[]; monthCountLabel?: string; monthCountOverride?: number; errorMessage?: string;
  isLoading?: boolean; initialMode?: CalendarMode; mobileLayout?: boolean;
  createDialogOpen?: boolean; onCreateDialogOpenChange?: (open: boolean) => void;
  onCreateSchedule?: (draft: ErgScheduleDraft) => Promise<ErgScheduleCreateResult> | ErgScheduleCreateResult;
  onCreateRoom?: (input: { roomName: string; schoolId: string }) => Promise<{ id: string; label: string; schoolId: string }> | { id: string; label: string; schoolId: string };
  onPublishScheduleBatch?: (batchId: string) => Promise<void> | void;
  onPreviewSchedule?: (draft: ErgScheduleDraft) => Promise<ErgSchedulePreviewResult> | ErgSchedulePreviewResult;
  onRetry?: () => void; onVisibleRangeChange?: (range: ErgCalendarVisibleRange) => void; permissions?: ErgCalendarPermissions;
  renderEventActions?: (event: ErgCalendarEvent) => ReactNode;
  resolveEventScopeLabel?: (event: ErgCalendarEvent, activeLane: string) => string;
  resolveEventTone?: (event: ErgCalendarEvent, activeLane: string) => ErgCalendarResolvedTone;
  resolveEventSummaryLabel?: (event: ErgCalendarEvent, activeLane: string) => string;
  resolveCalendarListTitle?: (activeLane: string) => string;
  resolveLaneScopeOptions?: (activeLane: string, events: ErgCalendarEvent[]) => ErgCalendarLaneSummary[];
  resolveLaneSummaries?: (activeLane: string, events: ErgCalendarEvent[], selectedScopeLabel: string) => ErgCalendarLaneSummary[];
  resolveScopeSelectLabel?: (activeLane: string) => string;
  scheduleCatalog?: ErgScheduleCatalog; showCreateButton?: boolean; todayDate?: string;
};
