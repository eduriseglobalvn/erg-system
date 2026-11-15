import { describe, expect, it } from "vitest";

import type { TeachingExport, TeachingMonthSheet } from "../../api/timekeeping-teaching-api";
import { teachingSheets } from "./teaching-excel";

const period = (date: string, periodNo: number) => ({ date, weekday: 1, periodNo, schoolName: "A", from: "07:00:00", to: "07:45:00", className: "10A", level: "THPT", subjectName: "Tin", teacherName: "GV" });
const month = (m: string, weeks: number): TeachingMonthSheet => ({
  month: m,
  weeks: Array.from({ length: weeks }, (_, index) => ({ index, label: `T${index + 1}` })),
  rows: [{ teacherId: "t", teacherName: "GV", weekTotals: Array.from({ length: weeks }, () => 2), total: 2 * weeks }],
});
const base: TeachingExport = {
  year: 2026,
  mainPeriods: [period("2026-09-07", 1), period("2026-09-07", 2), period("2026-10-05", 1)],
  assistantPeriods: [],
  mainMonths: [month("2026-10", 4), month("2026-09", 5), { month: "2026-11", rows: [] }],
  assistantMonths: [month("2026-09", 5)],
};

describe("teachingSheets", () => {
  it("names sheets, skips empty months and omits assistant sheets without assistant periods", () => {
    expect(teachingSheets(base).map((s) => s.name)).toEqual(["Total", "Tháng 09", "Tháng 10"]);
  });

  it("adds Total TG and TG Tháng MM when assistant periods exist", () => {
    const names = teachingSheets({ ...base, assistantPeriods: [period("2026-09-08", 1)] }).map((s) => s.name);
    expect(names).toEqual(["Total", "Tháng 09", "Tháng 10", "Total TG", "TG Tháng 09"]);
  });

  it("merges Tháng/Ngày/Thứ over periods of the same day and keeps 12 columns", () => {
    const total = teachingSheets(base)[0];
    expect(total.rows[3]).toHaveLength(12);
    for (const c of [0, 1, 2]) expect(total.merges).toContainEqual({ s: { r: 4, c }, e: { r: 5, c } });
    expect(total.merges).not.toContainEqual({ s: { r: 6, c: 0 }, e: { r: 6, c: 0 } });
    expect(total.rows.at(-1)?.[0]).toBe("Tổng cộng · 3 tiết");
  });

  it("sizes month columns by the number of weeks", () => {
    const [, sep, oct] = teachingSheets(base);
    expect(sep.rows[3]).toHaveLength(5 + 5 + 3);
    expect(oct.rows[3]).toHaveLength(5 + 4 + 3);
    expect(sep.rows.at(-1)?.slice(5, 10)).toEqual([2, 2, 2, 2, 2]);
  });
});
