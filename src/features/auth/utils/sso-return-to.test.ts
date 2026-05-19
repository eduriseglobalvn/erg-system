import { expect, test } from "vitest";

import { isAllowedSsoReturnHost, normalizeSsoReturnTo } from "./sso-return-to";

test("normalizes a HocLieu login returnTo back to the protected target page", () => {
  const returnTo = "https://hoclieu.erg.edu.vn:3001/login?redirect=%2Fprofile%3Ftab%3Dprofile";

  expect(normalizeSsoReturnTo(returnTo)).toBe("https://hoclieu.erg.edu.vn:3001/profile?tab=profile");
});

test("preserves normal protected returnTo URLs", () => {
  const returnTo = "https://hoclieu.erg.edu.vn:3001/community?topic=lesson-kit";

  expect(normalizeSsoReturnTo(returnTo)).toBe(returnTo);
});

test("keeps encoded hash redirects when older links use profile hash tabs", () => {
  const returnTo = "https://hoclieu.erg.edu.vn:3001/login?redirect=%2Fprofile%23tab%3Dsecurity";

  expect(normalizeSsoReturnTo(returnTo)).toBe("https://hoclieu.erg.edu.vn:3001/profile#tab=security");
});

test("rejects external SSO return hosts", () => {
  expect(normalizeSsoReturnTo("https://evil.example/login?redirect=%2Fprofile")).toBeNull();
  expect(isAllowedSsoReturnHost("hoclieu.erg.edu.vn")).toBe(true);
});
