import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { AuditTrailWorkspace } from "@/features/audit/components/audit-trail-workspace";
import { listAuditEvents } from "@/features/audit/api/audit-api";

vi.mock("@/features/audit/api/audit-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/audit/api/audit-api")>()),
  listAuditEvents: vi.fn(),
}));
vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-client")>()),
  hasApiBase: () => true,
  isBffAuthEnabled: () => true,
}));

const UUID = "01a171e6-1111-4222-8333-444455556666";

function renderWorkspace() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><AuditTrailWorkspace /></QueryClientProvider>);
}

afterEach(() => vi.clearAllMocks());

test("shows an inline error with retry instead of a skeleton when the API fails", async () => {
  vi.mocked(listAuditEvents).mockRejectedValueOnce(new Error("HTTP 500"));
  vi.mocked(listAuditEvents).mockResolvedValueOnce({ hasNext: false, items: [], page: 0, size: 25, totalElements: 0, totalPages: 0 });
  renderWorkspace();
  expect(await screen.findByText("Không thể tải nhật ký")).toBeTruthy();
  expect(document.querySelector(".MuiSkeleton-root")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
  await waitFor(() => expect(listAuditEvents).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByText("Không thể tải nhật ký")).toBeNull());
});

test("renders no raw UUIDs and formats time as dd/MM/yyyy", async () => {
  vi.mocked(listAuditEvents).mockResolvedValue({
    hasNext: false,
    items: [{ action: "UPDATE", id: "e1", occurredAt: "2026-03-07T10:05:00", outcome: "SUCCESS", resourceId: UUID, resourceType: "SCHOOL", scopeId: UUID, scopeType: "SCHOOL", details: {} }],
    page: 0,
    size: 25,
    totalElements: 1,
    totalPages: 1,
  });
  const { container } = renderWorkspace();
  expect(await screen.findByText("UPDATE")).toBeTruthy();
  expect(container.textContent).not.toContain(UUID);
  expect(container.textContent).not.toContain("01a171e6");
  expect(container.textContent).toContain("07/03/2026 10:05");
});

test("filter bar has Áp dụng as the contained button and Đặt lại as text", async () => {
  vi.mocked(listAuditEvents).mockResolvedValue({ hasNext: false, items: [], page: 0, size: 25, totalElements: 0, totalPages: 0 });
  renderWorkspace();
  expect(screen.getByRole("button", { name: "Áp dụng" }).className).toContain("MuiButton-contained");
  expect(screen.getByRole("button", { name: "Đặt lại" }).className).toContain("MuiButton-text");
  expect(document.querySelector('input[type="date"]')).toBeNull();
});
