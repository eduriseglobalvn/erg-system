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

test("keeps the redirect allowlist and strips credentials or unknown query keys", () => {
  expect(
    buildRedirectPath(
      "/student/course/42",
      "?tab=overview&debug=true&access_token=secret&search=math",
      "#section-2",
    ),
  ).toBe("/student/course/42?tab=overview&search=math#section-2");
});

test("fails closed for cross-origin and protocol-relative redirect targets", () => {
  expect(buildRedirectPath("//evil.example/login", "", "")).toBe("/");
  expect(buildRedirectPath("https://evil.example/login", "", "")).toBe("/");
  expect(buildRedirectPath("/unknown-area", "?tab=overview", "")).toBe("/");
});

test("does not redirect an auth gate that is unmounting on the login route", () => {
  expect(buildLoginRedirectTarget("/login", "?redirect=%2Fschools%2Flist", "")).toBeNull();
  expect(buildLoginRedirectTarget("/schools/list", "", "")).toBe(
    "/login?redirect=%2Fschools%2Flist",
  );
});
