import { expect, test } from "vitest";

import { buildRedirectPath, isAuthOnlyRedirect } from "./auth-redirects";

test("allows HocLieu community as an authenticated-only redirect", () => {
  expect(isAuthOnlyRedirect("hoclieu", "/cong-dong")).toBe(true);
  expect(isAuthOnlyRedirect("hoclieu", "/cong-dong?topic=review")).toBe(true);
});

test("allows profile as an authenticated-only redirect on teacher portals", () => {
  expect(isAuthOnlyRedirect("hoclieu", "/profile?tab=profile")).toBe(true);
  expect(isAuthOnlyRedirect("lms", "/profile?tab=security")).toBe(true);
});

test("does not bypass portal permission for LMS or HocLieu protected areas", () => {
  expect(isAuthOnlyRedirect("hoclieu", "/kho-hoc-lieu")).toBe(false);
  expect(isAuthOnlyRedirect("lms", "/")).toBe(false);
});

test("builds a local redirect path with query and hash", () => {
  expect(buildRedirectPath("/cong-dong", "?topic=lesson", "#reply")).toBe("/cong-dong?topic=lesson#reply");
});
