import { describe, expect, it } from "vitest";

import type { LessonReportMatrix, LessonReportRow } from "./lesson-report-api";
import { cellNote, dayHead, overdueText, rateTone, remindTargets, rowRate, sheetRows, summarize, weekTitle } from "./lesson-report-model";

const cell = (date: string, state: LessonReportRow["cells"][number]["state"], periods = state === "NONE" ? 0 : 2) => ({ date, state, periods });
const days = ["2026-11-09", "2026-11-10", "2026-11-11"];
const row = (id: string, school: string, states: LessonReportRow["cells"][number]["state"][]): LessonReportRow => ({
  teacherId: id, teacherName: `GV ${id}`, schoolName: school, cells: states.map((s, i) => cell(days[i]!, s)),
});
const rows = [row("a", "THCS A", ["ON_TIME", "LATE", "MISSING"]), row("b", "THCS A, TH B", ["ON_TIME", "NONE", "ON_TIME"])];

describe("lesson report model", () => {
  it("sums periods per state (as the backend counts them) and the teachers behind each", () => {
    expect(summarize(rows)).toMatchObject({ periods: 10, onTime: 6, late: 2, missing: 2, teachers: 2, schools: 2, lateTeachers: 1, missingTeachers: 1, onTimePercent: 60 });
    expect(summarize([])).toMatchObject({ periods: 0, onTimePercent: 0 });
  });

  it("rates a teacher over the days that count and leaves a free week empty", () => {
    expect(rowRate(rows[0]!)).toBe(33);
    expect(rowRate(rows[1]!)).toBe(100);
    expect(rowRate(row("c", "x", ["NONE", "NONE"]))).toBeNull();
  });

  it("reminds only teachers with a missing day", () => {
    expect(remindTargets(rows)).toEqual(["a"]);
  });

  it("words the overdue time from the 23:59 deadline", () => {
    expect(overdueText("2026-11-11", new Date(2026, 10, 13, 9, 30))).toBe("Quá hạn 1 ngày 9 giờ");
    expect(overdueText("2026-11-12", new Date(2026, 10, 13, 5, 0))).toBe("Quá hạn 5 giờ");
    expect(overdueText("2026-11-11", new Date(2026, 10, 13, 0, 0))).toBe("Quá hạn 1 ngày");
  });

  it("explains a cell, today's unconfirmed one still has time", () => {
    const now = new Date(2026, 10, 13, 8, 0);
    expect(cellNote("MISSING", 2, "2026-11-11", now)).toBe("2 tiết chưa xác nhận · Quá hạn 1 ngày 8 giờ");
    expect(cellNote("NONE", 2, "2026-11-13", now)).toContain("còn hạn đến 23:59");
    expect(cellNote("NONE", 0, "2026-11-10", now)).toBe("Không có tiết");
  });

  it("titles the week and the day columns as the board does", () => {
    expect(weekTitle(["2026-11-09", "2026-11-13"])).toBe("Tuần 09 – 13/11");
    expect(dayHead("2026-11-09")).toBe("T2 09/11");
    expect(dayHead("2026-11-15")).toBe("CN 15/11");
  });

  it("exports a header plus one line per teacher and keeps formulas inert", () => {
    const matrix = { weekStart: "2026-11-09", days, stats: { periods: 0, teachers: 0, schools: 0, onTime: 0, late: 0, missing: 0 }, rows } as LessonReportMatrix;
    const sheet = sheetRows(matrix, [{ ...rows[0]!, teacherName: "=HYPERLINK()" }]);
    expect(sheet[0]).toEqual(["Giáo viên", "Trường", "T2 09/11", "T3 10/11", "T4 11/11", "Đúng hạn"]);
    expect(sheet[1]?.[0]).toBe("'=HYPERLINK()");
    expect(sheet[1]?.slice(2)).toEqual(["Đúng hạn (2)", "Muộn (2)", "Chưa báo (2)", "33%"]);
  });

  it("bands the on-time rate", () => {
    expect([50, 69, 70, 99, 100].map(rateTone)).toEqual(["bad", "bad", "warn", "warn", "good"]);
  });
});
