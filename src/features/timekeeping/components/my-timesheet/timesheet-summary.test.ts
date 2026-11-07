import { describe, expect, it } from "vitest";

import type { MonthDayView } from "../../api/timekeeping-types";
import { firstIssue, monthGridCells, shiftPeriod, unitsVi } from "./timesheet-summary";

const DAYS: MonthDayView[] = [
  { date: "2026-10-12", status: "FULL", units: 1 },
  { date: "2026-10-14", status: "MISSING_PUNCH", units: 0.5 },
  { date: "2026-10-07", status: "MISSING_PUNCH", units: 0.5 },
];

describe("monthGridCells", () => {
  it("pads October 2026 (starts on Thursday) with 3 leading nulls and fills whole weeks", () => {
    const cells = monthGridCells("2026-10", DAYS, "2026-10-14");
    expect(cells.slice(0, 3).every((c) => c.date === null)).toBe(true);
    expect(cells[3].date).toBe("2026-10-01");
    expect(cells.filter((c) => c.date)).toHaveLength(31);
    expect(cells.length % 7).toBe(0);
    expect(cells.find((c) => c.date === "2026-10-14")).toMatchObject({ status: "MISSING_PUNCH", today: true });
  });

  it("has no leading pad when the month starts on Monday", () => {
    expect(monthGridCells("2026-06", [], "")[0].date).toBe("2026-06-01");
  });
});

describe("firstIssue", () => {
  it("returns the latest missing-punch day", () => expect(firstIssue(DAYS)?.date).toBe("2026-10-14"));
  it("returns null when none", () => expect(firstIssue([DAYS[0]])).toBeNull());
});

describe("formatting helpers", () => {
  it("uses a decimal comma and rolls the year", () => {
    expect(unitsVi(0.5)).toBe("0,5");
    expect(shiftPeriod("2026-01", -1)).toBe("2025-12");
  });
});
