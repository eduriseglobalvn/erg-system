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

vi.mock("@/features/elearning/student-dashboard/api/student-dashboard-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/elearning/student-dashboard/api/student-dashboard-api")>()),
  loadStudentDashboardData: mocks.loadStudentDashboardData,
}));

const loadStudentDashboardDataMock = vi.mocked(loadStudentDashboardData);

beforeEach(() => {
  loadStudentDashboardDataMock.mockReset();
  loadStudentDashboardDataMock.mockResolvedValue({
    assignments: [],
    assignmentsHasMore: false,
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

test("a longer assignment list gets its own key under the workspace prefix that invalidation targets", async () => {
  const scope = { tenantId: "tenant-a", accountId: "account-a" };
  const workspace = studentDashboardQueryKeys.workspace(scope);
  expect(studentDashboardQueryOptions({ ...scope, assignmentLimit: 50 }).queryKey).toEqual(workspace);
  const longer = studentDashboardQueryOptions({ ...scope, assignmentLimit: 100 });
  expect(longer.queryKey).toEqual([...workspace, 100]);

  await longer.queryFn({ signal: new AbortController().signal });
  expect(loadStudentDashboardDataMock).toHaveBeenCalledWith(expect.objectContaining({ assignmentLimit: 100, tenantId: "tenant-a" }));
});

test("passes TanStack cancellation and tenant scope to the API", async () => {
  const signal = new AbortController().signal;
  const options = studentDashboardQueryOptions({ tenantId: "tenant-a", accountId: "account-a" });

  await options.queryFn({ signal });

  expect(loadStudentDashboardDataMock).toHaveBeenCalledWith({ signal, tenantId: "tenant-a" });
  // A teacher can assign while the student's tab is open, so the dashboard is stale after 30s and refetches on focus.
  expect(options.staleTime).toBe(30_000);
  expect(options.gcTime).toBe(QUERY_POLICIES.offlineCore.gcTime);
  expect(options.refetchOnWindowFocus).toBe(true);
});

test("builds an API loading profile only from the active viewer session", () => {
  expect(createStudentDashboardLoadingProfile({
    id: "student-session",
    name: "Session Student",
    className: "7A",
    schoolName: "school-session",
    title: undefined,
    viewerKind: "student",
  })).toEqual({
    id: "student-session",
    name: "Session Student",
    className: "7A",
    gradeLabel: "Khối 7",
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
