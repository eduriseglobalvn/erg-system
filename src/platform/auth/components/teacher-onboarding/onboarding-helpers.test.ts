import { describe, expect, it } from "vitest";

import {
  describeOnboardingError,
  formatExpiryTime,
  isGoogleEmail,
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

describe("isGoogleEmail / formatExpiryTime", () => {
  it("detects gmail domains case-insensitively", () => {
    expect(isGoogleEmail(" A@Gmail.com ")).toBe(true);
    expect(isGoogleEmail("a@googlemail.com")).toBe(true);
    expect(isGoogleEmail("a@school.edu.vn")).toBe(false);
    expect(isGoogleEmail(null)).toBe(false);
  });

  it("returns empty string for invalid times", () => {
    expect(formatExpiryTime(undefined)).toBe("");
    expect(formatExpiryTime("not a date")).toBe("");
    expect(formatExpiryTime("2026-01-01T10:05:00Z")).not.toBe("");
  });
});
