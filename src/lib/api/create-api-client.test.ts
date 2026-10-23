import { expect, test, vi } from "vitest";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiRequest }));

test("domain client forwards explicit portal and auth policy", async () => {
  const { createApiClient } = await import("@/lib/api/create-api-client");
  apiRequest.mockResolvedValue({ ok: true });
  const client = createApiClient({ portal: "lcms", auth: "required" });

  await client.request("/api/v1/admin/users", { method: "GET" });

  expect(apiRequest).toHaveBeenCalledWith("/api/v1/admin/users", {
    method: "GET",
    portal: "lcms",
    auth: "required",
  });
});

test("typed operation serializes query and keeps the generated response contract", async () => {
  const { createApiClient } = await import("@/lib/api/create-api-client");
  apiRequest.mockResolvedValue({ data: { items: [] } });
  const client = createApiClient({ portal: "lcms", auth: "required" });

  const response = await client.operation("/api/v1/admin/users", "get", {
    query: { page: 2, limit: 20, search: "An" },
  });

  expect(response).toEqual({ data: { items: [] } });
  expect(apiRequest).toHaveBeenLastCalledWith("/api/v1/admin/users?page=2&limit=20&search=An", {
    portal: "lcms",
    auth: "required",
  });
});
