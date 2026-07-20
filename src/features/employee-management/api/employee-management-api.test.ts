import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  getBackOfficePortal: vi.fn(() => "lcms"),
}));

vi.mock("@/lib/api-client", () => ({
  apiRequest: mocks.apiRequest,
  getBackOfficePortal: mocks.getBackOfficePortal,
}));

describe("employee management API", () => {
  beforeEach(() => mocks.apiRequest.mockReset());

  test("uses canonical tenant-scoped admin endpoints for the full employee workflow", async () => {
    mocks.apiRequest.mockResolvedValue({});
    const api = await import("@/features/employee-management/api/employee-management-api");

    await api.listEmployees({ page: 1, limit: 25, search: "teacher", status: "ACTIVE", role: "lms_teacher" });
    await api.getEmployee("user/1");
    await api.updateEmployee("user/1", { fullName: "Teacher One" });
    await api.updateEmployeeStatus("user/1", "INACTIVE");
    await api.assignEmployeeRoles("user/1", ["lms_teacher"]);
    await api.resetEmployeeCredential("user/1", "ONE_TIME_PASSWORD");
    await api.listEmployeeActivity("user/1", 1, 20);
    await api.listEmployeeSecurityEvents("user/1", 1, 20);
    await api.listEmployeeSecurityFeed({ page: 1, limit: 50, sourceType: "LOGIN_ATTEMPT" });
    await api.listEmployeeSessions("user/1");
    await api.revokeEmployeeSession("user/1", "session-1");

    expect(mocks.apiRequest.mock.calls.map(([path]) => path)).toEqual([
      "/api/v1/admin/users?page=1&limit=25&search=teacher&status=ACTIVE&role=lms_teacher",
      "/api/v1/admin/users/user%2F1",
      "/api/v1/admin/users/user%2F1",
      "/api/v1/admin/users/user%2F1/status",
      "/api/v1/admin/users/user%2F1/roles",
      "/api/v1/admin/users/user%2F1/reset-credential",
      "/api/v1/admin/users/user%2F1/activity?page=1&limit=20",
      "/api/v1/admin/users/user%2F1/security-events?page=1&limit=20",
      "/api/v1/admin/users/security-feed?page=1&limit=50&sourceType=LOGIN_ATTEMPT",
      "/api/v1/admin/users/user%2F1/sessions",
      "/api/v1/admin/users/user%2F1/sessions/revoke",
    ]);
    expect(mocks.apiRequest.mock.calls.every(([path]) => !String(path).startsWith("/api/users/"))).toBe(true);
  });

  test("includes tenant filters pagination and role in employee query keys", async () => {
    const { employeeManagementQueryKeys } = await import("@/features/employee-management/api/employee-management-api");
    const filters = { page: 2, limit: 50, search: "IT", status: "ACTIVE", role: "it_operator" };
    expect(employeeManagementQueryKeys.list("tenant-a", filters)).toEqual([
      "employee-management",
      "tenant-a",
      "list",
      filters,
    ]);
    expect(employeeManagementQueryKeys.securityEvents("tenant-a", "user-1", 1, 20)).toEqual([
      "employee-management", "tenant-a", "security-events", "user-1", 1, 20,
    ]);
    expect(employeeManagementQueryKeys.securityFeed("tenant-a", { page: 1, limit: 50, sourceType: "LOGIN_ATTEMPT" })).toEqual([
      "employee-management", "tenant-a", "security-feed", { page: 1, limit: 50, sourceType: "LOGIN_ATTEMPT" },
    ]);
  });

  test("encodes dynamic user route segments from the contract", async () => {
    const { employeeManagementRoutes } = await import("@/features/employee-management/api/employee-management-routes");
    expect(employeeManagementRoutes.user("user/1")).toBe("/api/v1/admin/users/user%2F1");
  });
});
