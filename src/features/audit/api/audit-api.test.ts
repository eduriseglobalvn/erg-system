import { afterEach, describe, expect, test, vi } from "vitest";

import { apiRequest } from "@/lib/api-client";
import {
  auditQueryKeys,
  downloadAuditExport,
  normalizeAuditEntry,
  normalizeAuditPage,
  serializeAuditFilters,
} from "@/features/audit/api/audit-api";

vi.mock("@/lib/api-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api-client")>()),
  apiRequest: vi.fn(),
}));

afterEach(() => vi.clearAllMocks());

test("serializes only contract-supported filters and clamps the page size", () => {
  expect(serializeAuditFilters({ actorId: " actor-1 ", outcome: "DENIED", page: -2, size: 999, resourceType: "SCHOOL" })).toBe(
    "actorId=actor-1&outcome=DENIED&page=0&size=100&resourceType=SCHOOL",
  );
  expect(serializeAuditFilters({ actorId: "   ", page: 2, size: 25 }, "csv")).toBe("page=2&size=25&format=csv");
});

test("normalizes malformed optional fields without trusting client scope data", () => {
  const page = normalizeAuditPage({ items: [{ action: "UPDATE", details: null, id: "e1", outcome: "NOPE" }], hasNext: undefined });
  expect(page).toMatchObject({ page: 0, size: 1, totalElements: 1, items: [{ id: "e1", action: "UPDATE", details: {}, outcome: undefined }] });
});

test("query keys isolate tenant, account, workspace and selected school scope", () => {
  expect(auditQueryKeys.events("tenant-a", "account-a", "ADMIN", "school-a", { page: 0, size: 25 })).not.toEqual(
    auditQueryKeys.events("tenant-a", "account-a", "ADMIN", "school-b", { page: 0, size: 25 }),
  );
});

test("CSV export uses the audit export endpoint and blob response mode", async () => {
  const blob = new Blob(["action\nUPDATE\n"], { type: "text/csv" });
  vi.mocked(apiRequest).mockResolvedValue(blob);

  await expect(downloadAuditExport({ page: 1, size: 25 })).resolves.toBe(blob);
  expect(apiRequest).toHaveBeenCalledWith(
    "/api/v1/audit/export?page=1&size=25&format=csv",
    expect.objectContaining({ portal: "lcms", responseType: "blob" }),
  );
});

describe("normalizeAuditEntry", () => {
  test("keeps backend outcome values and omits blank identifiers", () => {
    expect(normalizeAuditEntry({ action: "LOGIN", actorId: " ", details: {}, id: "event-1", outcome: "SUCCESS" })).toMatchObject({
      action: "LOGIN",
      id: "event-1",
      outcome: "SUCCESS",
      actorId: undefined,
    });
  });
});
