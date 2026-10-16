import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import { apiRequest } from "@/lib/api-client";
import { isObject, validateResponse } from "@/lib/validate-response";
import {
  AUDIT_MAX_PAGE_SIZE,
  normalizeAuditFilters,
  type AuditContractEntry,
  type AuditContractPage,
  type AuditEntry,
  type AuditFilters,
  type AuditOutcome,
  type AuditPage,
} from "@/features/audit/types/audit-types";

export const auditQueryKeys = {
  root: (tenantId: string, accountId: string, workspace: string, scopeId?: string) =>
    ["audit", tenantId, accountId, workspace, scopeId ?? "all"] as const,
  events: (tenantId: string, accountId: string, workspace: string, scopeId: string | undefined, filters: AuditFilters) =>
    [...auditQueryKeys.root(tenantId, accountId, workspace, scopeId), "events", normalizeAuditFilters(filters)] as const,
};

export async function listAuditEvents(filters: AuditFilters = {}, signal?: AbortSignal): Promise<AuditPage> {
  const query = serializeAuditFilters(filters);
  const response = await apiRequest<AuditContractPage>(`${API_ENDPOINTS.audit.events}?${query}`, {
    portal: "lcms",
    ...(signal ? { signal } : {}),
  });

  return normalizeAuditPage(
    validateResponse(response, isAuditPage, "audit.events"),
  );
}

export async function downloadAuditExport(filters: AuditFilters = {}, signal?: AbortSignal): Promise<Blob> {
  const query = serializeAuditFilters({ ...filters, size: Math.min(filters.size ?? AUDIT_MAX_PAGE_SIZE, AUDIT_MAX_PAGE_SIZE) }, "csv");
  return apiRequest<Blob>(`${API_ENDPOINTS.audit.export}?${query}`, {
    portal: "lcms",
    responseType: "blob",
    ...(signal ? { signal } : {}),
  });
}

export function serializeAuditFilters(filters: AuditFilters = {}, format?: "json" | "csv") {
  const normalized = normalizeAuditFilters(filters);
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(normalized)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  if (format) search.set("format", format);
  return search.toString();
}

export function normalizeAuditPage(value: AuditContractPage): AuditPage {
  const items = Array.isArray(value.items) ? value.items.map(normalizeAuditEntry) : [];
  return {
    hasNext: Boolean(value.hasNext),
    items,
    page: Number.isFinite(value.page) ? Number(value.page) : 0,
    size: Number.isFinite(value.size) ? Number(value.size) : items.length,
    totalElements: Number.isFinite(value.totalElements) ? Number(value.totalElements) : items.length,
    totalPages: Number.isFinite(value.totalPages) ? Number(value.totalPages) : (items.length ? 1 : 0),
  };
}

export function normalizeAuditEntry(value: AuditContractEntry): AuditEntry {
  return {
    action: value.action?.trim() || "UNKNOWN_ACTION",
    actorId: value.actorId?.trim() || undefined,
    causationId: value.causationId?.trim() || undefined,
    correlationId: value.correlationId?.trim() || undefined,
    details: isObject(value.details) ? value.details : {},
    eventHash: value.eventHash?.trim() || undefined,
    id: value.id?.trim() || `${value.occurredAt ?? "event"}-${value.action ?? "unknown"}`,
    occurredAt: value.occurredAt,
    outcome: isAuditOutcome(value.outcome) ? value.outcome : undefined,
    requestId: value.requestId?.trim() || undefined,
    resourceId: value.resourceId?.trim() || undefined,
    resourceType: value.resourceType?.trim() || undefined,
    retentionUntil: value.retentionUntil,
    scopeId: value.scopeId?.trim() || undefined,
    scopeType: value.scopeType?.trim() || undefined,
    tenantId: value.tenantId?.trim() || undefined,
  };
}

function isAuditPage(value: unknown): value is AuditContractPage {
  return isObject(value) && (value.items === undefined || Array.isArray(value.items));
}

function isAuditOutcome(value: unknown): value is AuditOutcome {
  return value === "SUCCESS" || value === "FAILURE" || value === "DENIED" || value === "PARTIAL";
}
