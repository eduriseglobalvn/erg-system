import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/features/lcms/admin-operations/components/user-access-control-sections.tsx"),
  "utf8",
);

describe("user access control sections MUI policy", () => {
  it("uses MUI path imports without legacy UI adapters", () => {
    expect(source).not.toMatch(/@\/components\/(?:ui|mui-icon-shim)/);
    expect(source).not.toMatch(/@mui\/(?:material|icons-material)[\"']/);
    expect(source).not.toMatch(/from [\"']@\/lib\/utils[\"']/);
  });

  it("styles the operational UI with MUI sx instead of utility classes", () => {
    expect(source).not.toMatch(/\bclassName\s*=/);
    expect(source).toContain("sx={{");
  });
});
