import { ApiClientError, apiRequest } from "@/lib/api-client";
import type { StoredAuthSession } from "@/platform/auth/api/auth-token-storage";

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
  operationName: string;
  portal: GraphQlPortal;
  query: string;
  tenantId?: string;
  variables?: TVariables;
};

const sensitiveVariableKeys = ["authorization", "credential", "password", "secret", "token"];

export async function graphQlRequest<TData, TVariables extends Record<string, unknown> = Record<string, never>>({
  operationName,
  portal,
  query,
  tenantId = getDefaultTenantId(),
  variables,
}: GraphQlRequestInput<TVariables>): Promise<TData> {
  if (!operationName.trim()) {
    throw new ApiClientError("GraphQL operationName is required.", "GRAPHQL_OPERATION_NAME_MISSING", 400);
  }

  assertSafeVariables(variables);

  const payload = await apiRequest<GraphQlResponse<TData>>("/api/v1/graphql", {
    body: JSON.stringify({
      operationName,
      query,
      variables: variables ?? {},
    }),
    method: "POST",
    portal,
    unwrapEnvelope: false,
    headers: {
      "X-Tenant-ID": tenantId,
      "X-Portal": portal,
    },
  });

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
    console.warn(`GraphQL partial response for ${operationName}:`, payload.errors);
  }

  return payload.data;
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
