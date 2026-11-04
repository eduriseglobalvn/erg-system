import { describe, expect, test } from "vitest";
import {
  accessResult,
  describeDevice,
  describeSecurityEvent,
  formatIpAddress,
} from "@/features/employee-management/lib/access-log-display";

describe("access log display mapping", () => {
  test("turns event enums into Vietnamese sentences", () => {
    expect(describeSecurityEvent({ eventType: "LOGIN_SUCCESS", sourceType: "LOGIN_ATTEMPT" })).toBe("Đăng nhập thành công");
    expect(describeSecurityEvent({ eventType: "X", riskCode: "RAPID_SESSION_REPLACEMENT", sourceType: "SECURITY_EVENT" })).toMatch(/liên tục/);
    expect(describeSecurityEvent({ eventType: "NEW_UNKNOWN", sourceType: "SESSION" })).toBe("Hoạt động phiên đăng nhập");
    expect(describeSecurityEvent({ eventType: "NEW_UNKNOWN", sourceType: undefined })).toBe("Hoạt động khác");
  });

  test("classifies results", () => {
    expect(accessResult({ result: "FAILED" })).toBe("failed");
    expect(accessResult({ result: "SUCCESS" })).toBe("success");
    expect(accessResult({ result: null })).toBe("unknown");
  });

  test("shows localhost or a dash instead of loopback and empty ips", () => {
    expect(formatIpAddress("0:0:0:0:0:0:0:1")).toBe("localhost");
    expect(formatIpAddress("::1")).toBe("localhost");
    expect(formatIpAddress(null)).toBe("—");
    expect(formatIpAddress("10.0.0.12")).toBe("10.0.0.12");
  });

  test("describes device from user agent, else platform", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0) Chrome/126.0 Safari/537.36";
    expect(describeDevice({ metadata: { userAgent: ua }, platform: "WEB_DESKTOP" })).toBe("Chrome · Windows");
    expect(describeDevice({ metadata: {}, platform: "WEB_MOBILE" })).toBe("Di động");
    expect(describeDevice({ metadata: {}, platform: null })).toBe("—");
  });
});
