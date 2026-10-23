import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock("@/lib/api-client", () => ({ apiRequest }));

import {
  deprovisionEnterpriseConnector,
  dryRunEnterpriseConnector,
  enterpriseConnectorsQueryKeys,
  listEnterpriseConnectors,
  registerEnterpriseConnector,
  retryEnterpriseConnector,
  syncEnterpriseConnector,
} from "@/features/integrations/api/enterprise-connectors-api";

describe("enterprise connectors REST adapter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes connector metadata and drops secret contents", async () => {
    apiRequest.mockResolvedValueOnce([
      {
        id: "connector-1",
        tenantId: "tenant-a",
        providerKind: "sis",
        adapterKey: "reference-sis",
        providerKey: "sis-main",
        displayName: " SIS chÃ­nh ",
        endpoint: "https://sis.example.test/api?token=do-not-display",
        secretRef: "secret://vault/sis-main",
        mappingVersion: "2026.1",
        mappingHash: "A".repeat(64),
        status: "active",
        recordVersion: 3,
      },
      { displayName: "missing-id" },
    ]);

    await expect(listEnterpriseConnectors()).resolves.toEqual([
      expect.objectContaining({
        id: "connector-1",
        providerKind: "SIS",
        endpoint: "https://sis.example.test/api",
        secretConfigured: true,
        status: "ACTIVE",
      }),
    ]);
    expect(apiRequest).toHaveBeenCalledWith(
      "/api/v1/enterprise-connectors",
      expect.objectContaining({ portal: "lcms", auth: "required" }),
    );
  });

  it("registers a connector with server-side secret reference and idempotency", async () => {
    apiRequest.mockResolvedValueOnce({
      id: "connector-1",
      providerKind: "SCIM",
      adapterKey: "reference-scim",
      providerKey: "scim-main",
      displayName: "SCIM",
      secretRef: "secret://vault/scim-main",
      mappingVersion: "1",
      mappingHash: "b".repeat(64),
      status: "ACTIVE",
      recordVersion: 1,
    });

    await registerEnterpriseConnector({
      providerKind: "SCIM",
      adapterKey: "reference-scim",
      providerKey: "scim-main",
      displayName: "SCIM",
      secretRef: "secret://vault/scim-main",
      endpoint: "https://scim.example.test/v2",
      mappingVersion: "1",
      fieldMapping: { externalId: "externalId", email: "email" },
    }, "register-key");

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/v1/enterprise-connectors",
      expect.objectContaining({ method: "POST", headers: { "X-Idempotency-Key": "register-key" } }),
    );
    expect(JSON.parse(apiRequest.mock.calls[0][1].body)).toEqual(expect.objectContaining({ secretRef: "secret://vault/scim-main" }));
  });

  it("preserves expected version and idempotency for dry-run, sync, retry and deprovision", async () => {
    apiRequest.mockResolvedValueOnce({ connectorId: "c1", runId: "r1", mode: "DRY_RUN", additions: 2, updates: 1, removals: 0, total: 3, sampleExternalIds: ["u1"], status: "PREVIEW", recordVersion: 1 });
    await expect(dryRunEnterpriseConnector("c1", { expectedVersion: 4, cursor: "next" }, "dry-key")).resolves.toMatchObject({ runId: "r1", total: 3 });
    expect(JSON.parse(apiRequest.mock.calls[0][1].body)).toEqual({ expectedVersion: 4, cursor: "next" });

    apiRequest.mockResolvedValueOnce({ connectorId: "c1", runId: "r2", mode: "SYNC", processed: 3, created: 2, updated: 1, failed: 0, retryCount: 0, status: "SUCCEEDED", recordVersion: 2 });
    await syncEnterpriseConnector("c1", { expectedVersion: 5 }, "sync-key");
    expect(apiRequest.mock.calls[1][0]).toBe("/api/v1/enterprise-connectors/c1/sync");

    apiRequest.mockResolvedValueOnce({ connectorId: "c1", runId: "r2", mode: "RETRY", processed: 3, created: 2, updated: 1, failed: 0, retryCount: 1, status: "SUCCEEDED", recordVersion: 3 });
    await retryEnterpriseConnector("c1", "r2", { expectedVersion: 2 }, "retry-key");
    expect(apiRequest.mock.calls[2][0]).toBe("/api/v1/enterprise-connectors/c1/runs/r2/retry");

    apiRequest.mockResolvedValueOnce({ connectorId: "c1", runId: "r3", requested: 2, deprovisioned: 2, skipped: 0, status: "DEPROVISIONED", recordVersion: 4 });
    await deprovisionEnterpriseConnector("c1", { expectedVersion: 3, externalIds: ["u1", "u2"], reason: "offboarding" }, "deprovision-key");
    expect(JSON.parse(apiRequest.mock.calls[3][1].body)).toEqual({ expectedVersion: 3, externalIds: ["u1", "u2"], reason: "offboarding" });
  });

  it("rejects commands with missing ids or idempotency keys", async () => {
    await expect(syncEnterpriseConnector("  ", { expectedVersion: 0 }, "key")).rejects.toThrow("connectorId");
    await expect(dryRunEnterpriseConnector("c1", { expectedVersion: 0 }, "  ")).rejects.toThrow("idempotencyKey");
  });

  it("scopes query keys by tenant, account and workspace", () => {
    expect(enterpriseConnectorsQueryKeys.connectors("tenant-a", "admin-a", "ADMIN")).toEqual([
      "enterprise-connectors", "tenant-a", "admin-a", "ADMIN", "connectors",
    ]);
    expect(enterpriseConnectorsQueryKeys.connector("tenant-a", "admin-a", "ADMIN", "c1")).toEqual([
      "enterprise-connectors", "tenant-a", "admin-a", "ADMIN", "connector", "c1",
    ]);
  });
});
