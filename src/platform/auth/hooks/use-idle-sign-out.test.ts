import { expect, test } from "vitest";
import { IDLE_SIGN_OUT_MS, isIdleExpired } from "./use-idle-sign-out";

test("idle sign-out fires at exactly 156 minutes and never without a recorded activity", () => {
  expect(IDLE_SIGN_OUT_MS).toBe(156 * 60_000);
  expect(isIdleExpired(1_000, 1_000 + IDLE_SIGN_OUT_MS - 1)).toBe(false);
  expect(isIdleExpired(1_000, 1_000 + IDLE_SIGN_OUT_MS)).toBe(true);
  expect(isIdleExpired(null, Number.MAX_SAFE_INTEGER)).toBe(false);
});
