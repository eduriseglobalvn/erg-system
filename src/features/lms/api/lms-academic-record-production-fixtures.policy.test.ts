import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("LMS academic-record production fixture boundary", () => {
  it("keeps attendance fixtures behind the explicit dev-only runtime flag", () => {
    const source = read("../components/attendance/use-attendance-sheet-controller.ts");
    expect(source).toContain("runtimeFixturesEnabled() ? getMockAttendanceStatus");
  });

  it("keeps score fixtures behind the explicit dev-only runtime flag and out of views", () => {
    const controller = read("../components/score/use-score-sheet-controller.ts");
    const desktop = read("../components/score/desktop-score-sheet-panel.tsx");
    const mobile = read("../components/score/mobile-score-sheet-panel.tsx");
    expect(controller).toContain("runtimeFixturesEnabled() ? getMockAttempts");
    expect(desktop).not.toContain("getMockAttempts");
    expect(mobile).not.toContain("getDefaultScore");
  });
});
