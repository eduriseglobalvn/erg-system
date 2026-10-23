export function getProfileInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const first = parts.at(0)?.charAt(0) ?? "E";
  const last = parts.length > 1 ? parts.at(-1)?.charAt(0) : "";
  return `${first}${last}`.toUpperCase();
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
  if (nextPassword.length < 8) return "Mật khẩu mới cần tối thiểu 8 ký tự.";
  if (nextPassword !== form.confirmPassword.trim()) return "Mật khẩu xác nhận chưa khớp.";
  return null;
}
import type { PasswordFormState } from "@/features/profile/types/profile-types";

