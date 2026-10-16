import { expect, test } from "vitest";

import { ApiClientError } from "@/lib/api-client";
import { getFriendlyAuthErrorMessage } from "@/platform/auth/components/portal-login-controller";

test("shows a retryable message when another tab is processing login", () => {
  expect(getFriendlyAuthErrorMessage(
    new ApiClientError("another login is processing", "AUTH_LOGIN_IN_PROGRESS", 409),
    "fallback",
  )).toBe("Một tab khác đang xử lý đăng nhập cho tài khoản này. Vui lòng chờ một chút rồi thử lại.");
});
