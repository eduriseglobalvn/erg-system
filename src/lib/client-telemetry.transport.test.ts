import { afterEach, expect, test, vi } from "vitest";

import { apiRequest } from "@/lib/api-client";
import { clearClientTelemetry, getClientTelemetrySnapshot } from "@/lib/client-telemetry";
import { graphQlRequest } from "@/lib/graphql-client";
import {
  jsonResponse,
  resetTransportIntegrationState,
  storeIntegrationSession,
} from "@/test/api-graphql-integration-harness";

afterEach(() => {
  clearClientTelemetry();
  resetTransportIntegrationState();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

test("records one privacy-safe REST success metric", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  storeIntegrationSession();
  vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: { ok: true }, request_id: "req-1" })));

  await apiRequest("/api/v1/users/user-123?email=private@example.test", { portal: "lms" });

  expect(getClientTelemetrySnapshot()).toEqual([
    expect.objectContaining({
      errorCode: undefined,
      kind: "rest",
      method: "GET",
      name: "/api/v1/users/:id",
      outcome: "success",
      portal: "lms",
      requestId: "req-1",
    }),
  ]);
  expect(JSON.stringify(getClientTelemetrySnapshot())).not.toContain("private@example.test");
});

test("records REST errors and caller cancellation as distinct outcomes", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  storeIntegrationSession();
  vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: { code: "FORBIDDEN", message: "denied" } }, 403)));
  await expect(apiRequest("/api/v1/users/user-123", { portal: "lms" })).rejects.toMatchObject({ code: "FORBIDDEN" });

  const controller = new AbortController();
  const reason = new Error("route changed");
  vi.stubGlobal("fetch", vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), { once: true });
  })));
  const cancelled = apiRequest("/api/v1/users/user-456", { portal: "lms", signal: controller.signal });
  await vi.waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledOnce());
  controller.abort(reason);
  await expect(cancelled).rejects.toBe(reason);

  expect(getClientTelemetrySnapshot().map((event) => event.outcome)).toEqual(["error", "cancelled"]);
});

test("records GraphQL by operation name without a duplicate REST metric", async () => {
  vi.stubEnv("VITE_API_BASE", "https://api.erg.test");
  storeIntegrationSession();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({
    data: { lms: { namespace: "lms" } },
    errors: [{ message: "optional field denied" }],
  })));

  await graphQlRequest({
    errorPolicy: "allow-partial",
    operationName: "LmsTelemetryViewer",
    portal: "lms",
    query: "query LmsTelemetryViewer { lms { namespace } }",
    variables: { search: "private learner name" },
  });

  expect(getClientTelemetrySnapshot()).toEqual([
    expect.objectContaining({
      kind: "graphql",
      name: "LmsTelemetryViewer",
      outcome: "partial",
      portal: "lms",
    }),
  ]);
  expect(JSON.stringify(getClientTelemetrySnapshot())).not.toContain("private learner name");
});
