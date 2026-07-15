import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadDetail: vi.fn(),
  loadPage: vi.fn(),
}));

vi.mock("@/features/teaching-calendar/api/teaching-calendar-api", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/teaching-calendar/api/teaching-calendar-api")>(),
  loadTeachingScheduleBatchDetail: mocks.loadDetail,
  loadTeachingScheduleBatches: mocks.loadPage,
}));

import { TeachingScheduleBatchPanel } from "./teaching-schedule-batch-panel";

beforeEach(() => {
  mocks.loadPage.mockReset().mockResolvedValue({
    hasNext: false,
    hasPrevious: false,
    items: [{ applyFrom: "2026-07-13", createdAt: "2026-07-13T08:00:00Z", id: "batch-1", repeatWeeks: 2, schoolId: "school-1", status: "DRAFT" }],
    page: 0,
    size: 20,
    totalItems: 1,
    totalPages: 1,
  });
  mocks.loadDetail.mockReset().mockResolvedValue({
    applyFrom: "2026-07-13",
    createdAt: "2026-07-13T08:00:00Z",
    eventCount: 12,
    id: "batch-1",
    repeatWeeks: 2,
    schoolId: "school-1",
    status: "DRAFT",
    tenantId: "tenant-a",
  });
});

it("opens batch detail from the paginated batch table", async () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <TeachingScheduleBatchPanel permissions={{ canPublish: true }} tenantId="tenant-a" />
    </QueryClientProvider>,
  );

  fireEvent.click(await screen.findByRole("button", { name: "Xem đợt batch-1" }));
  await waitFor(() => expect(mocks.loadDetail).toHaveBeenCalledWith({ batchId: "batch-1", tenantId: "tenant-a" }));
  expect(await screen.findByText("12 sự kiện")).toBeInTheDocument();
});
