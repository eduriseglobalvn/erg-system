import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/lib/api-client";
import { getFriendlyAuthErrorMessage } from "@/platform/auth/components/portal-login-controller";

const msg = (error: unknown) => getFriendlyAuthErrorMessage(error, "fallback");

describe("login lockout and rate-limit messages", () => {
  it("maps ACCOUNT_LOCKED (403) and HTTP 423 to a Vietnamese lock message", () => {
    expect(msg(new ApiClientError("account temporarily locked", "ACCOUNT_LOCKED", 403))).toContain("tạm khóa");
    expect(msg(new ApiClientError("x", "HTTP_423", 423))).toContain("tạm khóa");
  });

  it("maps AUTH_TOO_MANY_ATTEMPTS to a too-many-attempts message", () => {
    expect(msg(new ApiClientError("too many login attempts", "AUTH_TOO_MANY_ATTEMPTS", 429))).toContain("quá nhiều lần");
  });

  it("maps a load 429 (password hashing busy, nginx limit) to the 'system busy' message with seconds", () => {
    expect(msg(new ApiClientError("busy", "AUTH_PASSWORD_HASH_BUSY", 429, { retryAfterSeconds: 2 }))).toBe("Hệ thống đang đông, vui lòng thử lại sau 2 giây");
    expect(msg(new ApiClientError("x", "HTTP_429", 429, { retryAfterSeconds: 1 }))).toBe("Hệ thống đang đông, vui lòng thử lại sau 1 giây");
  });

  it("shows the wait time in minutes when the backend sends retry seconds", () => {
    expect(msg(new ApiClientError("x", "AUTH_TOO_MANY_ATTEMPTS", 429, { retryAfterSeconds: 61 }))).toContain("Thử lại sau 2 phút");
  });

  it("never leaks the English backend text", () => {
    expect(msg(new ApiClientError("account temporarily locked", "ACCOUNT_LOCKED", 403))).not.toMatch(/temporarily|locked/);
  });
});
