import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const API_ROOT = resolve(process.cwd(), "src/features/teaching-calendar/api");
const MAX_OWNER_LINES = 300;

const OWNERS = [
  "teaching-calendar-workspace-types.ts",
  "teaching-calendar-command-types.ts",
  "teaching-calendar-transport-types.ts",
  "teaching-calendar-graphql-fragments.ts",
  "teaching-calendar-transport-utils.ts",
  "teaching-calendar-query-keys.ts",
  "teaching-calendar-workspace-query-api.ts",
  "teaching-calendar-reference-catalog-api.ts",
  "teaching-calendar-command-api.ts",
  "teaching-calendar-batch-api.ts",
  "teaching-calendar-mappers.ts",
] as const;

describe("Teaching Calendar API ownership", () => {
  it("keeps every required owner present and below 300 lines", () => {
    for (const fileName of OWNERS) {
      const filePath = resolve(API_ROOT, fileName);
      expect(existsSync(filePath), `${fileName} is missing`).toBe(true);
      const source = readFileSync(filePath, "utf8");
      expect(source.split(/\r?\n/).length, `${fileName} exceeds ${MAX_OWNER_LINES} lines`).toBeLessThanOrEqual(
        MAX_OWNER_LINES,
      );
    }
  });

  it("keeps the public API facade below 300 lines and free of behavior", () => {
    const source = readFileSync(resolve(API_ROOT, "teaching-calendar-api.ts"), "utf8");

    expect(source.split(/\r?\n/).length).toBeLessThanOrEqual(MAX_OWNER_LINES);
    expect(source).not.toMatch(/\b(?:async\s+)?function\b/);
    expect(source).not.toContain("graphQlRequest(");
    expect(source).not.toContain("apiRequest(");
    expect(source).toContain("teaching-calendar-workspace-query-api");
    expect(source).toContain("teaching-calendar-command-api");
    expect(source).toContain("teaching-calendar-batch-api");
  });

  it("keeps calendar mutation consumers away from tenant-wide invalidation", () => {
    const consumers = [
      resolve(process.cwd(), "src/features/teaching-calendar/components/teaching-schedule-batch-panel.tsx"),
      resolve(process.cwd(), "src/features/lcms/components/lcms-google-calendar-workspace.tsx"),
    ].map((filePath) => readFileSync(filePath, "utf8")).join("\n");

    expect(consumers).not.toContain('invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot(');
  });
});
