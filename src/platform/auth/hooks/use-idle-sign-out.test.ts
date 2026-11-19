import { beforeEach, describe, expect, test } from "vitest";
import { TEACHER_LOCAL_SESSION_KEY } from "@/platform/auth/api/auth-token-storage";
import { SHARED_DEVICE_KEY } from "@/platform/auth/api/shared-device";
import { IDLE_SIGN_OUT_MS, isIdleExpired, isIdleSignOutExempt } from "./use-idle-sign-out";

test("idle sign-out fires at exactly 156 minutes and never without a recorded activity", () => {
  expect(IDLE_SIGN_OUT_MS).toBe(156 * 60_000);
  expect(isIdleExpired(1_000, 1_000 + IDLE_SIGN_OUT_MS - 1)).toBe(false);
  expect(isIdleExpired(1_000, 1_000 + IDLE_SIGN_OUT_MS)).toBe(true);
  expect(isIdleExpired(null, Number.MAX_SAFE_INTEGER)).toBe(false);
});

describe("isIdleSignOutExempt for staff (BUG-PR-001)", () => {
  beforeEach(() => window.localStorage.clear());

  test("staff who ticked remember me on a personal device is never signed out for idling", () => {
    window.localStorage.setItem(TEACHER_LOCAL_SESSION_KEY, JSON.stringify({ accountId: "staff-1", rememberMe: true, refreshToken: "rt" }));
    expect(isIdleSignOutExempt()).toBe(true);
  });

  test("staff without remember me (no remembered refresh token) keeps the 156-minute sign-out", () => {
    expect(isIdleSignOutExempt()).toBe(false);
    window.localStorage.setItem(TEACHER_LOCAL_SESSION_KEY, JSON.stringify({ accountId: "staff-1", rememberMe: true }));
    expect(isIdleSignOutExempt()).toBe(false);
  });

  test("a shared computer keeps the 156-minute sign-out even when staff ticked remember me", () => {
    window.localStorage.setItem(TEACHER_LOCAL_SESSION_KEY, JSON.stringify({ accountId: "staff-1", rememberMe: true, refreshToken: "rt" }));
    window.localStorage.setItem(SHARED_DEVICE_KEY, "true");
    expect(isIdleSignOutExempt()).toBe(false);
  });
});
