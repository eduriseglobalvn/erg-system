import type { AssignmentRun } from "@/features/lms/classroom/types/classroom-types";
import { getDefaultTenantId, graphQlRequest, type GraphQlPage } from "@/lib/graphql-client";
import {
  isLmsEntity,
  isLmsGraphQlPage,
  withTenant,
  type LmsAssignment,
  type LmsAssignmentResource,
} from "@/features/lms/api/lms-graphql-shared";
import type { LmsAssignmentProgressWorkspace } from "@/features/lms/api/lms-assignment-progress-api";
import { isObject, validateResponse } from "@/lib/validate-response";

export type LmsTeacherHomeworkWorkspaceInput = {
  tenantId?: string;
  status?: string;
  page?: number;
  size?: number;
};

export type LmsTeacherHomeworkSummary = {
  activeAssignmentCount?: number | null;
  overdueAssignmentCount?: number | null;
  pendingReviewAssignmentCount?: number | null;
};

export type LmsTeacherClassOption = {
  id: string;
  schoolId?: string | null;
  name?: string | null;
  grade?: string | null;
  academicYear?: string | null;
  status?: string | null;
};

export type LmsAttemptSummary = {
  attemptId?: string | null;
  assignmentId?: string | null;
  academicClassId?: string | null;
  quizId?: string | null;
  subjectId?: string | null;
  studentId?: string | null;
  studentCode?: string | null;
  fullName?: string | null;
  status?: string | null;
  score?: number | null;
  maxScore?: number | null;
  percent?: number | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
};

export type LmsOverdueStudent = {
  assignmentId?: string | null;
  academicClassId?: string | null;
  quizId?: string | null;
  subjectId?: string | null;
  dueAt?: string | null;
  studentId?: string | null;
  studentCode?: string | null;
  fullName?: string | null;
  status?: string | null;
  updatedAt?: string | null;
};

export type LmsTeacherHomeworkWorkspace = {
  tenantId?: string | null;
  teacherId?: string | null;
  summary: LmsTeacherHomeworkSummary;
  classOptions: LmsTeacherClassOption[];
  assignments: GraphQlPage<LmsAssignment>;
  pendingReviews: GraphQlPage<LmsAttemptSummary>;
  overdueStudents: GraphQlPage<LmsOverdueStudent>;
};

const LmsTeacherHomeworkWorkspaceDocument = `
query LmsTeacherHomeworkWorkspace($input: TeacherHomeworkWorkspaceInput) {
  lms {
    teacherHomeworkWorkspace(input: $input) {
      tenantId
      teacherId
      summary {
        activeAssignmentCount
        overdueAssignmentCount
        pendingReviewAssignmentCount
      }
      classOptions {
        id
        schoolId
        name
        grade
        academicYear
        status
      }
      assignments {
        items {
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
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      pendingReviews {
        items {
          attemptId
          assignmentId
          academicClassId
          quizId
          subjectId
          studentId
          studentCode
          fullName
          status
          score
          maxScore
          percent
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
      overdueStudents {
        items {
          assignmentId
          academicClassId
          quizId
          subjectId
          dueAt
          studentId
          studentCode
          fullName
          status
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

export async function loadLmsTeacherHomeworkWorkspace(
  input: LmsTeacherHomeworkWorkspaceInput = {},
  signal?: AbortSignal,
) {
  const response = await graphQlRequest<
    { lms: { teacherHomeworkWorkspace: LmsTeacherHomeworkWorkspace } },
    { input: LmsTeacherHomeworkWorkspaceInput }
  >({
    operationName: "LmsTeacherHomeworkWorkspace",
    portal: "lms",
    query: LmsTeacherHomeworkWorkspaceDocument,
    signal,
    tenantId: input.tenantId ?? getDefaultTenantId(),
    variables: { input: withTenant(input) },
  });

  return validateResponse(
    response,
    isLmsTeacherHomeworkWorkspaceResponse,
    "lms.teacher-homework-workspace",
  ).lms.teacherHomeworkWorkspace;
}

function isLmsTeacherHomeworkWorkspaceResponse(
  value: unknown,
): value is { lms: { teacherHomeworkWorkspace: LmsTeacherHomeworkWorkspace } } {
  if (!isObject(value) || !isObject(value.lms) || !isObject(value.lms.teacherHomeworkWorkspace)) return false;
  const workspace = value.lms.teacherHomeworkWorkspace;
  return isObject(workspace.summary) &&
    Array.isArray(workspace.classOptions) && workspace.classOptions.every(isLmsEntity) &&
    isLmsGraphQlPage(workspace.assignments, isLmsEntity) &&
    isLmsGraphQlPage(workspace.pendingReviews) &&
    isLmsGraphQlPage(workspace.overdueStudents);
}

export function mapAssignmentsToRuns(
  assignments: LmsAssignment[],
  classOptions: LmsTeacherClassOption[] = [],
  progressByAssignmentId: Map<string, Pick<LmsAssignmentProgressWorkspace["summary"], "inProgressCount" | "needsReviewCount" | "submittedCount">> = new Map(),
): AssignmentRun[] {
  return assignments.map((assignment) => {
    const classOption = classOptions.find((item) => item.id === assignment.academicClassId);
    const progress = progressByAssignmentId.get(assignment.id);
    const submittedCount = progress?.submittedCount ?? 0;
    const inProgressCount = progress?.inProgressCount ?? 0;
    const total = submittedCount + inProgressCount;
    const primaryResource = primaryAssignmentResource(assignment);

    return {
      id: assignment.id,
      quizId: primaryResource?.quizId ?? assignment.quizId ?? null,
      quizVersionId: primaryResource?.quizVersionId ?? null,
      quizVersionLabel: primaryResource?.quizVersionLabel ?? null,
      title: assignment.quizId ? `Bai tap ${assignment.quizId}` : assignment.id,
      subjectLabel: subjectLabel(assignment.subjectId),
      targetLevel: classOption?.name || assignment.academicClassId || "Lop da giao",
      activeClasses: assignment.academicClassId ? 1 : 0,
      completionRate: total ? Math.round((submittedCount / total) * 100) : 0,
      submittedCount,
      inProgressCount,
      needsReviewCount: progress?.needsReviewCount ?? 0,
      dueLabel: formatDueLabel(assignment.dueAt),
    };
  });
}

function primaryAssignmentResource(assignment: LmsAssignment): LmsAssignmentResource | undefined {
  return [...(assignment.resources ?? [])].sort(
    (left, right) => (left.orderIndex ?? 0) - (right.orderIndex ?? 0),
  )[0];
}

function subjectLabel(subjectId?: string | null) {
  if (!subjectId) return "LMS";
  return subjectId
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDueLabel(value?: string | null) {
  if (!value) return "Chua co han nop";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chua co han nop";
  return `Hạn nộp ${date.toLocaleString("vi-VN", { day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit" })}`;
}
