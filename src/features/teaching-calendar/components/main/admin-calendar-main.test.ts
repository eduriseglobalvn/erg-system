import { expect, it } from "vitest";

import { addMonthsToDate } from "./admin-calendar-main";
import { hoursFor } from "./main-week-grid";

it("moves by real calendar months and clamps the day", () => {
  expect(addMonthsToDate("2026-01-31", 1)).toBe("2026-02-28");
  expect(addMonthsToDate("2026-03-15", -1)).toBe("2026-02-15");
  expect(addMonthsToDate("2026-12-10", 1)).toBe("2027-01-10");
});

it("widens the hour range for early and late events", () => {
  expect(hoursFor([])).toHaveLength(11);
  const at = (startTime: string) => ({ startTime }) as never;
  expect(hoursFor([at("06:30"), at("19:00")])[0]).toBe(6);
  expect(hoursFor([at("06:30"), at("19:00")]).at(-1)).toBe(19);
});
