import { afterEach, describe, expect, it, vi } from "vitest";

import { createInitialCalendarRange } from "./calendar-date-range";

describe("createInitialCalendarRange", () => {
  afterEach(() => vi.useRealTimers());

  it("uses the current Monday-to-Sunday week instead of a hard-coded date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-13T08:00:00+07:00"));

    expect(createInitialCalendarRange("week")).toEqual({
      from: "2026-07-13",
      initialDate: "2026-07-13",
      to: "2026-07-19",
    });
  });

  it("uses the current calendar month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-13T08:00:00+07:00"));

    expect(createInitialCalendarRange("month")).toEqual({
      from: "2026-07-01",
      initialDate: "2026-07-13",
      to: "2026-07-31",
    });
  });
});
