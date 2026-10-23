import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const API_ROOT = resolve(process.cwd(), "src/features/lcms/quiz/quiz-runtime/api");
const MAX_OWNER_LINES = 300;

const OWNERS = [
  "quiz-runtime-api.ts",
  "quiz-runtime-package-api.ts",
  "quiz-runtime-attempt-command-api.ts",
  "quiz-runtime-submit-model.ts",
  "quiz-runtime-package-normalizer.ts",
  "quiz-runtime-question-normalizers.ts",
  "quiz-runtime-normalization-utils.ts",
  "quiz-runtime-package-shuffle.ts",
] as const;

const PURE_OWNERS = [
  "quiz-runtime-submit-model.ts",
  "quiz-runtime-package-normalizer.ts",
  "quiz-runtime-question-normalizers.ts",
  "quiz-runtime-normalization-utils.ts",
  "quiz-runtime-package-shuffle.ts",
] as const;

describe("Quiz Runtime API ownership", () => {
  it.each(OWNERS)("keeps %s below the API owner budget and independent from UI", (fileName) => {
    const source = readFileSync(resolve(API_ROOT, fileName), "utf8");

    expect(source.split(/\r?\n/).length, `${fileName} exceeds ${MAX_OWNER_LINES} lines`).toBeLessThanOrEqual(
      MAX_OWNER_LINES,
    );
    expect(source).not.toMatch(/from\s+["'][^"']*\/(?:components|pages)\//);
  });

  it("keeps the public entry point as re-exports only", () => {
    const source = readFileSync(resolve(API_ROOT, "quiz-runtime-api.ts"), "utf8");

    expect(source).toContain("quiz-runtime-package-api");
    expect(source).toContain("quiz-runtime-attempt-command-api");
    expect(source).toContain("quiz-runtime-submit-model");
    expect(source).toContain("quiz-runtime-package-shuffle");
    expect(source).not.toMatch(/\b(?:async\s+)?function\b/);
  });

  it.each(PURE_OWNERS)("keeps %s free of transport and TanStack Query", (fileName) => {
    const source = readFileSync(resolve(API_ROOT, fileName), "utf8");

    expect(source).not.toContain("@/lib/api-client");
    expect(source).not.toContain("@tanstack/react-query");
  });
});
