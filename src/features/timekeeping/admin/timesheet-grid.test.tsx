import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TimesheetRow } from "../api/timekeeping-types";
import { offColumns, TimesheetGrid } from "./timesheet-grid";

const ROWS: TimesheetRow[] = [
  { userId: "u1", name: "Nguyễn Văn A", days: [{ d: 1, code: "X" }, { d: 5, code: "L" }, { d: 6, code: "" }, { d: 7, code: "KC" }], work: 20.5, late: 2, leave: 1, kpKc: 1, periods: 30, deductMinutes: 15 },
  { userId: "u2", name: "Lê Thị B", days: [{ d: 1, code: "M" }, { d: 5, code: "L" }], work: 21, late: 0, leave: 0, kpKc: 0, periods: 28, deductMinutes: 0 },
];

describe("TimesheetGrid", () => {
  it("renders a name, 31 day columns and 6 totals per row, with each symbol labelled in text", () => {
    render(<TimesheetGrid period="2026-10" rows={ROWS} />);
    expect(screen.getAllByRole("row")).toHaveLength(3);
    const first = screen.getAllByRole("row")[1];
    expect(within(first).getAllByRole("cell")).toHaveLength(1 + 31 + 6);
    expect(within(first).getByText("Nguyễn Văn A")).toBeInTheDocument();
    expect(within(first).getByRole("img", { name: "Ngày 1: Đủ công" })).toHaveTextContent("X");
    expect(within(first).getByRole("img", { name: "Ngày 7: Thiếu chấm" })).toHaveTextContent("KC");
    expect(within(first).getByText("20.5")).toBeInTheDocument();
  });

  it("pins the name column and marks weekends and holidays as off columns", () => {
    render(<TimesheetGrid period="2026-10" rows={ROWS} />);
    expect(getComputedStyle(screen.getByText("Nhân sự")).position).toBe("sticky");
    // 2026-10: the 3rd is a Saturday; the 5th is a holiday for everyone in these rows.
    const off = offColumns("2026-10", ROWS);
    expect(off.has(3) && off.has(4) && off.has(5)).toBe(true);
    expect(off.has(1)).toBe(false);
  });
});
