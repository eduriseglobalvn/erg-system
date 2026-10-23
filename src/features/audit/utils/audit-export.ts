import type { AuditEntry } from "@/features/audit/types/audit-types";
import { auditDetailsToText, maskAuditEntry } from "@/features/audit/utils/audit-masking";

const HEADERS = ["action", "actor", "outcome", "resource", "scope", "occurredAt", "details"] as const;

export function buildAuditCsv(entries: AuditEntry[]) {
  const rows = [HEADERS.map(csvCell).join(",")];
  for (const entry of entries) {
    const safe = maskAuditEntry(entry);
    rows.push([
      safe.action,
      safe.actorId,
      safe.outcome,
      [safe.resourceType, safe.resourceId].filter(Boolean).join(":"),
      [safe.scopeType, safe.scopeId].filter(Boolean).join(":"),
      safe.occurredAt,
      auditDetailsToText(safe.details),
    ].map(csvCell).join(","));
  }
  return `\uFEFF${rows.join("\r\n")}\r\n`;
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
