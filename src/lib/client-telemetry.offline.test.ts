import { afterEach, describe, expect, it } from "vitest";

import {
  clearClientTelemetry,
  getClientTelemetrySnapshot,
  recordOfflineShellTelemetry,
  setClientTelemetrySink,
} from "@/lib/client-telemetry";

afterEach(() => {
  clearClientTelemetry();
  setClientTelemetrySink(null);
});

describe("offline shell telemetry", () => {
  it("records bounded network and queue metadata without request payloads", () => {
    recordOfflineShellTelemetry({
      conflictCount: 9999,
      networkQuality: "offline",
      pendingCount: 9999,
      state: "offline",
      timestamp: 123,
    });

    expect(getClientTelemetrySnapshot()).toEqual([expect.objectContaining({
      conflictCount: 500,
      kind: "offline-shell",
      name: "offline-shell",
      networkQuality: "offline",
      outcome: "success",
      pendingCount: 500,
      timestamp: 123,
    })]);
    expect(JSON.stringify(getClientTelemetrySnapshot())).not.toContain("token");
  });

  it("normalizes unsupported shell labels to safe defaults", () => {
    recordOfflineShellTelemetry({
      networkQuality: "not-a-quality" as never,
      state: "not-a-state" as never,
      timestamp: Number.NaN,
    });

    expect(getClientTelemetrySnapshot()[0]).toMatchObject({
      kind: "offline-shell",
      networkQuality: "online",
      outcome: "success",
      timestamp: expect.any(Number),
    });
  });
});
