import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { STUDENT_LOCAL_SESSION_KEY } from "@/platform/auth/api/auth-token-storage";
import { applySharedDeviceParam, isSharedDevice } from "@/platform/auth/api/shared-device";
import { loginStudentWithApi } from "@/platform/auth/api/student-auth-storage";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { isIdleSignOutExempt } from "@/platform/auth/hooks/use-idle-sign-out";
import { I18nProvider } from "@/platform/i18n";

const rememberedStudent = { className: "", email: "hs@erg.edu.vn", loggedInAt: new Date().toISOString(), name: "HS", rememberMe: true, refreshToken: "refresh", portal: "elearning" };

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}><I18nProvider>{children}</I18nProvider></QueryClientProvider>;
}

test("remember me starts unticked on the student login and unchanged for staff", () => {
  expect(renderHook(() => useAuthSession("elearning"), { wrapper }).result.current.rememberMe).toBe(false);
  expect(renderHook(() => useAuthSession("lms"), { wrapper }).result.current.rememberMe).toBe(true);
});

test("?shared-device=on marks the computer as shared and forgets a remembered student; =off clears it", () => {
  window.localStorage.setItem(STUDENT_LOCAL_SESSION_KEY, JSON.stringify(rememberedStudent));

  applySharedDeviceParam("?redirect=%2Fstudent&shared-device=on");
  expect(isSharedDevice()).toBe(true);
  expect(window.localStorage.getItem(STUDENT_LOCAL_SESSION_KEY)).toBeNull();

  applySharedDeviceParam("?redirect=%2Fstudent");
  expect(isSharedDevice()).toBe(true);

  applySharedDeviceParam("?shared-device=off");
  expect(isSharedDevice()).toBe(false);
});

test("a student on a shared computer is never remembered, even if remember me was sent", async () => {
  applySharedDeviceParam("?shared-device=on");
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  const fetchMock = vi.fn(async (_url?: string | URL | Request, _init?: RequestInit) =>
    new Response(JSON.stringify({ data: { user: { id: "s1", email: "hs@erg.edu.vn" }, accessToken: "a", refreshToken: "r", expiresIn: 900 } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
  vi.stubGlobal("fetch", fetchMock);

  await loginStudentWithApi({ email: "hs@erg.edu.vn", password: "pw", rememberMe: true });

  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({ rememberMe: false });
  expect(window.localStorage.getItem(STUDENT_LOCAL_SESSION_KEY)).toBeNull();
});

test("only a remembered student on a personal device is exempt from the idle sign-out", () => {
  expect(isIdleSignOutExempt()).toBe(false);

  window.localStorage.setItem(STUDENT_LOCAL_SESSION_KEY, JSON.stringify(rememberedStudent));
  expect(isIdleSignOutExempt()).toBe(true);

  window.localStorage.setItem("erg-shared-device", "true");
  expect(isIdleSignOutExempt()).toBe(false);
});
