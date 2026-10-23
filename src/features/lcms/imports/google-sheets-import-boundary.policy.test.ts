import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const callSites = [
  "school-management/components/class-import-dialog.tsx",
  "school-management/components/student-import-dialog.tsx",
  "admin-operations/components/student-sheet-import-workspace.tsx",
] as const;

describe("Google Sheets import boundary", () => {
  it.each(callSites)("keeps direct Google transport out of %s", (relativePath) => {
    const source = readFileSync(resolve(process.cwd(), "src/features/lcms", relativePath), "utf8");

    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toContain("docs.google.com/spreadsheets/d/${");
  });

  it("keeps timeout and AbortSignal handling in the shared adapter", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/features/lcms/imports/google-sheets-csv-adapter.ts"),
      "utf8",
    );

    expect(source).toContain("timeoutMs");
    expect(source).toContain("AbortSignal");
    expect(source).toContain("signal?.addEventListener");
  });
});
