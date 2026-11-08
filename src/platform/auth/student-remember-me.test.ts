import { afterEach, expect, test, vi } from "vitest";

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
