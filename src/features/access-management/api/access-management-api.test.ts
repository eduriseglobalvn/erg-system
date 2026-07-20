import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  getBackOfficePortal: vi.fn(() => "lcms"),
}));

vi.mock("@/lib/api-client", () => ({
  apiRequest: mocks.apiRequest,
  getBackOfficePortal: mocks.getBackOfficePortal,
}));

describe("DB-backed access management API", () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
    mocks.getBackOfficePortal.mockClear();
  });

  test("loads the permission catalog with server-side filters and pagination", async () => {
    mocks.apiRequest.mockResolvedValueOnce({ items: [], page: 2, limit: 50, total: 0, totalPages: 0 });
    const { listPermissions } = await import("@/features/access-management/api/access-management-api");

    await listPermissions({
      page: 2,
      limit: 50,
      search: "assignment create",
      group: "lms",
      portal: "lcms",
      status: "ACTIVE",
      used: true,
    });

    expect(mocks.apiRequest).toHaveBeenCalledWith(
      "/api/v1/permissions/catalog?page=2&limit=50&search=assignment+create&group=lms&portal=lcms&status=ACTIVE&used=true",
      { portal: "lcms", auth: "required" },
    );
  });

  test("encodes dynamic role route segments from the contract", async () => {
    const { accessManagementRoutes } = await import("@/features/access-management/api/access-management-routes");
    expect(accessManagementRoutes.role("role/1")).toBe("/api/v1/roles/role%2F1");
  });

  test("uses only canonical v1 REST endpoints for permission groups and roles", async () => {
    mocks.apiRequest.mockResolvedValue([]);
    const {
      createRole,
      deleteRole,
      assignScopedUserRole,
      revokeScopedUserRole,
      getPermission,
      listPermissionGroups,
      listRoles,
      updateRole,
    } = await import("@/features/access-management/api/access-management-api");

    await getPermission("perm/lms.read");
    await listPermissionGroups();
    await listRoles();
    await createRole({ name: "pdt_operator", description: "PDT", permissions: ["lms.class.read"] });
    await updateRole("role/1", { description: "Updated", permissions: ["lms.class.read"] });
    await deleteRole("role/1");
    await assignScopedUserRole("user/1", { roleId: "role/1", scopeType: "SCHOOL", scopeId: "school-1" });
    await revokeScopedUserRole("user/1", "assignment/1", "Chuyển bộ phận");

    expect(mocks.apiRequest.mock.calls.map(([path]) => path)).toEqual([
      "/api/v1/permissions/perm%2Flms.read",
      "/api/v1/permission-groups",
      "/api/v1/roles",
      "/api/v1/roles",
      "/api/v1/roles/role%2F1",
      "/api/v1/roles/role%2F1",
      "/api/v1/users/user%2F1/role-assignments",
      "/api/v1/users/user%2F1/role-assignments/assignment%2F1",
    ]);
    expect(mocks.apiRequest.mock.calls[3]?.[1]).toMatchObject({ method: "POST" });
    expect(mocks.apiRequest.mock.calls[4]?.[1]).toMatchObject({ method: "PUT" });
    expect(mocks.apiRequest.mock.calls[5]?.[1]).toMatchObject({ method: "DELETE" });
    expect(mocks.apiRequest.mock.calls[6]?.[1]).toMatchObject({ method: "POST" });
    expect(mocks.apiRequest.mock.calls[7]?.[1]).toMatchObject({ method: "DELETE" });
  });

  test("does not fall back to GraphQL or mock data when the REST catalog fails", async () => {
    const failure = new Error("catalog unavailable");
    mocks.apiRequest.mockRejectedValueOnce(failure);
    const { listPermissions } = await import("@/features/access-management/api/access-management-api");

    await expect(listPermissions({ page: 0, limit: 25 })).rejects.toBe(failure);
    expect(mocks.apiRequest).toHaveBeenCalledTimes(1);
  });

  test("scopes query keys by tenant and every server-side filter", async () => {
    const { accessManagementQueryKeys } = await import("@/features/access-management/api/access-management-api");
    const filters = { page: 1, limit: 25, search: "teacher", group: "lms", portal: "lms", status: "ACTIVE" };

    expect(accessManagementQueryKeys.permissions("tenant-a", filters)).toEqual([
      "access-management",
      "tenant-a",
      "permissions",
      filters,
    ]);
    expect(accessManagementQueryKeys.permission("tenant-a", "perm-1")).toEqual([
      "access-management",
      "tenant-a",
      "permission",
      "perm-1",
    ]);
    expect(accessManagementQueryKeys.roles("tenant-a")).toEqual(["access-management", "tenant-a", "roles"]);
  });
});
