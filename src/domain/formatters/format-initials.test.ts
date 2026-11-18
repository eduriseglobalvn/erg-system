import { describe, expect, it } from "vitest";

import { nameInitials, nameWithoutTags } from "./format-initials";

describe("nameInitials", () => {
  it("takes the last two words", () => {
    expect(nameInitials("Lê Tuấn Kiệt")).toBe("TK");
    expect(nameInitials("An")).toBe("A");
  });

  it("ignores a bracketed tag and stray punctuation", () => {
    expect(nameInitials("[TEST] Giáo viên 3")).toBe("GV");
    expect(nameInitials("[TEST] Nhóm U")).toBe("NU");
    expect(nameInitials("- Trần  Bình")).toBe("TB");
    expect(nameInitials("[TEST] Học sinh 01")).toBe("HS");
    expect(nameInitials("7 12")).toBe("71");
  });

  it("drops the tag from a display name", () => {
    expect(nameWithoutTags("[TEST] Học  sinh 01")).toBe("Học sinh 01");
    expect(nameWithoutTags(undefined)).toBe("");
  });

  it("is empty when nothing usable is left", () => {
    expect(nameInitials("[TEST]")).toBe("");
    expect(nameInitials(undefined)).toBe("");
  });
});
