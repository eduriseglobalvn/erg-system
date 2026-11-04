import { formatUserAgent } from "@/features/employee-management/lib/user-agent";
import type { SecurityFeedItem } from "@/features/employee-management/types/employee-management";

const EVENT_SENTENCE: Record<string, string> = {
  LOGIN_SUCCESS: "Đăng nhập thành công",
  LOGIN_FAILED: "Đăng nhập không thành công",
  LOGIN_FAILURE: "Đăng nhập không thành công",
  LOGIN_ATTEMPT: "Thử đăng nhập",
  LOGIN_THROTTLE_REQUIRED: "Đăng nhập bị giới hạn do thử quá nhiều lần",
  LOGOUT: "Đăng xuất",
  ACCOUNT_LOCKED: "Tài khoản bị khoá",
  SESSION_CREATED: "Mở phiên đăng nhập mới",
  SESSION_REPLACED: "Phiên đăng nhập bị thay thế bởi thiết bị khác",
  RAPID_SESSION_REPLACEMENT: "Đổi phiên đăng nhập liên tục trong thời gian ngắn",
  SESSION_REVOKED: "Phiên đăng nhập bị thu hồi",
  SESSIONS_REVOKED: "Tất cả phiên đăng nhập bị thu hồi",
  PASSWORD_RESET: "Đặt lại mật khẩu",
  CREDENTIAL_RESET: "Cấp lại thông tin đăng nhập",
  USER_UPDATED: "Cập nhật tài khoản",
  EMPLOYEE_UPDATED: "Cập nhật hồ sơ nhân sự",
  ROLE_CREATED: "Tạo nhóm quyền",
  ROLE_UPDATED: "Cập nhật nhóm quyền",
  ROLE_CHANGED: "Thay đổi nhóm quyền của tài khoản",
  ASSIGNMENT_CREATED: "Gán quyền cho tài khoản",
  AUTHZ_CHANGED: "Thay đổi phân quyền",
  AUTHORIZATION_CHANGED: "Thay đổi phân quyền",
};

const SOURCE_FALLBACK: Record<string, string> = {
  LOGIN_ATTEMPT: "Đăng nhập",
  SECURITY_EVENT: "Cảnh báo bảo mật",
  SESSION: "Hoạt động phiên đăng nhập",
  USER_ACTIVITY: "Hoạt động quản trị",
};

export function describeSecurityEvent(item: Pick<SecurityFeedItem, "eventType" | "riskCode" | "sourceType">) {
  return (
    EVENT_SENTENCE[item.riskCode ?? ""] ??
    EVENT_SENTENCE[item.eventType] ??
    SOURCE_FALLBACK[item.sourceType ?? ""] ??
    "Hoạt động khác"
  );
}

export type AccessResult = "success" | "failed" | "warning" | "unknown";

export function accessResult(item: Pick<SecurityFeedItem, "result">): AccessResult {
  const value = (item.result ?? "").toUpperCase();
  if (value === "FAILED" || value === "FAILURE" || value === "DENIED") return "failed";
  if (value === "WARNING") return "warning";
  if (value === "SUCCESS") return "success";
  return "unknown";
}

export const ACCESS_RESULT_LABEL: Record<AccessResult, string> = {
  failed: "Thất bại",
  warning: "Cảnh báo",
  success: "Thành công",
  unknown: "Không rõ",
};

const LOOPBACK = /^(::1|0:0:0:0:0:0:0:1|127\.\d+\.\d+\.\d+|::ffff:127\.0\.0\.1)$/;

export function formatIpAddress(ip?: string | null) {
  const value = ip?.trim();
  if (!value) return "—";
  return LOOPBACK.test(value) ? "localhost" : value;
}

/** "Chrome · Windows" từ user agent trong metadata; không có thì dùng nền tảng. */
export function describeDevice(item: Pick<SecurityFeedItem, "metadata" | "platform">) {
  const meta = item.metadata ?? {};
  const raw = meta.userAgent ?? meta.user_agent;
  const parsed = formatUserAgent(typeof raw === "string" ? raw : undefined);
  if (parsed) return parsed;
  if (item.platform === "WEB_MOBILE") return "Di động";
  if (item.platform === "WEB_DESKTOP") return "Máy tính";
  return "—";
}
