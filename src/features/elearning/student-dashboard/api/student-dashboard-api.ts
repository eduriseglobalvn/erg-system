import { getCurrentElearningViewerSession } from "@/platform/auth/api/elearning-viewer-session";
import {
  studentAssignments,
  studentDashboardProfile,
  studentTeacherAnnouncements,
} from "@/features/elearning/student-dashboard/api/mock-student-dashboard";
import type {
  StudentAssignmentStatus,
  StudentDashboardAssignment,
  StudentDashboardProfile,
  StudentTeacherAnnouncement,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { hasApiBase } from "@/lib/api-client";
import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";
import { sampleQuiz } from "@/lib/sample-quiz";

type ElearningStudentDashboardResponse = {
  elearning: {
    studentDashboard: ElearningStudentDashboardDTO;
  };
};

type ElearningStudentDashboardDTO = {
  tenantId?: string | null;
  viewer?: {
    userId?: string | null;
    tenantId?: string | null;
    accountType?: string | null;
    accessLevel?: string | null;
  } | null;
  profile?: {
    userId?: string | null;
    studentId?: string | null;
    studentCode?: string | null;
    fullName?: string | null;
    email?: string | null;
    schoolId?: string | null;
    academicClassId?: string | null;
    status?: string | null;
    updatedAt?: string | null;
  } | null;
  summary?: {
    enrolledCourseCount?: number | null;
    activeAssignmentCount?: number | null;
    pendingActionCount?: number | null;
    generatedAt?: string | null;
    scoreSummary?: {
      completedAttemptCount?: number | null;
      attemptedAssignmentCount?: number | null;
      passedAttemptCount?: number | null;
      averagePercent?: number | null;
      bestPercent?: number | null;
    } | null;
  } | null;
  courses?: Array<{
    id?: string | null;
    title?: string | null;
    status?: string | null;
    progressPercent?: number | null;
    updatedAt?: string | null;
  }>;
  assignments?: Array<{
    id?: string | null;
    title?: string | null;
    status?: string | null;
    dueAt?: string | null;
  }>;
  nextActions?: Array<{
    id?: string | null;
    kind?: string | null;
    label?: string | null;
    targetId?: string | null;
    dueAt?: string | null;
  }>;
  announcements?: Array<{
    id?: string | null;
    title?: string | null;
    content?: string | null;
    pinned?: boolean | null;
    publishedAt?: string | null;
    updatedAt?: string | null;
  }>;
};

export type StudentDashboardApiData = {
  assignments: StudentDashboardAssignment[];
  profile: StudentDashboardProfile;
  teacherAnnouncements: StudentTeacherAnnouncement[];
};

const ElearningStudentDashboardDocument = `
query ElearningStudentDashboard($input: StudentDashboardInput) {
  elearning {
    studentDashboard(input: $input) {
      tenantId
      viewer {
        userId
        tenantId
        accountType
        accessLevel
      }
      profile {
        userId
        studentId
        studentCode
        fullName
        email
        schoolId
        academicClassId
        status
        updatedAt
      }
      summary {
        enrolledCourseCount
        activeAssignmentCount
        pendingActionCount
        generatedAt
        scoreSummary {
          completedAttemptCount
          attemptedAssignmentCount
          passedAttemptCount
          averagePercent
          bestPercent
        }
      }
      courses {
        id
        title
        status
        progressPercent
        updatedAt
      }
      assignments {
        id
        title
        status
        dueAt
      }
      nextActions {
        id
        kind
        label
        targetId
        dueAt
      }
      announcements {
        id
        title
        content
        pinned
        publishedAt
        updatedAt
      }
    }
  }
}
`;

export async function loadStudentDashboardData(): Promise<StudentDashboardApiData> {
  const session = getCurrentElearningViewerSession();

  if (!hasApiBase()) {
    return {
      assignments: studentAssignments,
      profile: mergeProfileSession(studentDashboardProfile, session, studentAssignments.length),
      teacherAnnouncements: studentTeacherAnnouncements,
    };
  }

  const response = await graphQlRequest<ElearningStudentDashboardResponse, { input: { tenantId: string } }>({
    operationName: "ElearningStudentDashboard",
    portal: "elearning",
    query: ElearningStudentDashboardDocument,
    variables: {
      input: {
        tenantId: getDefaultTenantId(),
      },
    },
  });
  return mapStudentDashboard(response.elearning.studentDashboard, session);
}

function mapStudentDashboard(
  dashboard: ElearningStudentDashboardDTO,
  session: ReturnType<typeof getCurrentElearningViewerSession>,
): StudentDashboardApiData {
  const assignments = (dashboard.assignments ?? []).filter(hasId).map((assignment, index) => mapAssignment(assignment, dashboard, index));
  const submittedCount = assignments.filter((assignment) => assignment.status === "submitted").length;
  const announcements = (dashboard.announcements ?? []).filter(hasId).map((announcement) => mapAnnouncement(announcement, dashboard));

  return {
    assignments,
    profile: mergeProfileSession(
      mapProfile(dashboard, assignments.length, submittedCount),
      session,
      assignments.length,
    ),
    teacherAnnouncements: announcements,
  };
}

function mergeProfileSession(
  baseProfile: StudentDashboardProfile,
  session: ReturnType<typeof getCurrentElearningViewerSession>,
  assignmentCount: number,
): StudentDashboardProfile {
  if (!session) return baseProfile;

  const isTeacherViewer = session.viewerKind === "teacher";
  return {
    ...baseProfile,
    id: session.id ?? baseProfile.id,
    name: session.name ?? baseProfile.name,
    className: session.className || baseProfile.className,
    schoolName: session.schoolName || baseProfile.schoolName,
    gradeLabel: isTeacherViewer ? session.title || session.className || "Giáo viên" : baseProfile.gradeLabel,
    homeroomTeacher: isTeacherViewer ? "Tự truy cập Elearning" : baseProfile.homeroomTeacher,
    totalAssignments: assignmentCount || baseProfile.totalAssignments,
  };
}

function mapProfile(
  dashboard: ElearningStudentDashboardDTO,
  assignmentCount: number,
  submittedCount: number,
): StudentDashboardProfile {
  const profile = dashboard.profile;
  const summary = dashboard.summary;
  const scoreSummary = summary?.scoreSummary;
  const attemptedCount = scoreSummary?.attemptedAssignmentCount ?? assignmentCount;
  const passedCount = scoreSummary?.passedAttemptCount ?? submittedCount;
  const weeklyGoalProgress = attemptedCount ? Math.round((passedCount / Math.max(attemptedCount, 1)) * 100) : 0;
  const activeAssignmentCount = summary?.activeAssignmentCount ?? 0;
  const enrolledCourseCount = summary?.enrolledCourseCount ?? 0;

  return {
    ...studentDashboardProfile,
    id: profile?.studentId || profile?.userId || studentDashboardProfile.id,
    name: profile?.fullName || studentDashboardProfile.name,
    className: profile?.academicClassId || studentDashboardProfile.className,
    schoolName: profile?.schoolId || studentDashboardProfile.schoolName,
    averageScore: Math.round(scoreSummary?.averagePercent ?? studentDashboardProfile.averageScore),
    completedAssignments: scoreSummary?.completedAttemptCount ?? submittedCount,
    totalAssignments: assignmentCount || activeAssignmentCount,
    motivationPoints: Math.max(0, enrolledCourseCount * 10 + (passedCount ?? 0) * 15),
    weeklyGoalProgress: Math.max(0, Math.min(100, weeklyGoalProgress)),
  };
}

function mapAssignment(
  assignment: NonNullable<ElearningStudentDashboardDTO["assignments"]>[number],
  dashboard: ElearningStudentDashboardDTO,
  index: number,
): StudentDashboardAssignment {
  const status = normalizeStatus(assignment.status, assignment.dueAt);
  const scoreSummary = dashboard.summary?.scoreSummary;
  const maxScore = 100;
  const bestScore = status === "submitted" ? Math.round(scoreSummary?.bestPercent ?? scoreSummary?.averagePercent ?? 0) : null;
  const progressRate = progressForStatus(status);
  const courses = dashboard.courses ?? [];
  const course = courses[index % Math.max(courses.length, 1)];

  return {
    id: assignment.id || `assignment-${index + 1}`,
    quizId: assignment.id || sampleQuiz.id,
    title: assignment.title || `Bài tập ${index + 1}`,
    subtitle: course?.title || "Bài tập từ LMS ERG",
    subjectLabel: course?.title || subjectLabelFor(index),
    teacherName: "Giáo viên ERG",
    status,
    progressRate,
    answeredCount: status === "not_started" ? 0 : Math.max(1, Math.round((progressRate / 100) * 10)),
    totalQuestions: 10,
    score: bestScore,
    maxScore,
    dueLabel: assignment.dueAt ? formatDueLabel(assignment.dueAt) : "Chưa có hạn nộp",
    statusLabel: statusLabelFor(status),
    lastActivityLabel: assignment.dueAt ? formatDateTimeLabel(assignment.dueAt) : "Mới cập nhật",
    focusNote: dashboard.nextActions?.find((action) => action.targetId === assignment.id)?.label || "Theo dõi tiến độ và hoàn thành bài theo lịch được giao.",
    attempts:
      bestScore !== null
        ? [
            {
              id: `attempt-${assignment.id}`,
              score: bestScore,
              maxScore,
              completedAtLabel: "Đã nộp",
              durationLabel: "20 phút",
            },
          ]
        : [],
  };
}

function mapAnnouncement(
  announcement: NonNullable<ElearningStudentDashboardDTO["announcements"]>[number],
  dashboard: ElearningStudentDashboardDTO,
): StudentTeacherAnnouncement {
  return {
    id: announcement.id || "announcement",
    title: announcement.title || "Thông báo lớp học",
    content: announcement.content || "",
    teacherName: "ERG",
    targetLabel: dashboard.profile?.academicClassId || studentDashboardProfile.className,
    createdAtLabel: formatDateTimeLabel(announcement.publishedAt || announcement.updatedAt || ""),
    isPinned: Boolean(announcement.pinned),
  };
}

function hasId<TValue extends { id?: string | null }>(value: TValue): value is TValue & { id: string } {
  return Boolean(value.id);
}

function normalizeStatus(status: string | null | undefined, dueAt?: string | null): StudentAssignmentStatus {
  const normalized = status?.toLowerCase() ?? "";
  if (normalized === "submitted" || normalized === "completed" || normalized === "done") return "submitted";
  if (dueAt && new Date(dueAt).getTime() < Date.now() && normalized !== "submitted") return "overdue";
  if (normalized === "in_progress" || normalized === "doing" || normalized === "started") return "in_progress";
  if (normalized === "overdue") return "overdue";
  return "not_started";
}

function progressForStatus(status: StudentAssignmentStatus) {
  if (status === "submitted") return 100;
  if (status === "in_progress") return 67;
  if (status === "overdue") return 35;
  return 0;
}

function statusLabelFor(status: StudentAssignmentStatus) {
  switch (status) {
    case "submitted":
      return "Đã nộp";
    case "in_progress":
      return "Đang làm";
    case "overdue":
      return "Quá hạn";
    default:
      return "Chưa bắt đầu";
  }
}

function subjectLabelFor(index: number) {
  return ["Tin học", "Tiếng Anh", "Toán học", "Khoa học"][index % 4];
}

function formatDueLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có hạn nộp";
  return `Hạn nộp ${date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}`;
}

function formatDateTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Mới cập nhật";
  return date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}
