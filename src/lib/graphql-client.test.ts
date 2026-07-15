import { afterEach, expect, test, vi } from "vitest";

import { graphQlRequest } from "@/lib/graphql-client";
import { clearTeacherSessionSnapshot, TEACHER_LOCAL_SESSION_KEY, portalSessionKey } from "@/platform/auth/api/auth-token-storage";

afterEach(() => {
  clearTeacherSessionSnapshot();
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

test("returns partial GraphQL data when errors are present", async () => {
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
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const fetchMock = vi.fn(async () =>
    new Response(
      JSON.stringify({
        data: { lms: { namespace: "lms" } },
        errors: [{ message: "Field riskSummary denied" }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);

  const data = await graphQlRequest<{ lms: { namespace: string } }>({
    operationName: "GraphQlShellStatus",
    portal: "lms",
    query: "query GraphQlShellStatus { lms { namespace status } }",
  });

  expect(data).toEqual({ lms: { namespace: "lms" } });
  expect(warnSpy).toHaveBeenCalled();
});

test("rejects GraphQL variables containing sensitive keys", async () => {
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
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  await expect(
    graphQlRequest({
      operationName: "BadQuery",
      portal: "lms",
      query: "query BadQuery { lms { namespace } }",
      variables: {
        input: {
          token: "secret",
        },
      },
    }),
  ).rejects.toThrow(/sensitive key/i);

  expect(fetchMock).not.toHaveBeenCalled();
});
