import type { TeachingCalendarEvent, TeachingScheduleStatus } from "./teaching-calendar-workspace-types";

export type TeachingScheduleResolveMode = "REJECT" | "DELETE_CONFLICTING";

export type TeachingScheduleBulkInput = {
  academicYear?: string;
  applyFrom: string;
  idempotencyKey?: string;
  note?: string;
  overrideConflicts?: boolean;
  repeatWeeks: number;
  resolveMode?: TeachingScheduleResolveMode;
  rows: TeachingScheduleBulkRowInput[];
  schoolId: string;
  tenantId?: string;
};

export type TeachingScheduleBulkRowInput = {
  assistantTeacherIds?: string[];
  classIds: string[];
  clientRowId: string;
  endTime: string;
  levelId?: string;
  mainTeacherIds: string[];
  note?: string;
  periodCount: number;
  periodStart: number;
  roomId?: string;
  roomName?: string;
  session?: string;
  startTime: string;
  subjectId: string;
  weekday: number;
};

export type TeachingScheduleRowMessage = { code: string; field?: string | null; message: string };

export type TeachingScheduleRowResult = {
  clientRowId: string;
  errors: TeachingScheduleRowMessage[];
  eventCount: number;
  teacherScheduleCount: number;
  valid: boolean;
  warnings: TeachingScheduleRowMessage[];
};

export type TeachingScheduleConflict = {
  clientRowId?: string | null;
  code: string;
  existingEventId?: string | null;
  message: string;
  severity: string;
};

export type TeachingSchedulePreviewPayload = {
  conflicts: TeachingScheduleConflict[];
  previewEventCount: number;
  rowResults: TeachingScheduleRowResult[];
  teacherScheduleCount: number;
  totalPeriodCount: number;
  valid: boolean;
};

export type TeachingScheduleBulkPayload = {
  batchId: string | null;
  conflicts: TeachingScheduleConflict[];
  createdEventCount: number;
  rowResults: TeachingScheduleRowResult[];
  teacherScheduleCount: number;
  totalPeriodCount: number;
};

export type TeachingScheduleEventUpdateInput = { eventId: string; note?: string; roomId?: string; roomName?: string; tenantId?: string };
export type TeachingScheduleEventPayload = { event: TeachingCalendarEvent };
export type TeachingScheduleEventDeleteInput = { eventId: string; tenantId?: string };

export type DeleteTeacherScheduleInput = {
  dateFrom?: string;
  dateTo?: string;
  schoolIds?: string[];
  teacherUserId: string;
  tenantId?: string;
};

export type TeachingScheduleDeletePayload = { affectedEventCount: number; deleted: boolean; eventId: string };
export type TeachingScheduleBatchPayload = { affectedEventCount: number; batchId: string; status: TeachingScheduleStatus };

export type TeachingScheduleBatchListInput = {
  page?: number;
  schoolId?: string;
  size?: number;
  status?: TeachingScheduleStatus;
  tenantId: string;
};

export type TeachingScheduleBatchSummary = {
  applyFrom: string;
  createdAt: string;
  id: string;
  repeatWeeks: number;
  schoolId: string;
  status: TeachingScheduleStatus;
};

export type TeachingScheduleBatchPage = {
  hasNext: boolean;
  hasPrevious: boolean;
  items: TeachingScheduleBatchSummary[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type TeachingScheduleBatchDetailInput = { batchId: string; tenantId: string };

export type TeachingScheduleBatchDetail = TeachingScheduleBatchSummary & {
  academicYear?: string | null;
  createdBy?: string | null;
  eventCount: number;
  note?: string | null;
  publishedAt?: string | null;
  publishedBy?: string | null;
  source?: string | null;
  tenantId: string;
};

export type CreateRoomInput = { roomName: string; schoolId: string; tenantId?: string };
export type TeachingScheduleRoomOption = { id: string; label: string; schoolId: string };

export type TeachingScheduleExcelImportInput = {
  academicYear?: string;
  applyFrom: string;
  note?: string;
  overrideConflicts?: boolean;
  repeatWeeks: number;
  resolveMode?: TeachingScheduleResolveMode;
  schoolId: string;
  tenantId?: string;
};
