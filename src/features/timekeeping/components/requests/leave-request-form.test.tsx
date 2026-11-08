import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api-client/errors";
import type { LeavePreview, RequestView } from "../../api/timekeeping-types";
import { LeaveRequestForm } from "./leave-request-form";

const h = vi.hoisted(() => ({
  api: { previewLeave: vi.fn(), createRequest: vi.fn(), updateRequest: vi.fn(), submitRequest: vi.fn(), cancelRequest: vi.fn() },
  navigate: vi.fn(),
}));
vi.mock("../../api/timekeeping-api", () => ({ timekeepingApi: h.api }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => h.navigate }));

const PREVIEW: LeavePreview = {
  days: 2,
  balanceBefore: 8.5,
  balanceAfter: 6.5,
  affectedPeriods: [{ start: "2026-11-10T07:30:00", end: "2026-11-10T08:15:00", className: "8A", subject: "Toán" }],
  approvers: [{ stepNo: 1, displayName: "Trần Minh", title: "Quản lý trực tiếp" }, { stepNo: 2, displayName: "Lê Hoa", title: "Phó hiệu trưởng" }],
};

const PENDING_LEAVE: RequestView = { id: "old1", status: "PENDING", type: "LEAVE", leaveKind: "ANNUAL", fromDate: "2026-11-10", toDate: "2026-11-11", note: "Việc gia đình" };

function renderForm(initial?: RequestView) {
  h.api.previewLeave.mockResolvedValue(PREVIEW);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><LeaveRequestForm initial={initial} /></QueryClientProvider>);
}

afterEach(() => vi.clearAllMocks());

describe("LeaveRequestForm (G08)", () => {
  it("shows days and balance from preview-leave, the affected periods, and no attachment/invite/compensatory controls", async () => {
    const { container } = renderForm();
    expect(await screen.findByText("2 ngày làm việc")).toBeInTheDocument();
    expect(screen.getByText("Phép năm còn 8,5 → 6,5 ngày sau khi duyệt")).toBeInTheDocument();
    expect(screen.getByText("Tiết dạy bị ảnh hưởng")).toBeInTheDocument();
    expect(screen.getByText("Thiếu 1")).toBeInTheDocument();
    expect(screen.getByText("Chưa có người dạy thay")).toBeInTheDocument();
    expect(screen.getByText("Lý do chỉ người duyệt nhìn thấy")).toBeInTheDocument();
    expect(screen.getByLabelText("Bước 1")).toBeInTheDocument();
    expect(screen.getByText("Trần Minh")).toBeInTheDocument();
    expect(screen.queryByText(/Mời|Đính kèm|Nghỉ bù|Trao đổi/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("radio", { name: /Phép năm|Nghỉ ốm|Việc riêng có lương|Không lương/ })).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Lưu nháp" })).toBeInTheDocument();
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
  });

  it("asks the server again 300 ms after the dates change, not on every keystroke", async () => {
    renderForm();
    await screen.findByText(/Phép năm còn 8,5/);
    const before = h.api.previewLeave.mock.calls.length;
    fireEvent.change(screen.getByLabelText("Đến ngày"), { target: { value: "2026-12-30" } });
    expect(h.api.previewLeave.mock.calls.length).toBe(before);
    await waitFor(() => expect(h.api.previewLeave.mock.calls.length).toBe(before + 1));
    expect(h.api.previewLeave.mock.calls.at(-1)?.[0]).toMatchObject({ to: "2026-12-30", kind: "ANNUAL", part: "FULL" });
  });

  it("keeps the form open and shows the server message when the balance is not enough", async () => {
    renderForm();
    h.api.createRequest.mockResolvedValue({ id: "r1", status: "DRAFT" });
    h.api.submitRequest.mockRejectedValue(new ApiClientError("Phép năm còn 1,5 ngày, không đủ cho 2 ngày", "INSUFFICIENT_LEAVE", 422));
    fireEvent.change(screen.getByLabelText("Lý do"), { target: { value: "Việc gia đình" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi đơn" }));
    expect(await screen.findByText("Phép năm còn 1,5 ngày, không đủ cho 2 ngày")).toBeInTheDocument();
    expect(screen.getByLabelText("Từ ngày")).toBeInTheDocument();
    expect(screen.getByLabelText("Lý do")).toHaveValue("Việc gia đình");
    expect(h.navigate).not.toHaveBeenCalled();
    expect(h.api.createRequest).toHaveBeenCalledWith(expect.objectContaining({ type: "LEAVE", leaveKind: "ANNUAL", note: "Việc gia đình" }));
    expect(h.api.createRequest.mock.calls[0][0]).not.toHaveProperty("days");
  });

  it("updates the saved draft instead of creating another one on the second try, then opens the detail", async () => {
    renderForm();
    h.api.createRequest.mockResolvedValue({ id: "r1", status: "DRAFT" });
    h.api.updateRequest.mockResolvedValue({ id: "r1", status: "DRAFT" });
    h.api.submitRequest.mockRejectedValueOnce(new ApiClientError("Chưa có người duyệt cho đơn này", "NO_APPROVER", 422)).mockResolvedValueOnce({ id: "r1", status: "PENDING" });
    fireEvent.change(screen.getByLabelText("Lý do"), { target: { value: "Việc gia đình" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi đơn" }));
    expect(await screen.findByText("Chưa có người duyệt cho đơn này")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Gửi đơn" }));
    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith(expect.objectContaining({ href: expect.stringContaining("?id=r1"), replace: true })));
    expect(h.api.createRequest).toHaveBeenCalledTimes(1);
    expect(h.api.updateRequest).toHaveBeenCalledWith("r1", expect.any(Object));
  });

  it("editing a pending request saves the new draft, then cancels the old one, then sends", async () => {
    renderForm(PENDING_LEAVE);
    expect(screen.getByText(/Sửa đơn đang chờ sẽ huỷ đơn hiện tại và gửi lại đơn mới/)).toBeInTheDocument();
    h.api.createRequest.mockResolvedValue({ id: "new1", status: "DRAFT" });
    h.api.cancelRequest.mockResolvedValue({ id: "old1", status: "CANCELLED" });
    h.api.submitRequest.mockResolvedValue({ id: "new1", status: "PENDING" });
    fireEvent.click(screen.getByRole("button", { name: "Gửi đơn" }));
    await waitFor(() => expect(h.api.submitRequest).toHaveBeenCalledWith("new1"));
    expect(h.api.cancelRequest).toHaveBeenCalledWith("old1");
    const order = (m: { mock: { invocationCallOrder: number[] } }) => m.mock.invocationCallOrder[0];
    expect(order(h.api.createRequest)).toBeLessThan(order(h.api.cancelRequest));
    expect(order(h.api.cancelRequest)).toBeLessThan(order(h.api.submitRequest));
  });

  it("leaves the old pending request alone when saving the new one fails", async () => {
    renderForm(PENDING_LEAVE);
    h.api.createRequest.mockRejectedValue(new ApiClientError("Ngày kết thúc phải sau ngày bắt đầu", "INVALID_RANGE", 400));
    fireEvent.click(screen.getByRole("button", { name: "Gửi đơn" }));
    expect(await screen.findByText("Ngày kết thúc phải sau ngày bắt đầu")).toBeInTheDocument();
    expect(h.api.cancelRequest).not.toHaveBeenCalled();
    expect(h.api.submitRequest).not.toHaveBeenCalled();
  });

  it("shows a generic text, not the raw message, for server errors", async () => {
    renderForm();
    h.api.createRequest.mockRejectedValue(new ApiClientError("java.lang.NullPointerException at ...", "INTERNAL", 500));
    fireEvent.change(screen.getByLabelText("Lý do"), { target: { value: "Việc gia đình" } });
    fireEvent.click(screen.getByRole("button", { name: "Gửi đơn" }));
    expect(await screen.findByText("Có lỗi xảy ra, thử lại.")).toBeInTheDocument();
    expect(screen.queryByText(/NullPointer/)).not.toBeInTheDocument();
  });

  it("shows the field error and sends nothing when the reason is empty", async () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: "Gửi đơn" }));
    expect(await screen.findByText("Nhập lý do")).toBeInTheDocument();
    expect(h.api.createRequest).not.toHaveBeenCalled();
  });
});
