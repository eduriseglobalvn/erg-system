import { getRoleMeta } from "@/platform/auth/permissions/role-display-catalog";

const ACTION_LABEL: Record<string, string> = {
  read: "Xem",
  view: "Xem",
  list: "Xem danh sách",
  create: "Tạo",
  update: "Cập nhật",
  edit: "Chỉnh sửa",
  delete: "Xoá",
  manage: "Quản lý",
  publish: "Xuất bản",
  export: "Xuất dữ liệu",
  import: "Nhập dữ liệu",
  assign: "Gán",
  approve: "Duyệt",
  grade: "Chấm điểm",
  submit: "Nộp",
};

const RESOURCE_LABEL: Record<string, string> = {
  users: "người dùng",
  user: "người dùng",
  rbac: "phân quyền",
  "rbac.role": "nhóm quyền",
  "rbac.override": "ngoại lệ phân quyền",
  role: "nhóm quyền",
  roles: "nhóm quyền",
  permission: "quyền",
  school: "trường học",
  class: "lớp học",
  student: "học viên",
  teacher: "giáo viên",
  course: "khoá học",
  assignment: "bài tập",
  quiz: "bài kiểm tra",
  question: "câu hỏi",
  attendance: "điểm danh",
  grade: "điểm số",
  report: "báo cáo",
  reports: "báo cáo",
  audit: "nhật ký kiểm toán",
  calendar: "lịch",
  notification: "thông báo",
  integration: "tích hợp",
  settings: "cài đặt",
};

const MODULE_LABEL: Record<string, string> = {
  rbac: "Phân quyền",
  users: "Người dùng",
  lms: "Học tập (LMS)",
  lcms: "Quản lý đào tạo",
  crm: "Tuyển sinh (CRM)",
  school: "Nhà trường",
  audit: "Kiểm toán",
  system: "Hệ thống",
  report: "Báo cáo",
  reports: "Báo cáo",
  calendar: "Lịch",
  integration: "Tích hợp",
  notification: "Thông báo",
  content: "Nội dung",
};

const SCOPE_TYPE_LABEL: Record<string, string> = {
  SYSTEM: "Toàn hệ thống",
  GLOBAL: "Toàn hệ thống",
  CENTER: "Trung tâm",
  SCHOOL: "Trường học",
  CLASS: "Lớp học",
};

type PermissionLike = { action?: string | null; group: string; label?: string | null; name: string; resource?: string | null };

/** Tên quyền tiếng Việt; không dịch được thì dùng nhãn từ máy chủ, cuối cùng là chính key. */
export function permissionDisplayName(permission: PermissionLike) {
  const parts = permission.name.split(".");
  const action = ACTION_LABEL[(permission.action ?? parts[parts.length - 1] ?? "").toLowerCase()];
  const resourceKey = (permission.resource ?? parts.slice(0, -1).join(".")).toLowerCase();
  const resource = RESOURCE_LABEL[resourceKey] ?? RESOURCE_LABEL[parts[parts.length - 2] ?? ""] ?? RESOURCE_LABEL[parts[0] ?? ""];
  if (action && resource) return `${action} ${resource}`;
  return permission.label?.trim() && permission.label !== permission.name ? permission.label : permission.name;
}

export function permissionModuleLabel(group: string) {
  const key = group.toLowerCase();
  return MODULE_LABEL[key] ?? MODULE_LABEL[key.split(".")[0] ?? ""] ?? group;
}

export function roleDisplayName(roleCode: string) {
  return getRoleMeta(roleCode).label;
}

export function scopeTypeLabel(type: string) {
  return SCOPE_TYPE_LABEL[type.toUpperCase()] ?? "Phạm vi khác";
}
