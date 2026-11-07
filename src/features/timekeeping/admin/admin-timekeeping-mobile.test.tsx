import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApprovalPage, TodayDashboard } from "../api/timekeeping-types";
import { AdminTimekeepingMobile } from "./admin-timekeeping-mobile";

const h = vi.hoisted(() => ({
  admin: { today: vi.fn(), reviewPunch: vi.fn(), remind: vi.fn() },
  api: { approvals: vi.fn(), approve: vi.fn(), reject: vi.fn() },
  navigate: vi.fn(),
}));
vi.mock("../api/timekeeping-admin-api", () => ({ timekeepingAdminApi: h.admin }));
vi.mock("../api/timekeeping-api", () => ({ timekeepingApi: h.api }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@tanstack/react-router", async (importOriginal) => ({ ...(await importOriginal<object>()), useNavigate: () => h.navigate, useSearch: () => ({}) }));
vi.mock("../api/timekeeping-admin-query", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useTimekeepingSchools: () => ({ data: [{ id: "s1", name: "CS Cầu Giấy" }] }),
}));

const TODAY: TodayDashboard = {
  present: 112, total: 130, late: 9, notPunched: 8, leave: 6, pendingRequests: 3,
  actionItems: [
    { kind: "PUNCH_REVIEW", targetId: "p1", userId: "u1", userName: "Lê Thị B", label: "Chấm ngoài vùng 180 m" },
    { kind: "NOT_PUNCHED_PERIOD_SOON", targetId: "u2", userId: "u2", userName: "Trần C", label: "Trần C chưa chấm, có tiết lúc 07:30" },
  ],
  recentPunches: [{ id: "p1", userName: "Lê Thị B", siteName: "CS Cầu Giấy", time: "2026-11-06T00:12:00Z", direction: "IN", status: "FLAGGED", hasPhoto: false }],
};
const APPROVALS: ApprovalPage = {
  total: 3,
  items: [{ overdue: false, requesterName: "Nguyễn A", request: { id: "r1", code: "DT-2026-0001", type: "WFH", status: "PENDING", fromDate: "2026-11-12", toDate: "2026-11-12" } }],
};

function renderMobile() {
  h.admin.today.mockResolvedValue(TODAY);
  h.api.approvals.mockResolvedValue(APPROVALS);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><AdminTimekeepingMobile /></QueryClientProvider>);
}

afterEach(() => vi.clearAllMocks());

describe("AdminTimekeepingMobile (A05)", () => {
  it("shows the four counts and the tab counts from /admin/today", async () => {
    renderMobile();
    expect(await screen.findByRole("tab", { name: "Chờ duyệt (3)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Chưa chấm (8)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ngoài vùng (1)" })).toBeInTheDocument();
    for (const [label, value] of [["Có mặt", "112"], ["Muộn", "9"], ["Chưa chấm", "8"], ["Nghỉ", "6"]]) {
      expect(within(screen.getByText(label, { selector: "p, span" }).parentElement as HTMLElement).getByText(value)).toBeInTheDocument();
    }
    expect(screen.getByText("Chấm công · Tất cả cơ sở")).toBeInTheDocument();
  });

  it("Duyệt on a request calls approve; the page has no contained button", async () => {
    h.api.approve.mockResolvedValue({});
    const { container } = renderMobile();
    fireEvent.click(await screen.findByRole("button", { name: "Duyệt đơn DT-2026-0001" }));
    await waitFor(() => expect(h.api.approve).toHaveBeenCalledWith("r1", { comment: "" }));
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(0);
  });

  it("rejecting a request needs a reason and makes no call without one", async () => {
    renderMobile();
    fireEvent.click(await screen.findByRole("button", { name: "Từ chối đơn DT-2026-0001" }));
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Từ chối" }));
    expect(await screen.findByText("Nhập lý do từ chối")).toBeInTheDocument();
    expect(h.api.reject).not.toHaveBeenCalled();
  });

  it("Duyệt on an out-of-zone punch reviews it with ACCEPT", async () => {
    h.admin.reviewPunch.mockResolvedValue({});
    renderMobile();
    fireEvent.click(await screen.findByRole("tab", { name: "Ngoài vùng (1)" }));
    fireEvent.click(await screen.findByRole("button", { name: "Duyệt lượt chấm của Lê Thị B" }));
    await waitFor(() => expect(h.admin.reviewPunch).toHaveBeenCalledWith("p1", { decision: "ACCEPT", comment: "" }));
  });

  it("Chưa chấm lists the people to remind", async () => {
    renderMobile();
    fireEvent.click(await screen.findByRole("tab", { name: "Chưa chấm (8)" }));
    expect(await screen.findByText("Trần C chưa chấm, có tiết lúc 07:30")).toBeInTheDocument();
  });
});
