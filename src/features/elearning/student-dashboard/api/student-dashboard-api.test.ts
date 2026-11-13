import { describe, expect, test, vi, beforeEach } from "vitest";

import { studentAssignments, studentTeacherAnnouncements } from "@/test/fixtures/mock-student-dashboard";
import { gradeLabelFromClassName, loadStudentDashboardData } from "@/features/elearning/student-dashboard/api/student-dashboard-api";
import ElearningStudentDashboardDocument from "@/features/elearning/student-dashboard/api/student-dashboard.graphql?raw";
import { graphQlRequest } from "@/lib/graphql-client";
import { hasApiBase } from "@/lib/api-client";
import { ResponseValidationError } from "@/lib/validate-response";

const mocks = vi.hoisted(() => ({
  getCurrentElearningViewerSession: vi.fn(() => null),
  getDefaultTenantId: vi.fn(() => "tenant-a"),
  graphQlRequest: vi.fn(),
  hasApiBase: vi.fn(),
}));

vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api-client")>(),
  hasApiBase: mocks.hasApiBase,
}));

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: mocks.getDefaultTenantId,
  graphQlRequest: mocks.graphQlRequest,
}));

vi.mock("@/platform/auth/api/elearning-viewer-session", () => ({
  getCurrentElearningViewerSession: mocks.getCurrentElearningViewerSession,
}));

const hasApiBaseMock = vi.mocked(hasApiBase);
const graphQlRequestMock = vi.mocked(graphQlRequest);

function dashboardResponse(overrides: Record<string, unknown> = {}) {
  return {
    elearning: {
      studentDashboard: {
        tenantId: "tenant-a",
        viewer: {
          userId: "student-a",
          tenantId: "tenant-a",
          accountType: "STUDENT",
          accessLevel: "LEARNER",
        },
        profile: {
          userId: "student-a",
          studentId: "student-a",
          studentCode: "STU-A",
          fullName: "Student A",
          email: "student-a@example.test",
          schoolId: "school-a",
          academicClassId: "class-a",
          status: "ACTIVE",
          updatedAt: "2026-07-28T00:00:00Z",
        },
        summary: {
          activeAssignmentCount: 0,
          enrolledCourseCount: 0,
          pendingActionCount: 0,
          generatedAt: "2026-07-28T00:00:00Z",
          scoreSummary: {
            attemptedAssignmentCount: 0,
            averagePercent: 0,
            bestPercent: 0,
            completedAttemptCount: 0,
            passedAttemptCount: 0,
          },
        },
        courses: [],
        assignments: [],
        nextActions: [],
        announcements: [],
        ...overrides,
      },
    },
  } as never;
}

describe("student dashboard API", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    hasApiBaseMock.mockReset();
    graphQlRequestMock.mockReset();
    mocks.getCurrentElearningViewerSession.mockReset();
    mocks.getCurrentElearningViewerSession.mockReturnValue(null);
    mocks.getDefaultTenantId.mockReturnValue("tenant-a");
  });

  test("uses mock dashboard data only when the explicit dev fixture flag is enabled", async () => {
    hasApiBaseMock.mockReturnValue(false);
    vi.stubEnv("VITE_ENABLE_RUNTIME_FIXTURES", "true");

    const dashboard = await loadStudentDashboardData();

    expect(dashboard.assignments).toEqual(studentAssignments);
    expect(dashboard.teacherAnnouncements).toEqual(studentTeacherAnnouncements);
    expect(graphQlRequestMock).not.toHaveBeenCalled();
  });

  test("propagates GraphQL failures when API base is configured", async () => {
    hasApiBaseMock.mockReturnValue(true);
    graphQlRequestMock.mockRejectedValueOnce(new Error("permission denied"));

    await expect(loadStudentDashboardData()).rejects.toThrow("permission denied");
  });

  test("forwards AbortSignal and uses the checked-in GraphQL document", async () => {
    hasApiBaseMock.mockReturnValue(true);
    graphQlRequestMock.mockResolvedValueOnce(dashboardResponse());
    const signal = new AbortController().signal;

    await loadStudentDashboardData({ signal, tenantId: "tenant-b" });

    expect(graphQlRequestMock).toHaveBeenCalledWith(expect.objectContaining({
      operationName: "ElearningStudentDashboard",
      query: ElearningStudentDashboardDocument,
      signal,
      variables: { input: { tenantId: "tenant-b" } },
    }));
  });

  test("60 assignments: asks for more with assignmentLimit and reports when the backend holds more", async () => {
    hasApiBaseMock.mockReturnValue(true);
    const card = (index: number) => ({ id: `asg-${index}`, title: `Bài ${index}`, status: "active", dueAt: "2026-12-01T00:00:00Z" });
    const sixty = Array.from({ length: 60 }, (_, index) => card(index));
    graphQlRequestMock.mockResolvedValueOnce(dashboardResponse({ assignments: sixty.slice(0, 50), assignmentsHasMore: true }));
    graphQlRequestMock.mockResolvedValueOnce(dashboardResponse({ assignments: sixty, assignmentsHasMore: false }));

    const first = await loadStudentDashboardData({ tenantId: "tenant-a" });
    expect(first.assignments).toHaveLength(50);
    expect(first.assignmentsHasMore).toBe(true);
    expect(graphQlRequestMock).toHaveBeenLastCalledWith(expect.objectContaining({ variables: { input: { tenantId: "tenant-a" } } }));

    const more = await loadStudentDashboardData({ assignmentLimit: 100, tenantId: "tenant-a" });
    expect(more.assignments).toHaveLength(60);
    expect(more.assignmentsHasMore).toBe(false);
    expect(graphQlRequestMock).toHaveBeenLastCalledWith(expect.objectContaining({
      variables: { input: { tenantId: "tenant-a", assignmentLimit: 100 } },
    }));
  });

  test("keeps API-enabled empty dashboard empty instead of refilling mock assignments", async () => {
    hasApiBaseMock.mockReturnValue(true);
    graphQlRequestMock.mockResolvedValueOnce(dashboardResponse());

    const dashboard = await loadStudentDashboardData();

    expect(dashboard.assignments).toEqual([]);
    expect(dashboard.teacherAnnouncements).toEqual([]);
    expect(dashboard.profile.totalAssignments).toBe(0);
    expect(dashboard.profile.motivationPoints).toBeNull();
    expect(dashboard.profile.weeklyGoalProgress).toBeNull();
  });

  test("rejects a malformed dashboard bootstrap payload at the GraphQL boundary", async () => {
    hasApiBaseMock.mockReturnValue(true);
    graphQlRequestMock.mockResolvedValueOnce({ elearning: {} } as never);

    await expect(loadStudentDashboardData()).rejects.toBeInstanceOf(ResponseValidationError);
  });

  test("rejects malformed assignment rows before mapping", async () => {
    hasApiBaseMock.mockReturnValue(true);
    graphQlRequestMock.mockResolvedValueOnce(dashboardResponse({
      assignments: [{ id: 1, title: "Invalid assignment", status: "ACTIVE", dueAt: null }],
    }));

    await expect(loadStudentDashboardData()).rejects.toBeInstanceOf(ResponseValidationError);
  });

  test("does not leak mock profile identity when API fields are empty", async () => {
    hasApiBaseMock.mockReturnValue(true);
    graphQlRequestMock.mockResolvedValueOnce(dashboardResponse({
      profile: {
        userId: "student-empty",
        studentId: null,
        studentCode: null,
        fullName: null,
        email: null,
        schoolId: null,
        academicClassId: null,
        status: null,
        updatedAt: null,
      },
    }));

    const dashboard = await loadStudentDashboardData();

    expect(dashboard.profile.id).toBe("student-empty");
    expect(dashboard.profile.name).toBe("");
    expect(dashboard.profile.className).toBe("");
    expect(dashboard.profile.schoolName).toBe("");
  });

  test("does not derive quiz identity, progress, score, teacher, or attempts from dashboard-only fields", async () => {
    hasApiBaseMock.mockReturnValue(true);
    graphQlRequestMock.mockResolvedValueOnce(dashboardResponse({
      summary: {
        activeAssignmentCount: 1,
        enrolledCourseCount: 1,
        pendingActionCount: 1,
        generatedAt: "2026-07-28T00:00:00Z",
        scoreSummary: {
          attemptedAssignmentCount: 4,
          averagePercent: 86,
          bestPercent: 98,
          completedAttemptCount: 3,
          passedAttemptCount: 2,
        },
      },
      courses: [{ id: "course-a", title: "Course A", status: "ACTIVE", progressPercent: 80, updatedAt: null }],
      assignments: [{
        id: "assignment-a",
        title: "Assignment A",
        status: "IN_PROGRESS",
        dueAt: "2099-01-01T00:00:00Z",
      }],
      nextActions: [{
        id: "assignment-a:next",
        kind: "assignment",
        label: "Continue Assignment A",
        targetId: "assignment-a",
        dueAt: "2099-01-01T00:00:00Z",
      }],
    }));

    const dashboard = await loadStudentDashboardData();
    const [assignment] = dashboard.assignments;

    expect(assignment).toMatchObject({
      id: "assignment-a",
      title: "Assignment A",
      status: "in_progress",
      dueLabel: expect.stringContaining("01/01/2099"),
      focusNote: "Continue Assignment A",
    });
    expect(assignment.quizId).toBeUndefined();
    expect(assignment.subjectLabel).toBeUndefined();
    expect(assignment.teacherName).toBeUndefined();
    expect(assignment.progressRate).toBeNull();
    expect(assignment.answeredCount).toBeNull();
    expect(assignment.totalQuestions).toBeNull();
    expect(assignment.score).toBeNull();
    expect(assignment.maxScore).toBeNull();
    expect(assignment.attempts).toEqual([]);
  });

  test("uses only the backend assignment-to-quiz identity when it is published", async () => {
    hasApiBaseMock.mockReturnValue(true);
    graphQlRequestMock.mockResolvedValueOnce(dashboardResponse({
      assignments: [{
        id: "assignment-a",
        quizId: "quiz-a",
        title: "Assignment A",
        status: "ACTIVE",
        dueAt: null,
      }],
    }));

    const dashboard = await loadStudentDashboardData();

    expect(dashboard.assignments[0]?.quizId).toBe("quiz-a");
  });

  test("does not treat a due date as learner activity", async () => {
    hasApiBaseMock.mockReturnValue(true);
    graphQlRequestMock.mockResolvedValueOnce(dashboardResponse({
      assignments: [{ id: "assignment-a", title: "Assignment A", status: "ACTIVE", dueAt: "2099-01-01T00:00:00Z" }],
    }));

    const dashboard = await loadStudentDashboardData();

    expect(dashboard.assignments[0]?.lastActivityLabel).toBe("Chưa có hoạt động");
  });

  test("files an assignment under Đã nộp only from the server handedIn flag, never from the status string", async () => {
    hasApiBaseMock.mockReturnValue(true);
    graphQlRequestMock.mockResolvedValueOnce(dashboardResponse({
      assignments: [
        { id: "a", title: "A", status: "graded", handedIn: true, dueAt: "2099-01-01T00:00:00Z", scorePercent: 79.6, submittedAt: "2026-11-10T03:00:00Z" },
        { id: "b", title: "B", status: "a_future_server_state", handedIn: true, dueAt: "2000-01-01T00:00:00Z", scorePercent: 40, submittedAt: null },
        { id: "c", title: "C", status: "in_progress", handedIn: false, dueAt: null, scorePercent: null, submittedAt: null },
        { id: "d", title: "D", status: "done", handedIn: false, dueAt: null, scorePercent: null, submittedAt: null },
      ],
    }));

    const [graded, futureState, open, notHandedIn] = (await loadStudentDashboardData()).assignments;

    expect(graded).toMatchObject({ status: "submitted", score: 80, maxScore: 100 });
    expect(graded?.lastActivityLabel).toContain("Nộp lúc 10/11/2026");
    // Past due, but handed in: the flag wins over the due date and over an unknown state string.
    expect(futureState).toMatchObject({ status: "submitted", score: 40 });
    expect(open).toMatchObject({ status: "in_progress", score: null, maxScore: null });
    expect(notHandedIn).toMatchObject({ status: "not_started" });
  });
});

describe("gradeLabelFromClassName", () => {
  test("derives the grade from class names and ignores ids", () => {
    expect(gradeLabelFromClassName("7A")).toBe("Khối 7");
    expect(gradeLabelFromClassName("Lớp 10C2")).toBe("Khối 10");
    expect(gradeLabelFromClassName("3f2a9c10-1b7d-4e55-9a00-0123456789ab")).toBe("");
    expect(gradeLabelFromClassName("")).toBe("");
    expect(gradeLabelFromClassName(undefined)).toBe("");
  });
});
