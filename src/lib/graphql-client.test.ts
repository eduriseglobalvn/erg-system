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

test("returns partial GraphQL data only when allow-partial is explicit", async () => {
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
    errorPolicy: "allow-partial",
    operationName: "GraphQlShellStatus",
    portal: "lms",
    query: "query GraphQlShellStatus { lms { namespace status } }",
  });

  expect(data).toEqual({ lms: { namespace: "lms" } });
  expect(warnSpy).toHaveBeenCalled();
});

test("rejects partial GraphQL data by default", async () => {
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
  vi.stubGlobal("fetch", vi.fn(async () =>
    new Response(
      JSON.stringify({
        data: { lms: { namespace: "lms" } },
        errors: [{ message: "Field riskSummary denied" }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  ));

  await expect(graphQlRequest({
    operationName: "GraphQlShellStatus",
    portal: "lms",
    query: "query GraphQlShellStatus { lms { namespace status } }",
  })).rejects.toMatchObject({ code: "GRAPHQL_PARTIAL_ERROR" });
});

test("propagates caller abort signal to the GraphQL fetch", async () => {
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
  const fetchMock = vi.fn((_url: string | URL | Request, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const controller = new AbortController();
  const reason = new Error("route changed");

  const request = graphQlRequest({
    operationName: "GraphQlShellStatus",
    portal: "lms",
    query: "query GraphQlShellStatus { lms { namespace } }",
    signal: controller.signal,
  });
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
  controller.abort(reason);

  await expect(request).rejects.toBe(reason);
});

test("rejects an explicit tenant that differs from the authenticated session", async () => {
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
      tenantId: "tenant-a",
    }),
  );
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);

  await expect(graphQlRequest({
    operationName: "GraphQlShellStatus",
    portal: "lms",
    query: "query GraphQlShellStatus { lms { namespace } }",
    tenantId: "tenant-b",
  })).rejects.toMatchObject({ code: "GRAPHQL_TENANT_MISMATCH" });

  expect(fetchMock).not.toHaveBeenCalled();
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
