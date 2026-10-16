import { afterEach, expect, test, vi } from "vitest";

import { apiRequest, ApiClientError, AUTH_SESSION_INVALID_EVENT, getApiResponseRequestId } from "@/lib/api-client";
import {
  clearTeacherSessionSnapshot,
  TEACHER_LOCAL_SESSION_KEY,
  portalSessionKey,
  readStoredAuthSession,
} from "@/platform/auth/api/auth-token-storage";

afterEach(() => {
  clearTeacherSessionSnapshot();
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

function setTestPath(path: string) {
  window.history.replaceState({}, "", path);
}

test("uses LMS portal auth for versioned LMS API requests without client portal headers", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({
      accountId: "author-1",
      accessToken: "lms-token",
      loggedInAt: new Date().toISOString(),
      portal: "lms",
      portals: ["lms"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { subjects: [] } }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);

  await apiRequest("/api/v1/lms/resources/library?schoolId=school-erg-alpha");

  const [, init] = fetchMock.mock.calls[0] ?? [];
  const headers = (init as RequestInit).headers as Headers;
  expect(headers.get("Authorization")).toBe("Bearer lms-token");
  expect(headers.get("X-Portal")).toBeNull();
});

test("uses LCMS portal auth for canonical curriculum commands while omitting client portal headers", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lcms"),
    JSON.stringify({
      accountId: "teacher-1",
      accessToken: "lcms-token",
      loggedInAt: new Date().toISOString(),
      portal: "lcms",
      portals: ["lcms"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { id: "subject-1" } }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);

  await apiRequest("/api/v1/curriculum/subjects", {
    method: "POST",
    body: JSON.stringify({ name: "IC3" }),
  });

  const [, init] = fetchMock.mock.calls[0] ?? [];
  const headers = (init as RequestInit).headers as Headers;
  expect(headers.get("Authorization")).toBe("Bearer lcms-token");
  expect(headers.get("X-Portal")).toBeNull();
});

test("uses LCMS portal auth for canonical curriculum and content APIs", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lcms"),
    JSON.stringify({
      accountId: "author-1",
      accessToken: "lcms-token",
      loggedInAt: new Date().toISOString(),
      portal: "lcms",
      portals: ["lcms"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { id: "content-1" } }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);

  await apiRequest("/api/content/items", {
    method: "POST",
    body: JSON.stringify({ contentType: "LECTURE", title: "Deck" }),
  });

  const [, init] = fetchMock.mock.calls[0] ?? [];
  const headers = (init as RequestInit).headers as Headers;
  expect(headers.get("Authorization")).toBe("Bearer lcms-token");
  expect(headers.get("X-Portal")).toBeNull();
});

test("uses current back-office auth for shared admin endpoints on LCMS host without client portal headers", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  setTestPath("/lcms");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lcms"),
    JSON.stringify({
      accountId: "teacher-1",
      accessToken: "lcms-token",
      loggedInAt: new Date().toISOString(),
      portal: "lcms",
      portals: ["lcms"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: [] }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);

  await apiRequest("/api/v1/centers");

  const [, init] = fetchMock.mock.calls[0] ?? [];
  const headers = (init as RequestInit).headers as Headers;
  expect(headers.get("Authorization")).toBe("Bearer lcms-token");
  expect(headers.get("X-Portal")).toBeNull();
});

test("returns authenticated binary downloads without passing responseType to fetch", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({ accountId: "teacher-1", accessToken: "lms-token", loggedInAt: new Date().toISOString(), portal: "lms", portals: ["lms"], rememberMe: true }),
  );
  const fetchMock = vi.fn(async () => new Response("action,actor\nUPDATE,ac…56\n", { status: 200, headers: { "Content-Type": "text/csv" } }));
  vi.stubGlobal("fetch", fetchMock);

  const result = await apiRequest<Blob>("/api/v1/reports/jobs/job-1/download", { portal: "lms", responseType: "blob" });
  expect(result).toBeInstanceOf(Blob);
  const [, init] = fetchMock.mock.calls[0] ?? [];
  expect(init).not.toHaveProperty("responseType");
  expect(await result.text()).toContain("UPDATE");
});

test("uses CRM auth for shared admin endpoints on CRM host without client portal headers", async () => {
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
  expect(headers.get("X-Portal")).toBeNull();
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
  const refreshHeaders = (refreshInit as RequestInit).headers as Headers;
  expect(refreshHeaders.get("X-Tenant-ID")).toBeNull();
  expect(refreshHeaders.get("X-Portal")).toBeNull();
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

test("does not clear the session or dispatch invalid event when a data query 401s without a refresh token", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({
      accountId: "teacher-1",
      accessToken: "lms-token",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      loggedInAt: new Date().toISOString(),
      portal: "lms",
      portals: ["lms"],
      rememberMe: true,
    }),
  );
  const invalidListener = vi.fn();
  window.addEventListener(AUTH_SESSION_INVALID_EVENT, invalidListener);
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "no access" } }), { status: 401 }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await expect(apiRequest("/api/v1/users/me")).rejects.toThrow("no access");

  window.removeEventListener(AUTH_SESSION_INVALID_EVENT, invalidListener);
  expect(invalidListener).not.toHaveBeenCalled();
  expect(readStoredAuthSession("lms")).toMatchObject({ accessToken: "lms-token" });
});

test("does not dispatch invalid event when a protected request has no token at all", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  const invalidListener = vi.fn();
  window.addEventListener(AUTH_SESSION_INVALID_EVENT, invalidListener);
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  await expect(apiRequest("/api/v1/users/me")).rejects.toThrow("Authentication session is missing or expired.");

  window.removeEventListener(AUTH_SESSION_INVALID_EVENT, invalidListener);
  expect(invalidListener).not.toHaveBeenCalled();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("treats HTTP 304 as a successful empty revalidation response", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({
      accountId: "student-1",
      accessToken: "lms-token",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      loggedInAt: new Date().toISOString(),
      portal: "lms",
      portals: ["lms"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi.fn(async () => new Response(null, { status: 304 }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(
    apiRequest("/api/v1/lms/quizzes/quiz-1/package", {
      cache: "default",
      portal: "lms",
    }),
  ).resolves.toBeUndefined();
});
test("does not dedupe concurrent GET requests across explicit portals even when the token is shared", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  const session = {
    accountId: "teacher-1",
    accessToken: "shared-teacher-token",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    loggedInAt: new Date().toISOString(),
    portal: "lms",
    portals: ["lms", "lcms"],
    rememberMe: true,
  };
  window.localStorage.setItem(portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"), JSON.stringify(session));

  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: { portal: "lms" } }), { status: 200, headers: { "Content-Type": "application/json" } }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: { portal: "lcms" } }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);

  const [lmsResult, lcmsResult] = await Promise.all([
    apiRequest<{ portal: string }>("/api/v1/users/me", { portal: "lms" }),
    apiRequest<{ portal: string }>("/api/v1/users/me", { portal: "lcms" }),
  ]);

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(lmsResult.portal).toBe("lms");
  expect(lcmsResult.portal).toBe("lcms");
});

test("does not dedupe concurrent GET requests with different browser cache modes", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms"),
    JSON.stringify({
      accountId: "teacher-1",
      accessToken: "lms-token",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      loggedInAt: new Date().toISOString(),
      portal: "lms",
      portals: ["lms"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: { source: "no-store" } }), { status: 200, headers: { "Content-Type": "application/json" } }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: { source: "default" } }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);

  const [noStoreResult, defaultResult] = await Promise.all([
    apiRequest<{ source: string }>("/api/v1/lms/quizzes/quiz-1/package", { portal: "lms" }),
    apiRequest<{ source: string }>("/api/v1/lms/quizzes/quiz-1/package", { portal: "lms", cache: "default" }),
  ]);

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(noStoreResult.source).toBe("no-store");
  expect(defaultResult.source).toBe("default");
});

test("does not dedupe GET requests with different response envelope modes", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: { source: "unwrapped" } }), { status: 200, headers: { "Content-Type": "application/json" } }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: { source: "raw" } }), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);

  const [unwrapped, raw] = await Promise.all([
    apiRequest<{ source: string }>("/api/v1/users/me", { auth: "public", unwrapEnvelope: true }),
    apiRequest<{ data: { source: string } }>("/api/v1/users/me", { auth: "public", unwrapEnvelope: false }),
  ]);

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(unwrapped.source).toBe("unwrapped");
  expect(raw.data.source).toBe("raw");
});

test("BFF commands obtain and send a CSRF token without a browser bearer token", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  vi.stubEnv("VITE_AUTH_MODE", "oidc-bff");
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ headerName: "X-XSRF-TOKEN", token: "csrf-1" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: { updated: true } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
  vi.stubGlobal("fetch", fetchMock);

  await apiRequest<{ updated: boolean }>("/api/v1/users/me", {
    method: "PATCH",
    body: JSON.stringify({ fullName: "Teacher" }),
  });

  const [, commandInit] = fetchMock.mock.calls[1] ?? [];
  expect(new Headers((commandInit as RequestInit).headers).get("X-XSRF-TOKEN")).toBe("csrf-1");
  expect((commandInit as RequestInit).credentials).toBe("include");
});

test("preserves structured backend error envelope metadata", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    statusCode: 422,
    message: "Validation failed",
    data: null,
    errors: { code: "VALIDATION_FAILED", fields: { email: "invalid" } },
    request_id: "req-contract-1",
  }), { status: 422, headers: { "Content-Type": "application/json" } })));

  const error = await apiRequest("/api/v1/auth/login", { method: "POST", auth: "public" }).catch((value) => value);

  expect(error).toBeInstanceOf(ApiClientError);
  expect(error).toMatchObject({
    code: "VALIDATION_FAILED",
    status: 422,
    requestId: "req-contract-1",
    details: { fields: { email: "invalid" } },
  });
});

test("retains request ID metadata on a successful unwrapped response", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    data: { users: [] },
    request_id: "req-success-1",
  }), { status: 200, headers: { "Content-Type": "application/json" } })));

  const result = await apiRequest<{ users: unknown[] }>("/api/v1/auth/login", { auth: "public" });

  expect(getApiResponseRequestId(result)).toBe("req-success-1");
});

test("rethrows an external abort reason without converting it to a network error", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  const reason = new Error("user cancelled");
  vi.stubGlobal("fetch", vi.fn(async () => { throw reason; }));
  const controller = new AbortController();
  controller.abort(reason);

  await expect(apiRequest("/api/v1/auth/login", { signal: controller.signal, auth: "public" })).rejects.toBe(reason);
});
