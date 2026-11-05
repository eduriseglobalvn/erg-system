import { describe, expect, it } from "vitest";

import { formatDecimal, parseDecimal } from "./decimal-text";

describe("decimal-text", () => {
  it("parses a comma decimal", () => expect(parseDecimal("2,6")).toBe(2.6));
  it.each(["", "-", "abc", "Infinity"])("reads %j as NaN", (text) => expect(parseDecimal(text)).toBeNaN());
  it.each([["1.000"], ["2.500"], ["0x10"], ["1e3"], ["2,"], ["1.000,5"]])("rejects %j", (text) => expect(parseDecimal(text)).toBeNaN());
  it("accepts plain decimals", () => {
    expect(parseDecimal("1.5")).toBe(1.5);
    expect(parseDecimal(",5")).toBe(0.5);
    expect(parseDecimal("0.125")).toBe(0.125);
    expect(parseDecimal(".500")).toBe(0.5);
    expect(parseDecimal("1.2345")).toBe(1.2345);
    expect(Object.is(parseDecimal("-0"), 0)).toBe(true);
    expect(formatDecimal(-0)).toBe("0");
  });
  it("formats with a comma and no grouping", () => {
    expect(formatDecimal(2.6 - 0.05)).toBe("2,55");
    expect(formatDecimal(16384)).toBe("16384");
    expect(formatDecimal(NaN)).toBe("");
  });
});
