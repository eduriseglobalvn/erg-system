import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api-client")>(),
  apiRequest: mocks.apiRequest,
  hasApiBase: () => true,
}));

import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { loadTeachingCalendarReferenceCatalog } from "@/features/teaching-calendar/api/teaching-calendar-reference-catalog-api";

describe("teaching calendar reference catalog", () => {
  beforeEach(() => mocks.apiRequest.mockReset());

  it("keeps the scoped schools but shows organization names instead of raw ids", async () => {
    mocks.apiRequest.mockImplementation(async (path: string) => path === API_ENDPOINTS.lms.educationUnits
      ? { items: [{ id: "sch_tcd", name: "sch_tcd" }, { id: "sch_unknown", name: "sch_unknown" }, { id: "01a1-uuid", name: "01a1-uuid" }] }
      : { educationUnits: [
        { id: "sch_tcd", name: "THCS Trương Công Định", type: "school" },
        { id: "sch_other", name: "THCS Vân Đồn", type: "school" },
        { id: "01a1-uuid", name: "THCS Lê Lợi", type: "SECONDARY" },
      ] });

    const catalog = await loadTeachingCalendarReferenceCatalog("lcms");

    expect(catalog.schools).toEqual([
      { id: "sch_unknown", name: "sch_unknown" },
      { id: "01a1-uuid", name: "THCS Lê Lợi" },
      { id: "sch_tcd", name: "THCS Trương Công Định" },
    ]);
  });
});
