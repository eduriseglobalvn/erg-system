import { describe, expect, test, vi, beforeEach } from "vitest";

import { studentAssignments, studentTeacherAnnouncements } from "@/features/elearning/student-dashboard/api/mock-student-dashboard";
import { loadStudentDashboardData } from "@/features/elearning/student-dashboard/api/student-dashboard-api";
import { graphQlRequest } from "@/lib/graphql-client";
import { hasApiBase } from "@/lib/api-client";

const mocks = vi.hoisted(() => ({
  getCurrentElearningViewerSession: vi.fn(() => null),
  getDefaultTenantId: vi.fn(() => "tenant-a"),
  graphQlRequest: vi.fn(),
  hasApiBase: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
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

describe("student dashboard API", () => {
  beforeEach(() => {
    hasApiBaseMock.mockReset();
    graphQlRequestMock.mockReset();
    mocks.getCurrentElearningViewerSession.mockReset();
    mocks.getCurrentElearningViewerSession.mockReturnValue(null);
    mocks.getDefaultTenantId.mockReturnValue("tenant-a");
  });

  test("uses mock dashboard data only when no API base is configured", async () => {
    hasApiBaseMock.mockReturnValue(false);

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

  test("keeps API-enabled empty dashboard empty instead of refilling mock assignments", async () => {
    hasApiBaseMock.mockReturnValue(true);
    graphQlRequestMock.mockResolvedValueOnce({
      elearning: {
        studentDashboard: {
          assignments: [],
          announcements: [],
          courses: [],
          profile: {
            fullName: "Student A",
            studentId: "student-a",
          },
          summary: {
            activeAssignmentCount: 0,
            enrolledCourseCount: 0,
            scoreSummary: {
              attemptedAssignmentCount: 0,
              averagePercent: 0,
              completedAttemptCount: 0,
              passedAttemptCount: 0,
            },
          },
        },
      },
    } as never);

    const dashboard = await loadStudentDashboardData();

    expect(dashboard.assignments).toEqual([]);
    expect(dashboard.teacherAnnouncements).toEqual([]);
    expect(dashboard.profile.totalAssignments).toBe(0);
    expect(dashboard.profile.motivationPoints).toBe(0);
    expect(dashboard.profile.weeklyGoalProgress).toBe(0);
  });
});
