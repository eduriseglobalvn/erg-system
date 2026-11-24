import { describe, expect, it } from "vitest";

import { buildAttendanceSheet, monthRange, weekStartsBetween } from "./attendance-sheet-model";

const p = (date: string, periodNo: number, over: Record<string, unknown> = {}) => ({
  absentees: [],
  date,
  eventId: "e1",
  happened: true,
  periodNo,
  subjectId: "s1",
  subjectName: "Tin học",
  ...over,
});

describe("attendance sheet", () => {
  it("covers every week of the month", () => {
    expect(monthRange("2026-11-19")).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(monthRange("2028-02-10").to).toBe("2028-02-29");
    expect(weekStartsBetween("2026-11-01", "2026-11-30")).toEqual(["2026-10-26", "2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30"]);
  });

  it("groups this subject's periods by week and marks x/K/P", () => {
    const sheet = buildAttendanceSheet(
      [
        p("2026-11-12", 2, { absentees: [{ excused: true, shortName: "B", studentId: "b" }] }),
        p("2026-11-04", 1, { absentees: [{ excused: false, shortName: "A", studentId: "a" }] }),
        p("2026-11-12", 2), // duplicate from an overlapping week fetch
        p("2026-11-05", 3, { subjectId: "other" }),
        p("2026-10-30", 1), // outside the month
        p("2026-11-19", 1, { happened: false }),
      ],
      [{ id: "a", name: "An" }, { id: "b", name: "Bình" }],
      { from: "2026-11-01", subjectId: "s1", subjectName: "Tin học", to: "2026-11-30" },
    );
    expect(sheet.columns.map((c) => c.date)).toEqual(["2026-11-04", "2026-11-12", "2026-11-19"]);
    expect(sheet.weeks.map((w) => [w.weekStart, w.columns.length])).toEqual([["2026-11-02", 1], ["2026-11-09", 1], ["2026-11-16", 1]]);
    expect(sheet.rows[0]).toMatchObject({ absentUnexcused: 1, marks: ["K", "x", ""] });
    expect(sheet.rows[1]).toMatchObject({ absentExcused: 1, marks: ["x", "P", ""] });
  });
});
