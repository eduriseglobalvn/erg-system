import { getBackOfficePortal } from "@/lib/api-client";
import { createApiClient } from "@/lib/api/create-api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type { ContractRequestPath } from "@/lib/api/contract-types";
import { mapEmployeeListDto, type EmployeeListDto } from "@/lib/api/mappers/admin-contract-mappers";
import { isObject, validateResponse } from "@/lib/validate-response";
import type {
  ActivityPage,
  CreateEmployeeRequest,
  EmployeeDetail,
  EmployeeCreatedResponse,
  EmployeeList,
  EmployeeListFilters,
  EmployeeSession,
  EmployeeStatusInput,
  SecurityEventPage,
  SecurityFeedFilters,
  SecurityFeedPage,
  UpdateEmployeeRequest,
  CredentialDeliveryResponse,
} from "@/features/employee-management/types/employee-management";

const client = () => createApiClient({ portal: getBackOfficePortal(), auth: "required" });

export const employeeManagementQueryKeys = {
  root: (tenantId: string) => ["employee-management", tenantId] as const,
  lists: (tenantId: string) => [...employeeManagementQueryKeys.root(tenantId), "list"] as const,
  list: (tenantId: string, filters: EmployeeListFilters) =>
    [...employeeManagementQueryKeys.lists(tenantId), filters] as const,
  detail: (tenantId: string, userId: string) =>
    [...employeeManagementQueryKeys.root(tenantId), "detail", userId] as const,
  activity: (tenantId: string, userId: string, page: number, limit: number) =>
    [...employeeManagementQueryKeys.root(tenantId), "activity", userId, page, limit] as const,
  securityEvents: (tenantId: string, userId: string, page: number, limit: number) =>
    [...employeeManagementQueryKeys.root(tenantId), "security-events", userId, page, limit] as const,
  sessions: (tenantId: string, userId: string) =>
    [...employeeManagementQueryKeys.root(tenantId), "sessions", userId] as const,
  securityFeed: (tenantId: string, filters: SecurityFeedFilters) =>
    [...employeeManagementQueryKeys.root(tenantId), "security-feed", filters] as const,
};

export async function listEmployees(filters: EmployeeListFilters, signal?: AbortSignal): Promise<EmployeeList> {
  const response = await client().operation(API_ENDPOINTS.adminUsers.root, "get", {
    query: {
      page: filters.page,
      limit: filters.limit,
      search: filters.search?.trim() || undefined,
      status: filters.status?.trim() || undefined,
      role: filters.role?.trim() || undefined,
    },
    ...(signal ? { signal } : {}),
  });
  const dto = validateResponse(response, isEmployeeListDto, "employee.list");
  return mapEmployeeListDto(dto);
}

function isEmployeeListDto(value: unknown): value is EmployeeListDto {
  return isObject(value) && Array.isArray(value.users) && isObject(value.meta);
}

export function getEmployee(userId: string, signal?: AbortSignal) {
  return client().request<EmployeeDetail>(API_ENDPOINTS.adminUsers.detail(userId), signal ? { signal } : undefined);
}

export function createEmployee(payload: CreateEmployeeRequest) {
  return client().request<EmployeeCreatedResponse>(API_ENDPOINTS.adminUsers.root, { method: "POST", body: JSON.stringify(payload) });
}

export function updateEmployee(userId: string, payload: UpdateEmployeeRequest) {
  return client().request<EmployeeDetail>(API_ENDPOINTS.adminUsers.detail(userId), { method: "PATCH", body: JSON.stringify(payload) });
}

export function updateEmployeeStatus(userId: string, status: EmployeeStatusInput) {
  return client().request<unknown>(API_ENDPOINTS.adminUsers.status(userId), { method: "PUT", body: JSON.stringify({ status }) });
}

export function assignEmployeeRoles(userId: string, roles: string[]) {
  return client().request<unknown>(API_ENDPOINTS.adminUsers.roles(userId), { method: "POST", body: JSON.stringify({ roles }) });
}

export function resetEmployeeCredential(userId: string, credentialDelivery: "EMAIL_INVITE" | "ONE_TIME_PASSWORD") {
  return client().request<CredentialDeliveryResponse>(API_ENDPOINTS.adminUsers.resetCredential(userId), { method: "POST", body: JSON.stringify({ credentialDelivery }) });
}

export function listEmployeeActivity(userId: string, page: number, limit: number, signal?: AbortSignal) {
  return client().request<ActivityPage>(`${API_ENDPOINTS.adminUsers.activity(userId)}?page=${page}&limit=${limit}` as ContractRequestPath, signal ? { signal } : undefined);
}

export function listEmployeeSecurityEvents(userId: string, page: number, limit: number, signal?: AbortSignal) {
  return client().request<SecurityEventPage>(`${API_ENDPOINTS.adminUsers.securityEvents(userId)}?page=${page}&limit=${limit}` as ContractRequestPath, signal ? { signal } : undefined);
}

export function listEmployeeSecurityFeed(filters: SecurityFeedFilters, signal?: AbortSignal) {
  const search = new URLSearchParams();
  search.set("page", String(filters.page));
  search.set("limit", String(filters.limit));
  setOptional(search, "userId", filters.userId);
  setOptional(search, "sourceType", filters.sourceType);
  return client().request<SecurityFeedPage>(`${API_ENDPOINTS.adminUsers.securityFeed}?${search}` as `${typeof API_ENDPOINTS.adminUsers.securityFeed}?${string}`, signal ? { signal } : undefined);
}

export async function listEmployeeSessions(userId: string, signal?: AbortSignal) {
  const response = await client().request<{ items: EmployeeSession[] }>(API_ENDPOINTS.adminUsers.sessions(userId), signal ? { signal } : undefined);
  return response.items;
}

export function revokeEmployeeSession(userId: string, sessionId: string) {
  return client().request<unknown>(API_ENDPOINTS.adminUsers.revokeSession(userId), { method: "POST", body: JSON.stringify({ sessionId }) });
}

function setOptional(search: URLSearchParams, name: string, value?: string) {
  const normalized = value?.trim();
  if (normalized) search.set(name, normalized);
}
