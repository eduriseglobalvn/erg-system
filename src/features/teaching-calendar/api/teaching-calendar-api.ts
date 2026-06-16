import {
  type CenterUpCalendarEvent,
  type CenterUpCalendarLaneSummary,
  type CenterUpCalendarPermissions,
  type CenterUpCalendarResolvedTone,
  type CenterUpCalendarTone,
  type CenterUpScheduleCatalog,
  type CenterUpScheduleDraft,
} from "@/components/shared/centerup-calendar-workspace";
import { apiRequest, hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId, graphQlRequest, type GraphQlPortal } from "@/lib/graphql-client";

export const TEACHING_CALENDAR_WORKSPACE_STALE_TIME_MS = 5 * 60_000;
export const TEACHING_CALENDAR_WORKSPACE_GC_TIME_MS = 30 * 60_000;

export type TeachingCalendarViewMode = "ALL" | "BY_SCHOOL" | "BY_TEACHER" | "BY_SUBJECT";
export type TeachingScheduleStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";
export type TeachingScheduleResolveMode = "REJECT" | "DELETE_CONFLICTING";

export type TeachingCalendarWorkspaceInput = {
  classIds?: string[];
  from: string;
  levelIds?: string[];
  schoolIds?: string[];
  statuses?: TeachingScheduleStatus[];
  subjectIds?: string[];
  teacherIds?: string[];
  tenantId?: string;
  to: string;
  viewMode?: TeachingCalendarViewMode;
};

export type MyTeachingCalendarInput = Omit<TeachingCalendarWorkspaceInput, "teacherIds">;
export type MyStudentCalendarInput = Pick<TeachingCalendarWorkspaceInput, "from" | "levelIds" | "statuses" | "subjectIds" | "tenantId" | "to" | "viewMode">;

export type TeachingCalendarWorkspace = {
  catalog: TeachingCalendarCatalog;
  events: TeachingCalendarEvent[];
  filterOptions: TeachingCalendarFilterOptions;
  from: string;
  generatedAt: string;
  laneSummaries: TeachingCalendarLaneSummary[];
  permissions: CenterUpCalendarPermissions;
  tenantId: string;
  to: string;
  viewMode: TeachingCalendarViewMode;
};

export type TeachingCalendarEvent = {
  batchId?: string | null;
  classId: string;
  className: string;
  colorGroup: { key: string; kind: string; label?: string | null };
  date: string;
  endAt: string;
  endTime: string;
  id: string;
  levelId?: string | null;
  levelName?: string | null;
  note?: string | null;
  periodCount: number;
  periodStart: number;
  roomId?: string | null;
  roomName?: string | null;
  schoolId: string;
  schoolName: string;
  startAt: string;
  startTime: string;
  status: TeachingScheduleStatus;
  subjectId?: string | null;
  subjectName?: string | null;
  teachers: TeachingScheduleTeacherAssignment[];
  title: string;
};

export type TeachingScheduleTeacherAssignment = {
  colorKey?: string | null;
  displayName: string;
  role: "MAIN" | "ASSISTANT";
  userId: string;
};

export type TeachingCalendarFilterOption = {
  colorKey?: string | null;
  count: number;
  id: string;
  label: string;
};

export type TeachingCalendarLaneSummary = {
  colorKey?: string | null;
  count: number;
  id: string;
  label: string;
};

export type TeachingCalendarFilterOptions = {
  classes: TeachingCalendarFilterOption[];
  levels: TeachingCalendarFilterOption[];
  schools: TeachingCalendarFilterOption[];
  subjects: TeachingCalendarFilterOption[];
  teachers: TeachingCalendarFilterOption[];
};

export type TeachingCalendarCatalog = {
  assistantTeachers: TeachingCalendarTeacherOption[];
  classes: TeachingCalendarClassOption[];
  levels: TeachingCalendarLevelOption[];
  rooms: TeachingCalendarRoomOption[];
  schools: TeachingCalendarFilterOption[];
  subjects: TeachingCalendarSubjectOption[];
  teachers: TeachingCalendarTeacherOption[];
};

export type TeachingCalendarClassOption = {
  academicYear?: string | null;
  grade?: string | null;
  id: string;
  label: string;
  schoolId: string;
};

export type TeachingCalendarTeacherOption = {
  colorKey?: string | null;
  id: string;
  label: string;
};

export type TeachingCalendarSubjectOption = {
  id: string;
  label: string;
};

export type TeachingCalendarLevelOption = {
  id: string;
  label: string;
  sortOrder?: number | null;
  subjectId: string;
};

export type TeachingCalendarRoomOption = {
  id?: string | null;
  label: string;
  schoolId?: string | null;
};

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

export type TeachingScheduleRowMessage = {
  code: string;
  field?: string | null;
  message: string;
};

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
  batchId: string;
  conflicts: TeachingScheduleConflict[];
  createdEventCount: number;
  rowResults: TeachingScheduleRowResult[];
  teacherScheduleCount: number;
  totalPeriodCount: number;
};

export type TeachingScheduleEventUpdateInput = {
  eventId: string;
  note?: string;
  roomId?: string;
  roomName?: string;
  tenantId?: string;
};

export type TeachingScheduleEventPayload = {
  event: TeachingCalendarEvent;
};

export type TeachingScheduleEventDeleteInput = {
  eventId: string;
  tenantId?: string;
};

export type DeleteTeacherScheduleInput = {
  dateFrom?: string;
  dateTo?: string;
  schoolIds?: string[];
  teacherUserId: string;
  tenantId?: string;
};

export type TeachingScheduleDeletePayload = {
  affectedEventCount: number;
  deleted: boolean;
  eventId: string;
};

export type TeachingScheduleBatchPayload = {
  affectedEventCount: number;
  batchId: string;
  status: TeachingScheduleStatus;
};

export type CreateRoomInput = {
  roomName: string;
  schoolId: string;
  tenantId?: string;
};

export type TeachingScheduleRoomOption = {
  id: string;
  label: string;
  schoolId: string;
};

type SessionCurrentResponseDTO = {
  availableScopeOptions?: Array<{
    label: string;
    level: "system" | "center" | "school" | "class" | string;
    unitId: string;
  }>;
  currentScope?: {
    classId?: string;
    level: "system" | "center" | "school" | "class" | string;
    unitId: string;
  };
  manageableClasses?: Array<{
    id: string;
    name: string;
    unitId: string;
  }>;
  manageableUnits?: Array<{
    id: string;
    level?: "system" | "center" | "school" | "class" | string;
    name: string;
    parentId?: string | null;
    type?: "system" | "center" | "school" | string;
  }>;
};

type EducationUnitDTO = {
  code?: string | null;
  id: string;
  name?: string | null;
  label?: string | null;
  status?: string | null;
  type?: "system" | "center" | "school" | string | null;
};

type LmsEducationUnitListResponseDTO = {
  items?: EducationUnitDTO[];
};

type OrganizationEducationUnitListResponseDTO = {
  educationUnits?: EducationUnitDTO[];
  items?: EducationUnitDTO[];
};

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

const calendarEventFields = `
  fragment CalendarEventFields on TeachingCalendarEvent {
    id
    batchId
    title
    startAt
    endAt
    date
    startTime
    endTime
    schoolId
    schoolName
    classId
    className
    subjectId
    subjectName
    levelId
    levelName
    roomId
    roomName
    periodStart
    periodCount
    teachers { userId displayName role colorKey }
    status
    note
    colorGroup { key label kind }
  }
`;

const workspaceFields = `
  ${calendarEventFields}
  fragment FilterOptionFields on TeachingCalendarFilterOption {
    id
    label
    count
    colorKey
  }
  fragment LaneSummaryFields on TeachingCalendarLaneSummary {
    id
    label
    count
    colorKey
  }
  fragment CatalogFields on TeachingScheduleCatalog {
    schools { ...FilterOptionFields }
    classes { id schoolId label grade academicYear }
    teachers { id label colorKey }
    assistantTeachers { id label colorKey }
    subjects { id label }
    levels { id subjectId label sortOrder }
    rooms { id label schoolId }
  }
  fragment WorkspaceFields on TeachingCalendarWorkspace {
    tenantId
    from
    to
    viewMode
    events { ...CalendarEventFields }
    filterOptions {
      schools { ...FilterOptionFields }
      classes { ...FilterOptionFields }
      teachers { ...FilterOptionFields }
      subjects { ...FilterOptionFields }
      levels { ...FilterOptionFields }
    }
    laneSummaries { ...LaneSummaryFields }
    catalog { ...CatalogFields }
    permissions { canCreate canUpdate canDelete canPublish canViewAggregate }
    generatedAt
  }
`;

const previewPayloadFields = `
  valid
  previewEventCount
  teacherScheduleCount
  totalPeriodCount
  rowResults {
    clientRowId
    valid
    eventCount
    teacherScheduleCount
    errors { code field message }
    warnings { code field message }
  }
  conflicts { code severity clientRowId existingEventId message }
`;

const bulkPayloadFields = `
  batchId
  createdEventCount
  teacherScheduleCount
  totalPeriodCount
  rowResults {
    clientRowId
    valid
    eventCount
    teacherScheduleCount
    errors { code field message }
    warnings { code field message }
  }
  conflicts { code severity clientRowId existingEventId message }
`;

export async function loadLcmsTeachingCalendarWorkspace(input: TeachingCalendarWorkspaceInput) {
  const data = await graphQlRequest<{ lcms: { teachingCalendarWorkspace: TeachingCalendarWorkspace } }, { input: TeachingCalendarWorkspaceInput }>({
    operationName: "LCMS_CALENDAR_WORKSPACE",
    portal: "lcms",
    query: `
      query LCMS_CALENDAR_WORKSPACE($input: TeachingCalendarWorkspaceInput!) {
        lcms {
          teachingCalendarWorkspace(input: $input) { ...WorkspaceFields }
        }
      }
      ${workspaceFields}
    `,
    tenantId: input.tenantId,
    variables: { input: withDefaultTenant(input) },
  });

  return data.lcms.teachingCalendarWorkspace;
}

export async function loadLmsMyTeachingCalendar(input: MyTeachingCalendarInput) {
  const data = await graphQlRequest<{ lms: { myTeachingCalendar: TeachingCalendarWorkspace } }, { input: MyTeachingCalendarInput }>({
    operationName: "MY_TEACHING_CALENDAR",
    portal: "lms",
    query: `
      query MY_TEACHING_CALENDAR($input: MyTeachingCalendarInput!) {
        lms {
          myTeachingCalendar(input: $input) { ...WorkspaceFields }
        }
      }
      ${workspaceFields}
    `,
    tenantId: input.tenantId,
    variables: { input: withDefaultTenant(input) },
  });

  return data.lms.myTeachingCalendar;
}

export async function loadLmsMyStudentCalendar(input: MyStudentCalendarInput) {
  const data = await graphQlRequest<{ lms: { myStudentCalendar: TeachingCalendarWorkspace } }, { input: MyStudentCalendarInput }>({
    operationName: "MY_STUDENT_CALENDAR",
    portal: "lms",
    query: `
      query MY_STUDENT_CALENDAR($input: MyStudentCalendarInput!) {
        lms {
          myStudentCalendar(input: $input) { ...WorkspaceFields }
        }
      }
      ${workspaceFields}
    `,
    tenantId: input.tenantId,
    variables: { input: withDefaultTenant(input) },
  });

  return data.lms.myStudentCalendar;
}

export async function loadTeachingCalendarSessionCatalog(portal: GraphQlPortal = "lms") {
  if (!hasApiBase()) return emptyCenterUpScheduleCatalog();

  const session = await apiRequest<SessionCurrentResponseDTO>("/api/v1/sessions/current", {
    portal,
  });

  return mapSessionToCenterUpScheduleCatalog(session);
}

export async function loadTeachingCalendarReferenceCatalog(portal: GraphQlPortal = "lms") {
  if (!hasApiBase()) return emptyCenterUpScheduleCatalog();

  const scopedSchools = await loadScopedEducationUnitSchools(portal);
  if (scopedSchools.length) return mapSchoolsToCenterUpScheduleCatalog(scopedSchools);

  const organizationSchools = await loadOrganizationEducationUnitSchools(portal);
  if (organizationSchools.length) return mapSchoolsToCenterUpScheduleCatalog(organizationSchools);

  return loadTeachingCalendarSessionCatalog(portal);
}

export async function previewTeachingSchedule(input: TeachingScheduleBulkInput, portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ previewTeachingSchedule: TeachingSchedulePreviewPayload }, { input: TeachingScheduleBulkInput }>({
    operationName: "PREVIEW_TEACHING_SCHEDULE",
    portal,
    query: `
      mutation PREVIEW_TEACHING_SCHEDULE($input: TeachingScheduleBulkInput!) {
        previewTeachingSchedule(input: $input) { ${previewPayloadFields} }
      }
    `,
    tenantId: input.tenantId,
    variables: { input: withDefaultTenant(input) },
  });

  return data.previewTeachingSchedule;
}

export async function createTeachingSchedule(input: TeachingScheduleBulkInput, portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ createTeachingSchedule: TeachingScheduleBulkPayload }, { input: TeachingScheduleBulkInput }>({
    operationName: "CREATE_TEACHING_SCHEDULE",
    portal,
    query: `
      mutation CREATE_TEACHING_SCHEDULE($input: TeachingScheduleBulkInput!) {
        createTeachingSchedule(input: $input) { ${bulkPayloadFields} }
      }
    `,
    tenantId: input.tenantId,
    variables: { input: withDefaultTenant(input) },
  });

  return data.createTeachingSchedule;
}

export async function updateTeachingScheduleEvent(input: TeachingScheduleEventUpdateInput, portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ updateTeachingScheduleEvent: TeachingScheduleEventPayload }, { input: TeachingScheduleEventUpdateInput }>({
    operationName: "UPDATE_TEACHING_SCHEDULE_EVENT",
    portal,
    query: `
      mutation UPDATE_TEACHING_SCHEDULE_EVENT($input: TeachingScheduleEventUpdateInput!) {
        updateTeachingScheduleEvent(input: $input) {
          event { ...CalendarEventFields }
        }
      }
      ${calendarEventFields}
    `,
    tenantId: input.tenantId,
    variables: { input: withDefaultTenant(input) },
  });

  return data.updateTeachingScheduleEvent;
}

export async function deleteTeachingScheduleEvent(input: TeachingScheduleEventDeleteInput, portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ deleteTeachingScheduleEvent: TeachingScheduleDeletePayload }, { input: TeachingScheduleEventDeleteInput }>({
    operationName: "DELETE_TEACHING_SCHEDULE_EVENT",
    portal,
    query: `
      mutation DELETE_TEACHING_SCHEDULE_EVENT($input: TeachingScheduleEventDeleteInput!) {
        deleteTeachingScheduleEvent(input: $input) { eventId deleted affectedEventCount }
      }
    `,
    tenantId: input.tenantId,
    variables: { input: withDefaultTenant(input) },
  });

  return data.deleteTeachingScheduleEvent;
}

export async function deleteTeacherSchedule(input: DeleteTeacherScheduleInput, portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ deleteTeacherSchedule: TeachingScheduleDeletePayload }, { input: DeleteTeacherScheduleInput }>({
    operationName: "DELETE_TEACHER_SCHEDULE",
    portal,
    query: `
      mutation DELETE_TEACHER_SCHEDULE($input: DeleteTeacherScheduleInput!) {
        deleteTeacherSchedule(input: $input) { eventId deleted affectedEventCount }
      }
    `,
    tenantId: input.tenantId,
    variables: { input: withDefaultTenant(input) },
  });

  return data.deleteTeacherSchedule;
}

export async function publishTeachingScheduleBatch(batchId: string, tenantId = getDefaultTenantId(), portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ publishTeachingScheduleBatch: TeachingScheduleBatchPayload }, { batchId: string }>({
    operationName: "PUBLISH_TEACHING_SCHEDULE_BATCH",
    portal,
    query: `
      mutation PUBLISH_TEACHING_SCHEDULE_BATCH($batchId: String!) {
        publishTeachingScheduleBatch(batchId: $batchId) { batchId status affectedEventCount }
      }
    `,
    tenantId,
    variables: { batchId },
  });

  return data.publishTeachingScheduleBatch;
}

export async function cancelTeachingScheduleBatch(batchId: string, tenantId = getDefaultTenantId(), portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ cancelTeachingScheduleBatch: TeachingScheduleBatchPayload }, { batchId: string }>({
    operationName: "CANCEL_TEACHING_SCHEDULE_BATCH",
    portal,
    query: `
      mutation CANCEL_TEACHING_SCHEDULE_BATCH($batchId: String!) {
        cancelTeachingScheduleBatch(batchId: $batchId) { batchId status affectedEventCount }
      }
    `,
    tenantId,
    variables: { batchId },
  });

  return data.cancelTeachingScheduleBatch;
}

export async function createTeachingScheduleRoom(input: CreateRoomInput, portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ createRoom: TeachingScheduleRoomOption }, { input: CreateRoomInput }>({
    operationName: "CREATE_TEACHING_SCHEDULE_ROOM",
    portal,
    query: `
      mutation CREATE_TEACHING_SCHEDULE_ROOM($input: CreateRoomInput!) {
        createRoom(input: $input) { id label schoolId }
      }
    `,
    tenantId: input.tenantId,
    variables: { input: withDefaultTenant(input) },
  });

  return data.createRoom;
}

export async function importTeachingScheduleFromExcel(input: TeachingScheduleExcelImportInput, portal: GraphQlPortal = "lcms") {
  const data = await graphQlRequest<{ importTeachingScheduleFromExcel: TeachingSchedulePreviewPayload }, { input: TeachingScheduleExcelImportInput }>({
    operationName: "IMPORT_TEACHING_SCHEDULE_FROM_EXCEL",
    portal,
    query: `
      mutation IMPORT_TEACHING_SCHEDULE_FROM_EXCEL($input: TeachingScheduleExcelImportInput!) {
        importTeachingScheduleFromExcel(input: $input) { ${previewPayloadFields} }
      }
    `,
    tenantId: input.tenantId,
    variables: { input: withDefaultTenant(input) },
  });

  return data.importTeachingScheduleFromExcel;
}

export async function uploadTeachingScheduleExcelFile(input: TeachingScheduleExcelImportInput, file: File) {
  const body = new FormData();
  body.set("file", file);
  body.set("metadata", JSON.stringify(withDefaultTenant(input)));
  return apiRequest<TeachingSchedulePreviewPayload>("/api/v1/calendar/import-excel", {
    body,
    method: "POST",
    portal: "lcms",
  });
}

export function mapTeachingCalendarEvents(events: TeachingCalendarEvent[]): CenterUpCalendarEvent[] {
  return events.map((event) => {
    const mainTeachers = event.teachers.filter((teacher) => teacher.role === "MAIN");
    const teacherLabel = mainTeachers.length ? mainTeachers.map((teacher) => teacher.displayName).join(", ") : event.teachers.map((teacher) => teacher.displayName).join(", ");
    return {
      attendees: event.className,
      className: event.className,
      date: event.date,
      duration: `${event.startTime} - ${event.endTime}`,
      endTime: event.endTime,
      grade: event.levelName ?? undefined,
      id: event.id,
      lane: event.colorGroup.kind,
      location: event.roomName ?? "Chưa có phòng",
      periodCount: event.periodCount,
      school: event.schoolName,
      startTime: event.startTime,
      subject: event.subjectName ?? event.title,
      teacher: teacherLabel || "Chưa phân công",
      time: event.startTime,
      title: event.title,
      tone: colorKeyToTone(event.colorGroup.key),
    };
  });
}

export function mapTeachingCalendarCatalog(catalog?: TeachingCalendarCatalog, filterOptions?: TeachingCalendarFilterOptions): CenterUpScheduleCatalog | undefined {
  if (!catalog && !filterOptions) return undefined;
  const catalogClasses = catalog?.classes ?? [];
  const catalogLevels = catalog?.levels ?? [];
  const catalogRooms = catalog?.rooms ?? [];
  const catalogSchools = catalog?.schools ?? [];
  const catalogSubjects = catalog?.subjects ?? [];
  const catalogTeachers = catalog?.teachers ?? [];
  const catalogAssistantTeachers = catalog?.assistantTeachers ?? [];

  return {
    assistantTeachers: (catalogAssistantTeachers.length ? catalogAssistantTeachers : filterOptions?.teachers ?? []).map((teacher) => ({ id: teacher.id, name: teacher.label })),
    classes: (catalogClasses.length ? catalogClasses : (filterOptions?.classes ?? []).map((classroom) => ({ ...classroom, academicYear: null, grade: null, schoolId: "" }))).map((classroom) => ({
      gradeLabel: classroom.grade ?? undefined,
      id: classroom.id,
      name: classroom.label,
      schoolId: classroom.schoolId,
    })),
    levels: (catalogLevels.length ? catalogLevels : (filterOptions?.levels ?? []).map((level) => ({ ...level, sortOrder: null, subjectId: "" }))).map((level) => ({ id: level.id, name: level.label, subjectId: level.subjectId })),
    rooms: catalogRooms.map((room) => ({ id: room.id ?? room.label, name: room.label, schoolId: room.schoolId ?? undefined })),
    schools: (catalogSchools.length ? catalogSchools : filterOptions?.schools ?? []).map((school) => ({ id: school.id, name: school.label })),
    subjects: (catalogSubjects.length ? catalogSubjects : filterOptions?.subjects ?? []).map((subject) => ({ id: subject.id, name: subject.label })),
    teachers: (catalogTeachers.length ? catalogTeachers : filterOptions?.teachers ?? []).map((teacher) => ({ id: teacher.id, name: teacher.label })),
  };
}

export function mergeTeachingCalendarCatalog(
  primary?: CenterUpScheduleCatalog,
  fallback?: CenterUpScheduleCatalog,
): CenterUpScheduleCatalog | undefined {
  if (!primary) return fallback;
  if (!fallback) return primary;

  return {
    assistantTeachers: mergeScheduleOptions(primary.assistantTeachers, fallback.assistantTeachers),
    classes: mergeScheduleOptions(primary.classes, fallback.classes),
    levels: mergeScheduleOptions(primary.levels, fallback.levels),
    rooms: mergeScheduleOptions(primary.rooms, fallback.rooms),
    schools: mergeScheduleOptions(primary.schools, fallback.schools),
    subjects: mergeScheduleOptions(primary.subjects, fallback.subjects),
    teachers: mergeScheduleOptions(primary.teachers, fallback.teachers),
  };
}

export function mapLaneSummaries(options: TeachingCalendarFilterOption[] | undefined): CenterUpCalendarLaneSummary[] | undefined {
  return options?.map((option) => ({
    color: colorKeyToBorder(option.colorKey),
    count: option.count,
    id: option.id,
    label: option.label,
  }));
}

export function mapScheduleDraftToBulkInput(draft: CenterUpScheduleDraft, options?: { idempotencyKey?: string; tenantId?: string }): TeachingScheduleBulkInput {
  return {
    applyFrom: draft.applyFrom,
    idempotencyKey: options?.idempotencyKey ?? createClientIdempotencyKey(),
    note: draft.note,
    overrideConflicts: draft.resolveMode === "DELETE_CONFLICTING" ? true : undefined,
    repeatWeeks: draft.repeatWeeks,
    resolveMode: draft.resolveMode ?? "REJECT",
    rows: draft.rows,
    schoolId: draft.schoolId,
    tenantId: options?.tenantId ?? getDefaultTenantId(),
  };
}

export function workspaceInputKey(input: TeachingCalendarWorkspaceInput | MyTeachingCalendarInput | MyStudentCalendarInput) {
  return [
    input.tenantId ?? getDefaultTenantId(),
    input.from,
    input.to,
    input.viewMode ?? "ALL",
    "schoolIds" in input ? input.schoolIds?.join(",") ?? "" : "",
    "teacherIds" in input ? input.teacherIds?.join(",") ?? "" : "",
    "classIds" in input ? input.classIds?.join(",") ?? "" : "",
    input.subjectIds?.join(",") ?? "",
    input.levelIds?.join(",") ?? "",
    input.statuses?.join(",") ?? "",
  ];
}

export function colorKeyToTone(colorKey?: string | null): CenterUpCalendarTone {
  const normalized = colorKey?.trim().toLowerCase();
  if (normalized === "green" || normalized === "purple" || normalized === "orange" || normalized === "red" || normalized === "teal" || normalized === "pink" || normalized === "indigo") {
    return normalized;
  }
  return "blue";
}

export function colorKeyToToneObject(colorKey?: string | null): CenterUpCalendarResolvedTone {
  return tonePalette[colorKeyToTone(colorKey)];
}

function colorKeyToBorder(colorKey?: string | null) {
  return colorKeyToToneObject(colorKey).border;
}

function withDefaultTenant<T extends { tenantId?: string }>(input: T): T {
  return {
    ...input,
    tenantId: input.tenantId ?? getDefaultTenantId(),
  };
}

function createClientIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `calendar-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function mapSessionToCenterUpScheduleCatalog(session: SessionCurrentResponseDTO): CenterUpScheduleCatalog {
  const scopeLabels = new Map((session.availableScopeOptions ?? []).map((scope) => [scope.unitId, scope.label]));
  const units = session.manageableUnits ?? [];
  const schoolUnits = units.filter(isScheduleSchoolUnit);
  const fallbackUnits = schoolUnits.length ? schoolUnits : units.filter((unit) => !isSystemEducationUnit(unit));
  const schools = uniqueById(fallbackUnits.map((unit) => ({
    id: unit.id,
    name: unit.name || scopeLabels.get(unit.id) || unit.id,
  })));
  const classes = uniqueById((session.manageableClasses ?? []).map((classroom) => ({
    id: classroom.id,
    name: classroom.name,
    schoolId: classroom.unitId,
  })));

  return {
    assistantTeachers: [],
    classes,
    levels: [],
    rooms: [],
    schools,
    subjects: [],
    teachers: [],
  };
}

async function loadScopedEducationUnitSchools(portal: GraphQlPortal) {
  try {
    const response = await apiRequest<LmsEducationUnitListResponseDTO>("/api/v1/lms/education-units", {
      portal,
    });
    return mapEducationUnitsToScheduleSchools(response.items ?? []);
  } catch {
    return [];
  }
}

async function loadOrganizationEducationUnitSchools(portal: GraphQlPortal) {
  try {
    const response = await apiRequest<OrganizationEducationUnitListResponseDTO>("/api/v1/education-units", {
      portal,
    });
    return mapEducationUnitsToScheduleSchools(response.educationUnits ?? response.items ?? []);
  } catch {
    return [];
  }
}

function mapSchoolsToCenterUpScheduleCatalog(schools: CenterUpScheduleCatalog["schools"]): CenterUpScheduleCatalog {
  return {
    ...emptyCenterUpScheduleCatalog(),
    schools,
  };
}

function mapEducationUnitsToScheduleSchools(units: EducationUnitDTO[]): CenterUpScheduleCatalog["schools"] {
  const schoolUnits = units.filter(isScheduleEducationUnitSchool);
  const fallbackUnits = schoolUnits.length ? schoolUnits : units.filter((unit) => !isSystemLikeEducationUnit(unit));

  return uniqueById(fallbackUnits.map((unit) => ({
    id: unit.id,
    name: unit.name?.trim() || unit.label?.trim() || unit.id,
  }))).sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

function emptyCenterUpScheduleCatalog(): CenterUpScheduleCatalog {
  return {
    assistantTeachers: [],
    classes: [],
    levels: [],
    rooms: [],
    schools: [],
    subjects: [],
    teachers: [],
  };
}

function mergeScheduleOptions<T extends string | { id: string }>(primary: T[] | undefined, fallback: T[] | undefined): T[] {
  const primaryOptions = primary ?? [];
  if (primaryOptions.length || !fallback?.length) return primaryOptions;
  return fallback;
}

function isScheduleSchoolUnit(unit: NonNullable<SessionCurrentResponseDTO["manageableUnits"]>[number]) {
  const normalizedType = (unit.type ?? unit.level ?? "").trim().toLowerCase();
  return normalizedType === "school" || normalizedType === "center";
}

function isScheduleEducationUnitSchool(unit: EducationUnitDTO) {
  const normalizedType = (unit.type ?? "").trim().toLowerCase();
  const normalizedStatus = (unit.status ?? "").trim().toLowerCase();
  return (normalizedType === "school" || normalizedType === "center") && normalizedStatus !== "inactive";
}

function isSystemEducationUnit(unit: NonNullable<SessionCurrentResponseDTO["manageableUnits"]>[number]) {
  const normalizedType = (unit.type ?? unit.level ?? "").trim().toLowerCase();
  const normalizedName = unit.name.trim().toLowerCase();
  return normalizedType === "system" || normalizedName.includes("erg system") || normalizedName.includes("hệ thống erg");
}

function isSystemLikeEducationUnit(unit: EducationUnitDTO) {
  const normalizedType = (unit.type ?? "").trim().toLowerCase();
  const normalizedName = (unit.name ?? unit.label ?? "").trim().toLowerCase();
  const normalizedCode = (unit.code ?? "").trim().toLowerCase();
  const normalizedStatus = (unit.status ?? "").trim().toLowerCase();
  return normalizedStatus === "inactive" || normalizedType === "system" || normalizedCode === "erg-system" || normalizedName.includes("erg system") || normalizedName.includes("hệ thống erg");
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

const tonePalette: Record<CenterUpCalendarTone, CenterUpCalendarResolvedTone> = {
  blue: { background: "#DCEBFF", border: "#5A94E8", text: "#174EA6" },
  green: { background: "#E0F2E7", border: "#42A96A", text: "#137333" },
  indigo: { background: "#E6EAFF", border: "#6974D8", text: "#3942A0" },
  orange: { background: "#FFF0D5", border: "#D88A2D", text: "#9A5A00" },
  pink: { background: "#FFE7F1", border: "#D95D91", text: "#9A2456" },
  purple: { background: "#EEE7FF", border: "#8B6BE8", text: "#5B3AAE" },
  red: { background: "#FFE4E1", border: "#D96A61", text: "#A33830" },
  teal: { background: "#DDF4F2", border: "#2E9F97", text: "#0A6B6F" },
};
