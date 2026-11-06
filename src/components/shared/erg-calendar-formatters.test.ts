import { describe, expect, it } from "vitest";

import { buildHourRows, CALENDAR_SCROLL_TIME, scrollTopForTime } from "./erg-calendar-formatters";

describe("calendar time grid options", () => {
  it("scrolls to 07:00 and labels hours in 24h format", () => {
    expect(CALENDAR_SCROLL_TIME).toBe("07:00:00");
    expect(scrollTopForTime()).toBe(7 * 52);
    const labels = buildHourRows().map((row) => row.label);
    expect(labels[7]).toBe("07:00");
    expect(labels[15]).toBe("15:00");
    expect(labels.join(" ")).not.toMatch(/AM|PM/);
  });
});
