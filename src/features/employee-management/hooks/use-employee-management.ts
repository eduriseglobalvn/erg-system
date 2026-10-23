import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignEmployeeRoles,
  createEmployee,
  employeeManagementQueryKeys,
  getEmployee,
  listEmployeeSecurityFeed,
  listEmployees,
  resetEmployeeCredential,
  revokeEmployeeSession,
  updateEmployee,
  updateEmployeeStatus,
} from "@/features/employee-management/api/employee-management-api";
import type { CreateEmployeeRequest, EmployeeListFilters, EmployeeStatusInput, SecurityFeedFilters, UpdateEmployeeRequest } from "@/features/employee-management/types/employee-management";
import { listRoles } from "@/features/access-management/api/access-management-api";
import { QUERY_POLICIES } from "@/lib/query-policy";

export function useEmployees(tenantId: string, filters: EmployeeListFilters) {
  return useQuery({ queryKey: employeeManagementQueryKeys.list(tenantId, filters), queryFn: ({ signal }) => listEmployees(filters, signal), staleTime: QUERY_POLICIES.transactional.staleTime });
}

export function useEmployeeDetail(tenantId: string, userId?: string) {
  return useQuery({ queryKey: employeeManagementQueryKeys.detail(tenantId, userId ?? ""), queryFn: ({ signal }) => getEmployee(userId ?? "", signal), enabled: Boolean(userId), staleTime: QUERY_POLICIES.transactional.staleTime });
}

export function useEmployeeSecurityEvents(tenantId: string, userId?: string, page = 1, limit = 20) {
  const filters = { userId, page, limit };
  return useQuery({
    queryKey: employeeManagementQueryKeys.securityFeed(tenantId, filters),
    queryFn: ({ signal }) => listEmployeeSecurityFeed(filters, signal),
    enabled: Boolean(userId),
    staleTime: QUERY_POLICIES.realtime.staleTime,
  });
}

export function useEmployeeSecurityFeed(tenantId: string, filters: SecurityFeedFilters) {
  return useQuery({
    queryKey: employeeManagementQueryKeys.securityFeed(tenantId, filters),
    queryFn: ({ signal }) => listEmployeeSecurityFeed(filters, signal),
    staleTime: QUERY_POLICIES.realtime.staleTime,
    refetchInterval: 30_000,
  });
}

export function useEmployeeRoleOptions(tenantId: string) {
  return useQuery({
    queryKey: [...employeeManagementQueryKeys.root(tenantId), "role-options"],
    queryFn: ({ signal }) => listRoles(signal),
    staleTime: QUERY_POLICIES.reference.staleTime,
  });
}

export function useEmployeeCommands(tenantId: string) {
  const queryClient = useQueryClient();
  return {
    create: useMutation({ mutationFn: (payload: CreateEmployeeRequest) => createEmployee(payload), onSuccess: () => invalidateEmployeeQueries(queryClient, employeeMutationInvalidationKeys.create(tenantId)) }),
    update: useMutation({ mutationFn: ({ userId, payload }: { userId: string; payload: UpdateEmployeeRequest }) => updateEmployee(userId, payload), onSuccess: (_result, { userId }) => invalidateEmployeeQueries(queryClient, employeeMutationInvalidationKeys.account(tenantId, userId)) }),
    status: useMutation({ mutationFn: ({ userId, status }: { userId: string; status: EmployeeStatusInput }) => updateEmployeeStatus(userId, status), onSuccess: (_result, { userId }) => invalidateEmployeeQueries(queryClient, employeeMutationInvalidationKeys.account(tenantId, userId)) }),
    roles: useMutation({ mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) => assignEmployeeRoles(userId, roles), onSuccess: (_result, { userId }) => invalidateEmployeeQueries(queryClient, employeeMutationInvalidationKeys.account(tenantId, userId)) }),
    resetCredential: useMutation({ mutationFn: ({ userId, delivery }: { userId: string; delivery: "EMAIL_INVITE" | "ONE_TIME_PASSWORD" }) => resetEmployeeCredential(userId, delivery), onSuccess: (_result, { userId }) => invalidateEmployeeQueries(queryClient, employeeMutationInvalidationKeys.account(tenantId, userId)) }),
    revokeSession: useMutation({ mutationFn: ({ userId, sessionId }: { userId: string; sessionId: string }) => revokeEmployeeSession(userId, sessionId), onSuccess: (_result, { userId }) => invalidateEmployeeQueries(queryClient, employeeMutationInvalidationKeys.revokeSession(tenantId, userId)) }),
  };
}

export const employeeMutationInvalidationKeys = {
  create: (tenantId: string) => [employeeManagementQueryKeys.lists(tenantId)] as const,
  account: (tenantId: string, userId: string) => [
    employeeManagementQueryKeys.lists(tenantId),
    employeeManagementQueryKeys.detail(tenantId, userId),
  ] as const,
  revokeSession: (tenantId: string, userId: string) => [
    employeeManagementQueryKeys.sessions(tenantId, userId),
    employeeManagementQueryKeys.detail(tenantId, userId),
  ] as const,
};

function invalidateEmployeeQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  keys: readonly (readonly unknown[])[],
) {
  return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}
