import { afterEach, expect, test, vi } from "vitest";

import { apiRequest } from "@/lib/api-client";
import { TEACHER_LOCAL_SESSION_KEY, portalSessionKey, readStoredAuthSession } from "@/platform/auth/api/auth-token-storage";

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

function setTestPath(path: string) {
  window.history.replaceState({}, "", path);
}

test("sends LMS portal auth for merged LearningResource API requests", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({
      accountId: "teacher-1",
      accessToken: "lms-token",
      loggedInAt: new Date().toISOString(),
      portal: "lms",
      portals: ["lms"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { subjects: [] } }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);

  await apiRequest("/api/v1/hoclieu/library/bootstrap?schoolId=school-erg-alpha");

  const [, init] = fetchMock.mock.calls[0] ?? [];
  const headers = (init as RequestInit).headers as Headers;
  expect(headers.get("Authorization")).toBe("Bearer lms-token");
  expect(headers.get("X-Portal")).toBe("lms");
});

test("sends LCMS portal auth for content admin requests while reusing LMS access", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({
      accountId: "teacher-1",
      accessToken: "lms-token",
      loggedInAt: new Date().toISOString(),
      portal: "lms",
      portals: ["lms"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { resources: [] } }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);

  await apiRequest("/api/v1/admin/hoclieu/resources?limit=100");

  const [, init] = fetchMock.mock.calls[0] ?? [];
  const headers = (init as RequestInit).headers as Headers;
  expect(headers.get("Authorization")).toBe("Bearer lms-token");
  expect(headers.get("X-Portal")).toBe("lcms");
});

test("uses current back-office portal for shared admin endpoints on LCMS host", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  setTestPath("/lcms");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({
      accountId: "teacher-1",
      accessToken: "lms-token",
      loggedInAt: new Date().toISOString(),
      portal: "lms",
      portals: ["lms"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: [] }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);

  await apiRequest("/api/v1/centers");

  const [, init] = fetchMock.mock.calls[0] ?? [];
  const headers = (init as RequestInit).headers as Headers;
  expect(headers.get("Authorization")).toBe("Bearer lms-token");
  expect(headers.get("X-Portal")).toBe("lcms");
});

test("uses CRM portal for shared admin endpoints on CRM host", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  setTestPath("/crm");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "crm"),
    JSON.stringify({
      accountId: "crm-1",
      accessToken: "crm-token",
      loggedInAt: new Date().toISOString(),
      portal: "crm",
      portals: ["crm"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: [] }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);

  await apiRequest("/api/users/crm-1");

  const [, init] = fetchMock.mock.calls[0] ?? [];
  const headers = (init as RequestInit).headers as Headers;
  expect(headers.get("Authorization")).toBe("Bearer crm-token");
  expect(headers.get("X-Portal")).toBe("crm");
});

test("refreshes an expired access token before calling a protected Spring API", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({
      accountId: "teacher-1",
      accessToken: "expired-token",
      refreshToken: "refresh-token",
      expiresAt: "2020-01-01T00:00:00.000Z",
      loggedInAt: new Date().toISOString(),
      portal: "lms",
      portals: ["lms"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi.fn(async (url: string | URL | Request) => {
    if (String(url).endsWith("/api/v1/auth/refresh")) {
      return new Response(
        JSON.stringify({
          data: {
            accessToken: "fresh-token",
            refreshToken: "next-refresh-token",
            expiresIn: 3600,
            tokenType: "Bearer",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ data: { ok: true } }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchMock);

  await apiRequest("/api/v1/users/me");

  expect(fetchMock).toHaveBeenCalledTimes(2);
  const [, refreshInit] = fetchMock.mock.calls[0] ?? [];
  expect(JSON.parse(String((refreshInit as RequestInit).body))).toMatchObject({
    refreshToken: "refresh-token",
  });
  const [, apiInit] = fetchMock.mock.calls[1] ?? [];
  const headers = (apiInit as RequestInit).headers as Headers;
  expect(headers.get("Authorization")).toBe("Bearer fresh-token");
  expect(readStoredAuthSession("lms")).toMatchObject({
    accessToken: "fresh-token",
    refreshToken: "next-refresh-token",
  });
});

test("refreshes and retries once when a protected API returns 401", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({
      accountId: "teacher-1",
      accessToken: "stale-token",
      refreshToken: "refresh-token",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      loggedInAt: new Date().toISOString(),
      portal: "lms",
      portals: ["lms"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "AUTH_INVALID_TOKEN", message: "invalid token" } }), { status: 401 }))
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { accessToken: "fresh-token", refreshToken: "next-refresh-token", expiresIn: 3600 } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: { ok: true } }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);

  await apiRequest("/api/v1/users/me");

  expect(fetchMock).toHaveBeenCalledTimes(3);
  const [, retryInit] = fetchMock.mock.calls[2] ?? [];
  const retryHeaders = (retryInit as RequestInit).headers as Headers;
  expect(retryHeaders.get("Authorization")).toBe("Bearer fresh-token");
});

test("clears the stored session when refresh fails after a 401", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({
      accountId: "teacher-1",
      accessToken: "stale-token",
      refreshToken: "bad-refresh-token",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      loggedInAt: new Date().toISOString(),
      portal: "lms",
      portals: ["lms"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "AUTH_INVALID_TOKEN", message: "invalid token" } }), { status: 401 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "AUTH_INVALID_TOKEN", message: "invalid refresh token" } }), { status: 401 }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(apiRequest("/api/v1/users/me")).rejects.toThrow("invalid token");

  expect(readStoredAuthSession("lms")).toBeNull();
});
