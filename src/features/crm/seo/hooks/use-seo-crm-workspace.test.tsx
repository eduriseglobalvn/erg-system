import type { PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { seoCrmQueryKeys } from "@/features/crm/seo/api/seo-crm-query";
import type { SeoCrmWorkspace, SeoSchoolLead } from "@/features/crm/seo/types/seo-crm-types";
import { useSeoCrmWorkspace } from "@/features/crm/seo/hooks/use-seo-crm-workspace";

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/features/crm/seo/api/seo-crm-transport", () => ({
  loadSeoCrmWorkspace: mocks.load,
  updateSeoLeadStatus: mocks.update,
}));

const scope = { tenantId: "tenant-a", accountId: "seo-a" };
const lead: SeoSchoolLead = {
  id: "lead-1", schoolId: "school-1", schoolName: "ERG", district: "", province: "", segment: "",
  contactName: "", contactRole: "", phone: "", source: "", ownerName: "seo-a", status: "consulted",
  probability: 20, expectedStudents: 0, expectedClasses: 0, nextFollowUpAt: "", lastTouchAt: "", notes: "",
  risks: [], version: 3,
};
const workspace: SeoCrmWorkspace = { leads: [lead], opportunities: [], followUps: [], handovers: [] };

describe("CRM optimistic status mutation", () => {
  beforeEach(() => {
    mocks.load.mockReset();
    mocks.update.mockReset();
  });

  it("uses cached version, rolls back failure and invalidates only the scoped workspace", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const queryKey = seoCrmQueryKeys.workspace(scope);
    queryClient.setQueryData(queryKey, workspace);
    const invalidate = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();
    mocks.update.mockRejectedValueOnce(new Error("conflict"));
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useSeoCrmWorkspace(scope), { wrapper });

    act(() => result.current.updateLeadStatus({ leadId: "lead-1", status: "active" }));

    await waitFor(() => expect(mocks.update).toHaveBeenCalledWith({ leadId: "lead-1", status: "active", expectedVersion: 3 }));
    await waitFor(() => expect(queryClient.getQueryData<SeoCrmWorkspace>(queryKey)?.leads[0]?.status).toBe("consulted"));
    expect(invalidate).toHaveBeenCalledWith({ queryKey, exact: true });
  });
});
