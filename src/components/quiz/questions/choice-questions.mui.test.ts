import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("choice question MUI policy", () => {
  it.each(["single-choice-question.tsx", "multiple-response-question.tsx"])("migrates %s", (file) => {
    const source = readFileSync(resolve(process.cwd(), "src/components/quiz/questions", file), "utf8");
    expect(source).not.toMatch(/className="[^"]*(?:\bflex\b|\bgrid\b|\bgap-\d|\brounded-|\bbg-\[|\blg:)/);
  });
});
