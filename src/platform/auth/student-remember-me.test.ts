import { afterEach, expect, test, vi } from "vitest";

import { apiRequest, AUTH_SESSION_INVALID_EVENT } from "@/lib/api-client";
import { STUDENT_LOCAL_SESSION_KEY, STUDENT_TEMP_SESSION_KEY } from "@/platform/auth/api/auth-token-storage";
import { getCurrentStudentSession, restoreRememberedStudentSession } from "@/platform/auth/api/student-auth-storage";

const remembered = { className: "", email: "hs@erg.edu.vn", loggedInAt: new Date().toISOString(), name: "HS", rememberMe: true, refreshToken: "old-refresh", portal: "elearning" };

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function stubRefresh(status: number, body: unknown) {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

test("a remembered student gets a fresh session from the stored refresh token", async () => {
  window.localStorage.setItem(STUDENT_LOCAL_SESSION_KEY, JSON.stringify(remembered));
  stubRefresh(200, { accessToken: "new-access", refreshToken: "new-refresh", expiresIn: 3600 });

  await restoreRememberedStudentSession();

  expect(getCurrentStudentSession()).toMatchObject({ accessToken: "new-access", refreshToken: "new-refresh" });
  expect(window.localStorage.getItem(STUDENT_LOCAL_SESSION_KEY)).toContain("new-refresh");
  expect(window.localStorage.getItem(STUDENT_LOCAL_SESSION_KEY)).not.toContain("new-access");
});

test("a rejected refresh token signs the remembered student out", async () => {
  window.localStorage.setItem(STUDENT_LOCAL_SESSION_KEY, JSON.stringify(remembered));
  stubRefresh(401, { error: { code: "INVALID_TOKEN", message: "invalid token" } });

  await restoreRememberedStudentSession();

  expect(window.localStorage.getItem(STUDENT_LOCAL_SESSION_KEY)).toBeNull();
  expect(window.sessionStorage.getItem(STUDENT_TEMP_SESSION_KEY)).toBeNull();
});

const studentInTab = { ...remembered, id: "student-1", accessToken: "old-access", expiresAt: "2020-01-01T00:00:00.000Z" };

function stubRefreshThenApi() {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  const fetchMock = vi.fn(async (url: string | URL | Request, _init?: RequestInit) =>
    String(url).endsWith("/api/v1/auth/refresh")
      ? new Response(JSON.stringify({ data: { accessToken: "new-access", refreshToken: "new-refresh", expiresIn: 900 } }), { status: 200, headers: { "Content-Type": "application/json" } })
      : new Response(JSON.stringify({ data: { ok: true } }), { status: 200, headers: { "Content-Type": "application/json" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

test("an expired student access token is refreshed silently on the next student API call", async () => {
  window.sessionStorage.setItem(STUDENT_TEMP_SESSION_KEY, JSON.stringify(studentInTab));
  window.localStorage.setItem(STUDENT_LOCAL_SESSION_KEY, JSON.stringify({ ...remembered, id: "student-1" }));
  const fetchMock = stubRefreshThenApi();

  await apiRequest("/api/elearning/home", { portal: "elearning" });

  expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/api/v1/auth/refresh");
  expect(((fetchMock.mock.calls[1]?.[1] as RequestInit).headers as Headers).get("Authorization")).toBe("Bearer new-access");
  expect(getCurrentStudentSession()).toMatchObject({ accessToken: "new-access", refreshToken: "new-refresh" });
  expect(window.localStorage.getItem(STUDENT_LOCAL_SESSION_KEY)).toContain("new-refresh");
  expect(window.localStorage.getItem(STUDENT_LOCAL_SESSION_KEY)).not.toContain("new-access");
});

test("a tab refreshes with the token another tab already rotated, not its own stale copy", async () => {
  // Reusing a rotated refresh token is treated as theft by the backend and revokes every session of the account.
  window.sessionStorage.setItem(STUDENT_TEMP_SESSION_KEY, JSON.stringify({ ...studentInTab, refreshToken: "rotated-away" }));
  window.localStorage.setItem(STUDENT_LOCAL_SESSION_KEY, JSON.stringify({ ...remembered, id: "student-1", refreshToken: "latest" }));
  const fetchMock = stubRefreshThenApi();

  await apiRequest("/api/elearning/home", { portal: "elearning" });

  expect(JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body))).toMatchObject({ refreshToken: "latest" });
});

test("a network error while refreshing keeps the student signed in", async () => {
  window.sessionStorage.setItem(STUDENT_TEMP_SESSION_KEY, JSON.stringify(studentInTab));
  window.localStorage.setItem(STUDENT_LOCAL_SESSION_KEY, JSON.stringify({ ...remembered, id: "student-1" }));
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  const offline = vi.fn(async (_url?: string | URL | Request) => { throw new TypeError("Failed to fetch"); });
  vi.stubGlobal("fetch", offline);
  const invalid = vi.fn();
  window.addEventListener(AUTH_SESSION_INVALID_EVENT, invalid);

  await expect(apiRequest("/api/elearning/home", { portal: "elearning" })).rejects.toThrow();

  window.removeEventListener(AUTH_SESSION_INVALID_EVENT, invalid);
  expect(String(offline.mock.calls[0]?.[0])).toContain("/api/v1/auth/refresh");
  expect(invalid).not.toHaveBeenCalled();
  expect(window.localStorage.getItem(STUDENT_LOCAL_SESSION_KEY)).toContain("old-refresh");
});

test("tabs refresh one at a time through the browser lock", async () => {
  window.sessionStorage.setItem(STUDENT_TEMP_SESSION_KEY, JSON.stringify(studentInTab));
  const request = vi.fn((_name: string, callback: () => Promise<unknown>) => callback());
  vi.stubGlobal("navigator", { ...navigator, locks: { request } });
  stubRefreshThenApi();

  await apiRequest("/api/elearning/home", { portal: "elearning" });

  expect(request).toHaveBeenCalledWith("erg-auth-refresh", expect.any(Function));
});

test("startup restore also waits for the cross-tab refresh lock", async () => {
  window.localStorage.setItem(STUDENT_LOCAL_SESSION_KEY, JSON.stringify(remembered));
  const request = vi.fn((_name: string, callback: () => Promise<unknown>) => callback());
  vi.stubGlobal("navigator", { ...navigator, locks: { request } });
  stubRefresh(200, { accessToken: "new-access", refreshToken: "new-refresh", expiresIn: 900 });

  await restoreRememberedStudentSession();

  expect(request).toHaveBeenCalledWith("erg-auth-refresh", expect.any(Function));
  expect(getCurrentStudentSession()).toMatchObject({ accessToken: "new-access" });
});
