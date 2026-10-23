import type { ApiResponseData, ContractPath } from "@/lib/api/contract-types";
import type {
  EmployeeItem,
  EmployeeListFilters,
  EmployeeStatus,
  EmployeeStatusInput,
} from "@/features/employee-management/types/employee-management";
import type {
  PermissionCatalogFilters,
  PermissionStatus,
  PermissionStatusInput,
  SystemPermission,
} from "@/features/access-management/types/access-management";

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;

const usersPath = "/api/v1/admin/users" satisfies ContractPath;
type UsersResponse = ApiResponseData<typeof usersPath, "get">;
const response: UsersResponse | undefined = undefined;
void usersPath;
void response;

// @ts-expect-error endpoint không có trong OpenAPI
const invalidPath = "/api/v1/not-real" satisfies ContractPath;
void invalidPath;

const employeeStatusContract: Equal<
  EmployeeStatus,
  "ACTIVE" | "PENDING" | "BLOCKED" | "BANNED" | "INACTIVE" | "UNKNOWN"
> = true;
const employeeItemStatusContract: Equal<EmployeeItem["status"], EmployeeStatus> = true;
const employeeFilterStatusContract: Equal<NonNullable<EmployeeListFilters["status"]>, EmployeeStatusInput> = true;
const permissionStatusContract: Equal<PermissionStatus, "ACTIVE" | "INACTIVE" | "DEPRECATED" | "UNKNOWN"> = true;
const permissionItemStatusContract: Equal<SystemPermission["status"], PermissionStatus> = true;
const permissionFilterStatusContract: Equal<NonNullable<PermissionCatalogFilters["status"]>, PermissionStatusInput> = true;
void employeeStatusContract;
void employeeItemStatusContract;
void employeeFilterStatusContract;
void permissionStatusContract;
void permissionItemStatusContract;
void permissionFilterStatusContract;
