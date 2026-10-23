import { expect, test } from "vitest";

import { projectTeachingDates } from "./curriculum-schedule-model";

test("projects multiple lessons per configured teaching day and skips other weekdays", () => {
  expect(projectTeachingDates({ startDate: "2026-08-24", teachingDays: [2, 4, 6], sessionsPerDay: 2 }, 7)).toEqual([
    "2026-08-25", "2026-08-25",
    "2026-08-27", "2026-08-27",
    "2026-08-29", "2026-08-29",
    "2026-09-01",
  ]);
});

test("returns no projection for an invalid empty teaching-day selection", () => {
  expect(projectTeachingDates({ startDate: "2026-08-24", teachingDays: [], sessionsPerDay: 2 }, 3)).toEqual([]);
});
