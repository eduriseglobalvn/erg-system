import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TeachingMonthSheet, TeachingPeriodPage } from "../../api/timekeeping-teaching-api";
import { MonthCloseButton, MonthStatusStrip } from "./month-close-card";
import { MonthSheet } from "./month-sheet";
import { TotalSheet } from "./total-sheet";

const sheet = (status: string): TeachingMonthSheet => ({ status, confirmedCount: 1, teacherCount: 2, weeks: [], rows: [{ teacherId: "t1", total: 5 }] });
const renderCard = (props: { canClose: boolean; data: TeachingMonthSheet }) =>
  render(<QueryClientProvider client={new QueryClient()}><MonthCloseButton {...props} month="2026-10" /></QueryClientProvider>);

describe("MonthCloseButton", () => {
  it("locks the close button until every teacher has confirmed", () => {
    renderCard({ canClose: true, data: sheet("COLLECTING") });
    expect(screen.getByRole("button", { name: "Chốt tháng 10" })).toBeDisabled();
  });

  it("shows who confirmed and the progress line in the strip", () => {
    render(<MonthStatusStrip data={sheet("COLLECTING")} month="2026-10" />);
    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("Đã xác nhận 1/2 · còn 1 chờ GV")).toBeInTheDocument();
  });

  it("keeps a closed month visible but disabled", () => {
    renderCard({ canClose: true, data: sheet("CLOSED") });
    expect(screen.getByRole("button", { name: "Đã chốt tháng 10" })).toBeDisabled();
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
    expect(screen.getByText("1 buổi dạy · 2 tiết")).toBeInTheDocument();
    expect(screen.getByText("Tổng cộng")).toBeInTheDocument();
  });

  it("retitles for the assistant table", () => {
    render(<TotalSheet data={{ rows: [], total: 0 }} onPage={() => undefined} role="ASSISTANT" />);
    expect(screen.getByText("BẢNG CHI TIẾT TKB TRỢ GIẢNG")).toBeInTheDocument();
  });
});

describe("MonthSheet", () => {
  it("merges the school cell over its teachers and ends with the signing box", () => {
    const data: TeachingMonthSheet = {
      status: "COLLECTING", weeks: [{ index: 1, label: "01-04", from: "2020-10-01", to: "2020-10-04" }],
      rows: [
        { teacherId: "a", schoolName: "THCS A", teacherName: "An", weekTotals: [2], total: 2, confirmation: { status: "CONFIRMED", confirmedAt: "2020-11-16T03:00:00Z" } },
        { teacherId: "b", schoolName: "THCS A", teacherName: "Bình", weekTotals: [0], total: 0 },
      ],
    };
    render(<MonthSheet data={data} month="2020-10" onOpenTeacher={() => undefined} role="MAIN" />);
    expect(screen.getAllByText("THCS A")).toHaveLength(1);
    expect(screen.getByText("01–04")).toBeInTheDocument();
    expect(screen.getByText("Chờ GV")).toBeInTheDocument();
    expect(screen.getByText("(Ký tên)")).toBeInTheDocument();
  });
});
