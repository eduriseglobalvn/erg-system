import { describe, expect, it } from "vitest";
import { formatViNumber, scoreOutOf10, tierLabel } from "./tiers";

describe("student tier helpers", () => {
  it("formats numbers the Vietnamese way", () => {
    expect(formatViNumber(1240)).toBe("1.240");
    expect(formatViNumber(7.25)).toBe("7,25");
    expect(formatViNumber(6.8)).toBe("6,8");
  });
  it("converts a raw score to the 10 scale", () => {
    expect(scoreOutOf10(72.5, 100)).toBe("7,25");
    expect(scoreOutOf10(19, 20)).toBe("9,5");
  });
  it("labels tiers with 5-to-1 divisions; Cao thủ has none", () => {
    expect(tierLabel("dong", 2)).toBe("Đồng 2");
    expect(tierLabel("ct", 1)).toBe("Cao thủ");
  });
});
