import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { seoCrmQueryKeys, seoCrmWorkspaceQueryOptions, type SeoCrmQueryScope } from "@/features/crm/seo/api/seo-crm-query";
import { updateSeoLeadStatus, type UpdateSeoLeadStatusInput } from "@/features/crm/seo/api/seo-crm-transport";
import type { SeoCrmWorkspace, SeoLeadStatus } from "@/features/crm/seo/types/seo-crm-types";

const emptyWorkspace: SeoCrmWorkspace = { leads: [], opportunities: [], followUps: [], handovers: [] };

export function useSeoCrmWorkspace(scope: SeoCrmQueryScope) {
  const queryClient = useQueryClient();
  const queryKey = seoCrmQueryKeys.workspace(scope);
  const query = useQuery(seoCrmWorkspaceQueryOptions(scope));
  const statusMutation = useMutation({
    mutationFn: (input: { leadId: string; status: SeoLeadStatus }) => {
      const lead = queryClient.getQueryData<SeoCrmWorkspace>(queryKey)?.leads.find((item) => item.id === input.leadId);
      if (!lead) throw new Error("CRM lead is not available in the current workspace cache");
      return updateSeoLeadStatus({ ...input, expectedVersion: lead.version } satisfies UpdateSeoLeadStatusInput);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey, exact: true });
      const previous = queryClient.getQueryData<SeoCrmWorkspace>(queryKey);
      queryClient.setQueryData<SeoCrmWorkspace>(queryKey, (current) => current ? {
        ...current,
        leads: current.leads.map((lead) => lead.id === input.leadId ? { ...lead, status: input.status } : lead),
      } : current);
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<SeoCrmWorkspace>(queryKey, (current) => current ? {
        ...current,
        leads: current.leads.map((lead) => lead.id === updated.id ? updated : lead),
      } : current);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey, exact: true }),
  });

  return {
    workspace: query.data ?? emptyWorkspace,
    isLoading: query.isLoading,
    error: query.error,
    updateLeadStatus: statusMutation.mutate,
    isUpdatingLeadStatus: statusMutation.isPending,
  };
}
