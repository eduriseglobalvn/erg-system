import { getRoleMeta } from "@/platform/auth/permissions/role-display-catalog";
import type { EmployeeStatus } from "@/features/employee-management/types/employee-management";

type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

const STATUS_VIEW: Record<EmployeeStatus, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: "Đang hoạt động", tone: "success" },
  PENDING: { label: "Chờ kích hoạt", tone: "info" },
  INACTIVE: { label: "Đã khoá", tone: "neutral" },
  BLOCKED: { label: "Bị chặn", tone: "error" },
  BANNED: { label: "Bị cấm", tone: "error" },
  UNKNOWN: { label: "Không xác định", tone: "neutral" },
};

export const EMPLOYEE_STATUS_FILTER_OPTIONS = (["ACTIVE", "PENDING", "INACTIVE", "BLOCKED", "BANNED"] as const).map(
  (value) => ({ value, label: STATUS_VIEW[value].label }),
);

export function employeeStatusView(status: string) {
  return STATUS_VIEW[status as EmployeeStatus] ?? STATUS_VIEW.UNKNOWN;
}

export function employeeRoleLabel(roleCode: string) {
  return getRoleMeta(roleCode).label;
}

const SCOPE_TYPE_LABEL: Record<string, string> = {
  SYSTEM: "Toàn hệ thống",
  GLOBAL: "Toàn hệ thống",
  CENTER: "Trung tâm",
  SCHOOL: "Trường học",
  CLASS: "Lớp học",
};

/** Scope dạng "SCHOOL:<uuid>" -> tên trường; không bao giờ trả UUID thô. */
export function scopeLabel(scope: string, schoolNames: ReadonlyMap<string, string>) {
  const [type = "", id = ""] = scope.split(":");
  const upper = type.toUpperCase();
  if (upper === "SCHOOL" && schoolNames.has(id)) return schoolNames.get(id)!;
  return SCOPE_TYPE_LABEL[upper] ?? "Phạm vi khác";
}

/** Trả nhãn đầu tiên và số nhãn còn lại ("+n"). */
export function summarize(labels: readonly string[]) {
  const unique = [...new Set(labels)];
  return { first: unique[0], rest: Math.max(0, unique.length - 1), all: unique };
}
