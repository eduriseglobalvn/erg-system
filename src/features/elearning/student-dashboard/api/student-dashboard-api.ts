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
import { getDefaultTenantId, graphQlRequest } from "@/lib/graphql-client";
import { runtimeFixturesEnabled } from "@/lib/runtime-fixtures";
import type {
  ElearningStudentDashboardQuery,
  ElearningStudentDashboardQueryVariables,
} from "@/lib/api/generated/graphql";
import { isObject, validateResponse } from "@/lib/validate-response";
import ElearningStudentDashboardDocument from "./student-dashboard.graphql?raw";

// Types come from the generated GraphQL contract (src/lib/api/generated/graphql.ts, ERG-018).
// The document lives in student-dashboard.graphql; codegen keeps these in sync with the BE schema.
type ElearningStudentDashboardResponse = ElearningStudentDashboardQuery;
type ElearningStudentDashboardDTO = ElearningStudentDashboardQuery["elearning"]["studentDashboard"];

export type StudentDashboardApiData = {
  assignments: StudentDashboardAssignment[];
  profile: StudentDashboardProfile;
  teacherAnnouncements: StudentTeacherAnnouncement[];
};

export async function loadStudentDashboardData({
  signal,
  tenantId = getDefaultTenantId(),
}: { signal?: AbortSignal; tenantId?: string } = {}): Promise<StudentDashboardApiData> {
  const session = getCurrentElearningViewerSession();

  if (runtimeFixturesEnabled()) {
    return {
      assignments: studentAssignments,
      profile: mergeProfileSession(studentDashboardProfile, session),
      teacherAnnouncements: studentTeacherAnnouncements,
    };
  }

  const response = await graphQlRequest<
    ElearningStudentDashboardResponse,
    ElearningStudentDashboardQueryVariables & Record<string, unknown>
  >({
    operationName: "ElearningStudentDashboard",
    portal: "elearning",
    query: ElearningStudentDashboardDocument,
    signal,
    variables: {
      input: {
        tenantId,
      },
    },
  });
  const dashboardResponse = validateResponse(response, isStudentDashboardResponse, "elearning.student-dashboard");
  return mapStudentDashboard(dashboardResponse.elearning.studentDashboard, session);
}

function isStudentDashboardResponse(value: unknown): value is ElearningStudentDashboardResponse {
  if (!isObject(value) || !isObject(value.elearning) || !isObject(value.elearning.studentDashboard)) return false;
  const dashboard = value.elearning.studentDashboard;
  if (
    typeof dashboard.tenantId !== "string" ||
    !isObject(dashboard.viewer) ||
    typeof dashboard.viewer.userId !== "string" ||
    typeof dashboard.viewer.tenantId !== "string" ||
    !isObject(dashboard.profile) ||
    typeof dashboard.profile.userId !== "string" ||
    !isObject(dashboard.summary) ||
    !Array.isArray(dashboard.courses) ||
    !Array.isArray(dashboard.assignments) ||
    !Array.isArray(dashboard.nextActions) ||
    !Array.isArray(dashboard.announcements)
  ) return false;

  return dashboard.courses.every(hasStringIdAndTitle) &&
    dashboard.assignments.every(hasStringIdAndTitle) &&
    dashboard.nextActions.every((action) =>
      isObject(action) && typeof action.id === "string" && typeof action.kind === "string" && typeof action.label === "string") &&
    dashboard.announcements.every((announcement) =>
      isObject(announcement) &&
      typeof announcement.id === "string" &&
      typeof announcement.title === "string" &&
      typeof announcement.pinned === "boolean");
}

function hasStringIdAndTitle(value: unknown) {
  return isObject(value) && typeof value.id === "string" && typeof value.title === "string";
}

function mapStudentDashboard(
  dashboard: ElearningStudentDashboardDTO,
  session: ReturnType<typeof getCurrentElearningViewerSession>,
): StudentDashboardApiData {
  const assignments = (dashboard.assignments ?? []).filter(hasId).map((assignment) => mapAssignment(assignment, dashboard));
  const announcements = (dashboard.announcements ?? []).filter(hasId).map((announcement) => mapAnnouncement(announcement, dashboard));

  return {
    assignments,
    profile: mergeProfileSession(
      mapProfile(dashboard, assignments.length),
      session,
    ),
    teacherAnnouncements: announcements,
  };
}

function mergeProfileSession(
  baseProfile: StudentDashboardProfile,
  session: ReturnType<typeof getCurrentElearningViewerSession>,
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
  };
}

function mapProfile(
  dashboard: ElearningStudentDashboardDTO,
  assignmentCount: number,
): StudentDashboardProfile {
  const profile = dashboard.profile;
  const summary = dashboard.summary;
  const scoreSummary = summary?.scoreSummary;
  const activeAssignmentCount = summary?.activeAssignmentCount ?? 0;

  return {
    id: profile?.studentId || profile?.userId || dashboard.viewer.userId || "",
    name: profile?.fullName || "",
    className: profile?.academicClassId || "",
    schoolName: profile?.schoolId || "",
    gradeLabel: "",
    homeroomTeacher: "",
    averageScore: scoreSummary ? Math.round(scoreSummary.averagePercent ?? 0) : null,
    completedAssignments: scoreSummary?.completedAttemptCount ?? null,
    totalAssignments: activeAssignmentCount || assignmentCount || 0,
    motivationPoints: null,
    weeklyGoalProgress: null,
  };
}

function mapAssignment(
  assignment: NonNullable<ElearningStudentDashboardDTO["assignments"]>[number],
  dashboard: ElearningStudentDashboardDTO,
): StudentDashboardAssignment {
  const status = normalizeStatus(assignment.status, assignment.dueAt, dashboard.summary?.generatedAt);
  const focusNote = dashboard.nextActions?.find((action) => action.targetId === assignment.id)?.label;

  return {
    id: assignment.id,
    ...(assignment.quizId ? { quizId: assignment.quizId } : {}),
    title: assignment.title,
    status,
    progressRate: null,
    answeredCount: null,
    totalQuestions: null,
    score: null,
    maxScore: null,
    dueLabel: assignment.dueAt ? formatDueLabel(assignment.dueAt) : "Chưa có hạn nộp",
    statusLabel: statusLabelFor(status),
    lastActivityLabel: "Chưa có hoạt động",
    ...(focusNote ? { focusNote } : {}),
    attempts: [],
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
    targetLabel: dashboard.profile?.academicClassId || undefined,
    createdAtLabel: formatDateTimeLabel(announcement.publishedAt || announcement.updatedAt || ""),
    isPinned: Boolean(announcement.pinned),
  };
}

function hasId<TValue extends { id?: string | null }>(value: TValue): value is TValue & { id: string } {
  return Boolean(value.id);
}

function normalizeStatus(status: string | null | undefined, dueAt?: string | null, nowValue?: string | null): StudentAssignmentStatus {
  const normalized = status?.toLowerCase() ?? "";
  if (normalized === "submitted" || normalized === "completed" || normalized === "done") return "submitted";
  const nowMs = nowValue ? Date.parse(nowValue) : Number.NaN;
  const dueMs = dueAt ? Date.parse(dueAt) : Number.NaN;
  if (Number.isFinite(dueMs) && Number.isFinite(nowMs) && dueMs < nowMs && normalized !== "submitted") return "overdue";
  if (normalized === "in_progress" || normalized === "doing" || normalized === "started") return "in_progress";
  if (normalized === "overdue") return "overdue";
  return "not_started";
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

function formatDueLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có hạn nộp";
  return `Hạn nộp ${date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}`;
}

function formatDateTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có hoạt động";
  return date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}
