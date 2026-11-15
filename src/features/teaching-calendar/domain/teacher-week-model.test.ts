import { describe, expect, it } from "vitest";

import { createTeacherCalendarInput, eventBox, eventTone, hourRange, leaveDays, monthWeeks, queryRange, shiftAnchor, visibleDays } from "./teacher-week-model";

describe("teacher week model", () => {
  it("lays periods out like the board: 1.1 px per minute under a 20 px head", () => {
    expect(eventBox({ endTime: "14:15", startTime: "13:30" }, 420)).toEqual({ height: 45 * 1.1 - 2, top: 20 + (810 - 420) * 1.1 });
  });

  it("keeps 07:00-17:00 and widens by whole hours around real periods", () => {
    expect(hourRange([{ endTime: "10:45", startTime: "10:00" }])).toEqual({ end: 1020, start: 420 });
    expect(hourRange([{ endTime: "19:30", startTime: "06:30" }])).toEqual({ end: 1200, start: 360 });
  });

  it("uses Monday to Saturday for the week and ranges per view", () => {
    expect(visibleDays("week", "2026-11-14")).toEqual(["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14"]);
    expect(queryRange("day", "2026-11-12")).toEqual({ from: "2026-11-12", to: "2026-11-12" });
    expect(queryRange("month", "2026-11-12")).toEqual({ from: "2026-10-26", to: "2026-12-05" });
    expect(monthWeeks("2026-11-12")).toHaveLength(6);
  });

  it("shifts by day, week and month", () => {
    expect(shiftAnchor("day", "2026-11-12", -1)).toBe("2026-11-11");
    expect(shiftAnchor("week", "2026-11-12", 1)).toBe("2026-11-19");
    expect(shiftAnchor("month", "2026-12-12", 1)).toBe("2027-01-01");
  });

  it("expands only approved leave requests into days", () => {
    const days = leaveDays([
      { fromDate: "2026-11-09", part: "FULL", status: "APPROVED", toDate: "2026-11-10", type: "LEAVE" },
      { fromDate: "2026-11-11", status: "PENDING", type: "LEAVE" },
      { fromDate: "2026-11-12", status: "APPROVED", type: "WFH" },
    ], "2026-11-10", "2026-11-14");
    expect([...days.keys()]).toEqual(["2026-11-10"]);
  });

  it("tones: assistant dashed, first school blue unless there is an assistant", () => {
    const main = { myRole: "MAIN" as const, schoolId: "a" };
    expect(eventTone(main, ["a", "b"], false)).toBe("primary");
    expect(eventTone({ ...main, schoolId: "b" }, ["a", "b"], false)).toBe("neutral");
    expect(eventTone(main, ["a"], true)).toBe("neutral");
    expect(eventTone({ ...main, myRole: "ASSISTANT" }, ["a"], true)).toBe("assistant");
  });

  it("also asks for cancelled periods so leave/holiday periods are drawn struck through", () => {
    expect(createTeacherCalendarInput("t", "week", "2026-11-12")).toMatchObject({ from: "2026-11-09", statuses: ["PUBLISHED", "CANCELLED"], to: "2026-11-14" });
  });
});
