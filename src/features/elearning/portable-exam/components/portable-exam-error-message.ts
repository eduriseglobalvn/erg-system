import { PortableExamVerificationError } from "@/features/elearning/portable-exam/types/portable-exam-types";

export function portableArtifactErrorMessage(error: unknown) {
  // Network failures surface as TypeError("Failed to fetch"); never show that raw text to students.
  if (error instanceof TypeError) return "Không thể kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.";
  const code = error instanceof PortableExamVerificationError ? error.code : undefined;
  if (code === "KEY_NOT_TRUSTED") return "Khóa phát hành của gói bài thi không được tin cậy.";
  if (code === "INVALID_SIGNATURE" || code === "INVALID_CONTENT_HASH") return "Nội dung bài thi đã bị thay đổi hoặc không còn toàn vẹn.";
  if (code === "EXPIRED" || code === "REVOKED") return "Gói bài thi đã hết hạn hoặc bị thu hồi.";
  if (code === "MIN_RUNTIME") return "Gói bài thi yêu cầu phiên bản ứng dụng mới hơn.";
  return "Gói bài thi không hợp lệ, bị thiếu hoặc không tương thích với phiên bản này.";
}
