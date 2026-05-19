import { afterEach, beforeEach, expect, test } from "vitest";

import { saveServerAuthSession } from "./auth-storage";
import { normalizeAuthSession, shouldRetrySharedAuthLogin, type AuthSessionResponseDTO } from "./auth-api";
import { ApiClientError } from "@/lib/api-client";
import { TEACHER_LOCAL_SESSION_KEY, clearTeacherSessionSnapshot, getStoredAccessToken } from "./auth-token-storage";

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
  // @ts-expect-error Test-only cleanup for the browser global.
  delete globalThis.window;
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
  expect(JSON.parse(storage.get(TEACHER_LOCAL_SESSION_KEY) ?? "{}")).toMatchObject({
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

test("retries shared auth login only for missing bearer login middleware errors", () => {
  expect(shouldRetrySharedAuthLogin(new ApiClientError("missing Authorization header", "HTTP_401", 401))).toBe(true);
  expect(shouldRetrySharedAuthLogin(new ApiClientError("invalid credentials", "HTTP_401", 401))).toBe(false);
  expect(shouldRetrySharedAuthLogin(new ApiClientError("missing Authorization header", "HTTP_403", 403))).toBe(false);
});

function normalizeLoginResponse(response: Parameters<typeof normalizeAuthSession>[0]): AuthSessionResponseDTO {
  return normalizeAuthSession(response);
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
