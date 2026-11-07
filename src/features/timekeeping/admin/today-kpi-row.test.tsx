import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TodayKpiRow } from "./today-kpi-row";

describe("TodayKpiRow", () => {
  it("shows presence, lateness, not-punched, leave, business and pending requests", () => {
    render(<TodayKpiRow data={{ present: 112, total: 130, late: 9, lateMinutesTotal: 47, notPunched: 8, notPunchedWithPeriodSoon: 3, leave: 6, business: 2, pendingRequests: 5, overdueRequests: 1 }} />);
    expect(screen.getByText("112")).toBeInTheDocument();
    expect(screen.getByText("/ 130")).toBeInTheDocument();
    expect(screen.getByText("Tổng 47 phút")).toBeInTheDocument();
    expect(screen.getByText("3 có tiết trong 30 phút")).toBeInTheDocument();
    expect(screen.getByText("1 quá hạn")).toBeInTheDocument();
    for (const label of ["Có mặt", "Đi muộn", "Chưa chấm", "Nghỉ có phép", "Công tác", "Đơn chờ duyệt"]) expect(screen.getByText(label)).toBeInTheDocument();
  });
});
