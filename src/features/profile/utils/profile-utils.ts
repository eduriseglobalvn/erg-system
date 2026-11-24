export function getProfileInitials(value: string) {
  return nameInitials(value) || "E";
}
export function getPasswordScore(value: string) {
  if (!value) return 0;
  const checks = [value.length >= 8, /[A-Z]/.test(value), /[a-z]/.test(value) && /\d/.test(value), /[^A-Za-z0-9]/.test(value)];
  return checks.filter(Boolean).length;
}
export function passwordScoreLabel(score: number) {
  if (score >= 4) return "Mạnh";
  if (score >= 3) return "Khá";
  if (score >= 2) return "Trung bình";
  if (score >= 1) return "Yếu";
  return "Chưa nhập";
}

export function validatePasswordChange(form: PasswordFormState) {
  const nextPassword = form.nextPassword.trim();
  if (!form.currentPassword.trim()) return "Vui lòng nhập mật khẩu hiện tại.";
  const policyError = passwordPolicyError(nextPassword);
  if (policyError) return policyError;
  if (nextPassword !== form.confirmPassword.trim()) return "Mật khẩu xác nhận chưa khớp.";
  return null;
}
import type { PasswordFormState } from "@/features/profile/types/profile-types";
import { nameInitials } from "@/domain/formatters/format-initials";
import { passwordPolicyError } from "@/platform/auth/password-policy";

