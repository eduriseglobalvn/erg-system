import { describe, expect, it } from "vitest";

import { addDays, mondayOf, shortDateVi, weekdayVi, weekRangeLabel } from "./class-log-week";

describe("class log week", () => {
  it("finds the Monday of any day, Sunday included", () => {
    expect(mondayOf("2026-11-12")).toBe("2026-11-09");
    expect(mondayOf("2026-11-09")).toBe("2026-11-09");
    expect(mondayOf("2026-11-15")).toBe("2026-11-09");
  });

  it("crosses month and year ends without shifting the day", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-11-09", 7)).toBe("2026-11-16");
  });

  it("names weekdays and prints the range as the board does", () => {
    expect(weekdayVi("2026-11-09")).toBe("Thứ 2");
    expect(weekdayVi("2026-11-14")).toBe("Thứ 7");
    expect(weekdayVi("2026-11-15")).toBe("Chủ nhật");
    expect(shortDateVi("2026-11-09")).toBe("09/11");
    expect(weekRangeLabel("2026-11-09", 5)).toBe("09/11 – 14/11/2026");
  });
});
