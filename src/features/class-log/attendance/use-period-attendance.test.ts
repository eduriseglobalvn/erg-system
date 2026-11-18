import { describe, expect, it } from "vitest";

import { readAttendanceDeepLink } from "./use-period-attendance";

describe("readAttendanceDeepLink", () => {
  it("takes the date and schedule the calendar link carries", () => {
    expect(readAttendanceDeepLink("?classId=c1&date=2026-11-18&scheduleId=ev-1")).toEqual({ date: "2026-11-18", scheduleId: "ev-1" });
  });

  it("ignores a malformed or missing date", () => {
    expect(readAttendanceDeepLink("?date=18/11/2026").date).toBeNull();
    expect(readAttendanceDeepLink("").date).toBeNull();
  });
});
