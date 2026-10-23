import type { ErgCalendarPermissions } from "@/components/shared/erg-calendar-workspace";

export type TeachingCalendarViewMode = "ALL" | "BY_SCHOOL" | "BY_TEACHER" | "BY_SUBJECT";
export type TeachingScheduleStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";

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
  permissions: ErgCalendarPermissions;
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

export type TeachingCalendarSubjectOption = { id: string; label: string };

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
