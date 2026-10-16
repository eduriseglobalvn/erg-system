import { apiRequest } from "@/lib/api-client";
import { hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { isNonEmptyString, isObject, validateResponse } from "@/lib/validate-response";

export type CreateLmsAssignmentInput = {
  title: string;
  quizIds: string[];
  recipientMode: "class" | "group" | "students";
  classId?: string | null;
  groupId?: string | null;
  studentIds?: string[];
  startAt?: string | null;
  dueAt?: string | null;
  attemptLimit?: number | null;
  maxDurationMinutes?: number | null;
  teacherNote?: string | null;
  idempotencyKey: string;
};

export type UpdateLmsAssignmentInput = {
  assignmentId: string;
  title?: string | null;
  startAt?: string | null;
  dueAt?: string | null;
  attemptLimit?: number | null;
  maxDurationMinutes?: number | null;
  teacherNote?: string | null;
  status?: string | null;
};

export type UpdateLmsAssignmentRecipientsInput = {
  assignmentId: string;
  recipientMode: "class" | "group" | "students";
  classId?: string | null;
  groupId?: string | null;
  studentIds?: string[];
};

export type LmsAssignmentResourceResponse = {
  quizId: string;
  quizVersionId: string;
  quizVersionLabel: string;
};

export type CreateLmsAssignmentResult = {
  assignmentId: string;
  recipientCount: number;
  resources: LmsAssignmentResourceResponse[];
};

export type LmsStudentGroupInput = {
  name: string;
  classId?: string | null;
  note?: string | null;
  color?: string | null;
  studentIds: string[];
};

export type LmsStudentGroupResult = {
  groupId: string;
  name: string;
  classId?: string | null;
  note?: string | null;
  color?: string | null;
  studentCount: number;
};

export type LmsStudentGroup = {
  id: string;
  name: string;
  classId?: string | null;
  note?: string | null;
  color?: string | null;
  ownerUserId?: string | null;
  studentIds: string[];
  studentCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type LmsStudentGroupWorkspace = {
  tenantId: string;
  groups: LmsStudentGroup[];
};

type StudentGroupsGraphQlResponse = {
  lms: {
    studentGroups: LmsStudentGroupWorkspace;
  };
};

const StudentGroupsDocument = `
query LmsStudentGroups($tenantId: String, $classId: String) {
  lms {
    studentGroups(input: { tenantId: $tenantId, classId: $classId }) {
      tenantId
      groups {
        id
        name
        classId
        note
        color
        ownerUserId
        studentIds
        studentCount
        createdAt
        updatedAt
      }
    }
  }
}
`;

export async function createLmsAssignment(input: CreateLmsAssignmentInput): Promise<CreateLmsAssignmentResult> {
  const response = await apiRequest<CreateLmsAssignmentResult>(API_ENDPOINTS.lms.assignments, {
    body: JSON.stringify({
      attemptLimit: input.attemptLimit,
      classId: input.classId,
      dueAt: input.dueAt,
      groupId: input.groupId,
      maxDurationMinutes: input.maxDurationMinutes,
      quizIds: input.quizIds,
      recipientMode: input.recipientMode,
      startAt: input.startAt,
      studentIds: input.studentIds ?? [],
      teacherNote: input.teacherNote,
      title: input.title,
    }),
    headers: {
      "X-Idempotency-Key": input.idempotencyKey,
    },
    method: "POST",
    portal: "lms",
  });
  return validateResponse(response, isAssignmentResult, "lms.assignment.create");
}

export async function updateLmsAssignment(input: UpdateLmsAssignmentInput): Promise<void> {
  await apiRequest<void>(API_ENDPOINTS.lms.assignment(input.assignmentId), {
    body: JSON.stringify({
      attemptLimit: input.attemptLimit,
      dueAt: input.dueAt,
      maxDurationMinutes: input.maxDurationMinutes,
      startAt: input.startAt,
      status: input.status,
      teacherNote: input.teacherNote,
      title: input.title,
    }),
    method: "PATCH",
    portal: "lms",
  });
}

export async function updateLmsAssignmentRecipients(input: UpdateLmsAssignmentRecipientsInput): Promise<CreateLmsAssignmentResult> {
  const response = await apiRequest<CreateLmsAssignmentResult>(API_ENDPOINTS.lms.assignmentRecipients(input.assignmentId), {
    body: JSON.stringify({
      classId: input.classId,
      groupId: input.groupId,
      recipientMode: input.recipientMode,
      studentIds: input.studentIds ?? [],
    }),
    method: "PUT",
    portal: "lms",
  });
  return validateResponse(response, isAssignmentResult, "lms.assignment.recipients");
}

export async function deleteLmsAssignment(assignmentId: string): Promise<void> {
  await apiRequest<void>(API_ENDPOINTS.lms.assignment(assignmentId), {
    method: "DELETE",
    portal: "lms",
  });
}

export async function loadLmsStudentGroups(input: {
  tenantId?: string;
  classId?: string | null;
} = {}, signal?: AbortSignal): Promise<LmsStudentGroupWorkspace> {
  const tenantId = input.tenantId ?? getDefaultTenantId();
  if (!hasApiBase()) {
    return {
      groups: [],
      tenantId,
    };
  }

  const response = await graphQlRequest<
    StudentGroupsGraphQlResponse,
    { tenantId: string; classId?: string | null }
  >({
    operationName: "LmsStudentGroups",
    portal: "lms",
    query: StudentGroupsDocument,
    signal,
    tenantId,
    variables: {
      classId: input.classId ?? null,
      tenantId,
    },
  });

  return validateResponse(response, isStudentGroupsResponse, "lms.student-groups").lms.studentGroups;
}

function isAssignmentResult(value: unknown): value is CreateLmsAssignmentResult {
  return isObject(value)
    && isNonEmptyString(value.assignmentId)
    && typeof value.recipientCount === "number"
    && Array.isArray(value.resources);
}

function isStudentGroupsResponse(value: unknown): value is StudentGroupsGraphQlResponse {
  if (!isObject(value) || !isObject(value.lms) || !isObject(value.lms.studentGroups)) return false;
  return isNonEmptyString(value.lms.studentGroups.tenantId) && Array.isArray(value.lms.studentGroups.groups);
}

export async function createLmsStudentGroup(input: LmsStudentGroupInput): Promise<LmsStudentGroupResult> {
  return apiRequest<LmsStudentGroupResult>(API_ENDPOINTS.lms.studentGroups, {
    body: JSON.stringify(input),
    method: "POST",
    portal: "lms",
  });
}

export async function updateLmsStudentGroup(groupId: string, input: LmsStudentGroupInput): Promise<LmsStudentGroupResult> {
  return apiRequest<LmsStudentGroupResult>(API_ENDPOINTS.lms.studentGroup(groupId), {
    body: JSON.stringify(input),
    method: "PUT",
    portal: "lms",
  });
}

export async function deleteLmsStudentGroup(groupId: string): Promise<void> {
  await apiRequest<void>(API_ENDPOINTS.lms.studentGroup(groupId), {
    method: "DELETE",
    portal: "lms",
  });
}
