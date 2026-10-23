import type {
  ErgCalendarEvent,
  ErgCalendarLaneSummary,
  ErgCalendarResolvedTone,
  ErgCalendarTone,
  ErgScheduleCatalog,
  ErgScheduleDraft,
} from "@/components/shared/erg-calendar-workspace";
import { getDefaultTenantId } from "@/lib/graphql-client";

import type { TeachingScheduleBulkInput } from "./teaching-calendar-command-types";
import { createClientIdempotencyKey } from "./teaching-calendar-transport-utils";
import type {
  TeachingCalendarCatalog,
  TeachingCalendarEvent,
  TeachingCalendarFilterOption,
  TeachingCalendarFilterOptions,
} from "./teaching-calendar-workspace-types";

export function mapTeachingCalendarEvents(events: TeachingCalendarEvent[]): ErgCalendarEvent[] {
  return events.map((event) => {
    const mainTeachers = event.teachers.filter((teacher) => teacher.role === "MAIN");
    const teacherLabel = mainTeachers.length
      ? mainTeachers.map((teacher) => teacher.displayName).join(", ")
      : event.teachers.map((teacher) => teacher.displayName).join(", ");
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
      note: event.note ?? undefined,
      periodCount: event.periodCount,
      roomId: event.roomId ?? undefined,
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

export function mapTeachingCalendarCatalog(catalog?: TeachingCalendarCatalog, filterOptions?: TeachingCalendarFilterOptions): ErgScheduleCatalog | undefined {
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
      gradeLabel: classroom.grade ?? undefined, id: classroom.id, name: classroom.label, schoolId: classroom.schoolId,
    })),
    levels: (catalogLevels.length ? catalogLevels : (filterOptions?.levels ?? []).map((level) => ({ ...level, sortOrder: null, subjectId: "" }))).map((level) => ({ id: level.id, name: level.label, subjectId: level.subjectId })),
    rooms: catalogRooms.map((room) => ({ id: room.id ?? room.label, name: room.label, schoolId: room.schoolId ?? undefined })),
    schools: (catalogSchools.length ? catalogSchools : filterOptions?.schools ?? []).map((school) => ({ id: school.id, name: school.label })),
    subjects: (catalogSubjects.length ? catalogSubjects : filterOptions?.subjects ?? []).map((subject) => ({ id: subject.id, name: subject.label })),
    teachers: (catalogTeachers.length ? catalogTeachers : filterOptions?.teachers ?? []).map((teacher) => ({ id: teacher.id, name: teacher.label })),
  };
}

export function mergeTeachingCalendarCatalog(primary?: ErgScheduleCatalog, fallback?: ErgScheduleCatalog): ErgScheduleCatalog | undefined {
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

export function mapLaneSummaries(options: TeachingCalendarFilterOption[] | undefined): ErgCalendarLaneSummary[] | undefined {
  return options?.map((option) => ({ color: colorKeyToToneObject(option.colorKey).border, count: option.count, id: option.id, label: option.label }));
}

export function mapScheduleDraftToBulkInput(draft: ErgScheduleDraft, options?: { idempotencyKey?: string; tenantId?: string }): TeachingScheduleBulkInput {
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

export function colorKeyToTone(colorKey?: string | null): ErgCalendarTone {
  const normalized = colorKey?.trim().toLowerCase();
  if (normalized === "green" || normalized === "purple" || normalized === "orange" || normalized === "red"
    || normalized === "teal" || normalized === "pink" || normalized === "indigo") return normalized;
  return "blue";
}

export function colorKeyToToneObject(colorKey?: string | null): ErgCalendarResolvedTone {
  return tonePalette[colorKeyToTone(colorKey)];
}

function mergeScheduleOptions<T extends string | { id: string }>(primary: T[] | undefined, fallback: T[] | undefined): T[] {
  const seen = new Set<string>();
  return [...(primary ?? []), ...(fallback ?? [])].filter((option) => {
    const key = typeof option === "string" ? `label:${option}` : `id:${option.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const tonePalette: Record<ErgCalendarTone, ErgCalendarResolvedTone> = {
  blue: { background: "#DCEBFF", border: "#5A94E8", text: "#174EA6" },
  green: { background: "#E0F2E7", border: "#42A96A", text: "#137333" },
  indigo: { background: "#E6EAFF", border: "#6974D8", text: "#3942A0" },
  orange: { background: "#FFF0D5", border: "#D88A2D", text: "#9A5A00" },
  pink: { background: "#FFE7F1", border: "#D95D91", text: "#9A2456" },
  purple: { background: "#EEE7FF", border: "#8B6BE8", text: "#5B3AAE" },
  red: { background: "#FFE4E1", border: "#D96A61", text: "#A33830" },
  teal: { background: "#DDF4F2", border: "#2E9F97", text: "#0A6B6F" },
};
