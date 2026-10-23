import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("assessment governance contract boundary", () => {
  it("does not render fixture campaigns or local-only approval mutations", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/features/lcms/school-management/components/assessment/assessment-governance-workspace.tsx"),
      "utf8",
    );

    expect(source).not.toContain("mock-training-monitoring");
    expect(source).not.toContain("assessmentCampaigns");
    expect(source).not.toContain("setRequests");
    expect(source).toContain("Chờ contract backend");
  });
});
