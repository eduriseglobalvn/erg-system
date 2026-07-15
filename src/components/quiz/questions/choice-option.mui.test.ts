import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("ChoiceOption MUI policy", () => {
  it("contains no Tailwind or lucide implementation", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/quiz/questions/choice-option.tsx"), "utf8");
    expect(source).not.toMatch(/lucide-react|className="[^"]*(?:\bgrid\b|\bflex\b|\bh-\d|\bw-\d|\brounded-|\bbg-\[|\btext-\[)/);
  });
});
