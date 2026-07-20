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
