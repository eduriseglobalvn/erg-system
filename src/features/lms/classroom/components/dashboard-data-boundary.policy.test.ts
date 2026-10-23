import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("LMS dashboard data boundary", () => {
  it("keeps overview, class list and reports free of synchronous fixture imports", () => {
    for (const fileName of ["overview-workspace.tsx", "class-list-workspace.tsx", "class-reports-workspace.tsx"]) {
      const source = readFileSync(resolve(process.cwd(), "src/features/lms/classroom/components", fileName), "utf8");
      expect(source, `${fileName} must consume dashboard props`).not.toContain("mock-classroom-data");
    }
  });

  it("renders an unavailable state when bootstrap has no operational metrics", () => {
    const source = readFileSync(resolve(process.cwd(), "src/features/lms/infrastructure/lms-dashboard-api.ts"), "utf8");
    expect(source).toContain("metricsAvailable: false");
    expect(source).toContain('principal: "Chưa có dữ liệu"');
  });
});
