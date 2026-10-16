import { describe, expect, test } from "vitest";

import {
  MemoryScopedJsonStore,
  OfflineResourceCache,
} from "@/platform/offline/offline-resource-cache";

const scope = { tenantId: "tenant-a", accountId: "student-a", workspace: "STUDENT" } as const;
const policy = {
  allowedResourceIds: ["resource-a", "resource-b"],
  maxBytes: 8,
  maxItems: 2,
  expiresAt: "2026-08-09T10:00:00.000Z",
};

describe("offline resource cache", () => {
  test("enforces explicit allowlist, expiry and bounded eviction", async () => {
    let now = Date.parse("2026-08-09T08:00:00.000Z");
    const cache = new OfflineResourceCache(new MemoryScopedJsonStore(), () => now);

    await expect(cache.put({
      scope,
      resourceId: "not-approved",
      fileType: "PDF",
      launchMode: "pdf_reader",
      accessState: "open",
      isDownloadable: true,
      bytes: new Uint8Array([1]),
      mimeType: "application/pdf",
      policy,
    })).rejects.toMatchObject({ code: "RESOURCE_NOT_ALLOWED" });

    await cache.put({ ...basePut(scope, "resource-a", [1, 2, 3]), policy });
    await cache.put({ ...basePut(scope, "resource-b", [4, 5, 6]), policy });
    const stored = await cache.list(scope);
    expect(stored.map((entry) => entry.resourceId)).toEqual(["resource-a", "resource-b"]);

    await cache.put({ ...basePut(scope, "resource-a", [7, 8, 9, 10]), policy: { ...policy, maxBytes: 8 } });
    expect((await cache.list(scope)).reduce((sum, item) => sum + item.byteLength, 0)).toBeLessThanOrEqual(8);

    now = Date.parse("2026-08-09T10:00:01.000Z");
    expect(await cache.list(scope)).toEqual([]);
  });

  test("does not persist secure/external resources or URL/token material", async () => {
    const cache = new OfflineResourceCache(new MemoryScopedJsonStore());
    const base = basePut(scope, "resource-a", [1]);

    await expect(cache.put({ ...base, launchMode: "external" })).rejects.toMatchObject({ code: "RESOURCE_NOT_ALLOWED" });
    await expect(cache.put({ ...base, isDownloadable: false })).rejects.toMatchObject({ code: "RESOURCE_NOT_ALLOWED" });
    await expect(cache.put({ ...base, bytes: new Uint8Array(), mimeType: "text/plain", metadata: { accessToken: "never" } })).rejects.toMatchObject({ code: "CREDENTIAL_PAYLOAD" });
  });
});

function basePut(scope: typeof import("@/platform/offline/offline-resource-cache").OfflineResourceScope, resourceId: string, bytes: number[]) {
  return {
    scope,
    resourceId,
    fileType: "PDF" as const,
    launchMode: "pdf_reader" as const,
    accessState: "open" as const,
    isDownloadable: true,
    bytes: new Uint8Array(bytes),
    mimeType: "application/pdf",
  };
}
