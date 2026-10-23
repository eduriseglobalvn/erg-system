import { beforeEach, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  hasApiBase: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  apiRequest: mocks.apiRequest,
  getBackOfficePortal: () => "admin",
  hasApiBase: mocks.hasApiBase,
}));

import { getCenters } from "@/features/lcms/admin-operations/api/centers-api";

beforeEach(() => {
  mocks.apiRequest.mockReset();
  mocks.hasApiBase.mockReset();
});

test("returns empty centers only when no API base is configured", async () => {
  mocks.hasApiBase.mockReturnValue(false);
  mocks.apiRequest.mockRejectedValueOnce(new Error("offline"));

  await expect(getCenters()).resolves.toEqual([]);
});

test("propagates API-enabled center load failures", async () => {
  mocks.hasApiBase.mockReturnValue(true);
  mocks.apiRequest.mockRejectedValueOnce(new Error("permission denied"));

  await expect(getCenters()).rejects.toThrow("permission denied");
});
