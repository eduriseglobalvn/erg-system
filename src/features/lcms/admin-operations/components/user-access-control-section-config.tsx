import type { AccessScopeType } from "@/features/lcms/admin-operations/api/access-management-api";

export const scopeLabels: Record<AccessScopeType | "none", string> = {
  system: "Hệ thống",
  center: "Trung tâm",
  school: "Trường học",
  none: "Chưa cấp",
};

export const roleOptions = [
  { id: "erg_super_admin", label: "Super Admin", hint: "Toàn quyền cấu hình và vận hành hệ thống" },
  { id: "admin", label: "Quản trị viên", hint: "Quản trị nghiệp vụ nội dung & nhân sự" },
  { id: "center_admin", label: "Quản trị trung tâm", hint: "Quản lý trường, lớp thuộc cụm trung tâm" },
  { id: "school_admin", label: "Quản trị trường", hint: "Theo dõi, quản lý lớp & học sinh trực thuộc" },
  { id: "teacher", label: "Giáo viên", hint: "Giao bài, chấm điểm và báo cáo tiến độ lớp học" },
  { id: "media_manager", label: "Media Manager", hint: "Quản lý tài nguyên media, video học liệu" },
];

export const roleAliases: Record<string, string[]> = {
  erg_super_admin: ["SUPER_ADMIN", "system.super_admin", "erg_super_admin"],
  admin: ["admin"],
  center_admin: ["center_admin"],
  school_admin: ["school_admin"],
  teacher: ["teacher"],
  media_manager: ["media_manager"],
};

export const panelSx = {
  border: 1,
  borderColor: "divider",
  borderRadius: 2,
  bgcolor: "background.paper",
  p: 2.5,
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
};

export const sectionHeaderSx = {
  display: "flex",
  flexDirection: { xs: "column", sm: "row" },
  alignItems: { xs: "stretch", sm: "center" },
  justifyContent: "space-between",
  gap: 1.5,
  borderBottom: 1,
  borderColor: "divider",
  pb: 1.5,
};

export const headingSx = {
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  color: "text.primary",
  fontSize: 14,
  fontWeight: 600,
};

export const helperSx = { mt: 0.5, color: "text.secondary", fontSize: 12 };

export const fieldSx = {
  "& .MuiInputBase-root": { minHeight: 36, borderRadius: 1 },
  "& .MuiInputBase-input": { py: 1, fontSize: 12, fontWeight: 500 },
};

export const actionSx = { minHeight: 32, borderRadius: 1, px: 1.75, fontSize: 12, fontWeight: 600, textTransform: "none" };

