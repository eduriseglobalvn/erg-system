import type {
  ElearningClassLeaderboardQuery,
  ElearningClassLeaderboardQueryVariables,
  ElearningLeaderboardClassesQuery,
  ElearningSetClassLeaderboardEnabledMutation,
  ElearningSetClassLeaderboardEnabledMutationVariables,
  ElearningStudentClassLeaderboardQuery,
  ElearningStudentClassLeaderboardQueryVariables,
} from "@/lib/api/generated/graphql";
import { getDefaultTenantId, graphQlRequest, type GraphQlPortal } from "@/lib/graphql-client";
import { isObject, validateResponse } from "@/lib/validate-response";
import ClassLeaderboardDocument from "./class-leaderboard.graphql?raw";

export type ClassLeaderboard = ElearningClassLeaderboardQuery["elearning"]["classLeaderboard"];
export type ClassLeaderboardEntry = ClassLeaderboard["entries"][number];
export type LeaderboardClass = ElearningLeaderboardClassesQuery["elearning"]["leaderboardClasses"][number];

/** Teacher pages talk to the backend as "lms", Admin pages as "lcms"; the backend scopes classes by role. */
export const classLeaderboardKeys = {
  classes: (portal: GraphQlPortal) => ["class-leaderboard", portal, "classes"] as const,
  board: (portal: GraphQlPortal, classId: string) => ["class-leaderboard", portal, "board", classId] as const,
  student: (accountId: string, classId: string) => ["class-leaderboard", "student", accountId, classId] as const,
};

function isBoard(value: unknown): value is ClassLeaderboard {
  return isObject(value) && Array.isArray(value.entries);
}

/** The signed-in student's class; `enabled: false` (no entries) once the teacher switches it off. */
export async function loadStudentClassLeaderboard(classId: string, signal?: AbortSignal) {
  const tenantId = getDefaultTenantId();
  const response = await graphQlRequest<ElearningStudentClassLeaderboardQuery, ElearningStudentClassLeaderboardQueryVariables & Record<string, unknown>>({
    operationName: "ElearningStudentClassLeaderboard",
    portal: "elearning",
    query: ClassLeaderboardDocument,
    signal,
    tenantId,
    variables: { input: { classId: classId || null, tenantId } },
  });
  return validateResponse(response, (value): value is ElearningStudentClassLeaderboardQuery =>
    isObject(value) && isObject(value.elearning) && isBoard(value.elearning.studentClassLeaderboard),
  "elearning.student-class-leaderboard").elearning.studentClassLeaderboard;
}

export async function loadLeaderboardClasses(portal: GraphQlPortal, signal?: AbortSignal) {
  const response = await graphQlRequest<ElearningLeaderboardClassesQuery>({
    operationName: "ElearningLeaderboardClasses",
    portal,
    query: ClassLeaderboardDocument,
    signal,
  });
  return validateResponse(response, (value): value is ElearningLeaderboardClassesQuery =>
    isObject(value) && isObject(value.elearning) && Array.isArray(value.elearning.leaderboardClasses),
  "elearning.leaderboard-classes").elearning.leaderboardClasses;
}

export async function loadClassLeaderboard(portal: GraphQlPortal, classId: string, signal?: AbortSignal) {
  const response = await graphQlRequest<ElearningClassLeaderboardQuery, ElearningClassLeaderboardQueryVariables & Record<string, unknown>>({
    operationName: "ElearningClassLeaderboard",
    portal,
    query: ClassLeaderboardDocument,
    signal,
    variables: { input: { classId } },
  });
  return validateResponse(response, (value): value is ElearningClassLeaderboardQuery =>
    isObject(value) && isObject(value.elearning) && isBoard(value.elearning.classLeaderboard),
  "elearning.class-leaderboard").elearning.classLeaderboard;
}

export async function setClassLeaderboardEnabled(portal: GraphQlPortal, classId: string, enabled: boolean) {
  return graphQlRequest<ElearningSetClassLeaderboardEnabledMutation, ElearningSetClassLeaderboardEnabledMutationVariables & Record<string, unknown>>({
    operationName: "ElearningSetClassLeaderboardEnabled",
    portal,
    query: ClassLeaderboardDocument,
    variables: { input: { classId, enabled } },
  });
}
