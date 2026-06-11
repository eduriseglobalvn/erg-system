import type {
  AssignmentRun,
  ClassroomSnapshot,
  ClassroomStudent,
  StudentStatus,
} from "@/features/lms/classroom/types/classroom-types";
import { getDefaultTenantId, graphQlRequest, type GraphQlPage } from "@/lib/graphql-client";

export type LmsLearningResourceLibraryInput = {
  tenantId?: string;
  educationUnitId?: string;
  academicYear?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  sectionId?: string;
  topicId?: string;
  status?: string;
  visibility?: string;
  page?: number;
  size?: number;
};

export type LmsLearningResourceTaxonomyNode = {
  id: string;
  kind?: string | null;
  label?: string | null;
  slug?: string | null;
  parentId?: string | null;
  subjectId?: string | null;
  categoryId?: string | null;
  sortOrder?: number | null;
  status?: string | null;
  description?: string | null;
  childCount?: number | null;
  resourceCount?: number | null;
};

export type LmsLearningResourceCard = {
  id: string;
  subjectId?: string | null;
  gradeId?: string | null;
  categoryId?: string | null;
  sectionId?: string | null;
  topicId?: string | null;
  title?: string | null;
  slug?: string | null;
  subtitle?: string | null;
  thumbnailUrl?: string | null;
  visibility?: string | null;
  status?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

export type LmsLearningResourceProgress = {
  resourceId: string;
  progressRate?: number | null;
  updatedAt?: string | null;
};

export type LmsLearningResourceRecentOpened = {
  resourceId: string;
  title?: string | null;
  openedAt?: string | null;
};

export type LmsLearningResourceLibrary = {
  tenantId?: string | null;
  educationUnitId?: string | null;
  taxonomyTree: LmsLearningResourceTaxonomyNode[];
  resources: GraphQlPage<LmsLearningResourceCard>;
  progress: LmsLearningResourceProgress[];
  recentOpened: LmsLearningResourceRecentOpened[];
};

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

export type LmsStudent = {
  id: string;
  schoolId?: string | null;
  academicClassId?: string | null;
  studentCode?: string | null;
  fullName?: string | null;
  username?: string | null;
  authUserId?: string | null;
  email?: string | null;
  status?: string | null;
  updatedAt?: string | null;
};

export type LmsAssignment = {
  id: string;
  academicClassId?: string | null;
  quizId?: string | null;
  subjectId?: string | null;
  dueAt?: string | null;
  status?: string | null;
  assignedBy?: string | null;
  recipientMode?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type LmsClassWorkspace = {
  tenantId?: string | null;
  classInfo: LmsClassInfo;
  scoreSummary?: LmsScoreSummary | null;
  riskSummary?: LmsRiskSummary | null;
  students: GraphQlPage<LmsStudent>;
  assignments: GraphQlPage<LmsAssignment>;
};

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

const LmsLearningResourceLibraryDocument = `
query LmsLearningResourceLibrary($input: LearningResourceLibraryInput) {
  lms {
    learningResourceLibrary(input: $input) {
      tenantId
      educationUnitId
      taxonomyTree {
        id
        kind
        label
        slug
        parentId
        subjectId
        categoryId
        sortOrder
        status
        description
        childCount
        resourceCount
      }
      resources {
        items {
          id
          subjectId
          gradeId
          categoryId
          sectionId
          topicId
          title
          slug
          subtitle
          thumbnailUrl
          visibility
          status
          publishedAt
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
      progress {
        resourceId
        progressRate
        updatedAt
      }
      recentOpened {
        resourceId
        title
        openedAt
      }
    }
  }
}
`;

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

export async function loadLmsLearningResourceLibrary(input: LmsLearningResourceLibraryInput) {
  const response = await graphQlRequest<
    { lms: { learningResourceLibrary: LmsLearningResourceLibrary } },
    { input: LmsLearningResourceLibraryInput }
  >({
    operationName: "LmsLearningResourceLibrary",
    portal: "lms",
    query: LmsLearningResourceLibraryDocument,
    tenantId: input.tenantId ?? getDefaultTenantId(),
    variables: { input: withTenant(input) },
  });

  return response.lms.learningResourceLibrary;
}

export async function loadLmsClassWorkspace(input: LmsClassWorkspaceInput) {
  const response = await graphQlRequest<{ lms: { classWorkspace: LmsClassWorkspace } }, { input: LmsClassWorkspaceInput }>({
    operationName: "LmsClassWorkspace",
    portal: "lms",
    query: LmsClassWorkspaceDocument,
    tenantId: input.tenantId ?? getDefaultTenantId(),
    variables: { input: withTenant(input) },
  });

  return response.lms.classWorkspace;
}

export async function loadLmsTeacherHomeworkWorkspace(input: LmsTeacherHomeworkWorkspaceInput = {}) {
  const response = await graphQlRequest<
    { lms: { teacherHomeworkWorkspace: LmsTeacherHomeworkWorkspace } },
    { input: LmsTeacherHomeworkWorkspaceInput }
  >({
    operationName: "LmsTeacherHomeworkWorkspace",
    portal: "lms",
    query: LmsTeacherHomeworkWorkspaceDocument,
    tenantId: input.tenantId ?? getDefaultTenantId(),
    variables: { input: withTenant(input) },
  });

  return response.lms.teacherHomeworkWorkspace;
}

export async function loadLmsAssignmentProgressWorkspace(input: LmsAssignmentProgressWorkspaceInput) {
  const response = await graphQlRequest<
    { lms: { assignmentProgressWorkspace: LmsAssignmentProgressWorkspace } },
    { input: LmsAssignmentProgressWorkspaceInput }
  >({
    operationName: "LmsAssignmentProgressWorkspace",
    portal: "lms",
    query: LmsAssignmentProgressWorkspaceDocument,
    tenantId: input.tenantId ?? getDefaultTenantId(),
    variables: { input: withTenant(input) },
  });

  return response.lms.assignmentProgressWorkspace;
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

    return {
      id: assignment.id,
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
      avatarSeed: initials(student.fullName || student.username || student.studentCode || student.id),
      currentAssignment: workspace.assignments.items[0]?.quizId ? `Bai tap ${workspace.assignments.items[0].quizId}` : "Chua co bai dang giao",
      currentStage: student.updatedAt ? `Cap nhat ${formatDateLabel(student.updatedAt)}` : "San sang hoc tap",
      progressRate: status === "ahead" ? 88 : status === "steady" ? 62 : 28,
      averageScore: Math.round(workspace.scoreSummary?.averagePercent ?? 0),
      streakDays: 0,
      completedAssignments: Math.round(workspace.scoreSummary?.completedAttemptCount ?? 0),
      status,
      mentorNote: student.status === "inactive" ? "Can kiem tra trang thai tai khoan hoc sinh." : "Theo doi tien do hoc tap theo lop hien tai.",
      lastActivity: student.updatedAt ? formatDateLabel(student.updatedAt) : "Chua co du lieu",
    };
  });
}

function withTenant<TInput extends { tenantId?: string }>(input: TInput): TInput {
  return {
    ...input,
    tenantId: input.tenantId ?? getDefaultTenantId(),
  };
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

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Moi cap nhat";
  return date.toLocaleString("vi-VN", { day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit" });
}

function gradeLabelFor(value?: string | null, fallback?: string) {
  if (!value) return fallback ?? "ERG";
  const grade = value.replace(/^grade[-_]?/i, "");
  return grade ? `Khoi ${grade}` : fallback ?? "ERG";
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
