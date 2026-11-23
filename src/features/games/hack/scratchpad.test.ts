import { describe, expect, it } from "vitest";

import { evalScratch, formatScratch } from "@/features/games/hack/scratchpad";

describe("scratchpad", () => {
  it("evaluates the design example", () => {
    expect(formatScratch(evalScratch("2 × 1024 ÷ 250") ?? 0)).toBe("8,19");
  });
  it("honours precedence, brackets, commas and unary minus", () => {
    expect(evalScratch("2+3*4")).toBe(14);
    expect(evalScratch("(2+3)*4")).toBe(20);
    expect(evalScratch("1,5*2")).toBe(3);
    expect(evalScratch("-3+5")).toBe(2);
  });
  it("rejects anything that is not arithmetic", () => {
    expect(evalScratch("alert(1)")).toBeNull();
    expect(evalScratch("2+")).toBeNull();
    expect(evalScratch("1/0")).toBeNull();
    expect(evalScratch("")).toBeNull();
  });
});
