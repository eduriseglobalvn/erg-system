import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/features/lcms/admin-operations/components/student-sheet-import-workspace.tsx"),
  "utf8",
);

describe("student sheet import workspace MUI policy", () => {
  it("uses MUI path imports without legacy UI adapters", () => {
    expect(source).not.toContain("@/components/mui-icon-shim");
    expect(source).not.toContain("@/components/ui/app-select");
    expect(source).not.toContain("@/lib/utils");
    expect(source).not.toMatch(/@mui\/(?:material|icons-material)[\"']/);
  });

  it("uses MUI sx rather than utility classes", () => {
    expect(source).not.toMatch(/\bclassName\s*=(?:["'`]|\{)/);
    expect(source).toContain("sx={{");
  });
});
