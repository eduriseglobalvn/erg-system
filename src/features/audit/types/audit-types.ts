import type { ApiResponseData } from "@/lib/api/contract-types";

export type AuditOutcome = "SUCCESS" | "FAILURE" | "DENIED" | "PARTIAL";

export type AuditContractPage = ApiResponseData<"/api/v1/audit/events", "get">;
export type AuditContractEntry = NonNullable<AuditContractPage["items"]>[number];

export type AuditEntry = {
  id: string;
  action: string;
  actorId?: string;
  causationId?: string;
  correlationId?: string;
  details: Record<string, unknown>;
  eventHash?: string;
  occurredAt?: string;
  outcome?: AuditOutcome;
  requestId?: string;
  resourceId?: string;
  resourceType?: string;
  retentionUntil?: string;
  scopeId?: string;
  scopeType?: string;
  tenantId?: string;
};

export type AuditPage = {
  hasNext: boolean;
  items: AuditEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type AuditFilters = {
  actorId?: string;
  from?: string;
  outcome?: AuditOutcome;
  page?: number;
  resourceId?: string;
  resourceType?: string;
  size?: number;
  to?: string;
};

export const AUDIT_PAGE_SIZE = 25;
export const AUDIT_MAX_PAGE_SIZE = 100;

export function normalizeAuditFilters(filters: AuditFilters = {}): Required<Pick<AuditFilters, "page" | "size">> & Omit<AuditFilters, "page" | "size"> {
  return {
    ...filters,
    actorId: normalizeOptional(filters.actorId),
    from: normalizeOptional(filters.from),
    page: Math.max(0, Math.floor(filters.page ?? 0)),
    resourceId: normalizeOptional(filters.resourceId),
    resourceType: normalizeOptional(filters.resourceType),
    size: Math.min(AUDIT_MAX_PAGE_SIZE, Math.max(1, Math.floor(filters.size ?? AUDIT_PAGE_SIZE))),
    to: normalizeOptional(filters.to),
  };
}

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}
