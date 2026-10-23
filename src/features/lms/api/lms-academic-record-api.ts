import type {
  AttendanceWorkspaceInput,
  GradebookWorkspaceInput,
  LmsAttendanceWorkspaceQuery,
  LmsAttendanceWorkspaceQueryVariables,
  LmsGradebookWorkspaceQuery,
  LmsGradebookWorkspaceQueryVariables,
  LmsUpsertAttendanceMutation,
  LmsUpsertAttendanceMutationVariables,
  LmsUpsertGradebookScoreMutation,
  LmsUpsertGradebookScoreMutationVariables,
  UpsertAttendanceInput,
  UpsertGradebookScoreInput,
} from "@/lib/api/generated/graphql";
import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";
import { isNonEmptyString, isObject, validateResponse } from "@/lib/validate-response";
import LmsAcademicRecordsDocument from "./lms-academic-records.graphql?raw";

export type AttendanceWorkspace = LmsAttendanceWorkspaceQuery["lms"]["attendanceWorkspace"];
export type AttendanceRecord = AttendanceWorkspace["records"][number];
export type GradebookWorkspace = LmsGradebookWorkspaceQuery["lms"]["gradebookWorkspace"];
export type GradebookColumn = GradebookWorkspace["columns"][number];
export type GradebookScore = GradebookWorkspace["scores"][number];

export async function loadAttendanceWorkspace(input: AttendanceWorkspaceInput, signal?: AbortSignal) {
  const tenantId = input.tenantId?.trim() || getDefaultTenantId();
  const response = await graphQlRequest<LmsAttendanceWorkspaceQuery, LmsAttendanceWorkspaceQueryVariables & Record<string, unknown>>({
    operationName: "LmsAttendanceWorkspace",
    portal: "lms",
    query: LmsAcademicRecordsDocument,
    signal,
    tenantId,
    variables: { input: { ...input, tenantId } },
  });
  return validateResponse(response, isAttendanceResponse, "lms.attendance-workspace").lms.attendanceWorkspace;
}

export async function loadGradebookWorkspace(input: GradebookWorkspaceInput, signal?: AbortSignal) {
  const tenantId = input.tenantId?.trim() || getDefaultTenantId();
  const response = await graphQlRequest<LmsGradebookWorkspaceQuery, LmsGradebookWorkspaceQueryVariables & Record<string, unknown>>({
    operationName: "LmsGradebookWorkspace",
    portal: "lms",
    query: LmsAcademicRecordsDocument,
    signal,
    tenantId,
    variables: { input: { ...input, tenantId } },
  });
  return validateResponse(response, isGradebookResponse, "lms.gradebook-workspace").lms.gradebookWorkspace;
}

export async function upsertAttendance(input: UpsertAttendanceInput, signal?: AbortSignal) {
  const tenantId = input.tenantId?.trim() || getDefaultTenantId();
  const response = await graphQlRequest<LmsUpsertAttendanceMutation, LmsUpsertAttendanceMutationVariables & Record<string, unknown>>({
    operationName: "LmsUpsertAttendance",
    portal: "lms",
    query: LmsAcademicRecordsDocument,
    signal,
    tenantId,
    variables: { input: { ...input, tenantId } },
  });
  return validateResponse(response, isAttendanceMutationResponse, "lms.attendance-upsert").upsertAttendance;
}

export async function upsertGradebookScore(input: UpsertGradebookScoreInput, signal?: AbortSignal) {
  const tenantId = input.tenantId?.trim() || getDefaultTenantId();
  const response = await graphQlRequest<LmsUpsertGradebookScoreMutation, LmsUpsertGradebookScoreMutationVariables & Record<string, unknown>>({
    operationName: "LmsUpsertGradebookScore",
    portal: "lms",
    query: LmsAcademicRecordsDocument,
    signal,
    tenantId,
    variables: { input: { ...input, tenantId } },
  });
  return validateResponse(response, isGradebookMutationResponse, "lms.gradebook-score-upsert").upsertGradebookScore;
}

function isAttendanceRecord(value: unknown) {
  return isObject(value) && isNonEmptyString(value.id) && isNonEmptyString(value.studentId) &&
    isNonEmptyString(value.subjectId) && isNonEmptyString(value.attendanceDate) &&
    typeof value.lessonIndex === "number" && isNonEmptyString(value.status) &&
    typeof value.version === "number" && isNonEmptyString(value.updatedAt);
}

function isAttendanceResponse(value: unknown): value is LmsAttendanceWorkspaceQuery {
  if (!isObject(value) || !isObject(value.lms) || !isObject(value.lms.attendanceWorkspace)) return false;
  const workspace = value.lms.attendanceWorkspace;
  return isNonEmptyString(workspace.tenantId) && isNonEmptyString(workspace.classId) &&
    isNonEmptyString(workspace.subjectId) && isNonEmptyString(workspace.from) &&
    isNonEmptyString(workspace.to) && Array.isArray(workspace.records) &&
    workspace.records.every(isAttendanceRecord);
}

function isGradebookColumn(value: unknown) {
  return isObject(value) && isNonEmptyString(value.id) && isNonEmptyString(value.label) &&
    typeof value.maxScore === "number" && isNonEmptyString(value.kind) &&
    typeof value.position === "number" && typeof value.version === "number" &&
    isNonEmptyString(value.updatedAt);
}

function isGradebookScore(value: unknown) {
  return isObject(value) && isNonEmptyString(value.studentId) && isNonEmptyString(value.columnId) &&
    typeof value.score === "number" && typeof value.maxScore === "number" &&
    typeof value.version === "number" && isNonEmptyString(value.updatedAt);
}

function isGradebookResponse(value: unknown): value is LmsGradebookWorkspaceQuery {
  if (!isObject(value) || !isObject(value.lms) || !isObject(value.lms.gradebookWorkspace)) return false;
  const workspace = value.lms.gradebookWorkspace;
  return isNonEmptyString(workspace.tenantId) && isNonEmptyString(workspace.classId) &&
    isNonEmptyString(workspace.subjectId) && Array.isArray(workspace.columns) &&
    workspace.columns.every(isGradebookColumn) && Array.isArray(workspace.scores) &&
    workspace.scores.every(isGradebookScore);
}

function isAttendanceMutationResponse(value: unknown): value is LmsUpsertAttendanceMutation {
  return isObject(value) && isAttendanceRecord(value.upsertAttendance);
}

function isGradebookMutationResponse(value: unknown): value is LmsUpsertGradebookScoreMutation {
  return isObject(value) && isGradebookScore(value.upsertGradebookScore);
}
