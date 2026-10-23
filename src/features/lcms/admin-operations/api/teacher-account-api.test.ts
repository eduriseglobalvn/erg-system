import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}));

vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...actual,
    apiRequest: mocks.apiRequest,
    getBackOfficePortal: () => "lcms",
  };
});

import { ApiClientError } from "@/lib/api-client";
import {
  TeacherAccountProvisionError,
  createTeacherAccount,
  resendTeacherInvite,
  resetTeacherCredential,
} from "@/features/lcms/admin-operations/api/teacher-account-api";

describe("teacher account administration API", () => {
  beforeEach(() => {
    mocks.apiRequest.mockReset();
  });

  test("normalizes and provisions a teacher account atomically", async () => {
    mocks.apiRequest.mockResolvedValueOnce({ user: { id: "teacher-1" }, deliveryStatus: "SENT" });

    await createTeacherAccount({
      primaryEmail: "  Teacher@ERG.edu.vn ",
      fullName: "  Nguyễn An  ",
      phone: " 0909000111 ",
      recoveryEmail: " Recovery@ERG.edu.vn ",
      roleGroupIds: ["lms_teacher_standard"],
      policies: [{ scopeType: "school", scopeId: "school-1", roleGroup: "lms_teacher_standard", modules: ["lms"] }],
      credentialDelivery: "EMAIL_INVITE",
    });

    expect(mocks.apiRequest).toHaveBeenCalledWith("/api/v1/users", {
      portal: "lcms",
      method: "POST",
      body: JSON.stringify({
        primaryEmail: "teacher@erg.edu.vn",
        fullName: "Nguyễn An",
        phone: "0909000111",
        recoveryEmail: "recovery@erg.edu.vn",
        roleGroupIds: ["lms_teacher_standard"],
        policies: [{ scopeType: "school", scopeId: "school-1", roleGroup: "lms_teacher_standard", modules: ["lms"] }],
        credentialDelivery: "EMAIL_INVITE",
      }),
    });
  });

  test("maps duplicate email conflicts to the primary email field", async () => {
    mocks.apiRequest.mockRejectedValueOnce(new ApiClientError("Email already exists", "EMAIL_EXISTS", 409));

    const request = createTeacherAccount({
      primaryEmail: "teacher@erg.edu.vn",
      fullName: "Teacher",
      roleGroupIds: ["lms_teacher_standard"],
      policies: [],
      credentialDelivery: "EMAIL_INVITE",
    });

    await expect(request).rejects.toMatchObject({
      name: "TeacherAccountProvisionError",
      field: "primaryEmail",
      code: "EMAIL_EXISTS",
    } satisfies Partial<TeacherAccountProvisionError>);
  });

  test("supports invite resend and one-time credential reset", async () => {
    mocks.apiRequest.mockResolvedValue({ deliveryStatus: "SENT" });

    await resendTeacherInvite("teacher 1");
    await resetTeacherCredential("teacher 1", "ONE_TIME_PASSWORD");

    expect(mocks.apiRequest).toHaveBeenNthCalledWith(1, "/api/v1/users/teacher%201/resend-invite", {
      portal: "lcms",
      method: "POST",
    });
    expect(mocks.apiRequest).toHaveBeenNthCalledWith(2, "/api/v1/users/teacher%201/reset-credential", {
      portal: "lcms",
      method: "POST",
      body: JSON.stringify({ credentialDelivery: "ONE_TIME_PASSWORD" }),
    });
  });
});
