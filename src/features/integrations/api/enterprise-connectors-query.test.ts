import { describe, expect, it } from "vitest";

import { enterpriseConnectorsQueryKeys } from "@/features/integrations/api/enterprise-connectors-api";
import { QUERY_POLICIES } from "@/lib/query-policy";

describe("enterprise connector query boundary", () => {
  it("scopes every connector key by tenant, account and workspace", () => {
    expect(enterpriseConnectorsQueryKeys.connectors("tenant-a", "admin-a", "ADMIN")).not.toEqual(
      enterpriseConnectorsQueryKeys.connectors("tenant-b", "admin-a", "ADMIN"),
    );
    expect(enterpriseConnectorsQueryKeys.connectors("tenant-a", "admin-a", "ADMIN")).not.toEqual(
      enterpriseConnectorsQueryKeys.connectors("tenant-a", "admin-b", "ADMIN"),
    );
  });

  it("does not persist connector metadata or command results offline", () => {
    expect(QUERY_POLICIES.transactional.persist).toBe(false);
    expect(QUERY_POLICIES.sensitive.persist).toBe(false);
  });
});
