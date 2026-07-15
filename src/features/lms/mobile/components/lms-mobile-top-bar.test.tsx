import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

it("implements the LMS mobile top bar with MUI only", () => {
  const source = readFileSync(resolve("src/features/lms/mobile/components/lms-mobile-top-bar.tsx"), "utf8");
  expect(source).not.toContain("lucide-react");
  expect(source).not.toContain("className=");
});
