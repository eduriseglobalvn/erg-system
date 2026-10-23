import { expect, test } from "vitest";

import { buildAuditCsv } from "@/features/audit/utils/audit-export";
import { maskAuditDetails, maskAuditEntry } from "@/features/audit/utils/audit-masking";
import type { AuditEntry } from "@/features/audit/types/audit-types";

const entry: AuditEntry = {
  action: "UPDATE_SCHOOL",
  actorId: "actor-123456",
  details: {
    email: "admin@erg.edu.vn",
    accessToken: "do-not-export",
    nested: { password: "secret", changed: true },
  },
  id: "event-1234",
  occurredAt: "2026-08-09T10:00:00Z",
  outcome: "SUCCESS",
  resourceId: "school-123456",
  resourceType: "SCHOOL",
  scopeId: "tenant-123456",
  scopeType: "TENANT",
};

test("masks credential-like keys recursively and shortens identifiers", () => {
  const masked = maskAuditEntry(entry);
  expect(masked.actorId).toBe("ac…56");
  expect(masked.details).toEqual({
    email: "admin@erg.edu.vn",
    accessToken: "•••",
    nested: { password: "•••", changed: true },
  });
  expect(maskAuditDetails(undefined)).toEqual({});
});

test("builds a safe CSV with escaped details and no raw credential", () => {
  const csv = buildAuditCsv([entry]);
  expect(csv).toContain("action,actor,outcome,resource,scope,occurredAt,details");
  expect(csv).toContain("UPDATE_SCHOOL");
  expect(csv).not.toContain("do-not-export");
  expect(csv).not.toContain("secret");
  expect(csv).toContain("\"{\"\"email\"\":\"\"admin@erg.edu.vn\"\",\"\"accessToken\"\":\"\"•••\"\"");
});
