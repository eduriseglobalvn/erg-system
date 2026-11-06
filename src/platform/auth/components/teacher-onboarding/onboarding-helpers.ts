import type { TeacherOnboardingStep } from "@/platform/auth/types/account-lifecycle";

export const stepLabels: Record<TeacherOnboardingStep, string> = {
  COMPLETE_PROFILE: "Hồ sơ & số điện thoại",
  VERIFY_RECOVERY_EMAIL: "Email khôi phục",
  CHANGE_PASSWORD: "Mật khẩu mới",
};

export function formatExpiryTime(isoString?: string | null) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function isGoogleEmail(email?: string | null) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith("@gmail.com") || normalized.endsWith("@googlemail.com");
}

export function describeOnboardingError(rawMsg: string) {
  if (rawMsg.includes("502") || rawMsg.includes("Failed to fetch") || rawMsg.includes("NetworkError")) {
    return "Không thể kết nối đến máy chủ (502). Vui lòng đảm bảo server backend đang chạy và thử lại.";
  }
  if (rawMsg.includes("conflicts with existing data") || rawMsg.includes("already used by another")) {
    return "Email này đã được liên kết với một tài khoản khác. Vui lòng kiểm tra lại.";
  }
  if (rawMsg.includes("recovery email must differ")) {
    return "Email khôi phục phải khác với email đăng nhập chính.";
  }
  if (rawMsg.includes("wait before requesting another")) {
    return "Vui lòng đợi ít giây trước khi yêu cầu gửi lại mã xác minh mới.";
  }
  if (rawMsg.includes("invalid verification code")) {
    return "Mã xác minh OTP không chính xác. Vui lòng kiểm tra lại.";
  }
  if (rawMsg.includes("verification code has expired")) {
    return "Mã xác minh OTP đã hết hạn. Vui lòng bấm gửi lại mã mới.";
  }
  return rawMsg;
}
