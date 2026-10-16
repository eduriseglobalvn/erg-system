import { beforeEach, describe, expect, test, vi } from "vitest";
import { ResponseValidationError } from "@/lib/validate-response";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  getBackOfficePortal: vi.fn(() => "lcms"),
}));

vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api-client")>(),
  apiRequest: mocks.apiRequest,
  getBackOfficePortal: mocks.getBackOfficePortal,
}));

describe("employee management API", () => {
  beforeEach(() => mocks.apiRequest.mockReset());

  test("uses canonical tenant-scoped admin endpoints for the full employee workflow", async () => {
    mocks.apiRequest
      .mockResolvedValue({})
      .mockResolvedValueOnce({ users: [], meta: { page: 1, limit: 25, total: 0, totalPages: 0 } });
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

  test("normalizes an unknown contract status before exposing the employee domain", async () => {
    mocks.apiRequest.mockResolvedValueOnce({
      users: [{ id: "user-1", email: "teacher@erg.edu.vn", fullName: "Teacher", roles: [], status: "FUTURE_STATUS" }],
      meta: { page: 0, limit: 25, total: 1, totalPages: 1 },
    });
    const { listEmployees } = await import("@/features/employee-management/api/employee-management-api");

    const result = await listEmployees({ page: 0, limit: 25 });

    expect(result.users[0]?.status).toBe("UNKNOWN");
  });

  test("rejects a malformed employee list at the transport boundary", async () => {
    mocks.apiRequest.mockResolvedValueOnce({ meta: { page: 0, limit: 25, total: 0, totalPages: 0 } });
    const { listEmployees } = await import("@/features/employee-management/api/employee-management-api");

    await expect(listEmployees({ page: 0, limit: 25 })).rejects.toBeInstanceOf(ResponseValidationError);
  });

  test("encodes dynamic user route segments from the contract", async () => {
    const { API_ENDPOINTS } = await import("@/lib/api/api-endpoints");
    expect(API_ENDPOINTS.adminUsers.detail("user/1")).toBe("/api/v1/admin/users/user%2F1");
  });

  test("forwards caller cancellation to employee reads", async () => {
    mocks.apiRequest
      .mockResolvedValueOnce({ users: [], meta: { page: 0, limit: 25, total: 0, totalPages: 0 } })
      .mockResolvedValueOnce({ id: "user-1" });
    const signal = new AbortController().signal;
    const { getEmployee, listEmployees } = await import("@/features/employee-management/api/employee-management-api");

    await listEmployees({ page: 0, limit: 25 }, signal);
    await getEmployee("user-1", signal);

    expect(mocks.apiRequest.mock.calls[0]?.[1]).toMatchObject({ signal });
    expect(mocks.apiRequest.mock.calls[1]?.[1]).toMatchObject({ signal });
  });
});
