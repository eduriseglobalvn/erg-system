import type {
  ClassLogChangesQuery,
  ClassLogClassWeekQuery,
  ClassLogConfirmWeekMutation,
  ClassLogCurriculumQuery,
  ClassLogTeacherWeekQuery,
  ClassLogUpdateEntryMutation,
  UpdateLessonLogEntryInput,
} from "@/lib/api/generated/graphql";
import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";

import ClassLogDocument from "./class-log.graphql?raw";

export type ClassLogWeek = ClassLogTeacherWeekQuery["lms"]["lessonLogTeacherWeek"];
export type ClassLogDay = ClassLogWeek["days"][number];
export type ClassLogPeriod = ClassLogDay["periods"][number];
export type ClassLogChange = ClassLogChangesQuery["lms"]["lessonLogChanges"][number];
export type ClassLogCurriculumRow = ClassLogCurriculumQuery["lms"]["lessonLogCurriculum"][number];
export type ClassLogStats = ClassLogConfirmWeekMutation["confirmLessonLogWeek"];
export type ClassLogEntryInput = UpdateLessonLogEntryInput;

function request<TData>({ operationName }: { operationName: string }, variables: Record<string, unknown>, signal?: AbortSignal) {
  return graphQlRequest<TData, Record<string, unknown>>({
    operationName, portal: "lms", query: ClassLogDocument, signal, tenantId: getDefaultTenantId(), variables,
  });
}

export async function loadTeacherWeek(vars: { weekStart: string; session?: string; status?: string }, signal?: AbortSignal) {
  const data = await request<ClassLogTeacherWeekQuery>({ operationName: "ClassLogTeacherWeek" }, {
    weekStart: vars.weekStart, session: vars.session || null, status: vars.status || null,
  }, signal);
  return data.lms.lessonLogTeacherWeek;
}

export async function loadClassWeek(vars: { classId: string; weekStart: string }, signal?: AbortSignal) {
  const data = await request<ClassLogClassWeekQuery>({ operationName: "ClassLogClassWeek" }, vars, signal);
  return data.lms.lessonLogClassWeek;
}

export async function loadChanges(vars: { weekStart: string; classId?: string }, signal?: AbortSignal) {
  const data = await request<ClassLogChangesQuery>({ operationName: "ClassLogChanges" }, { weekStart: vars.weekStart, classId: vars.classId || null }, signal);
  return data.lms.lessonLogChanges;
}

export async function loadCurriculum(vars: { classId: string; subjectId: string }, signal?: AbortSignal) {
  const data = await request<ClassLogCurriculumQuery>({ operationName: "ClassLogCurriculum" }, vars, signal);
  return data.lms.lessonLogCurriculum;
}

export async function updateLessonLogEntry(input: ClassLogEntryInput) {
  const data = await request<ClassLogUpdateEntryMutation>({ operationName: "ClassLogUpdateEntry" }, { input });
  return data.updateLessonLogEntry;
}

export async function confirmLessonLogWeek(weekStart: string) {
  const data = await request<ClassLogConfirmWeekMutation>({ operationName: "ClassLogConfirmWeek" }, { weekStart });
  return data.confirmLessonLogWeek;
}
