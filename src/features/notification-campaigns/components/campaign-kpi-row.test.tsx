import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { CampaignKpiRow } from "./campaign-kpi-row";

test("shows the three W1 KPIs from the summary", () => {
  render(<CampaignKpiRow summary={{ sentThisMonth: 12, avgViewedRate: 0.78, unackedTotal: 214, unackedCampaigns: 2 }} />);

  expect(screen.getByText("Đã gửi tháng này")).toBeInTheDocument();
  expect(screen.getByText("12")).toBeInTheDocument();
  expect(screen.getByText("Tỉ lệ đã xem trung bình")).toBeInTheDocument();
  expect(screen.getByText("78%")).toBeInTheDocument();
  expect(screen.getByText("Chưa xác nhận đã đọc")).toBeInTheDocument();
  expect(screen.getByText("214")).toBeInTheDocument();
  expect(screen.getByText("ở 2 thông báo bắt buộc xác nhận")).toBeInTheDocument();
});

test("shows a dash (not 0) while the summary is not loaded", () => {
  render(<CampaignKpiRow summary={undefined} />);
  expect(screen.getAllByText("—")).toHaveLength(3);
  expect(screen.queryByText(/thông báo bắt buộc xác nhận/)).toBeNull();
});
