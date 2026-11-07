import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PeriodLockAction } from "./period-lock-action";
import { PeriodStageStepper } from "./period-stage-stepper";

const h = vi.hoisted(() => ({ api: { lockPeriod: vi.fn(), reopenPeriod: vi.fn() } }));
vi.mock("../api/timekeeping-admin-api", () => ({ timekeepingAdminApi: h.api }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function renderAction(stage: "COLLECT" | "REVIEW" | "LOCKED") {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><PeriodLockAction period="2026-10" schoolId="s1" stage={stage} /></QueryClientProvider>);
}

afterEach(() => vi.clearAllMocks());

describe("PeriodStageStepper", () => {
  it("lists the four steps and the review issues", () => {
    render(<PeriodStageStepper issues={{ missingDays: 4, pendingRequests: 2 }} reviewUntil="2026-11-05" stage="REVIEW" />);
    for (const step of ["Thu thập", "Rà soát", "Chốt & khoá", "Gửi tính lương"]) expect(screen.getByText(step)).toBeInTheDocument();
    expect(screen.getByText("đến 05/11 · 4 ngày thiếu chấm · 2 đơn chưa duyệt")).toBeInTheDocument();
    expect(screen.getByText("Excel")).toBeInTheDocument();
    expect(screen.queryByText(/HRM/)).not.toBeInTheDocument();
  });
});

describe("PeriodLockAction", () => {
  it("shows the server's 409 message inside the dialog and keeps the stage", async () => {
    h.api.lockPeriod.mockRejectedValue(Object.assign(new Error("Còn 2 đơn chưa duyệt trong kỳ"), { status: 409 }));
    const { container } = renderAction("REVIEW");
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Chốt công tháng" }));
    fireEvent.click(await screen.findByRole("button", { name: "Chốt công" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Còn 2 đơn chưa duyệt trong kỳ");
    expect(h.api.lockPeriod).toHaveBeenCalledWith("2026-10", "s1");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Chốt công tháng", { selector: "button" })).toBeInTheDocument();
  });

  it("offers Mở lại kỳ (outlined) when LOCKED and needs a reason", async () => {
    h.api.reopenPeriod.mockResolvedValue({});
    const { container } = renderAction("LOCKED");
    expect(screen.queryByRole("button", { name: "Chốt công tháng" })).not.toBeInTheDocument();
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(0);
    const open = screen.getByRole("button", { name: "Mở lại kỳ" });
    expect(open).toHaveClass("MuiButton-outlined");
    fireEvent.click(open);
    const confirm = (await screen.findAllByRole("button", { name: "Mở lại kỳ" })).find((b) => b.classList.contains("MuiButton-contained")) as HTMLElement;
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox", { name: /Lý do/ }), { target: { value: "Sửa công tháng 10" } });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    await waitFor(() => expect(h.api.reopenPeriod).toHaveBeenCalledWith("2026-10", "s1", "Sửa công tháng 10"));
  });
});
