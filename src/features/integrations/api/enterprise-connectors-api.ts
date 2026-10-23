import type { components } from "@/lib/api/generated/erg-openapi";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type { ApiResponseData } from "@/lib/api/contract-types";
import { apiRequest } from "@/lib/api-client";

export type EnterpriseConnectorsPortal = "lcms";
export type EnterpriseConnectorProviderKind = "SIS" | "HRIS" | "SCIM";
export type EnterpriseConnectorStatus = "ACTIVE" | "DISABLED";
export type EnterpriseConnectorRunMode = "DRY_RUN" | "SYNC" | "RETRY" | "DEPROVISION";
export type EnterpriseConnectorRunStatus = "PREVIEW" | "SUCCEEDED" | "FAILED" | "RETRYABLE_FAILED" | "DEPROVISIONED";

export type EnterpriseConnectorResponse = components["schemas"]["ConnectorResponse"];
export type RegisterEnterpriseConnectorInput = components["schemas"]["RegisterConnectorRequest"];
export type EnterpriseConnectorRunInput = components["schemas"]["RunRequest"];
export type EnterpriseConnectorRetryInput = components["schemas"]["RetryRequest"];
export type EnterpriseConnectorDeprovisionInput = components["schemas"]["DeprovisionRequest"];

type ConnectorListResponse = ApiResponseData<"/api/v1/enterprise-connectors", "get">;
type ConnectorResponseData = ApiResponseData<"/api/v1/enterprise-connectors/{connectorId}", "get">;
type ConnectorRegisterResponse = ApiResponseData<"/api/v1/enterprise-connectors", "post">;
type DryRunResponse = ApiResponseData<"/api/v1/enterprise-connectors/{connectorId}/dry-run", "post">;
type SyncResponse = ApiResponseData<"/api/v1/enterprise-connectors/{connectorId}/sync", "post">;
type RetryResponse = ApiResponseData<"/api/v1/enterprise-connectors/{connectorId}/runs/{runId}/retry", "post">;
type DeprovisionResponse = ApiResponseData<"/api/v1/enterprise-connectors/{connectorId}/deprovision", "post">;

export type EnterpriseConnectorsRequestContext = {
  portal?: EnterpriseConnectorsPortal;
  signal?: AbortSignal;
};

export type EnterpriseConnector = {
  id: string;
  tenantId?: string;
  providerKind: EnterpriseConnectorProviderKind | string;
  adapterKey: string;
  providerKey: string;
  displayName: string;
  endpoint?: string;
  secretConfigured: boolean;
  mappingVersion: string;
  mappingHash: string;
  status: EnterpriseConnectorStatus;
  recordVersion: number;
  createdAt?: string;
  updatedAt?: string;
};

export type EnterpriseConnectorSyncPreview = {
  connectorId: string;
  runId: string;
  mode: EnterpriseConnectorRunMode;
  additions: number;
  updates: number;
  removals: number;
  total: number;
  sampleExternalIds: string[];
  status: EnterpriseConnectorRunStatus;
  recordVersion: number;
  createdAt?: string;
};

export type EnterpriseConnectorSyncRun = {
  connectorId: string;
  runId: string;
  mode: EnterpriseConnectorRunMode;
  processed: number;
  created: number;
  updated: number;
  failed: number;
  retryCount: number;
  status: EnterpriseConnectorRunStatus;
  errorCode?: string;
  recordVersion: number;
  createdAt?: string;
  updatedAt?: string;
};

export type EnterpriseConnectorDeprovisionRun = {
  connectorId: string;
  runId: string;
  requested: number;
  deprovisioned: number;
  skipped: number;
  status: EnterpriseConnectorRunStatus;
  recordVersion: number;
  createdAt?: string;
};

export const enterpriseConnectorsQueryKeys = {
  root: (tenantId: string, accountId: string, workspace: string) =>
    ["enterprise-connectors", tenantId, accountId, workspace] as const,
  connectors: (tenantId: string, accountId: string, workspace: string) =>
    [...enterpriseConnectorsQueryKeys.root(tenantId, accountId, workspace), "connectors"] as const,
  connector: (tenantId: string, accountId: string, workspace: string, connectorId: string) =>
    [...enterpriseConnectorsQueryKeys.root(tenantId, accountId, workspace), "connector", connectorId] as const,
};

export async function listEnterpriseConnectors(context: EnterpriseConnectorsRequestContext = {}): Promise<EnterpriseConnector[]> {
  const response = await apiRequest<ConnectorListResponse>(API_ENDPOINTS.enterpriseConnectors.root, {
    portal: context.portal ?? "lcms",
    auth: "required",
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return (response ?? []).map(normalizeConnector).filter(isDefined);
}

export async function getEnterpriseConnector(connectorId: string, context: EnterpriseConnectorsRequestContext = {}): Promise<EnterpriseConnector> {
  const id = requiredId(connectorId, "connectorId");
  const response = await apiRequest<ConnectorResponseData>(API_ENDPOINTS.enterpriseConnectors.connector(id), {
    portal: context.portal ?? "lcms",
    auth: "required",
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeConnector(response) : undefined, "get enterprise connector");
}

export async function registerEnterpriseConnector(
  input: RegisterEnterpriseConnectorInput,
  idempotencyKey: string,
  context: EnterpriseConnectorsRequestContext = {},
): Promise<EnterpriseConnector> {
  const response = await apiRequest<ConnectorRegisterResponse>(API_ENDPOINTS.enterpriseConnectors.root, {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeConnector(response) : undefined, "register enterprise connector");
}

export async function dryRunEnterpriseConnector(
  connectorId: string,
  input: EnterpriseConnectorRunInput,
  idempotencyKey: string,
  context: EnterpriseConnectorsRequestContext = {},
): Promise<EnterpriseConnectorSyncPreview> {
  const id = requiredId(connectorId, "connectorId");
  const response = await apiRequest<DryRunResponse>(API_ENDPOINTS.enterpriseConnectors.dryRun(id), {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizePreview(response) : undefined, "dry-run enterprise connector");
}

export async function syncEnterpriseConnector(
  connectorId: string,
  input: EnterpriseConnectorRunInput,
  idempotencyKey: string,
  context: EnterpriseConnectorsRequestContext = {},
): Promise<EnterpriseConnectorSyncRun> {
  const id = requiredId(connectorId, "connectorId");
  const response = await apiRequest<SyncResponse>(API_ENDPOINTS.enterpriseConnectors.sync(id), {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeSyncRun(response) : undefined, "sync enterprise connector");
}

export async function retryEnterpriseConnector(
  connectorId: string,
  runId: string,
  input: EnterpriseConnectorRetryInput,
  idempotencyKey: string,
  context: EnterpriseConnectorsRequestContext = {},
): Promise<EnterpriseConnectorSyncRun> {
  const connector = requiredId(connectorId, "connectorId");
  const run = requiredId(runId, "runId");
  const response = await apiRequest<RetryResponse>(API_ENDPOINTS.enterpriseConnectors.retry(connector, run), {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeSyncRun(response) : undefined, "retry enterprise connector");
}

export async function deprovisionEnterpriseConnector(
  connectorId: string,
  input: EnterpriseConnectorDeprovisionInput,
  idempotencyKey: string,
  context: EnterpriseConnectorsRequestContext = {},
): Promise<EnterpriseConnectorDeprovisionRun> {
  const id = requiredId(connectorId, "connectorId");
  const response = await apiRequest<DeprovisionResponse>(API_ENDPOINTS.enterpriseConnectors.deprovision(id), {
    method: "POST",
    portal: context.portal ?? "lcms",
    auth: "required",
    body: JSON.stringify(input),
    headers: idempotencyHeaders(idempotencyKey),
    ...(context.signal ? { signal: context.signal } : {}),
  });
  return requiredRecord(response ? normalizeDeprovision(response) : undefined, "deprovision enterprise connector");
}

function normalizeConnector(value: EnterpriseConnectorResponse): EnterpriseConnector | undefined {
  const id = value.id?.trim();
  if (!id) return undefined;
  return {
    id,
    tenantId: value.tenantId?.trim() || undefined,
    providerKind: value.providerKind?.trim().toUpperCase() || "UNKNOWN",
    adapterKey: value.adapterKey?.trim().toUpperCase() || "-",
    providerKey: value.providerKey?.trim() || "-",
    displayName: value.displayName?.trim() || "Connector chưa đặt tên",
    endpoint: safeEndpoint(value.endpoint),
    secretConfigured: Boolean(value.secretRef?.trim().startsWith("secret://")),
    mappingVersion: value.mappingVersion?.trim() || "-",
    mappingHash: value.mappingHash?.trim().toLowerCase() || "-",
    status: normalizeConnectorStatus(value.status),
    recordVersion: finiteNumber(value.recordVersion),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function normalizePreview(value: NonNullable<DryRunResponse>): EnterpriseConnectorSyncPreview | undefined {
  const connectorId = value.connectorId?.trim();
  const runId = value.runId?.trim();
  if (!connectorId || !runId) return undefined;
  return {
    connectorId,
    runId,
    mode: normalizeRunMode(value.mode),
    additions: finiteNumber(value.additions),
    updates: finiteNumber(value.updates),
    removals: finiteNumber(value.removals),
    total: finiteNumber(value.total),
    sampleExternalIds: normalizeSamples(value.sampleExternalIds),
    status: normalizeRunStatus(value.status),
    recordVersion: finiteNumber(value.recordVersion),
    createdAt: value.createdAt,
  };
}

function normalizeSyncRun(value: NonNullable<SyncResponse> | NonNullable<RetryResponse>): EnterpriseConnectorSyncRun | undefined {
  const connectorId = value.connectorId?.trim();
  const runId = value.runId?.trim();
  if (!connectorId || !runId) return undefined;
  return {
    connectorId,
    runId,
    mode: normalizeRunMode(value.mode),
    processed: finiteNumber(value.processed),
    created: finiteNumber(value.created),
    updated: finiteNumber(value.updated),
    failed: finiteNumber(value.failed),
    retryCount: finiteNumber(value.retryCount),
    status: normalizeRunStatus(value.status),
    errorCode: value.errorCode?.trim() || undefined,
    recordVersion: finiteNumber(value.recordVersion),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function normalizeDeprovision(value: NonNullable<DeprovisionResponse>): EnterpriseConnectorDeprovisionRun | undefined {
  const connectorId = value.connectorId?.trim();
  const runId = value.runId?.trim();
  if (!connectorId || !runId) return undefined;
  return {
    connectorId,
    runId,
    requested: finiteNumber(value.requested),
    deprovisioned: finiteNumber(value.deprovisioned),
    skipped: finiteNumber(value.skipped),
    status: normalizeRunStatus(value.status),
    recordVersion: finiteNumber(value.recordVersion),
    createdAt: value.createdAt,
  };
}

function normalizeConnectorStatus(value: string | undefined): EnterpriseConnectorStatus {
  return value?.trim().toUpperCase() === "ACTIVE" ? "ACTIVE" : "DISABLED";
}

function normalizeRunMode(value: string | undefined): EnterpriseConnectorRunMode {
  const mode = value?.trim().toUpperCase();
  return mode === "SYNC" || mode === "RETRY" || mode === "DEPROVISION" ? mode : "DRY_RUN";
}

function normalizeRunStatus(value: string | undefined): EnterpriseConnectorRunStatus {
  const status = value?.trim().toUpperCase();
  return status === "SUCCEEDED" || status === "FAILED" || status === "RETRYABLE_FAILED" || status === "DEPROVISIONED"
    ? status
    : "PREVIEW";
}

function normalizeSamples(value: readonly string[] | undefined) {
  return (value ?? []).map((item) => item?.trim()).filter((item): item is string => Boolean(item)).slice(0, 20);
}

function safeEndpoint(value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) return undefined;
    return (url.origin + url.pathname).replace(/\/+$/, "") || url.origin;
  } catch {
    return normalized.replace(/[?#].*$/, "");
  }
}

function idempotencyHeaders(idempotencyKey: string): HeadersInit {
  const value = idempotencyKey.trim();
  if (!value) throw new Error("idempotencyKey is required for enterprise connector commands.");
  return { "X-Idempotency-Key": value };
}

function requiredId(value: string, label: string) {
  const id = value.trim();
  if (!id) throw new Error(label + " is required.");
  return id;
}

function requiredRecord<T>(value: T | undefined, operation: string): T {
  if (!value) throw new Error(operation + " response is missing data.");
  return value;
}

function finiteNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
