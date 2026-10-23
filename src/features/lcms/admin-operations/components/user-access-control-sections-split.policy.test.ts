import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(process.cwd(), "src/features/lcms/admin-operations/components");
const owners = [
  "user-access-control-section-config.tsx",
  "user-access-control-member-sections.tsx",
  "user-access-control-role-section.tsx",
  "user-access-control-access-section.tsx",
  "user-access-control-section-primitives.tsx",
];

describe("User Access Control section ownership", () => {
  it("keeps the public facade below 250 lines", () => {
    const source = readFileSync(resolve(ROOT, "user-access-control-sections.tsx"), "utf8");
    expect(source.split(/\r?\n/).length).toBeLessThanOrEqual(250);
  });

  it("keeps focused owners present and below 300 lines", () => {
    for (const fileName of owners) {
      const source = readFileSync(resolve(ROOT, fileName), "utf8");
      expect(source.split(/\r?\n/).length, `${fileName} exceeds its owner budget`).toBeLessThanOrEqual(300);
    }
  });

  it("keeps every section MUI-first without utility classes", () => {
    const source = ["user-access-control-sections.tsx", ...owners]
      .map((fileName) => readFileSync(resolve(ROOT, fileName), "utf8"))
      .join("\n");
    expect(source).not.toMatch(/@\/components\/(?:ui|mui-icon-shim)/);
    expect(source).not.toMatch(/\bclassName\s*=/);
    expect(source).toContain("sx={{");
  });
});
