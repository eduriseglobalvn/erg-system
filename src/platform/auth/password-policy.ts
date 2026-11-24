/** Rule for a password the user chooses (change password, teacher onboarding). Login and system-issued student passwords are exempt. */
export const PASSWORD_RULE_TEXT = "Tối thiểu 6 ký tự, gồm chữ hoa, chữ thường và ký tự đặc biệt.";

/** Error message naming what is missing, or null when the password meets the rule. Must match the backend's ChangePasswordRequest pattern. */
export function passwordPolicyError(password: string): string | null {
  const missing = [
    password.length < 6 && "ít nhất 6 ký tự",
    !/\p{Lu}/u.test(password) && "chữ hoa",
    !/\p{Ll}/u.test(password) && "chữ thường",
    !/[^\p{L}\p{N}\s]/u.test(password) && "ký tự đặc biệt",
  ].filter(Boolean);
  if (password.length > 128) return "Mật khẩu tối đa 128 ký tự.";
  return missing.length ? `Mật khẩu cần có ${missing.join(", ")}.` : null;
}
