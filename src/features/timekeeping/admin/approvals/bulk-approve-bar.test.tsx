import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BulkApproveBar } from "./bulk-approve-bar";

const h = vi.hoisted(() => ({ api: { bulkApprove: vi.fn(), reject: vi.fn() }, success: vi.fn(), error: vi.fn() }));
vi.mock("../../api/timekeeping-api", () => ({ timekeepingApi: h.api }));
vi.mock("sonner", () => ({ toast: { success: h.success, error: h.error } }));

const SELECTED = [{ id: "r1", code: "DT-1" }, { id: "r2", code: "DT-2" }, { id: "r3", code: "DT-3" }];

function renderBar() {
  const onSettled = vi.fn();
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const view = render(<QueryClientProvider client={client}><BulkApproveBar onSettled={onSettled} selected={SELECTED} /></QueryClientProvider>);
  return { onSettled, ...view };
}

afterEach(() => vi.clearAllMocks());

describe("BulkApproveBar", () => {
  it("toasts approved and skipped counts with the first reason, lists every skip, and only releases approved ids", async () => {
    h.api.bulkApprove.mockResolvedValue({ approved: ["r1", "r3"], skipped: [{ id: "r2", reason: "Không đủ phép năm" }] });
    const { onSettled, container } = renderBar();
    expect(screen.getByText("Đã chọn 3 đơn hợp lệ")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Duyệt 3 đơn" }));
    await waitFor(() => expect(h.api.bulkApprove).toHaveBeenCalledWith({ requestIds: ["r1", "r2", "r3"] }));
    await waitFor(() => expect(h.success).toHaveBeenCalledWith("Đã duyệt 2 đơn · 1 đơn bỏ qua: Không đủ phép năm"));
    expect(onSettled).toHaveBeenCalledWith(["r1", "r3"]); // r2 stays selected
    expect(screen.getByText("DT-2: Không đủ phép năm")).toBeInTheDocument();
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(0);
  });

  it("asks for a reason before rejecting and sends no request without one", async () => {
    renderBar();
    fireEvent.click(screen.getByRole("button", { name: "Từ chối" }));
    fireEvent.click(screen.getByRole("button", { name: "Từ chối 3 đơn" }));
    expect(await screen.findByText("Nhập lý do từ chối")).toBeInTheDocument();
    expect(h.api.reject).not.toHaveBeenCalled();
  });
});
