import { beforeEach, describe, expect, test, vi } from "vitest";

import { ApiClientError } from "@/lib/api-client";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  getBackOfficePortal: vi.fn(() => "lcms"),
  graphQlRequest: vi.fn(),
}));

vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-client")>()),
  apiRequest: mocks.apiRequest,
  getBackOfficePortal: mocks.getBackOfficePortal,
}));

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: vi.fn(() => "tenant-1"),
  graphQlRequest: mocks.graphQlRequest,
}));

describe("access managed users", () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
    mocks.graphQlRequest.mockReset();
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

  test("preserves cancellation and does not issue the legacy REST fallback", async () => {
    const controller = new AbortController();
    const abortError = new DOMException("cancelled", "AbortError");
    mocks.graphQlRequest.mockRejectedValueOnce(abortError);
    const { listAccessManagedUsers } = await import("@/features/lcms/admin-operations/api/access-management-api");

    await expect(listAccessManagedUsers({}, controller.signal)).rejects.toBe(abortError);

    expect(mocks.graphQlRequest).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    );
    expect(mocks.apiRequest).not.toHaveBeenCalled();
  });

  test("fails closed for permission errors instead of issuing the legacy REST fallback", async () => {
    const forbidden = new ApiClientError("Forbidden", "GRAPHQL_ERROR", 403);
    mocks.graphQlRequest.mockRejectedValueOnce(forbidden);
    const { listAccessManagedUsers } = await import("@/features/lcms/admin-operations/api/access-management-api");

    await expect(listAccessManagedUsers({})).rejects.toBe(forbidden);
    expect(mocks.apiRequest).not.toHaveBeenCalled();
  });

  test("never calls the removed REST user list, even when the GraphQL capability is unavailable", async () => {
    const unavailable = new ApiClientError("Not found", "GRAPHQL_ERROR", 404);
    mocks.graphQlRequest.mockRejectedValueOnce(unavailable);
    const { listAccessManagedUsers } = await import("@/features/lcms/admin-operations/api/access-management-api");

    await expect(listAccessManagedUsers({})).rejects.toBe(unavailable);
    expect(mocks.apiRequest).not.toHaveBeenCalled();
  });
});
