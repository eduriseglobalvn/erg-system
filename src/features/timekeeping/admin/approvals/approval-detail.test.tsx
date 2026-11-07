import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApprovalDetail as ApprovalDetailDto } from "../../api/timekeeping-types";
import { ApprovalDetail } from "./approval-detail";

const h = vi.hoisted(() => ({ api: { approval: vi.fn(), approve: vi.fn(), reject: vi.fn() }, success: vi.fn() }));
vi.mock("../../api/timekeeping-api", () => ({ timekeepingApi: h.api }));
vi.mock("sonner", () => ({ toast: { success: h.success, error: vi.fn() } }));

const STEPS = [
  { stepNo: 1, resolver: "MANAGER", status: "WAITING" as const },
  { stepNo: 2, resolver: "SCHOOL_ROLE:VICE_PRINCIPAL", status: "WAITING" as const },
];
const DETAIL: ApprovalDetailDto = {
  canAct: true,
  actingOnBehalf: false,
  context: { lateCount: 2, approvedExplanations: 1 },
  teammatesOnLeave: [],
  affectedPeriods: [{ className: "6A1", subject: "Toán", start: "2026-11-10T01:00:00Z", end: "2026-11-10T01:45:00Z" }],
  item: { overdue: false, requesterName: "Lê Thị B", schoolId: "s1", request: { id: "r1", code: "DT-2026-0001", type: "LEAVE", leaveKind: "ANNUAL", status: "PENDING", days: 1, fromDate: "2026-11-10", toDate: "2026-11-10", note: "Việc gia đình", steps: STEPS } },
};

function renderDetail(detail: ApprovalDetailDto = DETAIL) {
  h.api.approval.mockResolvedValue(detail);
  const onClose = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const view = render(<QueryClientProvider client={client}><ApprovalDetail id="r1" onClose={onClose} /></QueryClientProvider>);
  return { onClose, ...view };
}

afterEach(() => vi.clearAllMocks());

describe("ApprovalDetail (A03)", () => {
  it("rejecting without a comment shows the reason error and calls no API; one contained button, no Phân công", async () => {
    const { container } = renderDetail();
    fireEvent.click(await screen.findByRole("button", { name: "Từ chối" }));
    expect(await screen.findByText("Nhập lý do từ chối")).toBeInTheDocument();
    expect(h.api.reject).not.toHaveBeenCalled();
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    expect(screen.queryByText("Phân công")).not.toBeInTheDocument();
  });

  it("approves with the comment, toasts and closes", async () => {
    h.api.approve.mockResolvedValue({});
    const { onClose } = renderDetail();
    fireEvent.change(await screen.findByLabelText("Nhận xét (gửi cho người nộp)"), { target: { value: "Đồng ý" } });
    fireEvent.click(screen.getByRole("button", { name: "Duyệt đơn" }));
    await waitFor(() => expect(h.api.approve).toHaveBeenCalledWith("r1", { comment: "Đồng ý" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(h.success).toHaveBeenCalledWith("Đã duyệt đơn DT-2026-0001");
  });

  it("shows the on-behalf line when the viewer is not a current-step approver", async () => {
    renderDetail({ ...DETAIL, actingOnBehalf: true });
    expect(await screen.findByText("Duyệt thay Tổ trưởng · đơn chuyển tiếp đến Phó hiệu trưởng")).toBeInTheDocument();
  });

  it("omits the on-behalf line for a current-step approver", async () => {
    renderDetail();
    await screen.findByRole("button", { name: "Duyệt đơn" });
    expect(screen.queryByText(/Duyệt thay/)).not.toBeInTheDocument();
  });
});
