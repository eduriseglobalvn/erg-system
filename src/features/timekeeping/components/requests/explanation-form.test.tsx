import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ExplanationContext } from "../../api/timekeeping-types";
import { ExplanationForm } from "./explanation-form";

const h = vi.hoisted(() => ({
  api: { explanationContext: vi.fn(), day: vi.fn(), month: vi.fn(), createRequest: vi.fn(), submitRequest: vi.fn() },
  navigate: vi.fn(),
}));
vi.mock("../../api/timekeeping-api", () => ({ timekeepingApi: h.api }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => h.navigate }));

const CTX: ExplanationContext = { remaining: 2, suggestedOut: "11:30:00", evidence: [{ kind: "SCHEDULE", label: "Lịch dạy ca sáng · 2 tiết", ref: "s1" }] };
const DAY = { date: "2026-10-14", missing: "OUT", shift: { name: "Ca sáng", start: "07:30:00", end: "11:30:00" } };

function renderForm(ctx: ExplanationContext = CTX) {
  h.api.explanationContext.mockResolvedValue(ctx);
  h.api.day.mockResolvedValue(DAY);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><ExplanationForm date="2026-10-14" /></QueryClientProvider>);
}

afterEach(() => vi.clearAllMocks());

describe("ExplanationForm (G09)", () => {
  it("fills the suggested OUT time, shows the day's context and one contained button", async () => {
    const { container } = renderForm();
    expect(await screen.findByText("2/3 lượt")).toBeInTheDocument();
    expect(await screen.findByText("Thiếu giờ ra")).toBeInTheDocument();
    expect(screen.getByText("Vào ca 07:30 · Ra ca 11:30")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText("Giờ ra đề nghị")).toHaveValue("11:30"));
    expect(screen.getByText("Gợi ý")).toBeInTheDocument();
    expect(screen.getByText("Lịch dạy ca sáng · 2 tiết")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.queryByRole("button", { name: "Lưu nháp" })).not.toBeInTheDocument();
    expect(container.querySelectorAll(".MuiButton-contained")).toHaveLength(1);
  });

  it("sends the explanation and opens its detail", async () => {
    renderForm();
    h.api.createRequest.mockResolvedValue({ id: "r9", status: "DRAFT" });
    h.api.submitRequest.mockResolvedValue({ id: "r9", status: "PENDING" });
    await waitFor(() => expect(screen.getByLabelText("Giờ ra đề nghị")).toHaveValue("11:30"));
    fireEvent.click(screen.getByRole("button", { name: "Gửi giải trình" }));
    await waitFor(() => expect(h.navigate).toHaveBeenCalledWith(expect.objectContaining({ href: expect.stringContaining("?id=r9") })));
    expect(h.api.createRequest).toHaveBeenCalledWith({ type: "EXPLANATION", workDate: "2026-10-14", explanationReason: "FORGOT", proposedOut: "11:30" });
  });

  it("blocks sending when the month's explanations are used up", async () => {
    renderForm({ ...CTX, remaining: 0 });
    expect(await screen.findByText("Đã dùng hết 3 lượt giải trình tháng này")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi giải trình" })).toBeDisabled();
  });
});
