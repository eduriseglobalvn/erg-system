import { ApiClientError, apiRequest, getApiResponseRequestId, inheritApiResponseRequestId } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import {
  readStoredAuthSession,
  type StoredAuthSession,
} from "@/platform/auth/api/auth-token-storage";
import {
  classifyClientTelemetryOutcome,
  clientTelemetryNow,
  normalizeGraphQlOperationName,
  recordClientTelemetry,
} from "@/lib/client-telemetry";

export type GraphQlPortal = Extract<NonNullable<StoredAuthSession["portal"]>, "crm" | "elearning" | "lcms" | "lms">;

export type GraphQlPage<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

type GraphQlResponse<TData> = {
  data?: TData;
  errors?: GraphQlErrorBody[];
};

type GraphQlErrorBody = {
  message: string;
  path?: Array<number | string>;
  extensions?: Record<string, unknown>;
};

type GraphQlRequestInput<TVariables extends Record<string, unknown>> = {
  errorPolicy?: "allow-partial" | "throw";
  operationName: string;
  portal: GraphQlPortal;
  query: string;
  signal?: AbortSignal;
  tenantId?: string;
  variables?: TVariables;
};

const sensitiveVariableKeys = ["authorization", "credential", "password", "secret", "token"];

export async function graphQlRequest<TData, TVariables extends Record<string, unknown> = Record<string, never>>({
  ...input
}: GraphQlRequestInput<TVariables>): Promise<TData> {
  const startedAt = clientTelemetryNow();
  try {
    const result = await performGraphQlRequest<TData, TVariables>(input);
    recordClientTelemetry({
      durationMs: clientTelemetryNow() - startedAt,
      errorCode: result.partial ? "GRAPHQL_PARTIAL_ERROR" : undefined,
      kind: "graphql",
      name: normalizeGraphQlOperationName(input.operationName),
      outcome: result.partial ? "partial" : "success",
      portal: input.portal,
      requestId: getApiResponseRequestId(result.data),
      status: 200,
      timestamp: Date.now(),
    });
    return result.data;
  } catch (error) {
    recordClientTelemetry({
      durationMs: clientTelemetryNow() - startedAt,
      errorCode: error instanceof ApiClientError ? error.code : undefined,
      kind: "graphql",
      name: normalizeGraphQlOperationName(input.operationName),
      outcome: classifyClientTelemetryOutcome(error, input.signal),
      portal: input.portal,
      requestId: error instanceof ApiClientError ? error.requestId : undefined,
      status: error instanceof ApiClientError ? error.status : undefined,
      timestamp: Date.now(),
    });
    throw error;
  }
}

async function performGraphQlRequest<TData, TVariables extends Record<string, unknown> = Record<string, never>>({
  errorPolicy = "throw",
  operationName,
  portal,
  query,
  signal,
  tenantId,
  variables,
}: GraphQlRequestInput<TVariables>): Promise<{ data: TData; partial: boolean }> {
  if (!operationName.trim()) {
    throw new ApiClientError("GraphQL operationName is required.", "GRAPHQL_OPERATION_NAME_MISSING", 400);
  }

  assertSafeVariables(variables);

  // X-Tenant-ID: backend không còn đọc từ client để authz (A1)
  // - tenantId lấy từ session đã đăng nhập
  // - Nếu FE gửi X-Tenant-ID mà khác tenant của session → 403
  // → FE nên bỏ gửi X-Tenant-ID tới GraphQL, hoặc đảm bảo nó khớp session
  // X-Portal: backend suy ra từ URL path, không cần gửi nữa
  assertTenantMatchesSession(portal, tenantId);
  const payload = await apiRequest<GraphQlResponse<TData>>(API_ENDPOINTS.graphql, {
    body: JSON.stringify({
      operationName,
      query,
      variables: variables ?? {},
    }),
    method: "POST",
    portal,
    signal,
    unwrapEnvelope: false,
    // headers: {
    //   "X-Tenant-ID": tenantId,
    //   "X-Portal": portal,
    // },
  });

  if (payload.errors?.length && errorPolicy === "throw") {
    throw new ApiClientError(
      payload.errors.map((error) => error.message).join("; "),
      payload.data ? "GRAPHQL_PARTIAL_ERROR" : "GRAPHQL_ERROR",
      200,
      payload.errors,
    );
  }

  if (!payload.data) {
    if (payload.errors?.length) {
      throw new ApiClientError(
        payload.errors.map((error) => error.message).join("; "),
        "GRAPHQL_ERROR",
        200,
      );
    }
    throw new ApiClientError("GraphQL response missing data.", "GRAPHQL_DATA_MISSING", 200);
  }

  if (payload.errors?.length) {
    console.warn(`GraphQL partial response for ${operationName}: ${payload.errors.length} error(s).`);
  }

  return {
    data: inheritApiResponseRequestId(payload.data, payload),
    partial: Boolean(payload.errors?.length),
  };
}

function assertTenantMatchesSession(portal: GraphQlPortal, requestedTenantId?: string) {
  const requested = requestedTenantId?.trim();
  const authenticated = readStoredAuthSession(portal)?.tenantId?.trim();
  if (!requested || !authenticated || requested === authenticated) return;

  throw new ApiClientError(
    "GraphQL tenant does not match the authenticated session.",
    "GRAPHQL_TENANT_MISMATCH",
    403,
  );
}

export function getDefaultTenantId() {
  return import.meta.env.VITE_TENANT_ID?.trim() || "erg";
}

function assertSafeVariables(value: unknown, path: string[] = []) {
  if (!value || typeof value !== "object") return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeVariables(item, [...path, String(index)]));
    return;
  }

  Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
    const normalizedKey = key.trim().toLowerCase();
    if (sensitiveVariableKeys.some((sensitiveKey) => normalizedKey.includes(sensitiveKey))) {
      throw new ApiClientError(`GraphQL variables cannot include sensitive key "${[...path, key].join(".")}".`, "GRAPHQL_SENSITIVE_VARIABLE", 400);
    }

    assertSafeVariables(child, [...path, key]);
  });
}
