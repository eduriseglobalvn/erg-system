import type {
  ClassroomSnapshot,
  ClassroomStudent,
  StudentStatus,
} from "@/domain/school/classroom-types";
import { getDefaultTenantId, graphQlRequest, type GraphQlPage } from "@/lib/graphql-client";
import {
  isLmsEntity,
  isLmsGraphQlPage,
  withTenant,
  type LmsAssignment,
  type LmsStudent,
} from "@/features/lms/api/lms-graphql-shared";
import { isObject, validateResponse } from "@/lib/validate-response";
import { formatShortDateTimeVi } from "@/features/lms/api/lms-date-label";

export type LmsClassWorkspaceInput = {
  tenantId?: string;
  classId: string;
  schoolId?: string;
  studentStatus?: string;
  page?: number;
  size?: number;
  assignmentStatus?: string;
  assignmentPage?: number;
  assignmentSize?: number;
};

export type LmsClassInfo = {
  id: string;
  schoolId?: string | null;
  name?: string | null;
  grade?: string | null;
  academicYear?: string | null;
  status?: string | null;
  homeroomTeacherId?: string | null;
  studentCount?: number | null;
  assignmentCount?: number | null;
  updatedAt?: string | null;
};

export type LmsScoreSummary = {
  completedAttemptCount?: number | null;
  attemptedStudentCount?: number | null;
  averagePercent?: number | null;
  bestPercent?: number | null;
};

export type LmsRiskSummary = {
  missingOverdueStudentCount?: number | null;
  lowScoreStudentCount?: number | null;
  inactiveStudentCount?: number | null;
};

export type LmsClassWorkspace = {
  tenantId?: string | null;
  classInfo: LmsClassInfo;
  scoreSummary?: LmsScoreSummary | null;
  riskSummary?: LmsRiskSummary | null;
  students: GraphQlPage<LmsStudent>;
  assignments: GraphQlPage<LmsAssignment>;
};

const LmsClassWorkspaceDocument = `
query LmsClassWorkspace($input: ClassWorkspaceInput!) {
  lms {
    classWorkspace(input: $input) {
      tenantId
      classInfo {
        id
        schoolId
        name
        grade
        academicYear
        status
        homeroomTeacherId
        studentCount
        assignmentCount
        updatedAt
      }
      scoreSummary {
        completedAttemptCount
        attemptedStudentCount
        averagePercent
        bestPercent
      }
      riskSummary {
        missingOverdueStudentCount
        lowScoreStudentCount
        inactiveStudentCount
      }
      students {
        items {
          id
          schoolId
          academicClassId
          studentCode
          fullName
          username
          authUserId
          email
          status
          updatedAt
          averagePercent
          completedAssignmentCount
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
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
          title
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
    }
  }
}
`;

export async function loadLmsClassWorkspace(input: LmsClassWorkspaceInput, signal?: AbortSignal) {
  const response = await graphQlRequest<{ lms: { classWorkspace: LmsClassWorkspace } }, { input: LmsClassWorkspaceInput }>({
    operationName: "LmsClassWorkspace",
    portal: "lms",
    query: LmsClassWorkspaceDocument,
    signal,
    tenantId: input.tenantId ?? getDefaultTenantId(),
    variables: { input: withTenant(input) },
  });

  return validateResponse(response, isLmsClassWorkspaceResponse, "lms.class-workspace").lms.classWorkspace;
}

function isLmsClassWorkspaceResponse(
  value: unknown,
): value is { lms: { classWorkspace: LmsClassWorkspace } } {
  if (!isObject(value) || !isObject(value.lms) || !isObject(value.lms.classWorkspace)) return false;
  const workspace = value.lms.classWorkspace;
  return isLmsEntity(workspace.classInfo) &&
    isLmsGraphQlPage(workspace.students, isLmsEntity) &&
    isLmsGraphQlPage(workspace.assignments, isLmsEntity);
}

export function mapClassWorkspaceToStudents(
  workspace: LmsClassWorkspace,
  selectedClass?: ClassroomSnapshot,
): ClassroomStudent[] {
  const classInfo = workspace.classInfo;
  const schoolName = selectedClass?.schoolName ?? classInfo.schoolId ?? "ERG Learning";
  const className = classInfo.name || selectedClass?.className || classInfo.id;
  const gradeLabel = gradeLabelFor(classInfo.grade, selectedClass?.gradeLabel);

  return workspace.students.items.map((student, index) => {
    const status = mapStudentStatus(student.status, index);
    return {
      id: student.id,
      name: student.fullName || student.username || student.studentCode || student.id,
      schoolId: student.schoolId || classInfo.schoolId || selectedClass?.schoolId || "",
      schoolName,
      classId: student.academicClassId || classInfo.id,
      className,
      gradeLabel,
      studentCode: student.studentCode || undefined,
      username: student.username || undefined,
      avatarSeed: initials(student.fullName || student.username || student.studentCode || student.id),
      currentAssignment: currentAssignmentLabel(workspace.assignments),
      currentStage: student.updatedAt ? `Cập nhật ${formatDateLabel(student.updatedAt)}` : "Sẵn sàng học tập",
      // The API has no per-student progress; this is a status-based placeholder, so the UI shows "—" (hasProgressData=false).
      progressRate: status === "ahead" ? 88 : status === "steady" ? 62 : 28,
      hasProgressData: false,
      // Per student (latest hand-in per assignment, averaged by the backend); 0 when none or no lms.grade.read.
      averageScore: Math.round(student.averagePercent ?? 0),
      streakDays: 0,
      completedAssignments: student.completedAssignmentCount ?? 0,
      status,
      mentorNote: student.status === "inactive" ? "Cần kiểm tra trạng thái tài khoản học sinh." : "Theo dõi tiến độ học tập theo lớp hiện tại.",
      lastActivity: student.updatedAt ? formatDateLabel(student.updatedAt) : "Chưa có dữ liệu",
    };
  });
}

export function formatDateLabel(value: string) {
  return formatShortDateTimeVi(value) || "Mới cập nhật";
}

function gradeLabelFor(value?: string | number | null, fallback?: string) {
  if (value == null || value === "") return fallback ?? "Toàn hệ thống";
  const str = String(value);
  const grade = str.replace(/^grade[-_]?/i, "");
  return grade ? `Khối ${grade}` : fallback ?? "Toàn hệ thống";
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function mapStudentStatus(status: string | null | undefined, index: number): StudentStatus {
  const normalized = status?.toLowerCase();
  if (normalized === "inactive" || normalized === "blocked" || normalized === "pending") return "support";
  if (normalized === "excellent" || normalized === "ahead") return "ahead";
  if (normalized === "active" || normalized === "steady") return "steady";
  return index % 5 === 0 ? "support" : index % 3 === 0 ? "ahead" : "steady";
}

/** «Tên bài» of the newest assignment, plus how many more the class has; never a raw id. */
export function currentAssignmentLabel(assignments: { items: LmsAssignment[]; totalItems?: number | null }): string {
  const total = assignments.totalItems ?? assignments.items.length;
  if (!assignments.items.length) return "Chưa có bài đang giao";
  const title = assignments.items[0].title?.trim();
  if (!title) return `${total} bài đang giao`;
  return total > 1 ? `${title} và ${total - 1} bài khác` : title;
}
