import { afterEach, expect, test, vi } from "vitest";

import { ApiClientError } from "@/lib/api-client";
import {
  CLIENT_TELEMETRY_MAX_EVENTS,
  classifyClientTelemetryOutcome,
  clearClientTelemetry,
  getClientTelemetrySnapshot,
  normalizeTelemetryEndpoint,
  recordClientTelemetry,
  setClientTelemetrySink,
  summarizeClientTelemetry,
} from "@/lib/client-telemetry";

afterEach(() => {
  clearClientTelemetry();
  setClientTelemetrySink(null);
  vi.restoreAllMocks();
});

test("normalizes dynamic REST paths and removes query values", () => {
  expect(normalizeTelemetryEndpoint("/api/v1/users/user-123/sessions?token=secret&email=a@b.test")).toBe(
    "/api/v1/users/:id/sessions",
  );
  expect(normalizeTelemetryEndpoint("/api/v1/lms/quizzes/quiz%2Fprivate/package")).toBe(
    "/api/v1/lms/quizzes/:id/package",
  );
});

test("retains only allowlisted fields in a bounded snapshot", () => {
  for (let index = 0; index < CLIENT_TELEMETRY_MAX_EVENTS + 5; index += 1) {
    recordClientTelemetry({
      durationMs: index,
      kind: "rest",
      method: "GET",
      name: "/api/v1/users/:id",
      outcome: "success",
      portal: "lms",
      timestamp: index,
      rawUrl: "?token=secret",
      variables: { password: "secret" },
    } as never);
  }

  const snapshot = getClientTelemetrySnapshot();
  expect(snapshot).toHaveLength(CLIENT_TELEMETRY_MAX_EVENTS);
  expect(snapshot[0]?.timestamp).toBe(5);
  expect(JSON.stringify(snapshot)).not.toContain("secret");
  expect(snapshot[0]).not.toHaveProperty("rawUrl");
  expect(snapshot[0]).not.toHaveProperty("variables");
});

test("isolates application flows from telemetry sink failures", async () => {
  setClientTelemetrySink(() => Promise.reject(new Error("collector unavailable")));

  expect(() => recordClientTelemetry({
    durationMs: 12,
    kind: "graphql",
    name: "LmsViewer",
    outcome: "success",
    portal: "lms",
    timestamp: 1,
  })).not.toThrow();
  await Promise.resolve();

  expect(getClientTelemetrySnapshot()).toHaveLength(1);
});

test("classifies timeout and cancellation without treating them as application errors", () => {
  expect(classifyClientTelemetryOutcome(new ApiClientError("timed out", "REQUEST_TIMEOUT", 408))).toBe("timeout");
  const controller = new AbortController();
  controller.abort(new Error("navigation changed"));
  expect(classifyClientTelemetryOutcome(controller.signal.reason, controller.signal)).toBe("cancelled");
  expect(classifyClientTelemetryOutcome(new ApiClientError("denied", "FORBIDDEN", 403))).toBe("error");
});

test("aggregates bounded endpoint metrics for error-rate and latency dashboards", () => {
  for (const [durationMs, outcome] of [[10, "success"], [20, "success"], [40, "error"], [80, "timeout"]] as const) {
    recordClientTelemetry({
      durationMs,
      kind: "rest",
      method: "GET",
      name: "/api/v1/users/:id",
      outcome,
      portal: "lms",
      timestamp: 1,
    });
  }

  expect(summarizeClientTelemetry()).toEqual([{
    averageDurationMs: 37.5,
    cancelledCount: 0,
    errorCount: 2,
    errorRate: 0.5,
    kind: "rest",
    method: "GET",
    name: "/api/v1/users/:id",
    p95DurationMs: 80,
    partialCount: 0,
    portal: "lms",
    requestCount: 4,
  }]);
});
