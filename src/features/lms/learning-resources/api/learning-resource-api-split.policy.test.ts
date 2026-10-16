import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const API_ROOT = resolve(process.cwd(), "src/features/lms/learning-resources/api");
const MAX_OWNER_LINES = 300;

const OWNERS = [
  "learning-resource-api.ts",
  "learning-resource-library-query-api.ts",
  "learning-resource-explorer-command-api.ts",
  "learning-resource-mapper.ts",
  "learning-resource-viewer-api.ts",
  "learning-resource-types.ts",
] as const;

describe("learning resource API ownership", () => {
  it.each(OWNERS)("keeps %s focused and independent from UI components", (fileName) => {
    const source = readFileSync(resolve(API_ROOT, fileName), "utf8");
    const lineCount = source.split(/\r?\n/).length;

    expect(lineCount, `${fileName} exceeds ${MAX_OWNER_LINES} lines`).toBeLessThanOrEqual(MAX_OWNER_LINES);
    expect(source).not.toMatch(/from\s+["'][^"']*\/components\//);
    expect(source).not.toMatch(/from\s+["'][^"']*\/pages\//);
  });

  it("keeps the legacy API entry point as re-exports only", () => {
    const source = readFileSync(resolve(API_ROOT, "learning-resource-api.ts"), "utf8");

    expect(source).toMatch(/export \* from .*learning-resource-library-query-api/);
    expect(source).toMatch(/export \* from .*learning-resource-explorer-command-api/);
    expect(source).toMatch(/export \* from .*learning-resource-mapper/);
    expect(source).toMatch(/export \* from .*learning-resource-viewer-api/);
    expect(source).not.toMatch(/\b(?:async\s+)?function\b/);
  });
});
