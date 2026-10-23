import { getDefaultTenantId } from "@/lib/graphql-client";

export function withDefaultTenant<T extends { tenantId?: string }>(input: T): T {
  return { ...input, tenantId: input.tenantId ?? getDefaultTenantId() };
}

export function createClientIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `calendar-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
