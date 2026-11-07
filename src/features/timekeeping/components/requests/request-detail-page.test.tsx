import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api-client/errors";
import type { RequestView } from "../../api/timekeeping-types";
import { RequestDetailPage } from "./request-detail-page";

const h = vi.hoisted(() => ({ api: { request: vi.fn(), remindRequest: vi.fn(), cancelRequest: vi.fn() }, navigate: vi.fn() }));
vi.mock("../../api/timekeeping-api", () => ({ timekeepingApi: h.api }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => h.navigate }));

const PENDING: RequestView = {
  id: "r1",
  code: "DT-2026-0012",
  type: "LEAVE",
  leaveKind: "ANNUAL",
  status: "PENDING",
  currentStep: 1,
  days: 2,
  fromDate: "2026-11-10",
  toDate: "2026-11-11",
  note: "Việc gia đình",
  submittedAt: "2026-11-06T08:00:00",
  steps: [
    { stepNo: 1, status: "WAITING", approverName: "Trần Minh", resolver: "MANAGER", viewedAt: "2026-11-06T08:15:00", dueAt: "2026-11-08T08:00:00" },
    { stepNo: 2, status: "WAITING", approverName: "Lê Hoa", resolver: "SCHOOL_ROLE:VICE_PRINCIPAL" },
  ],
};

function renderPage(request: RequestView = PENDING) {
  h.api.request.mockResolvedValue(request);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><RequestDetailPage id="r1" /></QueryClientProvider>);
}

afterEach(() => vi.clearAllMocks());

describe("RequestDetailPage (G10)", () => {
  it("shows the summary, the timeline and the three actions with one contained button", async () => {
    const { container } = renderPage();
    expect(await screen.findByText("Nghỉ phép năm · 2 ngày")).toBeInTheDocument();
    expect(screen.getByText("Chờ duyệt · bước 1/2")).toBeInTheDocument();
    expect(screen.getByText("2 ngày phép năm")).toBeInTheDocument();
    expect(screen.getByText("Hạn xử lý", { exact: false })).toBeInTheDocument();
    expect(screen.queryByText(/Trao đổi/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Huỷ đơn" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sửa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nhắc duyệt" })).toBeEnabled();
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
  });

  it("disables the reminder for 24 hours after the last one and hides edit/cancel once a step has acted", async () => {
    const acted: RequestView = { ...PENDING, lastRemindedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), steps: [{ ...PENDING.steps![0], status: "APPROVED", actedAt: "2026-11-06T09:00:00" }, PENDING.steps![1]] };
    renderPage(acted);
    expect(await screen.findByRole("button", { name: "Nhắc duyệt" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Huỷ đơn" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sửa" })).not.toBeInTheDocument();
  });

  it("shows the server's message when the reminder is refused", async () => {
    renderPage();
    h.api.remindRequest.mockRejectedValue(new ApiClientError("Mỗi đơn chỉ nhắc duyệt một lần trong 24 giờ", "REMIND_TOO_SOON", 429));
    fireEvent.click(await screen.findByRole("button", { name: "Nhắc duyệt" }));
    expect(await screen.findByText("Mỗi đơn chỉ nhắc duyệt một lần trong 24 giờ")).toBeInTheDocument();
  });

  it("asks for confirmation before cancelling", async () => {
    renderPage();
    h.api.cancelRequest.mockResolvedValue({ ...PENDING, status: "CANCELLED" });
    fireEvent.click(await screen.findByRole("button", { name: "Huỷ đơn" }));
    expect(await screen.findByText("Huỷ đơn này?")).toBeInTheDocument();
    expect(h.api.cancelRequest).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Huỷ đơn" }).at(-1) as HTMLElement);
    await waitFor(() => expect(h.api.cancelRequest).toHaveBeenCalledWith("r1"));
  });
});
