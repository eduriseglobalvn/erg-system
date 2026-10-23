import { describe, expect, it } from "vitest";
import { scopedQueryKey, tenantQueryKey, type QueryPortal } from "@/lib/query-key-scope";

describe("query-key scope", () => {
  it("cô lập cùng tài nguyên giữa bốn portal", () => {
    const portals: QueryPortal[] = ["lms", "lcms", "crm", "elearning"];
    const keys = portals.map((portal) => scopedQueryKey("dashboard", "bootstrap", { portal, tenantId: "tenant-a", accountId: "account-a" }));

    expect(new Set(keys.map((key) => JSON.stringify(key))).size).toBe(4);
    expect(keys[0]).toEqual(["dashboard", "bootstrap", "lms", "tenant-a", "account-a"]);
    expect(keys[3]).toEqual(["dashboard", "bootstrap", "elearning", "tenant-a", "account-a"]);
  });

  it("chuẩn hóa tenant/account trống để không tạo key undefined", () => {
    expect(scopedQueryKey("notifications", "inbox", { portal: "lms", tenantId: " ", accountId: undefined })).toEqual([
      "notifications", "inbox", "lms", "default", "anonymous",
    ]);
    expect(tenantQueryKey("account", "sessions", "tenant-a", "anonymous")).toEqual([
      "account", "sessions", "tenant-a", "anonymous",
    ]);
  });
});
