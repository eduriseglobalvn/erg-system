import type { AuditEntry } from "@/features/audit/types/audit-types";

const SENSITIVE_KEY = /(access.?token|refresh.?token|id.?token|token|secret|password|authorization|cookie|private.?key|api.?key|client.?secret)/i;

export function maskAuditEntry(entry: AuditEntry): AuditEntry {
  return {
    ...entry,
    actorId: maskIdentifier(entry.actorId),
    causationId: maskIdentifier(entry.causationId),
    correlationId: maskIdentifier(entry.correlationId),
    details: maskAuditDetails(entry.details),
    eventHash: maskIdentifier(entry.eventHash),
    requestId: maskIdentifier(entry.requestId),
    resourceId: maskIdentifier(entry.resourceId),
    scopeId: maskIdentifier(entry.scopeId),
    tenantId: maskIdentifier(entry.tenantId),
  };
}

export function maskAuditDetails(details: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!details) return {};
  return maskValue(details) as Record<string, unknown>;
}

export function maskIdentifier(value?: string) {
  if (!value) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length <= 4) return "•••";
  return `${normalized.slice(0, 2)}…${normalized.slice(-2)}`;
}

function maskValue(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEY.test(key)) return "•••";
  if (Array.isArray(value)) return value.map((item) => maskValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, maskValue(childValue, childKey)]));
  }
  return value;
}

export function auditDetailsToText(details: Record<string, unknown>) {
  return JSON.stringify(maskAuditDetails(details));
}
