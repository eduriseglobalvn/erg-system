import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

it("implements the LMS PWA setup sheet with MUI only", () => {
  const source = readFileSync(resolve("src/features/lms/mobile/components/lms-pwa-setup-sheet.tsx"), "utf8");
  expect(source).not.toContain("lucide-react");
  expect(source).not.toContain("className=");
  expect(source).not.toContain("@/lib/utils");
});
