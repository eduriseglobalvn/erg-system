import { afterEach, expect, test, vi } from "vitest";

import { apiRequest } from "@/lib/api-client";
import { TEACHER_LOCAL_SESSION_KEY, portalSessionKey } from "@/platform/auth/api/auth-token-storage";

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
