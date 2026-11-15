import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TeachingMonthSheet, TeachingPeriodPage } from "../../api/timekeeping-teaching-api";
import { MonthCloseCard } from "./month-close-card";
import { TotalSheet } from "./total-sheet";

const sheet = (status: string): TeachingMonthSheet => ({ status, confirmedCount: 1, teacherCount: 2, weeks: [], rows: [{ teacherId: "t1", total: 5 }] });
const renderCard = (props: { canClose: boolean; data: TeachingMonthSheet }) =>
  render(<QueryClientProvider client={new QueryClient()}><MonthCloseCard {...props} month="2026-10" /></QueryClientProvider>);

describe("MonthCloseCard", () => {
  it("locks the close button until every teacher has confirmed", () => {
    renderCard({ canClose: true, data: sheet("COLLECTING") });
    expect(screen.getByRole("button", { name: "Chốt tháng 10" })).toBeDisabled();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("enables it when READY and hides it for someone without timekeeping.manage", () => {
    const { unmount } = renderCard({ canClose: true, data: sheet("READY") });
    expect(screen.getByRole("button", { name: "Chốt tháng 10" })).toBeEnabled();
    unmount();
    renderCard({ canClose: false, data: sheet("READY") });
    expect(screen.queryByRole("button", { name: "Chốt tháng 10" })).not.toBeInTheDocument();
  });
});

describe("TotalSheet", () => {
  it("merges Tháng/Ngày/Thứ over the periods of one day", () => {
    const data: TeachingPeriodPage = {
      page: 0,
      size: 100,
      total: 2,
      rows: [
        { date: "2026-11-09", weekday: 1, periodNo: 1, className: "6A1" },
        { date: "2026-11-09", weekday: 1, periodNo: 2, className: "6A1" },
      ],
    };
    render(<TotalSheet data={data} onPage={() => undefined} role="MAIN" />);
    const merged = screen.getAllByText("Hai");
    expect(merged).toHaveLength(1);
    expect(merged[0]).toHaveAttribute("rowspan", "2");
    expect(screen.getByText("BẢNG CHI TIẾT TKB GIÁO VIÊN")).toBeInTheDocument();
    expect(screen.getByText("Tổng cộng · 2 tiết")).toBeInTheDocument();
  });

  it("retitles for the assistant table", () => {
    render(<TotalSheet data={{ rows: [], total: 0 }} onPage={() => undefined} role="ASSISTANT" />);
    expect(screen.getByText("BẢNG CHI TIẾT TKB TRỢ GIẢNG")).toBeInTheDocument();
  });
});
