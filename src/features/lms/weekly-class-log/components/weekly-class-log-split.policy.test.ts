import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(process.cwd(), "src/features/lms/weekly-class-log/components");

describe("Weekly Class Log ownership", () => {
  it("keeps the public page as a thin composition owner", () => {
    const source = readFileSync(resolve(ROOT, "weekly-class-log-page.tsx"), "utf8");

    expect(source.split(/\r?\n/).length).toBeLessThanOrEqual(100);
    expect(source).toContain("useWeeklyClassLogController");
    expect(source).toContain("WeeklyClassLogHeader");
    expect(source).toContain("WeeklyClassLogTable");
    expect(source).toContain("WeeklyClassLogSummary");
    expect(source).not.toMatch(/\buse(?:State|Effect|Memo)\b/);
  });

  it.each([
    "weekly-class-log-model.ts",
    "use-weekly-class-log-controller.ts",
    "weekly-class-log-header.tsx",
    "weekly-class-log-table.tsx",
    "weekly-class-log-summary.tsx",
  ])("has a dedicated %s owner", (fileName) => {
    expect(() => readFileSync(resolve(ROOT, fileName), "utf8")).not.toThrow();
  });
});
