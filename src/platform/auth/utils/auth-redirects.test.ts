import { expect, test } from "vitest";

import { buildLoginRedirectTarget, buildRedirectPath, isAuthOnlyRedirect } from "./auth-redirects";

test("allows profile as an authenticated-only redirect on teacher portals", () => {
  expect(isAuthOnlyRedirect("lms", "/profile?tab=security")).toBe(true);
});

test("does not bypass portal permission for LMS protected areas", () => {
  expect(isAuthOnlyRedirect("lms", "/")).toBe(false);
  expect(isAuthOnlyRedirect("lms", "/resources")).toBe(false);
});

test("builds a local redirect path with query and hash", () => {
  expect(buildRedirectPath("/cong-dong", "?topic=lesson", "#reply")).toBe("/cong-dong?topic=lesson#reply");
});

test("does not redirect an auth gate that is unmounting on the login route", () => {
  expect(buildLoginRedirectTarget("/login", "?redirect=%2Fschools%2Flist", "")).toBeNull();
  expect(buildLoginRedirectTarget("/schools/list", "", "")).toBe(
    "/login?redirect=%2Fschools%2Flist",
  );
});
