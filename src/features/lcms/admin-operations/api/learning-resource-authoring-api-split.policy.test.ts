import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const API_ROOT = resolve(process.cwd(), "src/features/lcms/admin-operations/api");
const MAX_OWNER_LINES = 300;

const OWNERS = [
  "learning-resource-authoring-api.ts",
  "learning-resource-authoring-domain-types.ts",
  "learning-resource-authoring-transport-types.ts",
  "learning-resource-authoring-library-query-api.ts",
  "learning-resource-authoring-library-mapper.ts",
  "learning-resource-authoring-resource-command-api.ts",
  "learning-resource-authoring-taxonomy-command-api.ts",
  "learning-resource-authoring-asset-command-api.ts",
  "learning-resource-authoring-content-mapper.ts",
  "learning-resource-authoring-utils.ts",
] as const;

const PURE_OWNERS = [
  "learning-resource-authoring-domain-types.ts",
  "learning-resource-authoring-transport-types.ts",
  "learning-resource-authoring-library-mapper.ts",
  "learning-resource-authoring-content-mapper.ts",
  "learning-resource-authoring-utils.ts",
] as const;

describe("Learning Resource Authoring API ownership", () => {
  it.each(OWNERS)("keeps %s focused and independent from UI", (fileName) => {
    const source = readFileSync(resolve(API_ROOT, fileName), "utf8");

    expect(source.split(/\r?\n/).length, `${fileName} exceeds ${MAX_OWNER_LINES} lines`).toBeLessThanOrEqual(
      MAX_OWNER_LINES,
    );
    expect(source).not.toMatch(/from\s+["'][^"']*\/(?:components|pages)\//);
  });

  it("keeps the public API entry point as re-exports only", () => {
    const source = readFileSync(resolve(API_ROOT, "learning-resource-authoring-api.ts"), "utf8");

    expect(source).toContain("learning-resource-authoring-library-query-api");
    expect(source).toContain("learning-resource-authoring-resource-command-api");
    expect(source).toContain("learning-resource-authoring-taxonomy-command-api");
    expect(source).toContain("learning-resource-authoring-asset-command-api");
    expect(source).not.toMatch(/\b(?:async\s+)?function\b/);
  });

  it.each(PURE_OWNERS)("keeps %s free of transport execution", (fileName) => {
    const source = readFileSync(resolve(API_ROOT, fileName), "utf8");

    expect(source).not.toContain("@/lib/api-client");
    expect(source).not.toContain("@/lib/graphql-client");
    expect(source).not.toContain("@tanstack/react-query");
  });
});
