import { beforeEach, describe, expect, test, vi } from "vitest";

import { LMS_ROLE_GROUP_TEMPLATES } from "@/platform/auth/permissions/lms-permission-catalog";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  getBackOfficePortal: vi.fn(() => "lcms"),
  graphQlRequest: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  apiRequest: mocks.apiRequest,
  getBackOfficePortal: mocks.getBackOfficePortal,
}));

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: vi.fn(() => "tenant-1"),
  graphQlRequest: mocks.graphQlRequest,
}));

function completeOptions() {
  return {
    scopes: [],
    modules: [{ id: "lms", name: "LMS", description: "Learning management" }],
    roleGroups: Object.entries(LMS_ROLE_GROUP_TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.name,
      scopeTypes: ["school"],
      permissions: [...template.permissions],
    })),
  };
}

describe("access management options", () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
    mocks.graphQlRequest.mockReset();
  });

  test("accepts an LMS catalog containing every required teacher role group and permission", async () => {
    mocks.apiRequest.mockResolvedValueOnce(completeOptions());
    const { getAccessManagementOptions } = await import("@/features/lcms/admin-operations/api/access-management-api");

    const options = await getAccessManagementOptions();

    expect(options.modules.some((module) => module.id === "lms")).toBe(true);
    expect(options.roleGroups.map((roleGroup) => roleGroup.id).sort()).toEqual(Object.keys(LMS_ROLE_GROUP_TEMPLATES).sort());
  });

  test("rejects backend options when an LMS role group is missing", async () => {
    const options = completeOptions();
    options.roleGroups = options.roleGroups.filter((roleGroup) => roleGroup.id !== "lms_teacher_readonly");
    mocks.apiRequest.mockResolvedValueOnce(options);
    const { getAccessManagementOptions } = await import("@/features/lcms/admin-operations/api/access-management-api");

    await expect(getAccessManagementOptions()).rejects.toThrow("lms_teacher_readonly");
  });

  test("rejects backend options when a required LMS permission is missing", async () => {
    const options = completeOptions();
    options.roleGroups = options.roleGroups.map((roleGroup) => ({
      ...roleGroup,
      permissions: roleGroup.permissions.filter((permission) => permission !== "lms.dashboard.read"),
    }));
    mocks.apiRequest.mockResolvedValueOnce(options);
    const { getAccessManagementOptions } = await import("@/features/lcms/admin-operations/api/access-management-api");

    await expect(getAccessManagementOptions()).rejects.toThrow("lms.dashboard.read");
  });

  test("does not infer roles or scope level from permission text and aggregate counts", async () => {
    mocks.graphQlRequest.mockResolvedValueOnce({
      lcms: {
        accessManagementWorkspace: {
          effectivePermissionsIncluded: true,
          users: {
            items: [
              {
                userId: "teacher-1",
                fullName: "Teacher One",
                email: "teacher@erg.edu.vn",
                status: "ACTIVE",
                roleCount: 2,
                scopeCount: 3,
                effectivePermissions: [{ permission: "lms.dashboard.read", source: "teacher_admin_system" }],
              },
            ],
            page: 0,
            size: 20,
            totalItems: 1,
          },
        },
      },
    });
    const { listAccessManagedUsers } = await import("@/features/lcms/admin-operations/api/access-management-api");

    const result = await listAccessManagedUsers({});

    expect(result.items[0]?.roles).toEqual([]);
    expect(result.items[0]?.accessSummary.highestScope).toBe("none");
    expect(result.items[0]?.accessSummary.warnings).toContain("ACCESS_METADATA_INCOMPLETE");
  });
});
