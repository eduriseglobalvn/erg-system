import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MyTeachingMonth } from "../../api/timekeeping-teaching-api";
import { MyTeachingPage } from "./my-teaching-page";

const month = vi.hoisted(() => ({ data: undefined as unknown }));
vi.mock("../api/teaching-hours-query", () => ({
  useMyTeachingMonth: () => ({ data: month.data, isLoading: false, isError: false, refetch: vi.fn() }),
  useMyTeachingActions: () => ({ confirm: { mutate: vi.fn(), isPending: false }, issue: { mutate: vi.fn(), isPending: false } }),
  useMyTeachingPeriods: () => ({ data: undefined, isError: false, refetch: vi.fn() }),
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));

const data: MyTeachingMonth = {
  status: "COLLECTING", deadline: "2020-11-16", total: 6, assistantTotal: 0, confirmation: { status: "PENDING" },
  weeks: [{ index: 1, label: "01-02", from: "2020-10-01", to: "2020-10-02" }, { index: 2, label: "05-09", from: "2020-10-05", to: "2020-10-09" }],
  rows: [{ schoolName: "THCS A", subjectName: "IC3", level: "Cấp 2", className: "6A4", weekTotals: [2, 4], total: 6 }],
  missingReports: [{ eventId: "e1", date: "2020-10-08", className: "6A4", periodStart: 1, periodCount: 2, from: "07:00:00", to: "08:35:00" }],
};

describe("MyTeachingPage (desktop)", () => {
  it("draws the board: waiting banner, week matrix with a red cell, missing card and the two actions", () => {
    month.data = data;
    render(<QueryClientProvider client={new QueryClient()}><MyTeachingPage period="2020-10" /></QueryClientProvider>);
    expect(screen.getByText("Bảng công tháng 10 đang chờ bạn xác nhận · hạn 16/11")).toBeInTheDocument();
    expect(screen.getByText("tháng 10 · 1 trường")).toBeInTheDocument();
    expect(screen.getByText("05–09")).toBeInTheDocument();
    expect(screen.getAllByText("4")[0]).toHaveStyle({ backgroundColor: "#FFEDEA" });
    expect(screen.getByText("2 tiết")).toBeInTheDocument();
    expect(screen.getByText("Báo giảng ngay ›")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button").map((b) => b.textContent);
    expect(buttons.indexOf("Báo sai sót")).toBeLessThan(buttons.indexOf("Xác nhận bảng công"));
    expect(screen.getByRole("button", { name: "Xác nhận bảng công" })).toBeDisabled();
  });
});
