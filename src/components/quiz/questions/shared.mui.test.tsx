import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("quiz shared MUI policy", () => {
  it("does not use Tailwind or legacy UI imports", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/quiz/questions/shared.tsx"), "utf8");

    expect(source).not.toMatch(/lucide-react|@\/components\/ui|className=.{0,80}(?:\bflex\b|\bgrid\b|\bgap-\d|\brounded-|\bbg-\[|\btext-\[)/s);
  });
});
