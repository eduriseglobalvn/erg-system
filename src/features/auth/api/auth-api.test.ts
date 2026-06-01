import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { saveServerAuthSession } from "./auth-storage";
import { authApi, normalizeAuthSession, shouldRetrySharedAuthLogin, type AuthSessionResponseDTO } from "./auth-api";
import { ApiClientError } from "@/lib/api-client";
import { TEACHER_LOCAL_SESSION_KEY, clearTeacherSessionSnapshot, getStoredAccessToken, portalSessionKey, readStoredAuthSession } from "./auth-token-storage";

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

test("backend login sends CRM portal in request body and X-Portal header", async () => {
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
    email: "crm@erg.edu.vn",
    password: "password123",
    rememberMe: true,
    portal: "crm",
  });

  const [, init] = fetchMock.mock.calls[0] ?? [];
  const headers = (init as RequestInit).headers as Headers;
  expect(headers.get("Content-Type")).toBe("application/json");
  expect(headers.get("X-Tenant-ID")).toBe("erg");
  expect(headers.get("X-Request-ID")).toBeTruthy();
  expect(headers.get("X-Portal")).toBe("crm");
  expect((init as RequestInit).referrerPolicy).toBe("no-referrer");
  expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
    deviceFingerprint: expect.any(String),
    deviceId: expect.any(String),
    deviceName: expect.any(String),
    portal: "crm",
  });
});

test("backend login sends LCMS portal when logging in from lcms host", async () => {
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
    email: "admin@erg.edu.vn",
    password: "Admin@2025",
    rememberMe: true,
    portal: "lcms",
  });

  const [, init] = fetchMock.mock.calls[0] ?? [];
  const headers = (init as RequestInit).headers as Headers;
  expect(headers.get("X-Portal")).toBe("lcms");
  expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
    portal: "lcms",
  });
});

test("keeps the configured spring API base when the CRM portal runs on its own host", async () => {
  vi.stubEnv("VITE_API_BASE", "http://localhost:8080");
  Object.assign(window.location, {
    hostname: "crm.erg.edu.vn",
    origin: "https://crm.erg.edu.vn:3001",
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
    email: "admin@erg.edu.vn",
    password: "Admin@2025",
    rememberMe: true,
    portal: "crm",
  });

  const [url] = fetchMock.mock.calls[0] ?? [];
  expect(url).toBe("http://localhost:8080/api/v1/auth/login");
});

test("persists snake_case access tokens from backend login responses", async () => {
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
  expect(JSON.parse(storage.get(portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms")) ?? "{}")).toMatchObject({
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

test("uses a stored LMS session for HocLieu resource requests", async () => {
  saveServerAuthSession(
    normalizeLoginResponse({
      user: {
        id: "teacher-hoclieu",
        email: "teacher.hoclieu@erg.edu.vn",
        fullName: "ERG HocLieu Teacher",
      },
      accessToken: "shared-lms-token",
      portals: ["lms"],
    }),
    true,
    "lms",
  );

  expect(readStoredAuthSession("hoclieu")).toMatchObject({
    accessToken: "shared-lms-token",
    portal: "lms",
    portals: ["lms"],
  });
  expect(getStoredAccessToken("hoclieu")).toBe("shared-lms-token");
});

test("uses a stored LMS session for LCMS requests", async () => {
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

  expect(readStoredAuthSession("lcms")).toMatchObject({
    accessToken: "shared-lms-token",
    portal: "lms",
    portals: ["lms"],
  });
  expect(getStoredAccessToken("lcms")).toBe("shared-lms-token");
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
