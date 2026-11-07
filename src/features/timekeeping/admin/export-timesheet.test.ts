import { describe, expect, it } from "vitest";

import type { Timesheet } from "../api/timekeeping-types";
import { timesheetToRows } from "./export-timesheet";

const sheet: Timesheet = {
  period: "2026-10",
  rows: [
    { userId: "u1", name: "Nguyễn Văn A", team: "Tổ Toán", days: [{ d: 1, code: "X" }, { d: 2, code: "" }, { d: 3, code: "½" }], work: 1.5, late: 1, leave: 0, kpKc: 0, periods: 12, deductMinutes: 15 },
    { userId: "u2", name: "=HYPERLINK(\"x\")", team: "", days: [{ d: 31, code: "KC" }], work: 0, late: 0, leave: 0, kpKc: 1, periods: 0, deductMinutes: 0 },
  ],
};

describe("timesheetToRows", () => {
  const rows = timesheetToRows(sheet);

  it("gives a header and one row per person, 2 + 31 + 6 columns each", () => {
    expect(rows).toHaveLength(3);
    for (const row of rows) expect(row).toHaveLength(39);
    expect(rows[0].slice(0, 4)).toEqual(["Nhân sự", "Tổ", 1, 2]);
    expect(rows[0].slice(-6)).toEqual(["Công", "Muộn", "Phép", "KP/KC", "Tiết dạy", "Phút trừ"]);
  });

  it("shows off days as empty text and half days as ½, with totals as numbers", () => {
    expect(rows[1].slice(2, 5)).toEqual(["X", "", "½"]);
    expect(rows[1].slice(-6)).toEqual([1.5, 1, 0, 0, 12, 15]);
    expect(rows[2][2 + 30]).toBe("KC");
  });

  it("neutralises text that a spreadsheet would run as a formula", () => {
    expect(rows[2][0]).toBe("'=HYPERLINK(\"x\")");
  });
});
