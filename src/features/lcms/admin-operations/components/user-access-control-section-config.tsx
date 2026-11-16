import type { AccessScopeType } from "@/features/lcms/admin-operations/api/access-management-api";

export const scopeLabels: Record<AccessScopeType | "none", string> = {
  system: "Hệ thống",
  center: "Trung tâm",
  school: "Trường học",
  none: "Chưa cấp",
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

