import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RequestView } from "../../api/timekeeping-types";
import { MyRequestsPage } from "./my-requests-page";

const h = vi.hoisted(() => ({ api: { myRequests: vi.fn(), month: vi.fn(), explanationContext: vi.fn() }, navigate: vi.fn() }));
vi.mock("../../api/timekeeping-api", () => ({ timekeepingApi: h.api }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => h.navigate }));

const LEAVE: RequestView = { id: "r1", code: "DT-2026-0001", type: "LEAVE", leaveKind: "ANNUAL", status: "PENDING", days: 2, fromDate: "2026-11-10", toDate: "2026-11-11", note: "Việc gia đình" };
const EXPLANATION: RequestView = { id: "r2", type: "EXPLANATION", status: "APPROVED", workDate: "2026-10-14" };

function renderPage(items: RequestView[] = [LEAVE, EXPLANATION]) {
  h.api.myRequests.mockResolvedValue({ items, total: items.length });
  h.api.month.mockResolvedValue({ annualLeaveRemaining: 8.5 });
  h.api.explanationContext.mockResolvedValue({ remaining: 2 });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MyRequestsPage /></QueryClientProvider>);
}

afterEach(() => vi.clearAllMocks());

describe("MyRequestsPage (G06)", () => {
  it("shows the balances, the requests and exactly one contained button, without Nghỉ bù", async () => {
    const { container } = renderPage();
    expect(await screen.findByText("8,5 ngày")).toBeInTheDocument();
    expect(await screen.findByText("2 / 3 lượt")).toBeInTheDocument();
    expect(screen.getByText(/Còn trong T\d{2}/)).toBeInTheDocument();
    expect(await screen.findByText("Nghỉ phép năm · 2 ngày")).toBeInTheDocument();
    expect(screen.getByText("10/11/2026 – 11/11/2026")).toBeInTheDocument();
    expect(screen.getByText("Việc gia đình")).toBeInTheDocument();
    expect(screen.getByText("Giải trình chấm công")).toBeInTheDocument();
    expect(screen.queryByText(/Nghỉ bù/)).not.toBeInTheDocument();
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    expect(screen.getAllByRole("radio").map((r) => r.textContent)).toEqual(["Tất cả", "Chờ duyệt", "Đã duyệt", "Từ chối"]);
  });

  it("filters by status through the API and opens the picker and the detail", async () => {
    renderPage();
    await screen.findByText("Nghỉ phép năm · 2 ngày");
    fireEvent.click(screen.getByRole("radio", { name: "Chờ duyệt" }));
    await waitFor(() => expect(h.api.myRequests).toHaveBeenLastCalledWith({ status: "PENDING", size: 50 }, expect.anything()));
    expect(screen.getByRole("radio", { name: "Chờ duyệt" })).toHaveAttribute("aria-checked", "true");

    fireEvent.click(screen.getByRole("button", { name: /Tạo đơn/ }));
    expect(h.navigate).toHaveBeenCalledWith(expect.objectContaining({ href: expect.stringContaining("?new=") }));
    fireEvent.click(await screen.findByText("Nghỉ phép năm · 2 ngày"));
    expect(h.navigate).toHaveBeenLastCalledWith(expect.objectContaining({ href: expect.stringContaining("?id=r1") }));
  });

  it("shows an empty state when there is nothing to list", async () => {
    renderPage([]);
    expect(await screen.findByText("Chưa có đơn nào")).toBeInTheDocument();
  });
});
