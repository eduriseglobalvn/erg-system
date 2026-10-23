import { describe, expect, test } from "vitest";

import { getPasswordScore, getProfileInitials, validatePasswordChange } from "@/features/profile/utils/profile-utils";

describe("profile utilities", () => {
  test("derives stable initials from a display name", () => {
    expect(getProfileInitials("Nguyễn Văn An")).toBe("NA");
    expect(getProfileInitials("ERG")).toBe("E");
  });

  test("scores password strength using the existing four checks", () => {
    expect(getPasswordScore("")).toBe(0);
    expect(getPasswordScore("Abcdef1!")).toBe(4);
  });

  test.each([
    [{ currentPassword: "", nextPassword: "Abcdef1!", confirmPassword: "Abcdef1!" }, "Vui lòng nhập mật khẩu hiện tại."],
    [{ currentPassword: "old", nextPassword: "short", confirmPassword: "short" }, "Mật khẩu mới cần tối thiểu 8 ký tự."],
    [{ currentPassword: "old", nextPassword: "Abcdef1!", confirmPassword: "different" }, "Mật khẩu xác nhận chưa khớp."],
    [{ currentPassword: "old", nextPassword: " Abcdef1! ", confirmPassword: "Abcdef1!" }, null],
  ])("validates password change %#", (form, expected) => {
    expect(validatePasswordChange(form)).toBe(expected);
  });
});
