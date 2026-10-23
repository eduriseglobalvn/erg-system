import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { getDefaultTenantId } from "@/lib/graphql-client";
import { QUERY_POLICIES } from "@/lib/query-policy";
import { getCurrentAccount } from "@/platform/auth/api/auth-storage";
import {
  deprovisionEnterpriseConnector,
  dryRunEnterpriseConnector,
  enterpriseConnectorsQueryKeys,
  getEnterpriseConnector,
  listEnterpriseConnectors,
  registerEnterpriseConnector,
  retryEnterpriseConnector,
  syncEnterpriseConnector,
  type EnterpriseConnectorDeprovisionInput,
  type EnterpriseConnectorRunInput,
  type EnterpriseConnectorRetryInput,
  type RegisterEnterpriseConnectorInput,
  type EnterpriseConnectorsRequestContext,
} from "@/features/integrations/api/enterprise-connectors-api";

export type EnterpriseConnectorsWorkspace = "ADMIN";

export type EnterpriseConnectorsScope = {
  tenantId: string;
  accountId: string;
  workspace: EnterpriseConnectorsWorkspace;
  portal: "lcms";
};

export function useEnterpriseConnectorsScope(): EnterpriseConnectorsScope {
  const accountId = getCurrentAccount("lcms")?.id?.trim() || "anonymous";
  return useMemo(() => ({
    tenantId: getDefaultTenantId(),
    accountId,
    workspace: "ADMIN",
    portal: "lcms",
  }), [accountId]);
}

export function useEnterpriseConnectors(scope: EnterpriseConnectorsScope, enabled = true) {
  return useQuery({
    queryKey: enterpriseConnectorsQueryKeys.connectors(scope.tenantId, scope.accountId, scope.workspace),
    queryFn: ({ signal }) => listEnterpriseConnectors(contextFor(scope, signal)),
    enabled,
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}

export function useEnterpriseConnector(scope: EnterpriseConnectorsScope, connectorId: string | undefined) {
  const normalizedId = connectorId?.trim() ?? "";
  return useQuery({
    queryKey: enterpriseConnectorsQueryKeys.connector(scope.tenantId, scope.accountId, scope.workspace, normalizedId),
    queryFn: ({ signal }) => getEnterpriseConnector(normalizedId, contextFor(scope, signal)),
    enabled: Boolean(normalizedId),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
  });
}

export function useRegisterEnterpriseConnector(scope: EnterpriseConnectorsScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: RegisterEnterpriseConnectorInput; idempotencyKey: string }) =>
      registerEnterpriseConnector(input, idempotencyKey, contextFor(scope)),
    onSuccess: () => invalidateRoot(queryClient, scope),
  });
}

export function useDryRunEnterpriseConnector(scope: EnterpriseConnectorsScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ connectorId, input, idempotencyKey }: { connectorId: string; input: EnterpriseConnectorRunInput; idempotencyKey: string }) =>
      dryRunEnterpriseConnector(connectorId, input, idempotencyKey, contextFor(scope)),
    onSuccess: () => invalidateRoot(queryClient, scope),
  });
}

export function useSyncEnterpriseConnector(scope: EnterpriseConnectorsScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ connectorId, input, idempotencyKey }: { connectorId: string; input: EnterpriseConnectorRunInput; idempotencyKey: string }) =>
      syncEnterpriseConnector(connectorId, input, idempotencyKey, contextFor(scope)),
    onSuccess: () => invalidateRoot(queryClient, scope),
  });
}

export function useRetryEnterpriseConnector(scope: EnterpriseConnectorsScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ connectorId, runId, input, idempotencyKey }: { connectorId: string; runId: string; input: EnterpriseConnectorRetryInput; idempotencyKey: string }) =>
      retryEnterpriseConnector(connectorId, runId, input, idempotencyKey, contextFor(scope)),
    onSuccess: () => invalidateRoot(queryClient, scope),
  });
}

export function useDeprovisionEnterpriseConnector(scope: EnterpriseConnectorsScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ connectorId, input, idempotencyKey }: { connectorId: string; input: EnterpriseConnectorDeprovisionInput; idempotencyKey: string }) =>
      deprovisionEnterpriseConnector(connectorId, input, idempotencyKey, contextFor(scope)),
    onSuccess: () => invalidateRoot(queryClient, scope),
  });
}

async function invalidateRoot(queryClient: ReturnType<typeof useQueryClient>, scope: EnterpriseConnectorsScope) {
  await queryClient.invalidateQueries({ queryKey: enterpriseConnectorsQueryKeys.root(scope.tenantId, scope.accountId, scope.workspace) });
}

function contextFor(scope: EnterpriseConnectorsScope, signal?: AbortSignal): EnterpriseConnectorsRequestContext {
  return signal ? { portal: scope.portal, signal } : { portal: scope.portal };
}
