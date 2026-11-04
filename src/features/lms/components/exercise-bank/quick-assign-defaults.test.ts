import { describe, expect, it } from "vitest";
import { defaultQuickAssignDueInput, dueInputToIso } from "./quick-assign-defaults";

describe("quick assign defaults", () => {
  it("uses today + 7 days on the local calendar", () => {
    expect(defaultQuickAssignDueInput(new Date(2026, 10, 5, 0, 30))).toBe("2026-11-12");
  });

  it("rolls over month and year boundaries", () => {
    expect(defaultQuickAssignDueInput(new Date(2026, 11, 28, 23, 50))).toBe("2027-01-04");
  });

  it("converts the due date to the end of the local day", () => {
    const iso = dueInputToIso("2026-11-12");
    const due = new Date(iso as string);
    expect([due.getFullYear(), due.getMonth(), due.getDate(), due.getHours(), due.getMinutes()]).toEqual([2026, 10, 12, 23, 59]);
    expect(dueInputToIso("bad")).toBeNull();
  });
});
