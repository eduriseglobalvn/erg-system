import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";

import type { LessonLogPeriod, SaveAttendanceAndLogInput } from "./attendance-model";

export type CurriculumLessonRow = { period: number; title: string; topic: string | null };

const PERIOD_FIELDS = `eventId date periodNo classId className subjectName subjectId teacherName ppctPeriod actualPeriod lessonTitle
  absentees { studentId shortName excused } comment status late happened version`;

const DAY_PERIODS = `query ClassLogTeacherDayPeriods($date: Date!) {
  lms { teacherDayPeriods(date: $date) { ${PERIOD_FIELDS} } }
}`;

const CURRICULUM = `query ClassLogLessonCurriculum($classId: ID!, $subjectId: ID!) {
  lms { lessonLogCurriculum(classId: $classId, subjectId: $subjectId) { topic period title } }
}`;

const SAVE = `mutation ClassLogSaveAttendanceAndLog($input: SaveAttendanceAndLogInput!) {
  saveAttendanceAndLog(input: $input) { ${PERIOD_FIELDS} }
}`;

export async function loadTeacherDayPeriods(date: string, signal?: AbortSignal): Promise<LessonLogPeriod[]> {
  const data = await graphQlRequest<{ lms: { teacherDayPeriods: LessonLogPeriod[] } }, { date: string }>({
    operationName: "ClassLogTeacherDayPeriods",
    portal: "lms",
    query: DAY_PERIODS,
    signal,
    tenantId: getDefaultTenantId(),
    variables: { date },
  });
  return data.lms.teacherDayPeriods;
}

export async function loadLessonCurriculum(classId: string, subjectId: string, signal?: AbortSignal): Promise<CurriculumLessonRow[]> {
  const data = await graphQlRequest<{ lms: { lessonLogCurriculum: CurriculumLessonRow[] } }, { classId: string; subjectId: string }>({
    operationName: "ClassLogLessonCurriculum",
    portal: "lms",
    query: CURRICULUM,
    signal,
    tenantId: getDefaultTenantId(),
    variables: { classId, subjectId },
  });
  return data.lms.lessonLogCurriculum;
}

export async function saveAttendanceAndLog(input: SaveAttendanceAndLogInput, signal?: AbortSignal): Promise<LessonLogPeriod> {
  const data = await graphQlRequest<{ saveAttendanceAndLog: LessonLogPeriod }, { input: SaveAttendanceAndLogInput }>({
    operationName: "ClassLogSaveAttendanceAndLog",
    portal: "lms",
    query: SAVE,
    signal,
    tenantId: getDefaultTenantId(),
    variables: { input },
  });
  return data.saveAttendanceAndLog;
}
