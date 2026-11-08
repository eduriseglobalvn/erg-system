import { afterEach, expect, test } from "vitest";

import {
  clearStoredAuthSessions,
  portalSessionKey,
  readStoredRefreshSession,
  TEACHER_LOCAL_SESSION_KEY,
  writeStoredAuthIdentity,
} from "@/platform/auth/api/auth-token-storage";

const session = { accountId: "u1", accessToken: "access", refreshToken: "refresh", loggedInAt: new Date().toISOString(), portal: "lms" as const, portals: ["lms" as const] };
const localKey = portalSessionKey(TEACHER_LOCAL_SESSION_KEY, "lms");

afterEach(() => {
  clearStoredAuthSessions();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

test("remember me keeps only the refresh token across restarts", () => {
  writeStoredAuthIdentity({ ...session, rememberMe: true });
  expect(JSON.parse(window.localStorage.getItem(localKey) ?? "null")).toMatchObject({ refreshToken: "refresh", rememberMe: true });
  expect(window.localStorage.getItem(localKey)).not.toContain("access\"");

  window.sessionStorage.clear();
  expect(readStoredRefreshSession("lms")?.refreshToken).toBe("refresh");
});

test("without remember me nothing is persisted, and sign-out wipes it", () => {
  writeStoredAuthIdentity({ ...session, rememberMe: false });
  expect(window.localStorage.getItem(localKey)).toBeNull();

  writeStoredAuthIdentity({ ...session, rememberMe: true });
  clearStoredAuthSessions();
  expect(window.localStorage.getItem(localKey)).toBeNull();
});
