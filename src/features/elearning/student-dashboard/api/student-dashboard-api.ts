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
import { apiRequest, hasApiBase } from "@/lib/api-client";
import { sampleQuiz } from "@/lib/sample-quiz";

type LmsListDTO<T> = {
  items?: T[];
};

type StudentAssignmentDTO = {
  id: string;
  classId?: string;
  quizId?: string;
  subjectId?: string;
  status: string;
  dueAt?: string;
  createdAt?: string;
  updatedAt?: string;
  teacherNote?: string;
};

type StudentScoreDTO = {
  assignment: StudentAssignmentDTO;
  bestScore: number;
  recentAttemptsTop3?: Array<{
    id: string;
    score: number;
    maxScore: number;
    percent: number;
    submittedAt?: string;
    updatedAt?: string;
  }>;
};

export type StudentDashboardApiData = {
  assignments: StudentDashboardAssignment[];
  profile: StudentDashboardProfile;
  teacherAnnouncements: StudentTeacherAnnouncement[];
};

export async function loadStudentDashboardData(): Promise<StudentDashboardApiData> {
  const session = getCurrentElearningViewerSession();

  if (!hasApiBase()) {
    return {
      assignments: studentAssignments,
      profile: mergeProfileSession(studentDashboardProfile, session, studentAssignments.length),
      teacherAnnouncements: studentTeacherAnnouncements,
    };
  }

  const [assignmentsResponse, scoresResponse] = await Promise.all([
    apiRequest<LmsListDTO<StudentAssignmentDTO>>("/api/lms/students/me/assignments"),
    apiRequest<LmsListDTO<StudentScoreDTO>>("/api/lms/students/me/scores"),
  ]);
  const scores = scoresResponse.items ?? [];
  const assignments = (assignmentsResponse.items ?? []).map((assignment, index) => mapAssignment(assignment, scores, index));
  const submittedCount = assignments.filter((assignment) => assignment.status === "submitted").length;

  return {
    assignments: assignments.length ? assignments : studentAssignments,
    profile: mergeProfileSession(
      {
        ...studentDashboardProfile,
        completedAssignments: submittedCount,
        totalAssignments: assignments.length || studentDashboardProfile.totalAssignments,
      },
      session,
      assignments.length,
    ),
    teacherAnnouncements: [],
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

function mapAssignment(
  assignment: StudentAssignmentDTO,
  scores: StudentScoreDTO[],
  index: number,
): StudentDashboardAssignment {
  const score = scores.find((item) => item.assignment.id === assignment.id);
  const status = normalizeStatus(assignment.status, assignment.dueAt);
  const latestAttempt = score?.recentAttemptsTop3?.[0];
  const maxScore = Math.round(latestAttempt?.maxScore ?? 100);
  const bestScore = score ? Math.round(score.bestScore) : null;
  const progressRate = status === "submitted" ? 100 : status === "in_progress" ? 67 : status === "overdue" ? 35 : 0;

  return {
    id: assignment.id,
    quizId: assignment.quizId || sampleQuiz.id,
    title: assignment.quizId ? `Bài tập ${assignment.quizId}` : `Bài tập ${index + 1}`,
    subtitle: assignment.teacherNote || "Bài tập từ LMS ERG",
    subjectLabel: subjectLabelFor(index),
    teacherName: "Giáo viên ERG",
    status,
    progressRate,
    answeredCount: status === "not_started" ? 0 : Math.max(1, Math.round((progressRate / 100) * 10)),
    totalQuestions: 10,
    score: bestScore,
    maxScore,
    dueLabel: assignment.dueAt ? formatDueLabel(assignment.dueAt) : "Chưa có hạn nộp",
    statusLabel: statusLabelFor(status),
    lastActivityLabel: assignment.updatedAt ? formatDateTimeLabel(assignment.updatedAt) : "Chưa có hoạt động",
    focusNote: assignment.teacherNote || "Theo dõi tiến độ và hoàn thành bài theo lịch được giao.",
    attempts: score
      ? [
          {
            id: `attempt-${assignment.id}`,
            score: Math.round(score.bestScore),
            maxScore,
            completedAtLabel: latestAttempt?.submittedAt || latestAttempt?.updatedAt ? formatDateTimeLabel(latestAttempt.submittedAt ?? latestAttempt.updatedAt ?? "") : "Đã nộp",
            durationLabel: "20 phút",
          },
        ]
      : [],
  };
}

function normalizeStatus(status: string, dueAt?: string): StudentAssignmentStatus {
  const normalized = status.toLowerCase();
  if (normalized === "submitted" || normalized === "completed") return "submitted";
  if (dueAt && new Date(dueAt).getTime() < Date.now() && normalized !== "submitted") return "overdue";
  if (normalized === "in_progress" || normalized === "doing") return "in_progress";
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
