import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { STUDENT_LOCAL_SESSION_KEY } from "@/platform/auth/api/auth-token-storage";
import { getCurrentStudentSession, loginStudentWithApi } from "@/platform/auth/api/student-auth-storage";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test("student login sends elearning portal to backend and stores returned token", async () => {
  const fetchMock = vi.fn(async () =>
    new Response(
      JSON.stringify({
        data: {
          user: { id: "student-1", email: "student@erg.edu.vn", fullName: "Student One" },
          accessToken: "student-access-token",
          refreshToken: "student-refresh-token",
          expiresIn: 3600,
          portals: ["elearning"],
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);

  const session = await loginStudentWithApi({
    email: "student@erg.edu.vn",
    password: "password123",
    rememberMe: true,
  });

  const [, init] = fetchMock.mock.calls[0] ?? [];
  expect(JSON.parse(String((init as RequestInit).body))).toMatchObject({
    email: "student@erg.edu.vn",
    password: "password123",
    rememberMe: true,
    portal: "elearning",
  });
  expect(session.accessToken).toBe("student-access-token");
  expect(JSON.parse(window.localStorage.getItem(STUDENT_LOCAL_SESSION_KEY) ?? "{}")).toMatchObject({
    accessToken: "student-access-token",
    portal: "elearning",
  });
});

test("student session expires when stored expiry is in the past", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-31T02:00:00.000Z"));
  window.localStorage.setItem(
    STUDENT_LOCAL_SESSION_KEY,
    JSON.stringify({
      accessToken: "student-access-token",
      className: "",
      email: "student@erg.edu.vn",
      expiresAt: "2026-05-31T01:00:00.000Z",
      loggedInAt: "2026-05-31T00:00:00.000Z",
      name: "Student One",
      portal: "elearning",
      rememberMe: true,
    }),
  );

  expect(getCurrentStudentSession()).toBeNull();
  expect(window.localStorage.getItem(STUDENT_LOCAL_SESSION_KEY)).toBeNull();
});

test("student session without backend expiry is not kept across a day", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-05-31T02:00:00.000Z"));
  window.localStorage.setItem(
    STUDENT_LOCAL_SESSION_KEY,
    JSON.stringify({
      accessToken: "student-access-token",
      className: "",
      email: "student@erg.edu.vn",
      loggedInAt: "2026-05-30T00:00:00.000Z",
      name: "Student One",
      portal: "elearning",
      rememberMe: true,
    }),
  );

  expect(getCurrentStudentSession()).toBeNull();
  expect(window.localStorage.getItem(STUDENT_LOCAL_SESSION_KEY)).toBeNull();
});

test("student session without any usable expiry anchor is cleared", () => {
  window.localStorage.setItem(
    STUDENT_LOCAL_SESSION_KEY,
    JSON.stringify({
      accessToken: "student-access-token",
      className: "",
      email: "student@erg.edu.vn",
      loggedInAt: "not-a-date",
      name: "Student One",
      portal: "elearning",
      rememberMe: true,
    }),
  );

  expect(getCurrentStudentSession()).toBeNull();
  expect(window.localStorage.getItem(STUDENT_LOCAL_SESSION_KEY)).toBeNull();
});
