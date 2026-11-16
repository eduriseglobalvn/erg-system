export type RoleTone = "success" | "warning" | "danger" | "info" | "neutral" | "purple";

export interface RoleDisplayMeta {
  badgeTone: RoleTone;
  category: string;
  description: string;
  keyPermissions: readonly string[];
  label: string;
}

// Fixed fallback labels for the 7 business roles; the real labels and descriptions come from GET /api/v1/rbac/catalog.
const ROLE_CATEGORY = "Vai trò nghiệp vụ";

function roleMeta(label: string, badgeTone: RoleTone, description: string): RoleDisplayMeta {
  return { badgeTone, category: ROLE_CATEGORY, description, keyPermissions: [], label };
}

export const ROLE_DISPLAY_CATALOG: Record<string, RoleDisplayMeta> = {
  "system.super_admin": roleMeta("Quản trị", "purple", "Toàn quyền hệ thống."),
  director: roleMeta("Giám đốc", "info", "Chỉ xem toàn bộ, không thêm, sửa, xoá."),
  pdt_operator: roleMeta("Phòng đào tạo", "info", "Toàn quyền đào tạo, trừ CRM và nhật ký."),
  operations: roleMeta("Vận hành", "info", "Chỉ xem phần LMS."),
  "lms.instructor": roleMeta("Giáo viên", "success", "Chỉ lớp mình dạy."),
  "lms.learner": roleMeta("Học sinh", "neutral", "Chỉ cổng học sinh."),
  admissions: roleMeta("Tuyển sinh", "warning", "Chỉ CRM."),
};

export function getRoleMeta(roleName: string): RoleDisplayMeta {
  const normalized = roleName.trim().toLowerCase();
  const found = ROLE_DISPLAY_CATALOG[normalized];
  if (found) return found;

  // Fallback for custom or unmapped roles
  const formatted = roleName
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return {
    badgeTone: "neutral",
    category: "Nhóm quyền bổ sung",
    description: `Nhóm quyền nghiệp vụ được định cấu hình riêng trong hệ thống (${roleName}).`,
    keyPermissions: ["Theo cấu hình hệ thống"],
    label: formatted,
  };
}

export interface ScopeDisplayMeta {
  badgeTone: RoleTone;
  description: string;
  label: string;
  placeholder?: string;
  requiresId: boolean;
  scopeType: string;
}

export const SCOPE_DISPLAY_CATALOG: Record<string, ScopeDisplayMeta> = {
  SYSTEM: {
    badgeTone: "purple",
    description: "Áp dụng quyền hạn trên toàn bộ hệ thống ERG (bao gồm mọi tổ chức và mọi trường học).",
    label: "Toàn hệ thống ERG",
    requiresId: false,
    scopeType: "SYSTEM",
  },
  TENANT: {
    badgeTone: "info",
    description: "Áp dụng quyền hạn trên toàn bộ tổ chức hiện tại (bao gồm tất cả trung tâm và trường học trực thuộc).",
    label: "Toàn tổ chức (Toàn Tenant)",
    requiresId: false,
    scopeType: "TENANT",
  },
  CENTER: {
    badgeTone: "success",
    description: "Giới hạn quyền hạn trong phạm vi một cơ sở hoặc trung tâm đào tạo cụ thể.",
    label: "Cơ sở / Trung tâm đào tạo",
    placeholder: "Nhập mã cơ sở (VD: CS-QUAN-1, CENTER-01)...",
    requiresId: true,
    scopeType: "CENTER",
  },
  SCHOOL: {
    badgeTone: "warning",
    description: "Giới hạn quyền hạn trong phạm vi một trường học liên kết cụ thể.",
    label: "Trường học liên kết",
    placeholder: "Nhập mã trường (VD: THCS-TRUONG-CONG-DINH)...",
    requiresId: true,
    scopeType: "SCHOOL",
  },
  CLASS: {
    badgeTone: "warning",
    description: "Giới hạn quyền hạn chỉ áp dụng đối với các lớp học được phân công trực tiếp.",
    label: "Lớp học được phân công",
    placeholder: "Nhập mã lớp (VD: 9A1, 9A2)...",
    requiresId: true,
    scopeType: "CLASS",
  },
};

export function getScopeMeta(scopeType: string): ScopeDisplayMeta {
  const found = SCOPE_DISPLAY_CATALOG[scopeType.toUpperCase()];
  if (found) return found;

  return {
    badgeTone: "neutral",
    description: `Phạm vi nghiệp vụ được tùy chỉnh (${scopeType}).`,
    label: scopeType,
    placeholder: "Nhập ID phạm vi...",
    requiresId: true,
    scopeType,
  };
}
