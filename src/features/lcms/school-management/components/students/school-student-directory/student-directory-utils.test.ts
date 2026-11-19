import { describe, expect, it } from "vitest";

import {
  getAvatarStyle,
  getInitials,
} from "@/features/lcms/school-management/components/students/school-student-directory/student-directory-utils";

describe("getInitials", () => {
  it("falls back to HS", () => {
    expect(getInitials(null)).toBe("HS");
    expect(getInitials(undefined)).toBe("HS");
  });
  it("uses the shared initials of the last two words", () => {
    expect(getInitials("an")).toBe("A");
    expect(getInitials("Nguyen Van An")).toBe("VA");
    expect(getInitials("[TEST] Học sinh 01")).toBe("HS");
  });
});

describe("getAvatarStyle", () => {
  it("is deterministic per name", () => {
    expect(getAvatarStyle("Nguyen Van An")).toBe(getAvatarStyle("Nguyen Van An"));
    expect(getAvatarStyle(null)).toBe(getAvatarStyle("HS"));
  });
});
