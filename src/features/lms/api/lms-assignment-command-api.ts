import { apiRequest } from "@/lib/api-client";
import { hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";

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
  return apiRequest<CreateLmsAssignmentResult>("/api/v1/lms/assignments", {
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
}

export async function updateLmsAssignment(input: UpdateLmsAssignmentInput): Promise<void> {
  await apiRequest<void>(`/api/v1/lms/assignments/${input.assignmentId}`, {
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
  return apiRequest<CreateLmsAssignmentResult>(`/api/v1/lms/assignments/${input.assignmentId}/recipients`, {
    body: JSON.stringify({
      classId: input.classId,
      groupId: input.groupId,
      recipientMode: input.recipientMode,
      studentIds: input.studentIds ?? [],
    }),
    method: "PUT",
    portal: "lms",
  });
}

export async function deleteLmsAssignment(assignmentId: string): Promise<void> {
  await apiRequest<void>(`/api/v1/lms/assignments/${assignmentId}`, {
    method: "DELETE",
    portal: "lms",
  });
}

export async function loadLmsStudentGroups(input: {
  tenantId?: string;
  classId?: string | null;
} = {}): Promise<LmsStudentGroupWorkspace> {
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
    tenantId,
    variables: {
      classId: input.classId ?? null,
      tenantId,
    },
  });

  return response.lms.studentGroups;
}

export async function createLmsStudentGroup(input: LmsStudentGroupInput): Promise<LmsStudentGroupResult> {
  return apiRequest<LmsStudentGroupResult>("/api/v1/lms/student-groups", {
    body: JSON.stringify(input),
    method: "POST",
    portal: "lms",
  });
}

export async function updateLmsStudentGroup(groupId: string, input: LmsStudentGroupInput): Promise<LmsStudentGroupResult> {
  return apiRequest<LmsStudentGroupResult>(`/api/v1/lms/student-groups/${groupId}`, {
    body: JSON.stringify(input),
    method: "PUT",
    portal: "lms",
  });
}

export async function deleteLmsStudentGroup(groupId: string): Promise<void> {
  await apiRequest<void>(`/api/v1/lms/student-groups/${groupId}`, {
    method: "DELETE",
    portal: "lms",
  });
}
