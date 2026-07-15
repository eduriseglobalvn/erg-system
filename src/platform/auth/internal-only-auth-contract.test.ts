import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("internal-only authentication contract", () => {
  test("auth API does not expose registration or social provider login", () => {
    const authApi = source("./api/auth-api.ts");
    const apiClient = source("../../lib/api-client.ts");

    expect(authApi).not.toContain("async register(");
    expect(authApi).not.toContain("loginWithProvider");
    expect(authApi).not.toContain("/google/login");
    expect(apiClient).not.toContain("/api/v1/auth/register");
    expect(apiClient).not.toContain("/api/v1/auth/google/login");
    expect(apiClient).not.toContain("/api/lms/auth/register");
    expect(apiClient).not.toContain("/api/lms/auth/providers/");
  });

  test("auth UI does not load Google Identity or offer registration", () => {
    const authHook = source("./hooks/use-auth-session.ts");
    const desktopForm = source("./components/auth-form-panel.tsx");
    const mobileForm = source("./components/portal-mobile-login-form.tsx");

    expect(authHook).not.toContain("requestGoogleIdToken");
    expect(authHook).not.toContain("registerMutation");
    expect(authHook).not.toContain("loginByProvider");
    expect(desktopForm).not.toContain("GoogleSignInButton");
    expect(mobileForm).not.toContain("GoogleSignInButton");
  });

  test("browser account model does not retain password credentials or local password authentication", () => {
    const authTypes = source("./types/auth-types.ts");
    const authStorage = source("./api/auth-storage.ts");
    const teacherAccountType = authTypes.match(/export type TeacherAccount = \{[\s\S]*?^};/m)?.[0] ?? "";

    expect(teacherAccountType).not.toContain("password:");
    expect(authStorage).not.toContain("registerAccount(");
    expect(authStorage).not.toContain("loginWithPassword(");
    expect(authStorage).not.toContain("loginWithProvider(");
    expect(authStorage).not.toContain("updateAccountPassword(");
  });
});
