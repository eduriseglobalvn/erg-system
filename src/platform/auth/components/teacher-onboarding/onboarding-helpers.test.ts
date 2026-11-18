import { describe, expect, it } from "vitest";

import {
  describeOnboardingError,
} from "@/platform/auth/components/teacher-onboarding/onboarding-helpers";

describe("describeOnboardingError", () => {
  it("maps known backend messages to Vietnamese copy", () => {
    expect(describeOnboardingError("HTTP 502")).toContain("502");
    expect(describeOnboardingError("Failed to fetch")).toContain("502");
    expect(describeOnboardingError("already used by another account")).toContain("tài khoản khác");
    expect(describeOnboardingError("recovery email must differ")).toContain("phải khác");
    expect(describeOnboardingError("wait before requesting another code")).toContain("đợi");
    expect(describeOnboardingError("invalid verification code")).toContain("không chính xác");
    expect(describeOnboardingError("verification code has expired")).toContain("hết hạn");
  });

  it("passes unknown messages through", () => {
    expect(describeOnboardingError("boom")).toBe("boom");
  });
});
