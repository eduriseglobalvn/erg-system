import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { getAuthScope, getCurrentAccountId } from "@/platform/auth/api/auth-storage";
import {
  clearTeacherSessionSnapshot,
  portalSessionKey,
  STUDENT_TEMP_SESSION_KEY,
  TEACHER_TEMP_SESSION_KEY,
} from "@/platform/auth/api/auth-token-storage";

// Characterization of how the stored session resolves into tenant/account/roles/permissions.
// Fallback strings ("anonymous", undefined tenant) are part of query keys: do not change them.
const FUTURE = "2099-01-01T00:00:00.000Z";

function store(key: string, value: unknown) {
  window.sessionStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
}

function storeTeacher(portal: "crm" | "admin" | "lms" | "lcms", extra: Record<string, unknown> = {}) {
  store(portalSessionKey(TEACHER_TEMP_SESSION_KEY, portal), {
    accountId: "acc-1",
    accountEmail: "a@erg.test",
    accessToken: "token-not-a-jwt",
    expiresAt: FUTURE,
    rememberMe: false,
    portal,
    ...extra,
  });
}

beforeEach(() => {
  clearTeacherSessionSnapshot();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  clearTeacherSessionSnapshot();
});

describe("getAuthScope", () => {
  test("no stored session: raw undefined ids and empty arrays", () => {
    const scope = getAuthScope("lms");
    expect(scope.session).toBeNull();
    expect(scope.tenantId).toBeUndefined();
    expect(scope.accountId).toBeUndefined();
    expect(scope.roles).toEqual([]);
    expect(scope.permissions).toEqual([]);
  });

  test("stored session: exposes raw tenant, account, roles, permissions", () => {
    storeTeacher("lms", { tenantId: " tenant-a ", roles: ["TEACHER"], permissions: ["x.read"] });
    const scope = getAuthScope("lms");
    expect(scope.portal).toBe("lms");
    expect(scope.tenantId).toBe(" tenant-a "); // not trimmed: callers normalise themselves
    expect(scope.accountId).toBe("acc-1");
    expect(scope.roles).toEqual(["TEACHER"]);
    expect(scope.permissions).toEqual(["x.read"]);
    expect(scope.session?.accessToken).toBeTruthy();
  });

  test("default portal resolves from the current location (lms on jsdom root)", () => {
    storeTeacher("lms", { tenantId: "t1" });
    expect(getAuthScope().portal).toBe("lms");
    expect(getAuthScope().tenantId).toBe("t1");
  });

  test("expired session is ignored", () => {
    storeTeacher("lms", { expiresAt: "2000-01-01T00:00:00.000Z" });
    expect(getAuthScope("lms").session).toBeNull();
  });

  test("session without expiry needs a loggedInAt younger than 12h", () => {
    storeTeacher("lms", { expiresAt: undefined, loggedInAt: new Date().toISOString() });
    expect(getAuthScope("lms").session).not.toBeNull();
    storeTeacher("lms", { expiresAt: undefined, loggedInAt: new Date(Date.now() - 13 * 3600 * 1000).toISOString() });
    expect(getAuthScope("lms").session).toBeNull();
    storeTeacher("lms", { expiresAt: undefined });
    expect(getAuthScope("lms").session).toBeNull();
  });

  test("session without access token is ignored", () => {
    storeTeacher("lms", { accessToken: undefined });
    expect(getAuthScope("lms").session).toBeNull();
  });

  test("invalid JSON is ignored", () => {
    store(portalSessionKey(TEACHER_TEMP_SESSION_KEY, "lms"), "{not json");
    expect(getAuthScope("lms").session).toBeNull();
  });

  test("portal differences: crm session is invisible to lms, admin session serves lcms", () => {
    storeTeacher("crm", { tenantId: "crm-tenant" });
    expect(getAuthScope("lms").session).toBeNull();
    expect(getAuthScope("crm").tenantId).toBe("crm-tenant");

    window.sessionStorage.clear();
    storeTeacher("admin", { tenantId: "admin-tenant", portals: ["admin"] });
    expect(getAuthScope("lcms").tenantId).toBe("admin-tenant");
  });

  test("elearning portal reads the student temp session, falling back to a teacher credential", () => {
    storeTeacher("lms", { tenantId: "t-teacher" });
    expect(getAuthScope("elearning").tenantId).toBe("t-teacher");

    store(STUDENT_TEMP_SESSION_KEY, {
      accessToken: "student-token",
      expiresAt: FUTURE,
      portal: "elearning",
      tenantId: "t-student",
    });
    expect(getAuthScope("elearning").tenantId).toBe("t-student");
  });
});

describe("getCurrentAccountId", () => {
  test("signed out falls back to anonymous or the given fallback", () => {
    expect(getCurrentAccountId("lms")).toBe("anonymous");
    expect(getCurrentAccountId("lms", "none")).toBe("none");
  });

  test("signed in returns the trimmed account id", () => {
    storeTeacher("lms", { accountId: "acc-9" });
    expect(getCurrentAccountId("lms")).toBe("acc-9");
  });

  test("expired session behaves as signed out", () => {
    storeTeacher("lms", { expiresAt: "2000-01-01T00:00:00.000Z" });
    expect(getCurrentAccountId("lms")).toBe("anonymous");
  });

  test("server mode without access token behaves as signed out", () => {
    vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
    storeTeacher("lms", { accessToken: undefined });
    expect(getCurrentAccountId("lms")).toBe("anonymous");
  });

  test("oidc-bff mode never exposes an account id from storage", () => {
    vi.stubEnv("VITE_AUTH_MODE", "oidc-bff");
    storeTeacher("lms");
    expect(getCurrentAccountId("lms")).toBe("anonymous");
  });
});
