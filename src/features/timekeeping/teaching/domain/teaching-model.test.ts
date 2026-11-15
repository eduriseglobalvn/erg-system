import { describe, expect, it } from "vitest";

import type { TeachingPeriodRow } from "../../api/timekeeping-teaching-api";
import { dayShading, groupByDay, hmVi, schoolCount, schoolSpans, totalSummary, weekCaptionVi, weekLabelVi, weekNotStarted, groupTeachingRows, hasTeaching, missingCells, mondayOf, monthEnded, myMonthState, periodRangeLabel, yearMonths, teachingErrorText, weekIndexOf } from "./teaching-model";

describe("teaching-model", () => {
  it("merges consecutive periods of the same day", () => {
    const rows = [{ date: "2026-11-09" }, { date: "2026-11-09" }, { date: "2026-11-10" }, { date: "2026-11-09" }] as TeachingPeriodRow[];
    expect(groupByDay(rows).map((c) => c.daySpan)).toEqual([2, 0, 1, 1]);
  });

  it("finds the week of a date and flags missing-report cells", () => {
    const weeks = [{ from: "2026-10-01", to: "2026-10-02" }, { from: "2026-10-05", to: "2026-10-09" }];
    expect(weekIndexOf(weeks, "2026-10-08")).toBe(1);
    expect(weekIndexOf(weeks, "2026-10-03")).toBe(-1);
    expect(missingCells({ weeks, missingReports: [{ date: "2026-10-08", className: "6A4" }] }).has("1|6A4")).toBe(true);
  });

  it("groups rows by school, subject and level", () => {
    const groups = groupTeachingRows([
      { schoolName: "A", subjectName: "IC3", level: "Cấp 2", className: "6A1" },
      { schoolName: "A", subjectName: "IC3", level: "Cấp 2", className: "6A2" },
      { schoolName: "B", subjectName: "IC3", level: "Cấp 1", className: "3A" },
    ]);
    expect(groups.map((g) => g.rows.length)).toEqual([2, 1]);
  });

  it("works out months, school years and Mondays", () => {
    expect(monthEnded("2026-10", "2026-11-01")).toBe(true);
    expect(monthEnded("2026-10", "2026-10-31")).toBe(false);
    expect(yearMonths(2026, "2026-03-15")).toEqual(["2026-01", "2026-02", "2026-03"]);
    expect(mondayOf("2026-10-08")).toBe("2026-10-05");
    expect(mondayOf("2026-11-15")).toBe("2026-11-09");
  });

  it("labels period ranges", () => {
    expect(periodRangeLabel(1, 2)).toBe("Tiết 1–2");
    expect(periodRangeLabel(3, 1)).toBe("Tiết 3");
  });

  it("derives the teacher's month state", () => {
    const pending = { status: "COLLECTING", confirmation: { status: "PENDING" } };
    expect(myMonthState(pending, "2026-10", "2026-10-20")).toBe("COLLECTING");
    expect(myMonthState(pending, "2026-10", "2026-11-02")).toBe("AWAITING");
    expect(myMonthState({ ...pending, confirmation: { status: "ISSUE_REPORTED" } }, "2026-10", "2026-11-02")).toBe("ISSUE");
    expect(myMonthState({ status: "CLOSED" }, "2026-10", "2026-11-02")).toBe("CLOSED");
  });

  it("hides the tab without periods and maps error codes", () => {
    expect(hasTeaching(undefined)).toBe(false);
    expect(hasTeaching({ total: 0, rows: [] })).toBe(false);
    expect(hasTeaching({ total: 4 })).toBe(true);
    expect(teachingErrorText(Object.assign(new Error("x"), { code: "TOTAL_CHANGED", status: 409 }))).toBe("Số tiết vừa thay đổi, kiểm tra lại trước khi xác nhận.");
  });

  it("writes week labels and lesson times as the boards do", () => {
    expect(weekLabelVi("01-04")).toBe("01–04");
    expect(weekLabelVi("30")).toBe("30");
    expect(weekCaptionVi({ label: "01-02", to: "2026-10-02" })).toBe("01–02/10");
    expect(hmVi("13:15:00")).toBe("13h15");
    expect(hmVi(undefined)).toBe("");
  });

  it("merges school cells, shades alternate days and greys weeks not started", () => {
    expect(schoolSpans([{ schoolName: "A" }, { schoolName: "A" }, { schoolName: "B" }, { schoolName: "A" }])).toEqual([2, 0, 1, 1]);
    expect(dayShading([{ daySpan: 2 }, { daySpan: 0 }, { daySpan: 1 }, { daySpan: 1 }])).toEqual([false, false, true, false]);
    expect(weekNotStarted({ from: "2026-11-09" }, "2026-11-05")).toBe(true);
    expect(weekNotStarted({ from: "2026-11-02" }, "2026-11-05")).toBe(false);
    expect(schoolCount([{ schoolName: "A" }, { schoolName: "A" }, { schoolName: "B" }, {}])).toBe(2);
  });

  it("only counts days in the summary when every period is on the page", () => {
    const rows = [{ date: "2026-11-09" }, { date: "2026-11-09" }, { date: "2026-11-10" }];
    expect(totalSummary(rows, 3)).toBe("2 buổi dạy · 3 tiết");
    expect(totalSummary(rows, 40)).toBe("40 tiết");
  });
});
