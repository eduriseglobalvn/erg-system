import { getBackOfficePortal } from "@/lib/api-client";
import { createApiClient } from "@/lib/api/create-api-client";
import { employeeManagementRoutes as routes } from "@/features/employee-management/api/employee-management-routes";
import type {
  ActivityPage,
  CreateEmployeeRequest,
  EmployeeDetail,
  EmployeeCreatedResponse,
  EmployeeList,
  EmployeeListFilters,
  EmployeeSession,
  SecurityEventPage,
  SecurityFeedFilters,
  SecurityFeedPage,
  UpdateEmployeeRequest,
  CredentialDeliveryResponse,
} from "@/features/employee-management/types/employee-management";

const client = () => createApiClient({ portal: getBackOfficePortal(), auth: "required" });

export const employeeManagementQueryKeys = {
  root: (tenantId: string) => ["employee-management", tenantId] as const,
  list: (tenantId: string, filters: EmployeeListFilters) =>
    [...employeeManagementQueryKeys.root(tenantId), "list", filters] as const,
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

export function listEmployees(filters: EmployeeListFilters) {
  const search = new URLSearchParams();
  search.set("page", String(filters.page));
  search.set("limit", String(filters.limit));
  setOptional(search, "search", filters.search);
  setOptional(search, "status", filters.status);
  setOptional(search, "role", filters.role);
  return client().request<EmployeeList>(`${routes.users}?${search}` as `${typeof routes.users}?${string}`);
}

export function getEmployee(userId: string) {
  return client().request<EmployeeDetail>(routes.user(userId));
}

export function createEmployee(payload: CreateEmployeeRequest) {
  return client().request<EmployeeCreatedResponse>(routes.users, { method: "POST", body: JSON.stringify(payload) });
}

export function updateEmployee(userId: string, payload: UpdateEmployeeRequest) {
  return client().request<EmployeeDetail>(routes.user(userId), { method: "PATCH", body: JSON.stringify(payload) });
}

export function updateEmployeeStatus(userId: string, status: string) {
  return client().request<unknown>(routes.status(userId), { method: "PUT", body: JSON.stringify({ status }) });
}

export function assignEmployeeRoles(userId: string, roles: string[]) {
  return client().request<unknown>(routes.roles(userId), { method: "POST", body: JSON.stringify({ roles }) });
}

export function resetEmployeeCredential(userId: string, credentialDelivery: "EMAIL_INVITE" | "ONE_TIME_PASSWORD") {
  return client().request<CredentialDeliveryResponse>(routes.resetCredential(userId), { method: "POST", body: JSON.stringify({ credentialDelivery }) });
}

export function listEmployeeActivity(userId: string, page: number, limit: number) {
  return client().request<ActivityPage>(`${routes.activity(userId)}?page=${page}&limit=${limit}` as `${string}?${string}`);
}

export function listEmployeeSecurityEvents(userId: string, page: number, limit: number) {
  return client().request<SecurityEventPage>(`${routes.securityEvents(userId)}?page=${page}&limit=${limit}` as `${string}?${string}`);
}

export function listEmployeeSecurityFeed(filters: SecurityFeedFilters) {
  const search = new URLSearchParams();
  search.set("page", String(filters.page));
  search.set("limit", String(filters.limit));
  setOptional(search, "userId", filters.userId);
  setOptional(search, "sourceType", filters.sourceType);
  return client().request<SecurityFeedPage>(`${routes.securityFeed}?${search}` as `${typeof routes.securityFeed}?${string}`);
}

export async function listEmployeeSessions(userId: string) {
  const response = await client().request<{ items: EmployeeSession[] }>(routes.sessions(userId));
  return response.items;
}

export function revokeEmployeeSession(userId: string, sessionId: string) {
  return client().request<unknown>(routes.revokeSession(userId), { method: "POST", body: JSON.stringify({ sessionId }) });
}

function setOptional(search: URLSearchParams, name: string, value?: string) {
  const normalized = value?.trim();
  if (normalized) search.set(name, normalized);
}
