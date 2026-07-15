import { ApiClientError, apiRequest } from "@/lib/api-client";
import type { UserAccessPolicy } from "@/features/lcms/admin-operations/api/access-management-api";
import type { TeacherAccountLifecycle } from "@/platform/auth/types/account-lifecycle";

export type TeacherCredentialDelivery = "EMAIL_INVITE" | "ONE_TIME_PASSWORD";

export type CreateTeacherAccountInput = {
  primaryEmail: string;
  fullName: string;
  phone?: string;
  recoveryEmail?: string;
  roleGroupIds: string[];
  policies: UserAccessPolicy[];
  credentialDelivery: TeacherCredentialDelivery;
};

export type ProvisionedTeacherAccount = {
  id: string;
  primaryEmail: string;
  fullName: string;
  status: string;
};

export type TeacherAccountDeliveryResult = {
  deliveryStatus: "SENT" | "READY" | "FAILED";
  oneTimePassword?: string;
};

export type CreateTeacherAccountResponse = TeacherAccountDeliveryResult & {
  user: ProvisionedTeacherAccount;
  lifecycle?: TeacherAccountLifecycle;
};

export class TeacherAccountProvisionError extends Error {
  code: string;
  field?: keyof CreateTeacherAccountInput;
  status: number;

  constructor(message: string, code: string, status: number, field?: keyof CreateTeacherAccountInput) {
    super(message);
    this.name = "TeacherAccountProvisionError";
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

export async function createTeacherAccount(input: CreateTeacherAccountInput) {
  try {
    return await apiRequest<CreateTeacherAccountResponse>("/api/v1/users", {
      portal: "lcms",
      method: "POST",
      body: JSON.stringify({
        primaryEmail: normalizeEmail(input.primaryEmail),
        fullName: input.fullName.trim(),
        phone: optionalTrim(input.phone),
        recoveryEmail: input.recoveryEmail ? normalizeEmail(input.recoveryEmail) : undefined,
        roleGroupIds: input.roleGroupIds,
        policies: input.policies,
        credentialDelivery: input.credentialDelivery,
      }),
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      const field = error.status === 409 || error.code.toUpperCase().includes("EMAIL") ? "primaryEmail" : undefined;
      throw new TeacherAccountProvisionError(error.message, error.code, error.status, field);
    }
    throw error;
  }
}

export function resendTeacherInvite(userId: string) {
  return apiRequest<TeacherAccountDeliveryResult>(
    `/api/v1/users/${encodeURIComponent(userId)}/resend-invite`,
    { portal: "lcms", method: "POST" },
  );
}

export function resetTeacherCredential(userId: string, credentialDelivery: TeacherCredentialDelivery) {
  return apiRequest<TeacherAccountDeliveryResult>(
    `/api/v1/users/${encodeURIComponent(userId)}/reset-credential`,
    {
      portal: "lcms",
      method: "POST",
      body: JSON.stringify({ credentialDelivery }),
    },
  );
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function optionalTrim(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}
