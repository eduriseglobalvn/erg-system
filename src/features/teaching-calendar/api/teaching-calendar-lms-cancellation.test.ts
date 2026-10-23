import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  graphQlRequest: vi.fn(),
}));

vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/api-client")>(),
  apiRequest: mocks.apiRequest,
  hasApiBase: () => true,
}));

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: () => "tenant-default",
  graphQlRequest: mocks.graphQlRequest,
}));

import {
  loadLmsMyTeachingCalendar,
  loadTeachingCalendarReferenceCatalog,
} from "@/features/teaching-calendar/api/teaching-calendar-api";

describe("LMS teaching calendar cancellation", () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
    mocks.graphQlRequest.mockReset();
  });

  it("forwards signal to the LMS GraphQL workspace", async () => {
    const signal = new AbortController().signal;
    mocks.graphQlRequest.mockResolvedValueOnce({
      lms: {
        myTeachingCalendar: {
          catalog: {},
          events: [],
          filterOptions: {},
          laneSummaries: [],
        },
      },
    });

    await loadLmsMyTeachingCalendar({ from: "2026-07-28", tenantId: "tenant-a", to: "2026-08-04" }, signal);

    expect(mocks.graphQlRequest).toHaveBeenCalledWith(expect.objectContaining({ signal }));
  });

  it("forwards signal to the LMS reference catalog REST fallback chain", async () => {
    const signal = new AbortController().signal;
    mocks.apiRequest.mockResolvedValueOnce({
      items: [{ id: "school-a", name: "School A", type: "SCHOOL" }],
    });

    await loadTeachingCalendarReferenceCatalog("lms", signal);

    expect(mocks.apiRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ portal: "lms", signal }),
    );
  });
});
