import { describe, expect, it } from "vitest";

import { period, week } from "../test/class-log-test-data";
import { buildTeacherRows, summarizeClassWeek } from "./class-log-model";

describe("class log model", () => {
  it("heads every day Monday to Saturday, with the empty wording for days without periods", () => {
    const rows = buildTeacherRows(week([period({ periodNo: 2, eventId: "e2" }), period()]));
    const days = rows.filter((r) => r.kind === "day");
    expect(days.map((d) => d.kind === "day" && d.weekday)).toEqual(["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]);
    expect(days[0]).toMatchObject({ meta: "Chiều · 2 tiết", empty: false });
    expect(days[1]).toMatchObject({ meta: "Không có tiết theo TKB", empty: true });
    expect(rows.filter((r) => r.kind === "period").map((r) => r.kind === "period" && r.period.periodNo)).toEqual([1, 2]);
  });

  it("counts absences by kind and lists the subjects nobody signed", () => {
    const w = week([
      period({ absentees: [{ studentId: "s1", shortName: "Bảo", excused: true }, { studentId: "s2", shortName: "An", excused: false }] }),
      period({ eventId: "e2", date: "2026-11-10", subjectName: "LS & ĐL", status: "CONFIRMED" }),
      period({ eventId: "e3", date: "2026-11-11", subjectName: "Toán" }),
    ]);
    expect(summarizeClassWeek(w)).toEqual({ absenceText: "2 lượt · 1P; 1K", unsignedText: "2 (Tin học IC3, Toán)", unsignedCount: 2 });
  });
});
