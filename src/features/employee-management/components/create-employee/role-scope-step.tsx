import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { appleCleanInputSx, appleDesign, AppleFormField } from "@/features/employee-management/components/apple-ui-tokens";
import { DEFAULT_CENTER_OPTIONS } from "@/features/employee-management/components/create-employee/constants";
import type { EmployeeForm, SetEmployeeField, SetEmployeeForm } from "@/features/employee-management/components/create-employee/constants";
import { SCOPE_DISPLAY_CATALOG } from "@/platform/auth/permissions/role-display-catalog";
import { applyRoleSelection, assignableRoleValue } from "@/features/rbac/lib/exclusive-roles";
import type { AssignableRole } from "@/features/rbac/api/rbac-api";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function RoleScopeStep({
  dbClasses,
  dbSchools,
  form,
  roleOptions,
  setForm,
  set,
  tenantId,
}: {
  dbClasses: unknown[];
  dbSchools: unknown[];
  form: EmployeeForm;
  roleOptions: AssignableRole[] | undefined;
  set: SetEmployeeField;
  setForm: SetEmployeeForm;
  tenantId: string;
}) {
  const roleById = (value: string) => (roleOptions ?? []).find((role) => assignableRoleValue(role) === value);
  const labelOf = (value: string) => roleById(value)?.label ?? value;
  const isExclusive = (value: string) => roleById(value)?.exclusive ?? false;

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      {/* 1. Vai trò: chỉ những vai trò người thao tác được phép gán; Giám đốc / Vận hành đứng một mình. */}
      <AppleFormField label="Vai trò (chọn một hoặc nhiều)" required>
        <TextField
          select
          fullWidth
          value={form.roleNames}
          onChange={(event) => {
            const picked = typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value;
            const val = applyRoleSelection(form.roleNames, picked, isExclusive);
            setForm((f) => ({ ...f, roleName: val[0] || "", roleNames: val }));
          }}
          helperText="Giám đốc và Vận hành không kết hợp với vai trò khác: chọn một trong hai sẽ bỏ các vai trò còn lại."
          slotProps={{
            select: {
              displayEmpty: true,
              multiple: true,
              renderValue: (selected) => {
                const arr = Array.isArray(selected) ? selected : [];
                if (!arr.length) {
                  return (
                    <Typography sx={{ color: appleDesign.colors.textTertiary, fontSize: "0.85rem" }}>
                      Chọn vai trò...
                    </Typography>
                  );
                }
                return (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {arr.map((roleKey) => (
                      <Chip
                        key={roleKey}
                        size="small"
                        label={labelOf(roleKey)}
                        sx={{
                          bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                          borderRadius: "6px",
                          color: appleDesign.colors.blue,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          height: 24,
                        }}
                      />
                    ))}
                  </Box>
                );
              },
            },
          }}
          sx={appleCleanInputSx}
        >
          {(roleOptions ?? []).map((role) => {
            const value = assignableRoleValue(role);
            return (
              <MenuItem key={role.id} value={value} sx={{ py: 0.5 }}>
                <Checkbox size="small" checked={form.roleNames.includes(value)} sx={{ mr: 1, p: 0.5 }} />
                <ListItemText primary={role.label} />
              </MenuItem>
            );
          })}
        </TextField>
      </AppleFormField>

      {/* 2. Phạm vi tác vụ (Scope Dropdown) */}
      <AppleFormField label="Phạm vi tác vụ (Scope)" required>
        <TextField
          select
          fullWidth
          value={form.scopeType}
          onChange={(event) => {
            const nextScope = event.target.value;
            set("scopeType", nextScope);
            set("scopeId", "");
            setForm((f) => ({
              ...f,
              scopeId: "",
              scopeType: nextScope,
              selectedCenterIds: [],
              selectedClassIds: [],
              selectedSchoolIds: [],
            }));
          }}
          slotProps={{
            select: {
              renderValue: (val) => SCOPE_DISPLAY_CATALOG[String(val)]?.label ?? String(val),
            },
          }}
          sx={appleCleanInputSx}
        >
          {Object.values(SCOPE_DISPLAY_CATALOG).map((scope) => (
            <MenuItem key={scope.scopeType} value={scope.scopeType}>
              {scope.label}
            </MenuItem>
          ))}
        </TextField>
      </AppleFormField>

      {/* 3. Trường học liên kết Dropdown (Multi-select from DB) */}
      {form.scopeType === "SCHOOL" && (
        <AppleFormField label="Trường học liên kết (Chọn một hoặc nhiều trường từ danh sách DB)" required>
          <TextField
            select
            fullWidth
            value={form.selectedSchoolIds}
            onChange={(event) => {
              const val = typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value;
              setForm((f) => ({ ...f, scopeId: val.join(", "), selectedSchoolIds: val }));
            }}
            slotProps={{
              select: {
                displayEmpty: true,
                multiple: true,
                renderValue: (selected) => {
                  const arr = Array.isArray(selected) ? selected : [];
                  if (!arr.length) {
                    return <Typography sx={{ color: appleDesign.colors.textTertiary, fontSize: "0.85rem" }}>Chọn trường học từ cơ sở dữ liệu...</Typography>;
                  }
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {arr.map((id) => {
                        const s = (dbSchools as Array<{ id: string; name: string }>).find((item) => item.id === id);
                        return (
                          <Chip
                            key={id}
                            size="small"
                            label={s ? s.name : id}
                            sx={{
                              bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                              borderRadius: "6px",
                              color: appleDesign.colors.blue,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              height: 24,
                            }}
                          />
                        );
                      })}
                    </Box>
                  );
                },
              },
            }}
            sx={appleCleanInputSx}
          >
            {(dbSchools as Array<{ district?: string | null; id: string; name: string; schoolType?: string }>).map((school) => (
              <MenuItem key={school.id} value={school.id} sx={{ py: 0.5 }}>
                <Checkbox size="small" checked={form.selectedSchoolIds.includes(school.id)} sx={{ mr: 1, p: 0.5 }} />
                <ListItemText
                  primary={
                    <Box sx={{ alignItems: "center", display: "flex", gap: 1, width: "100%" }}>
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{school.name}</Typography>
                      {school.schoolType && (
                        <Typography sx={{ color: "text.secondary", fontSize: "0.72rem", ml: "auto" }}>
                          {school.schoolType} {school.district ? `· ${school.district}` : ""}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </MenuItem>
            ))}
          </TextField>
        </AppleFormField>
      )}

      {/* 4. Lớp học được phân công (Dropdown chọn trường -> Dropdown multi-select lớp từ DB) */}
      {form.scopeType === "CLASS" && (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { sm: "repeat(2, 1fr)", xs: "1fr" } }}>
          <AppleFormField label="Chọn trường của lớp học (DB)" required>
            <TextField
              select
              fullWidth
              value={form.selectedSchoolForClass}
              onChange={(e) => set("selectedSchoolForClass", e.target.value)}
              sx={appleCleanInputSx}
            >
              {(dbSchools as Array<{ id: string; name: string; schoolType?: string }>).map((school) => (
                <MenuItem key={school.id} value={school.id}>
                  {school.name} ({school.schoolType})
                </MenuItem>
              ))}
            </TextField>
          </AppleFormField>

          <AppleFormField label="Chọn danh sách lớp phụ trách (DB)" required>
            <TextField
              select
              fullWidth
              value={form.selectedClassIds}
              onChange={(event) => {
                const val = typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value;
                setForm((f) => ({ ...f, scopeId: val.join(", "), selectedClassIds: val }));
              }}
              slotProps={{
                select: {
                  displayEmpty: true,
                  multiple: true,
                  renderValue: (selected) => {
                    const arr = Array.isArray(selected) ? selected : [];
                    if (!arr.length) {
                      return <Typography sx={{ color: appleDesign.colors.textTertiary, fontSize: "0.85rem" }}>Chọn một hoặc nhiều lớp...</Typography>;
                    }
                    return (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {arr.map((id) => (
                          <Chip
                            key={id}
                            size="small"
                            label={`Lớp ${id}`}
                            sx={{
                              bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                              borderRadius: "6px",
                              color: appleDesign.colors.blue,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              height: 24,
                            }}
                          />
                        ))}
                      </Box>
                    );
                  },
                },
              }}
              sx={appleCleanInputSx}
            >
              {(dbClasses as Array<{ id: string; name: string }>).map((cls) => (
                <MenuItem key={cls.id} value={cls.id} sx={{ py: 0.5 }}>
                  <Checkbox size="small" checked={form.selectedClassIds.includes(cls.id)} sx={{ mr: 1, p: 0.5 }} />
                  <ListItemText primary={<Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{cls.name}</Typography>} />
                </MenuItem>
              ))}
            </TextField>
          </AppleFormField>
        </Box>
      )}

      {/* 5. Cơ sở / Trung tâm đào tạo (Multi-select dropdown) */}
      {form.scopeType === "CENTER" && (
        <AppleFormField label="Cơ sở / Trung tâm đào tạo (Chọn một hoặc nhiều cơ sở)" required>
          <TextField
            select
            fullWidth
            value={form.selectedCenterIds}
            onChange={(event) => {
              const val = typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value;
              setForm((f) => ({ ...f, scopeId: val.join(", "), selectedCenterIds: val }));
            }}
            slotProps={{
              select: {
                displayEmpty: true,
                multiple: true,
                renderValue: (selected) => {
                  const arr = Array.isArray(selected) ? selected : [];
                  if (!arr.length) {
                    return <Typography sx={{ color: appleDesign.colors.textTertiary, fontSize: "0.85rem" }}>Chọn cơ sở đào tạo...</Typography>;
                  }
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {arr.map((id) => {
                        const c = DEFAULT_CENTER_OPTIONS.find((item) => item.id === id);
                        return (
                          <Chip
                            key={id}
                            size="small"
                            label={c ? c.name : id}
                            sx={{
                              bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.08),
                              borderRadius: "6px",
                              color: appleDesign.colors.blue,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              height: 24,
                            }}
                          />
                        );
                      })}
                    </Box>
                  );
                },
              },
            }}
            sx={appleCleanInputSx}
          >
            {DEFAULT_CENTER_OPTIONS.map((center) => (
              <MenuItem key={center.id} value={center.id} sx={{ py: 0.5 }}>
                <Checkbox size="small" checked={form.selectedCenterIds.includes(center.id)} sx={{ mr: 1, p: 0.5 }} />
                <ListItemText primary={<Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{center.name}</Typography>} />
              </MenuItem>
            ))}
          </TextField>
        </AppleFormField>
      )}

      {/* 6. Toàn tổ chức hoặc Toàn hệ thống Notice */}
      {["SYSTEM", "TENANT"].includes(form.scopeType) && (
        <Box
          sx={{
            alignItems: "flex-start",
            bgcolor: alpha(ergEnterpriseTokens.color.primary, 0.04),
            border: `1px solid ${alpha(ergEnterpriseTokens.color.primary, 0.15)}`,
            borderRadius: "12px",
            display: "flex",
            gap: 1.5,
            p: 1.75,
          }}
        >
          <CheckCircleRoundedIcon sx={{ color: appleDesign.colors.blue, fontSize: 20, mt: 0.25 }} />
          <Box>
            <Typography sx={{ color: appleDesign.colors.blue, fontSize: "0.825rem", fontWeight: 600 }}>
              {form.scopeType === "SYSTEM" ? "Toàn bộ hệ thống ERG" : `Toàn tổ chức (${tenantId})`}
            </Typography>
            <Typography sx={{ color: appleDesign.colors.textSecondary, fontSize: "0.76rem", lineHeight: 1.45, mt: 0.25 }}>
              Tài khoản sẽ được tự động kích hoạt quyền hạn trên tất cả các trường học và cơ sở thuộc tổ chức.
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
