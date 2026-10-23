import { describe, expect, it, vi } from "vitest";

import { seoCrmQueryKeys, seoCrmWorkspaceQueryOptions } from "@/features/crm/seo/api/seo-crm-query";
import { isPersistableQuery } from "@/lib/query-persistence";

vi.mock("@/features/crm/seo/api/seo-crm-transport", () => ({
  loadSeoCrmWorkspace: vi.fn(async () => ({ leads: [], opportunities: [], followUps: [], handovers: [] })),
}));

describe("CRM query scope and cancellation", () => {
  it("isolates workspace cache by portal, tenant and account", () => {
    expect(seoCrmQueryKeys.workspace({ tenantId: " tenant-a ", accountId: " seo-a " }))
      .toEqual(["crm", "workspace", "crm", "tenant-a", "seo-a"]);
    expect(seoCrmQueryKeys.workspace({ tenantId: "tenant-a", accountId: "seo-a" }))
      .not.toEqual(seoCrmQueryKeys.workspace({ tenantId: "tenant-a", accountId: "seo-b" }));
  });

  it("forwards AbortSignal and marks only authenticated CRM scopes persistable", async () => {
    const scope = { tenantId: "tenant-a", accountId: "seo-a" };
    const options = seoCrmWorkspaceQueryOptions(scope);
    const controller = new AbortController();
    await options.queryFn?.({ signal: controller.signal } as never);
    const { loadSeoCrmWorkspace } = await import("@/features/crm/seo/api/seo-crm-transport");
    expect(loadSeoCrmWorkspace).toHaveBeenCalledWith(controller.signal);
    expect(isPersistableQuery({ queryKey: seoCrmQueryKeys.workspace(scope) } as never)).toBe(true);
    expect(isPersistableQuery({ queryKey: seoCrmQueryKeys.workspace({ tenantId: "tenant-a", accountId: "anonymous" }) } as never)).toBe(false);
  });
});
