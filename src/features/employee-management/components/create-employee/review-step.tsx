import Box from "@mui/material/Box";

import type { EmployeeForm } from "@/features/employee-management/components/create-employee/constants";
import { ReviewRow } from "@/features/employee-management/components/create-employee/review-row";
import { getRoleMeta, getScopeMeta } from "@/platform/auth/permissions/role-display-catalog";

export function ReviewStep({
  chosenRoles,
  effectiveScopeId,
  form,
}: {
  chosenRoles: string[];
  effectiveScopeId: string;
  form: EmployeeForm;
}) {
  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <ReviewRow label="Nhân sự" value={`${form.fullName} · ${form.employeeCode}`} />
      <ReviewRow label="Liên hệ" value={`${form.email}${form.phone ? ` · ${form.phone}` : ""}`} />
      <ReviewRow label="Nghề nghiệp" value={`${form.jobTitle}${form.departmentId ? ` · ${form.departmentId}` : ""}`} />
      <ReviewRow
        label="Nhóm quyền đã cấp"
        value={chosenRoles.map((r) => getRoleMeta(r).label).join(", ") || "Chưa chọn quyền"}
      />
      <ReviewRow
        label="Phạm vi áp dụng"
        value={`${getScopeMeta(form.scopeType).label}: ${effectiveScopeId || "Toàn tổ chức"}`}
      />
      <ReviewRow
        label="Phương thức cấp mật khẩu"
        value={form.credentialDelivery === "EMAIL_INVITE" ? "Gửi thư mời qua Email" : "Tạo Temporary Credential một lần"}
      />
    </Box>
  );
}
