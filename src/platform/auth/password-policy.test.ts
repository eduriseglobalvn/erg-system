import { describe, expect, it } from "vitest";
import { passwordPolicyError } from "@/platform/auth/password-policy";

describe("passwordPolicyError", () => {
  it.each(["Abc@12", "Mật@Khẩu", "aB!cde"])("accepts %s", (password) => {
    expect(passwordPolicyError(password)).toBeNull();
  });

  it("names everything that is missing", () => {
    expect(passwordPolicyError("abc")).toBe("Mật khẩu cần có ít nhất 6 ký tự, chữ hoa, ký tự đặc biệt.");
    expect(passwordPolicyError("ABCDEF1")).toBe("Mật khẩu cần có chữ thường, ký tự đặc biệt.");
  });

  it("does not count a space as a special character", () => {
    expect(passwordPolicyError("Abc def")).toBe("Mật khẩu cần có ký tự đặc biệt.");
  });
});
