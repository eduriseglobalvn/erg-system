import { describe, expect, it } from "vitest";

import { cutoffProgress } from "@/features/elearning/student-tier/tier-format";

describe("cutoffProgress", () => {
  it("measures between the two cutoffs", () => {
    expect(cutoffProgress(1240, 1185, 1325)).toBeCloseTo(0.393, 3);
    expect(cutoffProgress(1240, 905, 1480)).toBeCloseTo(0.583, 3);
  });
  it("clamps and survives unknown or non-rising cutoffs", () => {
    expect(cutoffProgress(100, 200, 300)).toBe(0);
    expect(cutoffProgress(500, 200, 300)).toBe(1);
    expect(cutoffProgress(500, undefined, 300)).toBe(0);
    expect(cutoffProgress(500, 300, 300)).toBe(0);
  });
});
