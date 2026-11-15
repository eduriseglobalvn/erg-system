import { describe, expect, it } from "vitest";

import { period, week } from "../test/class-log-test-data";
import { actualSpan, clampStart, dayDot, groupPeriods, lessonLines, whenText } from "./lesson-report-mobile-model";

const two = [
  period({ periodNo: 1, date: "2026-11-12", actualPeriod: 10, lessonTitle: "Bài 7" }),
  period({ periodNo: 2, date: "2026-11-12", actualPeriod: 11, lessonTitle: null }),
];

describe("lesson report mobile model", () => {
  it("groups the periods of one event and day and skips periods that have not happened", () => {
    const groups = groupPeriods(week([...two, period({ eventId: "e2", date: "2026-11-13", happened: false })]));
    expect(groups).toHaveLength(1);
    expect(whenText(groups[0]!)).toBe("T5 12/11 · Tiết 1–2");
    expect(lessonLines(groups[0]!)).toEqual(["T10 · Bài 7", "T11 · Chưa có trong KCT"]);
  });

  it("is confirmed only when every period is, and late when any is", () => {
    const [group] = groupPeriods(week([{ ...two[0]!, status: "CONFIRMED", late: true }, two[1]!]));
    expect(group).toMatchObject({ confirmed: false, late: true });
  });

  it("colours the day dot: waiting beats late beats done, no class is none", () => {
    const done = groupPeriods(week([period({ date: "2026-11-09", status: "CONFIRMED" }), period({ eventId: "e3", date: "2026-11-10", status: "CONFIRMED", late: true }), ...two]));
    expect([dayDot(done, "2026-11-09"), dayDot(done, "2026-11-10"), dayDot(done, "2026-11-12"), dayDot(done, "2026-11-13")]).toEqual(["ok", "late", "miss", "none"]);
  });

  it("prints the picked span and keeps it inside the framework", () => {
    expect(actualSpan(12, 2)).toBe("T12–13");
    expect(actualSpan(5, 1)).toBe("T5");
    expect(clampStart(14, 2, 14)).toBe(13);
    expect(clampStart(0, 2, 14)).toBe(1);
  });
});
