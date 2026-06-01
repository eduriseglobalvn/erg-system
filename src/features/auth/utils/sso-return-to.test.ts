import { expect, test } from "vitest";

import { isAllowedSsoReturnHost, normalizeSsoReturnTo } from "./sso-return-to";

test("normalizes an LMS login returnTo back to the protected target page", () => {
  const returnTo = "https://lms.erg.edu.vn:3001/login?redirect=%2Fprofile%3Ftab%3Dprofile";

  expect(normalizeSsoReturnTo(returnTo)).toBe("https://lms.erg.edu.vn:3001/profile?tab=profile");
});

test("preserves normal protected returnTo URLs", () => {
  const returnTo = "https://lms.erg.edu.vn:3001/resources?topic=lesson-kit";

  expect(normalizeSsoReturnTo(returnTo)).toBe(returnTo);
});

test("keeps encoded hash redirects when older links use profile hash tabs", () => {
  const returnTo = "https://lms.erg.edu.vn:3001/login?redirect=%2Fprofile%23tab%3Dsecurity";

  expect(normalizeSsoReturnTo(returnTo)).toBe("https://lms.erg.edu.vn:3001/profile#tab=security");
});

test("rejects external SSO return hosts", () => {
  expect(normalizeSsoReturnTo("https://evil.example/login?redirect=%2Fprofile")).toBeNull();
  expect(isAllowedSsoReturnHost("lms.erg.edu.vn")).toBe(true);
});
