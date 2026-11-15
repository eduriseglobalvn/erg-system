import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { ScheduleLegend } from "./schedule-legend";

it("renders the five shared legend items in board order", () => {
  render(<ScheduleLegend />);
  expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
    "Đã xuất bản", "Nháp", "Trùng", "Không kịp di chuyển (< 50′)", "Nghỉ",
  ]);
});

it("takes longer labels for the Main page", () => {
  render(<ScheduleLegend items={["published", "draft", "clash"]} labels={{ clash: "Trùng lịch", draft: "Nháp (giáo viên chưa thấy)" }} />);
  expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Đã xuất bản", "Nháp (giáo viên chưa thấy)", "Trùng lịch"]);
});
