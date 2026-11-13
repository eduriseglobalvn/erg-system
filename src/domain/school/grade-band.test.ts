import { describe, expect, it } from "vitest";
import { gradeBandFor } from "./grade-band";

describe("gradeBandFor", () => {
  it.each([
    [100, "A"],
    [90, "A"],
    [89.99, "B"],
    [80, "B"],
    [79.99, "C"],
    [70, "C"],
    [69.99, "D"],
    [60, "D"],
    [59.99, "E"],
    [0, "E"],
  ] as const)("%s → %s", (score, band) => {
    expect(gradeBandFor(score)).toBe(band);
  });

  it("drops a student who needs support from D to E, but not from C", () => {
    expect(gradeBandFor(65, true)).toBe("E");
    expect(gradeBandFor(70, true)).toBe("C");
  });
});
