import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { hydrateSessionFromCookie } from "./cross-domain-session";

const localSessionKey = "erg-auth-local";
const tempSessionKey = "erg-auth-temp";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  document.cookie = "erg_sso=; max-age=0; path=/";
  window.history.replaceState({}, "", "/login?sso_token=legacy-token&redirect=%2Fteacher");
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

test("never hydrates credentials from a URL token parameter", () => {
  const replaceState = vi.spyOn(window.history, "replaceState");

  expect(hydrateSessionFromCookie(localSessionKey, tempSessionKey)).toBe(false);
  expect(window.localStorage.getItem(localSessionKey)).toBeNull();
  expect(replaceState).not.toHaveBeenCalled();
  expect(window.location.search).toContain("sso_token=legacy-token");
});
