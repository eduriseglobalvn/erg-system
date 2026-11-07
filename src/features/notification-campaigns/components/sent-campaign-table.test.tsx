import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import type { CampaignResponse } from "../api/campaign-types";
import { SentCampaignTable } from "./sent-campaign-table";

const campaigns: CampaignResponse[] = [
  {
    id: "c1",
    title: "Lịch nghỉ lễ 2/9",
    status: "SENT",
    audience: { wholeTenant: true },
    pushEnabled: true,
    requireReadAck: true,
    sentAt: new Date(2026, 8, 1, 7, 5).toISOString(),
    recipientCount: 200,
    viewedCount: 150,
    ackedCount: 120,
  },
  {
    id: "c2",
    title: "Họp phụ huynh",
    status: "SENT",
    audience: { classIds: ["k1", "k2"] },
    pushEnabled: false,
    requireReadAck: false,
    sentAt: new Date(2026, 9, 20, 18, 30).toISOString(),
    recipientCount: 0,
    viewedCount: 0,
  },
];

test("lists sent campaigns with the W1 columns, 24h time and a dash when no ack is required", () => {
  render(<SentCampaignTable campaigns={campaigns} onOpen={vi.fn()} />);

  const table = screen.getByRole("table", { name: "Thông báo đã gửi" });
  expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
    "Tiêu đề",
    "Gửi đến",
    "Kênh",
    "Thời gian",
    "Đã xem",
    "Xác nhận",
  ]);

  const [, first, second] = within(table).getAllByRole("row");
  const firstCells = within(first).getAllByRole("cell").map((cell) => cell.textContent);
  expect(firstCells[1]).toContain("Toàn hệ thống");
  expect(firstCells[2]).toBe("Web push + hộp thư");
  expect(firstCells[3]).toBe("01/09/2026 07:05");
  expect(firstCells[4]).toContain("75%");
  expect(firstCells[5]).toContain("120/200");

  const secondCells = within(second).getAllByRole("cell").map((cell) => cell.textContent);
  expect(secondCells[2]).toBe("Hộp thư");
  expect(secondCells[3]).toBe("20/10/2026 18:30");
  // No recipients yet: 0%, never NaN.
  expect(secondCells[4]).toContain("0%");
  expect(secondCells[5]).toBe("—");
});

test("opening a row (click or its title button) passes the campaign id", () => {
  const onOpen = vi.fn();
  render(<SentCampaignTable campaigns={campaigns} onOpen={onOpen} />);

  fireEvent.click(screen.getByRole("button", { name: "Lịch nghỉ lễ 2/9" }));
  expect(onOpen).toHaveBeenCalledTimes(1);
  expect(onOpen).toHaveBeenLastCalledWith("c1");

  fireEvent.click(screen.getByText("20/10/2026 18:30"));
  expect(onOpen).toHaveBeenLastCalledWith("c2");
});
