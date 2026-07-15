import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return { ...actual, apiRequest: mocks.apiRequest };
});

import {
  changeMyPassword,
  requestRecoveryEmailChallenge,
  updateMyTeacherProfile,
  verifyRecoveryEmailChallenge,
} from "@/platform/auth/api/account-security-api";

describe("account security API", () => {
  beforeEach(() => mocks.apiRequest.mockReset());

  test("updates only mutable self-profile fields", async () => {
    mocks.apiRequest.mockResolvedValueOnce({ id: "teacher-1" });

    await updateMyTeacherProfile({ fullName: "  Nguyễn An ", phone: " 0909000111 ", title: " Giáo viên " });

    expect(mocks.apiRequest).toHaveBeenCalledWith("/api/v1/users/me", {
      portal: "lms",
      method: "PATCH",
      body: JSON.stringify({ full_name: "Nguyễn An", phone: "0909000111", job_title: "Giáo viên" }),
    });
  });

  test("normalizes recovery email and verifies an OTP challenge", async () => {
    mocks.apiRequest
      .mockResolvedValueOnce({ challengeId: "challenge-1", maskedEmail: "t***@erg.edu.vn", expiresAt: "2026-07-14T12:00:00Z", retryAfterSeconds: 60 })
      .mockResolvedValueOnce({ verified: true });

    await requestRecoveryEmailChallenge(" Recovery@ERG.edu.vn ");
    await verifyRecoveryEmailChallenge({ challengeId: "challenge-1", otp: " 123456 " });

    expect(mocks.apiRequest).toHaveBeenNthCalledWith(1, "/api/v1/users/me/recovery-email/challenges", {
      portal: "lms",
      method: "POST",
      body: JSON.stringify({ recoveryEmail: "recovery@erg.edu.vn" }),
    });
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(2, "/api/v1/users/me/recovery-email/verify", {
      portal: "lms",
      method: "POST",
      body: JSON.stringify({ challengeId: "challenge-1", otp: "123456" }),
    });
  });

  test("changes the password using the existing backend field contract", async () => {
    mocks.apiRequest.mockResolvedValueOnce({ lifecycle: { status: "ACTIVE", nextSteps: [] } });

    await changeMyPassword({ currentPassword: "temporary", newPassword: "NewPassword@123" });

    expect(mocks.apiRequest).toHaveBeenCalledWith("/api/v1/users/me/password", {
      portal: "lms",
      method: "PUT",
      body: JSON.stringify({ old_password: "temporary", new_password: "NewPassword@123" }),
    });
  });
});
