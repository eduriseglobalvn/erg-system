import { afterEach, expect, test } from "vitest";

import {
  clearStoredAuthSessions,
  readStoredRefreshSession,
  TEACHER_LOCAL_SESSION_KEY,
  writeStoredAuthIdentity,
} from "@/platform/auth/api/auth-token-storage";

const session = { accountId: "u1", accessToken: "access", refreshToken: "refresh", loggedInAt: new Date().toISOString(), portal: "lms" as const, portals: ["lms" as const] };
const localKey = TEACHER_LOCAL_SESSION_KEY;

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

test("a tab refreshes with the token another tab already rotated, not its in-memory copy", () => {
  // Reusing a rotated refresh token is treated as theft by the backend and revokes every session of the account.
  writeStoredAuthIdentity({ ...session, rememberMe: true, refreshToken: "rotated-away" });
  window.localStorage.setItem(localKey, JSON.stringify({ ...session, accessToken: undefined, rememberMe: true, refreshToken: "latest" }));

  expect(readStoredRefreshSession("lms")?.refreshToken).toBe("latest");
});

test("another account's remembered token is never used for this tab's session", () => {
  writeStoredAuthIdentity({ ...session, rememberMe: true, refreshToken: "mine" });
  window.localStorage.setItem(localKey, JSON.stringify({ ...session, accountId: "u2", accessToken: undefined, rememberMe: true, refreshToken: "theirs" }));

  expect(readStoredRefreshSession("lms")?.refreshToken).toBe("mine");
});
