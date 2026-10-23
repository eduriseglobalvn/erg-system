import { beforeEach, describe, expect, it, vi } from "vitest";

const { operation } = vi.hoisted(() => ({ operation: vi.fn() }));
vi.mock("@/lib/api/create-api-client", () => ({ createApiClient: () => ({ operation }) }));
vi.mock("@/lib/api-client", () => ({ getBackOfficePortal: () => "crm" }));

import { loadSeoCrmWorkspace, updateSeoLeadStatus } from "@/features/crm/seo/api/seo-crm-transport";

describe("CRM typed REST transport", () => {
  beforeEach(() => operation.mockReset());

  it("loads workspace through the endpoint registry with cancellation", async () => {
    operation.mockResolvedValue({ leads: [], opportunities: [], followUps: [], handovers: [] });
    const signal = new AbortController().signal;
    await loadSeoCrmWorkspace(signal);
    expect(operation).toHaveBeenCalledWith("/api/v1/crm/workspace", "get", { signal });
  });

  it("sends optimistic version for lead status updates", async () => {
    operation.mockResolvedValue({ id: "lead-1", schoolId: "school-1", status: "active", version: 4 });
    await updateSeoLeadStatus({ leadId: "lead-1", status: "active", expectedVersion: 3 });
    expect(operation).toHaveBeenCalledWith("/api/v1/crm/leads/lead-1/status", "patch", {
      body: { status: "active", expectedVersion: 3 },
    });
  });
});
