import { expect, it } from "vitest";

import { sanitizeRedirect } from "@/platform/auth/components/portal-login-controller";

it("rejects open-redirect shapes browsers treat as another origin", () => {
  expect(sanitizeRedirect("/" + String.fromCharCode(92) + "evil.com", "/home")).toBe("/home");
  expect(sanitizeRedirect("//evil.com", "/home")).toBe("/home");
  expect(sanitizeRedirect("https://evil.com", "/home")).toBe("/home");
  expect(sanitizeRedirect("/teacher/home", "/")).toBe("/teacher/home");
});
