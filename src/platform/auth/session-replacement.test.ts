import { afterEach, expect, test, vi } from "vitest";

import {
  ACCOUNT_DISABLED_EVENT,
  AUTHORIZATION_CHANGED_EVENT,
  AUTH_SESSION_REPLACED_EVENT,
  apiRequest,
} from "@/lib/api-client";
import { portalSessionKey, TEACHER_LOCAL_SESSION_KEY } from "@/platform/auth/api/auth-token-storage";

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

test("a replaced session dispatches the dedicated event without attempting token refresh", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lcms"),
    JSON.stringify({
      accountId: "user-1",
      accessToken: "replaced-access-token",
      refreshToken: "replaced-refresh-token",
      loggedInAt: new Date().toISOString(),
      portal: "lcms",
      portals: ["lcms"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({
    error: { code: "AUTH_SESSION_REPLACED", message: "This session was replaced" },
  }), { status: 401, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  const listener = vi.fn();
  window.addEventListener(AUTH_SESSION_REPLACED_EVENT, listener);

  await expect(apiRequest("/api/v1/admin/users", { portal: "lcms" })).rejects.toMatchObject({
    code: "AUTH_SESSION_REPLACED",
  });

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledTimes(1);
  window.removeEventListener(AUTH_SESSION_REPLACED_EVENT, listener);
});

test.each([
  ["ACCOUNT_DISABLED", ACCOUNT_DISABLED_EVENT],
  ["AUTHZ_VERSION_CHANGED", AUTHORIZATION_CHANGED_EVENT],
])("%s invalidates the local session through its dedicated central event", async (code, eventName) => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  window.localStorage.setItem(
    portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lcms"),
    JSON.stringify({
      accountId: "user-1",
      accessToken: "stale-access-token",
      refreshToken: "stale-refresh-token",
      loggedInAt: new Date().toISOString(),
      portal: "lcms",
      portals: ["lcms"],
      rememberMe: true,
    }),
  );
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({
    error: { code, message: "Authorization lifecycle changed" },
  }), { status: 401, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", fetchMock);
  const listener = vi.fn();
  window.addEventListener(eventName, listener);

  await expect(apiRequest("/api/v1/admin/users", { portal: "lcms" })).rejects.toMatchObject({ code });

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledTimes(1);
  expect(window.localStorage.getItem(portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lcms"))).toBeNull();
  window.removeEventListener(eventName, listener);
});
