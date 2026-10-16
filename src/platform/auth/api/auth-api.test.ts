import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { saveServerAuthSession } from "./auth-storage";
import { authApi, isBackendAuthSessionResponse, normalizeAuthSession, shouldRetrySharedAuthLogin, type AuthSessionResponseDTO } from "./auth-api";
import { ApiClientError } from "@/lib/api-client";
import { ResponseValidationError } from "@/lib/validate-response";
import { TEACHER_LOCAL_SESSION_KEY, TEACHER_TEMP_SESSION_KEY, clearTeacherSessionSnapshot, getStoredAccessToken, portalSessionKey, readStoredAuthSession, resolveCurrentPortal } from "./auth-token-storage";

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  clearTeacherSessionSnapshot();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      atob: (value: string) => Buffer.from(value, "base64").toString("binary"),
      dispatchEvent: () => true,
      history: { replaceState: () => undefined },
      location: { hash: "", pathname: "/", search: "" },
      localStorage: createStorage(),
      sessionStorage: createStorage(),
    },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.useRealTimers();
  // @ts-expect-error Test-only cleanup for the browser global.
  delete globalThis.window;
});

test("backend login sends portal in the body without a browser-controlled tenant header", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  const fetchMock = vi.fn(async () =>
    new Response(
      JSON.stringify({
        data: {
          user: { id: "crm-1", email: "crm@erg.edu.vn", fullName: "CRM User", roles: ["admin"] },
          accessToken: "crm-access-token",
          refreshToken: "crm-refresh-token",
          expiresIn: 3600,
          portals: ["crm"],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);

  await authApi.login({
    identifier: "crm@erg.edu.vn",
    password: "password123",
    rememberMe: true,
    portal: "crm",
  });

  const [, init] = fetchMock.mock.calls[0] ?? [];
  const headers = (init as RequestInit).headers as Headers;
  expect(headers.get("Content-Type")).toBe("application/json");
  expect(headers.get("X-Tenant-ID")).toBeNull();
  expect(headers.get("X-Request-ID")).toBeTruthy();
  expect(headers.get("X-Portal")).toBeNull();
  expect((init as RequestInit).referrerPolicy).toBe("no-referrer");
  expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
    deviceFingerprint: expect.any(String),
    deviceId: expect.any(String),
    deviceName: expect.any(String),
    portal: "crm",
  });
});

test("backend login sends LCMS portal in its authenticated request body", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  const fetchMock = vi.fn(async () =>
    new Response(
      JSON.stringify({
        data: {
          user: { id: "lcms-1", email: "admin@erg.edu.vn", fullName: "LCMS User", roles: ["admin"] },
          accessToken: "lcms-access-token",
          portals: ["lcms"],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);

  await authApi.login({
    identifier: "admin@erg.edu.vn",
    password: "Admin@2025",
    rememberMe: true,
    portal: "lcms",
  });

  const [, init] = fetchMock.mock.calls[0] ?? [];
  const headers = (init as RequestInit).headers as Headers;
  expect(headers.get("X-Portal")).toBeNull();
  expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
    portal: "lcms",
  });
});

test("keeps the configured spring API base when the CRM portal runs on its own host", async () => {
  vi.stubEnv("VITE_API_BASE", "http://localhost:8080");
  Object.assign(window.location, {
    hostname: "crm.erg.edu.local",
    origin: "https://crm.erg.edu.local:3001",
    protocol: "https:",
  });
  const fetchMock = vi.fn(async () =>
    new Response(
      JSON.stringify({
        data: {
          user: { id: "crm-1", email: "admin@erg.edu.vn", fullName: "ERG Admin", roles: ["admin"] },
          accessToken: "crm-access-token",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);

  await authApi.login({
    identifier: "admin@erg.edu.vn",
    password: "Admin@2025",
    rememberMe: true,
    portal: "crm",
  });

  const [url] = fetchMock.mock.calls[0] ?? [];
  expect(url).toBe("http://localhost:8080/api/v1/auth/login");
});

test("routes production portal OIDC through the shared auth host", () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.edu.vn");
  const assign = vi.fn();
  Object.assign(window.location, {
    hostname: "lms.erg.edu.vn",
    assign,
  });

  authApi.startOidcLogin("lms", "/teacher/classes?tab=today");

  expect(assign).toHaveBeenCalledWith(
    "https://auth.erg.edu.vn/login?portal=lms&returnTo=%2Fteacher%2Fclasses%3Ftab%3Dtoday&redirect=%2Fteacher%2Fclasses%3Ftab%3Dtoday",
  );
});

test("sanitizes OIDC return targets before sending them to the shared auth host", () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.edu.vn");
  const assign = vi.fn();
  Object.assign(window.location, {
    hostname: "lms.erg.edu.vn",
    assign,
  });

  authApi.startOidcLogin("lms", "/student/course/42?tab=overview&debug=true&sso_token=secret");

  expect(assign).toHaveBeenCalledWith(
    "https://auth.erg.edu.vn/login?portal=lms&returnTo=%2Fstudent%2Fcourse%2F42%3Ftab%3Doverview&redirect=%2Fstudent%2Fcourse%2F42%3Ftab%3Doverview",
  );
});

test("keeps snake_case access tokens in browser-session storage only", async () => {
  const account = saveServerAuthSession(
    await normalizeLoginResponse({
      user: {
        id: "teacher-1",
        email: "teacher@erg.edu.vn",
        full_name: "ERG Teacher",
      },
      access_token: "jwt-token",
      refresh_token: "refresh-token",
      expires_in: 3600,
      portals: ["lms"],
    }),
    true,
  );

  expect(account.email).toBe("teacher@erg.edu.vn");
  expect(getStoredAccessToken("lms")).toBe("jwt-token");
  expect(storage.has(portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"))).toBe(false);
  expect(JSON.parse(storage.get(portalSessionKey(TEACHER_TEMP_SESSION_KEY, "lms")) ?? "{}")).toMatchObject({
    accessToken: "jwt-token",
    refreshToken: "refresh-token",
    portal: "lms",
  });
});

test("persists token fields from backend login responses", async () => {
  saveServerAuthSession(
    normalizeLoginResponse({
      user: {
        id: "teacher-2",
        email: "teacher2@erg.edu.vn",
        fullName: "ERG Teacher 2",
      },
      token: "plain-token",
      refreshToken: "refresh-token",
      expiresIn: 3600,
      portals: ["lms"],
    }),
    true,
  );

  expect(getStoredAccessToken("lms")).toBe("plain-token");
});

test("persists nested token fields from backend login responses", async () => {
  saveServerAuthSession(
    normalizeLoginResponse({
      user: {
        id: "teacher-3",
        email: "teacher3@erg.edu.vn",
        fullName: "ERG Teacher 3",
      },
      tokens: {
        access_token: "nested-token",
        refresh_token: "nested-refresh",
      },
      expires_in: 3600,
      portals: ["lms"],
    }),
    true,
  );

  expect(getStoredAccessToken("lms")).toBe("nested-token");
});

test("projects a legacy super-admin login into canonical workspaces", () => {
  const session = normalizeAuthSession({
    user: {
      id: "usr-super-admin",
      email: "admin@erg.edu.vn",
      fullName: "ERG Super Admin",
      roles: ["system.super_admin"],
    },
    accessToken: "super-admin-token",
    refreshToken: "super-admin-refresh",
    expiresIn: 3600,
    permissions: ["*"],
    portals: ["*"],
  });

  expect(session.roles).toEqual(["system.super_admin"]);
  saveServerAuthSession(session, true, "lms");
  expect(readStoredAuthSession("lms")).toMatchObject({
    workspaces: ["ADMIN", "TEACHER", "STUDENT", "CRM"],
    roles: ["system.super_admin"],
    permissions: ["*"],
  });
});

test("projects the root admin legacy account into student and keeps the token on the shared host", () => {
  Object.assign(window.location, { hostname: "lms.erg.edu.local", pathname: "/student" });
  const session = normalizeAuthSession({
    user: {
      id: "usr-root-admin",
      email: "admin@erg.edu.vn",
      fullName: "ERG Admin",
      roles: ["admin"],
    },
    accessToken: "root-admin-token",
    refreshToken: "root-admin-refresh",
    expiresIn: 3600,
    portals: ["lcms"],
  });

  saveServerAuthSession(session, true, "lcms");

  expect(resolveCurrentPortal()).toBe("lms");
  expect(readStoredAuthSession("lms")).toMatchObject({
    accountEmail: "admin@erg.edu.vn",
    portal: "lcms",
    workspaces: ["ADMIN", "TEACHER", "STUDENT", "CRM"],
    permissions: ["*"],
  });
  expect(getStoredAccessToken("elearning")).toBe("root-admin-token");
});

test("selects the LCMS session for the admin route on the shared LMS host", () => {
  Object.assign(window.location, { hostname: "lms.erg.edu.local", pathname: "/admin/calendar" });
  expect(resolveCurrentPortal()).toBe("lcms");
});

test("uses a stored LMS session for learning resource requests", async () => {
  saveServerAuthSession(
    normalizeLoginResponse({
      user: {
        id: "teacher-resources",
        email: "teacher.resources@erg.edu.vn",
        fullName: "ERG Resource Teacher",
      },
      accessToken: "shared-lms-token",
      portals: ["lms"],
    }),
    true,
    "lms",
  );

  expect(readStoredAuthSession("lms")).toMatchObject({
    accessToken: "shared-lms-token",
    portal: "lms",
    portals: ["lms"],
  });
  expect(getStoredAccessToken("lms")).toBe("shared-lms-token");
});

test("does not reuse an LMS-only entitlement for LCMS requests", async () => {
  saveServerAuthSession(
    normalizeLoginResponse({
      user: {
        id: "teacher-lcms",
        email: "teacher.lcms@erg.edu.vn",
        fullName: "ERG LCMS Teacher",
      },
      accessToken: "shared-lms-token",
      portals: ["lms"],
    }),
    true,
    "lms",
  );

  expect(readStoredAuthSession("lcms")).toBeNull();
  expect(getStoredAccessToken("lcms")).toBeUndefined();
});

test("rejects stored teacher sessions without an access token", () => {
  storage.set(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({
      accountId: "teacher-without-token",
      loggedInAt: new Date().toISOString(),
      portal: "lms",
      portals: ["lms"],
      rememberMe: true,
    }),
  );

  expect(readStoredAuthSession("lms")).toBeNull();
  expect(getStoredAccessToken("lms")).toBeUndefined();
});

test("rejects stale stored teacher sessions when backend did not provide an expiry", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-31T02:00:00.000Z"));
  storage.set(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({
      accountId: "teacher-stale",
      accessToken: "opaque-token",
      loggedInAt: "2026-05-30T00:00:00.000Z",
      portal: "lms",
      portals: ["lms"],
      rememberMe: true,
    }),
  );

  expect(readStoredAuthSession("lms")).toBeNull();
  expect(getStoredAccessToken("lms")).toBeUndefined();
});

test("rejects stored teacher sessions without any usable expiry anchor", () => {
  storage.set(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({
      accountId: "teacher-orphan",
      accessToken: "opaque-token",
      portal: "lms",
      portals: ["lms"],
      rememberMe: true,
    }),
  );

  expect(readStoredAuthSession("lms")).toBeNull();
  expect(getStoredAccessToken("lms")).toBeUndefined();
});

test("rejects stored teacher sessions with an expired JWT", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-31T02:00:00.000Z"));
  storage.set(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({
      accountId: "teacher-expired",
      accessToken: createJwt({ exp: Math.floor(new Date("2026-05-31T01:00:00.000Z").getTime() / 1000), portals: ["lms"] }),
      loggedInAt: "2026-05-31T00:00:00.000Z",
      portal: "lms",
      rememberMe: true,
    }),
  );

  expect(readStoredAuthSession("lms")).toBeNull();
  expect(getStoredAccessToken("lms")).toBeUndefined();
});

test("retries shared auth login only for missing bearer login middleware errors", () => {
  expect(shouldRetrySharedAuthLogin(new ApiClientError("missing Authorization header", "HTTP_401", 401))).toBe(true);
  expect(shouldRetrySharedAuthLogin(new ApiClientError("invalid credentials", "HTTP_401", 401))).toBe(false);
  expect(shouldRetrySharedAuthLogin(new ApiClientError("missing Authorization header", "HTTP_403", 403))).toBe(false);
});

test("preserves granted and denied permissions from the authentication session", () => {
  const session = normalizeAuthSession({
    account: {
      id: "teacher-1",
      fullName: "Teacher One",
      email: "teacher@erg.edu.vn",
      role: "teacher",
      provider: "password",
      department: "ERG",
      title: "Giáo viên",
      features: [],
      createdAt: "2026-07-14T00:00:00Z",
      lastLoginAt: null,
    },
    permissions: ["lms.grade.*"],
    deniedPermissions: ["lms.grade.finalize"],
    roles: ["teacher", "lms_teacher_standard"],
    portals: ["lms"],
    workspaces: ["TEACHER"],
  });

  expect(session.permissions).toEqual(["lms.grade.*"]);
  expect(session.deniedPermissions).toEqual(["lms.grade.finalize"]);
  expect(session.roles).toEqual(["teacher", "lms_teacher_standard"]);
  expect(session.workspaces).toEqual(["TEACHER"]);
});

test("preserves explicit first-login lifecycle returned by login", () => {
  const session = normalizeAuthSession({
    user: {
      id: "teacher-onboarding",
      email: "teacher.onboarding@erg.edu.vn",
      fullName: "Teacher Onboarding",
      isProfileCompleted: false,
      lifecycle: {
        status: "FIRST_LOGIN_RESTRICTED",
        isProfileCompleted: false,
        recoveryEmailMasked: null,
        recoveryEmailVerified: false,
        mustChangePassword: true,
        nextSteps: ["COMPLETE_PROFILE", "VERIFY_RECOVERY_EMAIL", "CHANGE_PASSWORD"],
      },
    },
    accessToken: "restricted-token",
    portals: ["lms"],
  });

  expect(session.account.lifecycle).toMatchObject({
    status: "FIRST_LOGIN_RESTRICTED",
    mustChangePassword: true,
    nextSteps: ["COMPLETE_PROFILE", "VERIFY_RECOVERY_EMAIL", "CHANGE_PASSWORD"],
  });
});

test("does not assume profile completion when backend omits lifecycle fields", () => {
  const session = normalizeAuthSession({
    user: {
      id: "teacher-unknown",
      email: "teacher.unknown@erg.edu.vn",
      fullName: "Teacher Unknown",
    },
    accessToken: "token",
    portals: ["lms"],
  });

  expect(session.account.isProfileCompleted).toBeUndefined();
  expect(session.account.lifecycle).toBeUndefined();
});

test("accepts a login response that carries a usable account and access token", () => {
  expect(
    isBackendAuthSessionResponse({
      user: { id: "teacher-9", email: "teacher9@erg.edu.vn", fullName: "ERG Teacher 9" },
      accessToken: "valid-token",
      portals: ["lms"],
    }),
  ).toBe(true);
});

test("login rejects a malformed backend response with a clear typed error", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  const fetchMock = vi.fn(async () =>
    new Response(
      // Missing account identity and access token entirely.
      JSON.stringify({ data: { portals: ["lms"] } }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);

  await expect(
    authApi.login({
      identifier: "teacher9@erg.edu.vn",
      password: "password123",
      rememberMe: true,
      portal: "lms",
    }),
  ).rejects.toBeInstanceOf(ResponseValidationError);
});

function normalizeLoginResponse(response: Parameters<typeof normalizeAuthSession>[0]): AuthSessionResponseDTO {
  return normalizeAuthSession(response);
}

function createJwt(payload: Record<string, unknown>) {
  return `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.signature`;
}

function createStorage() {
  return {
    getItem: (key: string) => storage.get(key) ?? null,
    removeItem: (key: string) => {
      storage.delete(key);
    },
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
  };
}
