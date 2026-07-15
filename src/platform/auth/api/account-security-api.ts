import { apiRequest } from "@/lib/api-client";
import type { TeacherAccountLifecycle } from "@/platform/auth/types/account-lifecycle";
import type { TeacherAccount } from "@/platform/auth/types/auth-types";

export type UpdateMyTeacherProfileInput = {
  fullName: string;
  phone: string;
  title?: string;
  avatarUrl?: string;
  bio?: string;
};

export type RecoveryEmailChallenge = {
  challengeId: string;
  maskedEmail: string;
  expiresAt: string;
  retryAfterSeconds: number;
};

export type RecoveryEmailVerification = {
  verified: boolean;
  lifecycle?: TeacherAccountLifecycle;
};

export type PasswordChangeResult = {
  lifecycle?: TeacherAccountLifecycle;
  revokedSessions?: number;
};

export function updateMyTeacherProfile(input: UpdateMyTeacherProfileInput) {
  return apiRequest<TeacherAccount>("/api/v1/users/me", {
    portal: "lms",
    method: "PATCH",
    body: JSON.stringify({
      full_name: input.fullName.trim(),
      phone: input.phone.trim(),
      job_title: optionalTrim(input.title),
      avatar_url: optionalTrim(input.avatarUrl),
      bio: optionalTrim(input.bio),
    }),
  });
}

export function requestRecoveryEmailChallenge(recoveryEmail: string) {
  return apiRequest<RecoveryEmailChallenge>("/api/v1/users/me/recovery-email/challenges", {
    portal: "lms",
    method: "POST",
    body: JSON.stringify({ recoveryEmail: recoveryEmail.trim().toLowerCase() }),
  });
}

export function verifyRecoveryEmailChallenge(input: { challengeId: string; otp: string }) {
  return apiRequest<RecoveryEmailVerification>("/api/v1/users/me/recovery-email/verify", {
    portal: "lms",
    method: "POST",
    body: JSON.stringify({ challengeId: input.challengeId, otp: input.otp.trim() }),
  });
}

export function changeMyPassword(input: { currentPassword: string; newPassword: string }) {
  return apiRequest<PasswordChangeResult>("/api/v1/users/me/password", {
    portal: "lms",
    method: "PUT",
    body: JSON.stringify({ old_password: input.currentPassword, new_password: input.newPassword }),
  });
}

function optionalTrim(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}
