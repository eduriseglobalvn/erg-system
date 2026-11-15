import { expect, it } from "vitest";

import { breakBefore, periodLength } from "./school-periods-page";

const slot = (periodNo: number, startTime: string | null, endTime: string | null) => ({ endTime, periodNo, session: "MORNING" as const, startTime });

it("periodLength returns the common length or undefined when lengths differ", () => {
  expect(periodLength([slot(1, "07:15", "08:00"), slot(2, "08:00", "08:45"), slot(5, null, null)])).toBe(45);
  expect(periodLength([slot(1, "07:15", "08:00"), slot(2, "08:00", "08:50")])).toBeUndefined();
});

it("breakBefore is the gap between consecutive periods, 0 when adjacent or untimed", () => {
  expect(breakBefore(slot(2, "08:00", "08:45"), slot(3, "09:15", "10:00"))).toBe(30);
  expect(breakBefore(slot(1, "07:15", "08:00"), slot(2, "08:00", "08:45"))).toBe(0);
  expect(breakBefore(slot(4, "10:00", "10:45"), slot(5, null, null))).toBe(0);
  expect(breakBefore(undefined, slot(1, "07:15", "08:00"))).toBe(0);
});
