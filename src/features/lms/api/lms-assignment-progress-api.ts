import { getDefaultTenantId, graphQlRequest, type GraphQlPage } from "@/lib/graphql-client";
import {
  isLmsEntity,
  isLmsGraphQlPage,
  withTenant,
  type LmsAssignment,
  type LmsStudent,
} from "@/features/lms/api/lms-graphql-shared";
import { isObject, validateResponse } from "@/lib/validate-response";

export type LmsAssignmentProgressWorkspaceInput = {
  tenantId?: string;
  assignmentId: string;
  attemptStatus?: string;
  page?: number;
  size?: number;
};

export type LmsAttempt = {
  id: string;
  assignmentId?: string | null;
  quizId?: string | null;
  studentId?: string | null;
  status?: string | null;
  score?: number | null;
  maxScore?: number | null;
  percent?: number | null;
  passed?: boolean | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
};

export type LmsAssignmentRecipient = LmsStudent & {
  missing?: boolean | null;
  late?: boolean | null;
  latestAttempt?: LmsAttempt | null;
  bestAttempt?: LmsAttempt | null;
};

export type LmsMissingLateStudent = LmsStudent & {
  dueAt?: string | null;
  missing?: boolean | null;
  late?: boolean | null;
};

export type LmsAssignmentProgressWorkspace = {
  tenantId?: string | null;
  assignment: LmsAssignment;
  summary: {
    submittedCount?: number | null;
    inProgressCount?: number | null;
    needsReviewCount?: number | null;
  };
  attempts: GraphQlPage<LmsAttempt>;
  recipients: GraphQlPage<LmsAssignmentRecipient>;
  missingLateStudents: GraphQlPage<LmsMissingLateStudent>;
};

const LmsAssignmentProgressWorkspaceDocument = `
query LmsAssignmentProgressWorkspace($input: AssignmentProgressWorkspaceInput!) {
  lms {
    assignmentProgressWorkspace(input: $input) {
      tenantId
      assignment {
        id
        academicClassId
        quizId
        subjectId
        dueAt
        status
        assignedBy
        recipientMode
        resources {
          quizId
          quizVersionId
          quizVersionLabel
          orderIndex
        }
        createdAt
        updatedAt
      }
      summary {
        submittedCount
        inProgressCount
        needsReviewCount
      }
      attempts {
        items {
          id
          assignmentId
          quizId
          studentId
          status
          score
          maxScore
          percent
          passed
          startedAt
          submittedAt
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      recipients {
        items {
          studentId
          schoolId
          academicClassId
          studentCode
          fullName
          username
          authUserId
          email
          status
          missing
          late
          latestAttempt {
            id
            assignmentId
            quizId
            studentId
            status
            score
            maxScore
            percent
            passed
            startedAt
            submittedAt
            updatedAt
          }
          bestAttempt {
            id
            assignmentId
            quizId
            studentId
            status
            score
            maxScore
            percent
            passed
            startedAt
            submittedAt
            updatedAt
          }
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      missingLateStudents {
        items {
          studentId
          schoolId
          academicClassId
          studentCode
          fullName
          username
          authUserId
          email
          status
          dueAt
          missing
          late
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
    }
  }
}
`;

export async function loadLmsAssignmentProgressWorkspace(
  input: LmsAssignmentProgressWorkspaceInput,
  signal?: AbortSignal,
) {
  const response = await graphQlRequest<
    { lms: { assignmentProgressWorkspace: LmsAssignmentProgressWorkspace } },
    { input: LmsAssignmentProgressWorkspaceInput }
  >({
    operationName: "LmsAssignmentProgressWorkspace",
    portal: "lms",
    query: LmsAssignmentProgressWorkspaceDocument,
    signal,
    tenantId: input.tenantId ?? getDefaultTenantId(),
    variables: { input: withTenant(input) },
  });

  return validateResponse(
    response,
    isLmsAssignmentProgressWorkspaceResponse,
    "lms.assignment-progress-workspace",
  ).lms.assignmentProgressWorkspace;
}

function isLmsAssignmentProgressWorkspaceResponse(
  value: unknown,
): value is { lms: { assignmentProgressWorkspace: LmsAssignmentProgressWorkspace } } {
  if (!isObject(value) || !isObject(value.lms) || !isObject(value.lms.assignmentProgressWorkspace)) return false;
  const workspace = value.lms.assignmentProgressWorkspace;
  return isLmsEntity(workspace.assignment) &&
    isObject(workspace.summary) &&
    isLmsGraphQlPage(workspace.attempts, isLmsEntity) &&
    isLmsGraphQlPage(workspace.recipients) &&
    isLmsGraphQlPage(workspace.missingLateStudents);
}
