import type { ClassLogLessonReportMatrixQuery, ClassLogRemindLessonReportMutation } from "@/lib/api/generated/graphql";
import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";

import ReportDocument from "./lesson-report.graphql?raw";

export type LessonReportMatrix = ClassLogLessonReportMatrixQuery["lms"]["lessonReportMatrix"];
export type LessonReportRow = LessonReportMatrix["rows"][number];
export type LessonReportCell = LessonReportRow["cells"][number];

function request<TData>({ operationName }: { operationName: string }, portal: "lcms" | "lms", variables: Record<string, unknown>, signal?: AbortSignal) {
  return graphQlRequest<TData, Record<string, unknown>>({ operationName, portal, query: ReportDocument, signal, tenantId: getDefaultTenantId(), variables });
}

/** Admin portal (ADMIN workspace): the matrix of every teacher; `schoolId` narrows it on the server. */
export async function loadLessonReportMatrix(vars: { weekStart: string; schoolId?: string }, signal?: AbortSignal) {
  const data = await request<ClassLogLessonReportMatrixQuery>({ operationName: "ClassLogLessonReportMatrix" }, "lcms", { weekStart: vars.weekStart, schoolId: vars.schoolId || null, subjectId: null }, signal);
  return data.lms.lessonReportMatrix;
}

/** Number of teachers reminded; the server sends at most one reminder per teacher per day. */
export async function remindLessonReport(teacherIds: string[]) {
  const data = await request<ClassLogRemindLessonReportMutation>({ operationName: "ClassLogRemindLessonReport" }, "lcms", { teacherIds });
  return data.remindLessonReport;
}
