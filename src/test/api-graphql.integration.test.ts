import { afterEach, describe, expect, test, vi } from "vitest";

import { AUTH_SESSION_INVALID_EVENT, apiRequest } from "@/lib/api-client";
import { graphQlRequest } from "@/lib/graphql-client";
import { scopedQueryKey } from "@/lib/query-key-scope";
import {
  createDeferred,
  createTransportIntegrationQueryClient,
  jsonResponse,
  resetTransportIntegrationState,
  storeIntegrationSession,
} from "@/test/api-graphql-integration-harness";

const operation = "query IntegrationViewer { lms { namespace } }";

afterEach(() => {
  resetTransportIntegrationState();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("API and GraphQL transport integration", () => {
  test("cancels a REST query through TanStack Query without invalidating auth", async () => {
    vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
    storeIntegrationSession();
    const queryClient = createTransportIntegrationQueryClient();
    const queryKey = ["integration", "rest-cancellation"] as const;
    const invalidSessionListener = vi.fn();
    const fetchStarted = createDeferred<void>();
    let transportSignal: AbortSignal | undefined;
    window.addEventListener(AUTH_SESSION_INVALID_EVENT, invalidSessionListener);
    vi.stubGlobal("fetch", vi.fn((_url: string | URL | Request, init?: RequestInit) => {
      transportSignal = init?.signal ?? undefined;
      fetchStarted.resolve();
      return new Promise<Response>((_resolve, reject) => {
        transportSignal?.addEventListener("abort", () => reject(transportSignal?.reason), { once: true });
      });
    }));

    const request = queryClient.fetchQuery({
      queryKey,
      queryFn: ({ signal }) => apiRequest("/api/v1/users/me", { portal: "lms", signal }),
    });
    await fetchStarted.promise;
    await queryClient.cancelQueries({ queryKey });
    await request.catch(() => undefined);

    expect(transportSignal?.aborted).toBe(true);
    expect(queryClient.getQueryData(queryKey)).toBeUndefined();
    expect(invalidSessionListener).not.toHaveBeenCalled();
    window.removeEventListener(AUTH_SESSION_INVALID_EVENT, invalidSessionListener);
    queryClient.clear();
  });

  test("applies GraphQL partial-error policy before data reaches the query cache", async () => {
    vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
    storeIntegrationSession();
    const queryClient = createTransportIntegrationQueryClient();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
      data: { lms: { namespace: "lms" } },
      errors: [{ message: "riskSummary denied" }],
    })));
    const allowedKey = ["integration", "graphql", "partial", "allowed"] as const;
    const rejectedKey = ["integration", "graphql", "partial", "rejected"] as const;

    const partial = await queryClient.fetchQuery({
      queryKey: allowedKey,
      queryFn: () => graphQlRequest<{ lms: { namespace: string } }>({
        errorPolicy: "allow-partial",
        operationName: "IntegrationViewer",
        portal: "lms",
        query: operation,
      }),
    });
    await expect(queryClient.fetchQuery({
      queryKey: rejectedKey,
      queryFn: () => graphQlRequest({
        operationName: "IntegrationViewer",
        portal: "lms",
        query: operation,
      }),
    })).rejects.toMatchObject({ code: "GRAPHQL_PARTIAL_ERROR" });

    expect(partial).toEqual({ lms: { namespace: "lms" } });
    expect(queryClient.getQueryData(allowedKey)).toEqual(partial);
    expect(queryClient.getQueryData(rejectedKey)).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledOnce();
    queryClient.clear();
  });

  test("isolates identical GraphQL queries by portal, tenant, and account scope", async () => {
    vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
    const queryClient = createTransportIntegrationQueryClient();
    vi.stubGlobal("fetch", vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const authorization = new Headers(init?.headers).get("Authorization");
      return jsonResponse({ data: { lms: { namespace: authorization } } });
    }));
    const tenantAKey = scopedQueryKey("integration", "viewer", {
      accountId: "teacher-a",
      portal: "lms",
      tenantId: "tenant-a",
    });
    const tenantBKey = scopedQueryKey("integration", "viewer", {
      accountId: "teacher-b",
      portal: "lms",
      tenantId: "tenant-b",
    });

    storeIntegrationSession({ accountId: "teacher-a", accessToken: "token-a", tenantId: "tenant-a" });
    await queryClient.fetchQuery({
      queryKey: tenantAKey,
      queryFn: () => graphQlRequest({ operationName: "IntegrationViewer", portal: "lms", query: operation, tenantId: "tenant-a" }),
    });
    storeIntegrationSession({ accountId: "teacher-b", accessToken: "token-b", tenantId: "tenant-b" });
    await queryClient.fetchQuery({
      queryKey: tenantBKey,
      queryFn: () => graphQlRequest({ operationName: "IntegrationViewer", portal: "lms", query: operation, tenantId: "tenant-b" }),
    });

    expect(queryClient.getQueryData(tenantAKey)).toEqual({ lms: { namespace: "Bearer token-a" } });
    expect(queryClient.getQueryData(tenantBKey)).toEqual({ lms: { namespace: "Bearer token-b" } });
    await expect(graphQlRequest({
      operationName: "IntegrationViewer",
      portal: "lms",
      query: operation,
      tenantId: "tenant-a",
    })).rejects.toMatchObject({ code: "GRAPHQL_TENANT_MISMATCH" });
    queryClient.clear();
  });

  test("shares one token refresh across concurrent 401 responses and retries both requests", async () => {
    vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
    storeIntegrationSession({ accessToken: "stale-token", refreshToken: "shared-refresh-token" });
    const refreshResponse = createDeferred<Response>();
    let refreshCalls = 0;
    let staleCalls = 0;
    let retryCalls = 0;
    const invalidSessionListener = vi.fn();
    window.addEventListener(AUTH_SESSION_INVALID_EVENT, invalidSessionListener);
    vi.stubGlobal("fetch", vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).endsWith("/api/v1/auth/refresh")) {
        refreshCalls += 1;
        return refreshResponse.promise;
      }
      const authorization = new Headers(init?.headers).get("Authorization");
      if (authorization === "Bearer stale-token") {
        staleCalls += 1;
        return jsonResponse({ error: { code: "AUTH_INVALID_TOKEN", message: "expired" } }, 401);
      }
      retryCalls += 1;
      return jsonResponse({ data: { authorization } });
    }));

    const first = apiRequest<{ authorization: string }>("/api/v1/users/me?request=first", {
      portal: "lms",
      signal: new AbortController().signal,
    });
    const second = apiRequest<{ authorization: string }>("/api/v1/users/me?request=second", {
      portal: "lms",
      signal: new AbortController().signal,
    });
    await vi.waitFor(() => expect(staleCalls).toBe(2));
    await vi.waitFor(() => expect(refreshCalls).toBe(1));
    refreshResponse.resolve(jsonResponse({
      data: { accessToken: "fresh-token", refreshToken: "next-refresh-token", expiresIn: 3600 },
    }));

    await expect(Promise.all([first, second])).resolves.toEqual([
      { authorization: "Bearer fresh-token" },
      { authorization: "Bearer fresh-token" },
    ]);
    expect(refreshCalls).toBe(1);
    expect(retryCalls).toBe(2);
    expect(invalidSessionListener).not.toHaveBeenCalled();
    window.removeEventListener(AUTH_SESSION_INVALID_EVENT, invalidSessionListener);
  });

  test("prevents a cancelled late GraphQL response from overwriting fresh cache data", async () => {
    vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
    storeIntegrationSession();
    const queryClient = createTransportIntegrationQueryClient();
    const queryKey = ["integration", "graphql", "stale-response"] as const;
    const staleNetwork = createDeferred<Response>();
    const firstFetchStarted = createDeferred<void>();
    let firstSignal: AbortSignal | undefined;
    let callCount = 0;
    vi.stubGlobal("fetch", vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      callCount += 1;
      if (callCount === 1) {
        firstSignal = init?.signal ?? undefined;
        firstFetchStarted.resolve();
        return staleNetwork.promise;
      }
      return jsonResponse({ data: { lms: { namespace: "fresh" } } });
    }));
    const queryFn = ({ signal }: { signal: AbortSignal }) => graphQlRequest<{ lms: { namespace: string } }>({
      operationName: "IntegrationViewer",
      portal: "lms",
      query: operation,
      signal,
    });

    const staleRequest = queryClient.fetchQuery({ queryKey, queryFn });
    const staleSettled = staleRequest.catch(() => undefined);
    await firstFetchStarted.promise;
    await queryClient.cancelQueries({ queryKey });
    expect(firstSignal?.aborted).toBe(true);
    await expect(queryClient.fetchQuery({ queryKey, queryFn })).resolves.toEqual({ lms: { namespace: "fresh" } });
    staleNetwork.resolve(jsonResponse({ data: { lms: { namespace: "stale" } } }));
    await staleSettled;
    await Promise.resolve();

    expect(queryClient.getQueryData(queryKey)).toEqual({ lms: { namespace: "fresh" } });
    queryClient.clear();
  });
});
