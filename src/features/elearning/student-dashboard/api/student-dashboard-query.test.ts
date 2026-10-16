import { beforeEach, expect, test, vi } from "vitest";

import {
  createStudentDashboardLoadingProfile,
  studentDashboardQueryKeys,
  studentDashboardQueryOptions,
} from "@/features/elearning/student-dashboard/api/student-dashboard-query";
import { loadStudentDashboardData } from "@/features/elearning/student-dashboard/api/student-dashboard-api";
import { QUERY_POLICIES } from "@/lib/query-policy";

const mocks = vi.hoisted(() => ({
  loadStudentDashboardData: vi.fn(),
}));

vi.mock("@/features/elearning/student-dashboard/api/student-dashboard-api", () => ({
  loadStudentDashboardData: mocks.loadStudentDashboardData,
}));

const loadStudentDashboardDataMock = vi.mocked(loadStudentDashboardData);

beforeEach(() => {
  loadStudentDashboardDataMock.mockReset();
  loadStudentDashboardDataMock.mockResolvedValue({
    assignments: [],
    profile: {
      id: "student-a",
      name: "Student A",
      className: "class-a",
      gradeLabel: "",
      schoolName: "school-a",
      homeroomTeacher: "",
      averageScore: 0,
      completedAssignments: 0,
      totalAssignments: 0,
      motivationPoints: 0,
      weeklyGoalProgress: 0,
    },
    teacherAnnouncements: [],
  });
});

test("isolates dashboard cache by tenant and account", () => {
  const baseline = studentDashboardQueryKeys.workspace({ tenantId: "tenant-a", accountId: "account-a" });

  expect(baseline).not.toEqual(
    studentDashboardQueryKeys.workspace({ tenantId: "tenant-b", accountId: "account-a" }),
  );
  expect(baseline).not.toEqual(
    studentDashboardQueryKeys.workspace({ tenantId: "tenant-a", accountId: "account-b" }),
  );
  expect(studentDashboardQueryKeys.workspace({ tenantId: " tenant-a ", accountId: " account-a " }))
    .toEqual(baseline);
});

test("passes TanStack cancellation and tenant scope to the API", async () => {
  const signal = new AbortController().signal;
  const options = studentDashboardQueryOptions({ tenantId: "tenant-a", accountId: "account-a" });

  await options.queryFn({ signal });

  expect(loadStudentDashboardDataMock).toHaveBeenCalledWith({ signal, tenantId: "tenant-a" });
  expect(options.staleTime).toBe(QUERY_POLICIES.offlineCore.staleTime);
  expect(options.gcTime).toBe(QUERY_POLICIES.offlineCore.gcTime);
  expect(options.refetchOnWindowFocus).toBe(false);
});

test("builds an API loading profile only from the active viewer session", () => {
  expect(createStudentDashboardLoadingProfile({
    id: "student-session",
    name: "Session Student",
    className: "class-session",
    schoolName: "school-session",
    title: undefined,
    viewerKind: "student",
  })).toEqual({
    id: "student-session",
    name: "Session Student",
    className: "class-session",
    gradeLabel: "",
    schoolName: "school-session",
    homeroomTeacher: "",
    averageScore: 0,
    completedAssignments: 0,
    totalAssignments: 0,
    motivationPoints: 0,
    weeklyGoalProgress: 0,
  });
  expect(createStudentDashboardLoadingProfile(null).name).toBe("");
});
