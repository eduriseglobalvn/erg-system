import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/features/lcms/admin-operations/components/admin-operations-workspace.tsx"),
  "utf8",
);

describe("education unit editor MUI policy", () => {
  it("imports icons from MUI path modules", () => {
    expect(source).not.toContain("@/components/mui-icon-shim");
    expect(source).not.toMatch(/@mui\/icons-material[\"']/);
  });

  it("uses MUI controls and sx throughout the editor surface", () => {
    const editor = source.slice(
      source.indexOf("function EducationUnitEditor"),
      source.indexOf("function UnitInsightRail"),
    );

    expect(editor).not.toMatch(/\bclassName\s*=/);
    expect(editor).not.toContain("<AppSelect");
    expect(editor).not.toContain("<TsForm");
    expect(editor).toContain("sx={{");
  });
});
