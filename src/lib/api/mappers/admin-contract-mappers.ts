import type { ApiResponseData } from "@/lib/api/contract-types";
import type { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type { EmployeeList, EmployeeStatus } from "@/features/employee-management/types/employee-management";
import type { PermissionPage, PermissionStatus, SystemPermission } from "@/features/access-management/types/access-management";

export type EmployeeListDto = ApiResponseData<typeof API_ENDPOINTS.adminUsers.root, "get">;
export type PermissionPageDto = ApiResponseData<typeof API_ENDPOINTS.access.permissionsCatalog, "get">;

export function mapEmployeeListDto(dto: EmployeeListDto): EmployeeList {
  const meta = dto?.meta;
  return {
    users: (dto?.users ?? []).map((item) => ({
      id: item.id ?? "",
      email: item.email ?? "",
      fullName: item.fullName ?? "",
      avatar_url: item.avatar_url ?? null,
      phone: item.phone ?? null,
      status: mapEmployeeStatus(item.status),
      roles: [...(item.roles ?? [])],
      isProfileCompleted: true,
      last_login_at: item.last_login_at ?? null,
      createdAt: item.createdAt ?? "",
      employeeCode: item.employeeCode ?? null,
      departmentId: item.departmentId ?? null,
      jobTitle: item.jobTitle ?? null,
      employmentType: item.employmentType ?? null,
      scopes: [...(item.scopes ?? [])],
      activeDeviceCount: item.activeDeviceCount ?? 0,
      activePlatforms: [...(item.activePlatforms ?? [])],
      riskCode: item.riskCode ?? null,
      riskSeverity: item.riskSeverity ?? null,
    })),
    meta: {
      page: meta?.page ?? 0,
      limit: meta?.limit ?? 50,
      total: meta?.total ?? 0,
      totalPages: meta?.totalPages ?? 0,
    },
  };
}

export function mapPermissionPageDto(dto: PermissionPageDto): PermissionPage {
  return {
    items: (dto?.items ?? []).map(mapPermissionDto),
    page: dto?.page ?? 0,
    limit: dto?.limit ?? 50,
    total: dto?.total ?? 0,
    totalPages: dto?.totalPages ?? 0,
  };
}

function mapPermissionDto(dto: NonNullable<NonNullable<PermissionPageDto>["items"]>[number]): SystemPermission {
  return {
    id: dto.id ?? "",
    name: dto.name ?? "",
    group: dto.group ?? "",
    label: dto.label ?? dto.name ?? "",
    description: dto.description ?? null,
    resource: dto.resource ?? null,
    action: dto.action ?? null,
    portal: dto.portal ?? null,
    supportedScope: dto.supportedScope ?? null,
    status: mapPermissionStatus(dto.status),
    isSystem: dto.isSystem ?? false,
    deprecatedAt: dto.deprecatedAt ?? null,
    used: dto.used ?? false,
    roleCount: dto.roleCount ?? 0,
    userCount: dto.userCount ?? 0,
    roleNames: [...(dto.roleNames ?? [])],
    bindings: (dto.bindings ?? []).map((binding) => ({
      id: binding.id ?? "",
      surfaceType: binding.surfaceType ?? "UNKNOWN",
      surfaceIdentifier: binding.surfaceIdentifier ?? "",
      description: binding.description ?? null,
      enforced: binding.enforced ?? false,
    })),
  };
}

function mapEmployeeStatus(status: string | null | undefined): EmployeeStatus {
  const normalized = status?.trim().toUpperCase();
  switch (normalized) {
    case "ACTIVE":
    case "PENDING":
    case "BLOCKED":
    case "BANNED":
    case "INACTIVE":
      return normalized;
    default:
      return "UNKNOWN";
  }
}

function mapPermissionStatus(status: string | null | undefined): PermissionStatus {
  const normalized = status?.trim().toUpperCase();
  switch (normalized) {
    case "ACTIVE":
    case "INACTIVE":
    case "DEPRECATED":
      return normalized;
    default:
      return "UNKNOWN";
  }
}
