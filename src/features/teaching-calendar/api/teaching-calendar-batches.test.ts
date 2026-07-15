import { beforeEach, describe, expect, it, vi } from "vitest";

const { graphQlRequest } = vi.hoisted(() => ({ graphQlRequest: vi.fn() }));

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: () => "tenant-default",
  graphQlRequest,
}));

import {
  loadTeachingScheduleBatchDetail,
  loadTeachingScheduleBatches,
  teachingCalendarQueryKeys,
} from "./teaching-calendar-api";

describe("teaching schedule batches", () => {
  beforeEach(() => graphQlRequest.mockReset());

  it("loads a tenant-scoped LCMS batch page with the typed contract", async () => {
    const page = {
      hasNext: false,
      hasPrevious: false,
      items: [{ applyFrom: "2026-07-13", createdAt: "2026-07-13T08:00:00Z", id: "batch-1", repeatWeeks: 2, schoolId: "school-1", status: "DRAFT" }],
      page: 0,
      size: 20,
      totalItems: 1,
      totalPages: 1,
    };
    graphQlRequest.mockResolvedValue({ lcms: { teachingScheduleBatches: page } });

    await expect(loadTeachingScheduleBatches({ page: 0, size: 20, status: "DRAFT", tenantId: "tenant-a" })).resolves.toEqual(page);
    expect(graphQlRequest).toHaveBeenCalledWith(expect.objectContaining({
      operationName: "TEACHING_SCHEDULE_BATCHES",
      portal: "lcms",
      tenantId: "tenant-a",
      variables: { input: { page: 0, size: 20, status: "DRAFT", tenantId: "tenant-a" } },
    }));
  });

  it("scopes batch query keys by tenant and filters", () => {
    expect(teachingCalendarQueryKeys.batches("lcms", { page: 0, schoolId: "school-a", size: 20, status: "DRAFT", tenantId: "tenant-a" })).toEqual([
      "teaching-calendar", "lcms", "tenant-a", "batches", "school-a", "DRAFT", 0, 20,
    ]);
  });

  it("loads a tenant-scoped LCMS batch detail", async () => {
    const detail = {
      applyFrom: "2026-07-13",
      createdAt: "2026-07-13T08:00:00Z",
      eventCount: 12,
      id: "batch-1",
      repeatWeeks: 2,
      schoolId: "school-1",
      status: "DRAFT",
      tenantId: "tenant-a",
    };
    graphQlRequest.mockResolvedValue({ lcms: { teachingScheduleBatch: detail } });

    await expect(loadTeachingScheduleBatchDetail({ batchId: "batch-1", tenantId: "tenant-a" })).resolves.toEqual(detail);
    expect(graphQlRequest).toHaveBeenCalledWith(expect.objectContaining({
      operationName: "TEACHING_SCHEDULE_BATCH_DETAIL",
      portal: "lcms",
      tenantId: "tenant-a",
      variables: { input: { batchId: "batch-1", tenantId: "tenant-a" } },
    }));
    expect(teachingCalendarQueryKeys.batchDetail("lcms", "tenant-a", "batch-1")).toEqual([
      "teaching-calendar", "lcms", "tenant-a", "batch-detail", "batch-1",
    ]);
  });
});
