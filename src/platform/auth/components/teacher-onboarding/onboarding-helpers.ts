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
