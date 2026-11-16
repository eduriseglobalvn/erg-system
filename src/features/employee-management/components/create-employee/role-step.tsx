import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { appleCleanInputSx, appleDesign, AppleFormField } from "@/features/employee-management/components/apple-ui-tokens";
import type { EmployeeForm, SetEmployeeForm } from "@/features/employee-management/components/create-employee/constants";
import { applyRoleSelection, assignableRoleValue } from "@/features/rbac/lib/exclusive-roles";
import type { AssignableRole } from "@/features/rbac/api/rbac-api";
import { alpha } from "@mui/material/styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

export function RoleStep({
  form,
  roleOptions,
  setForm,
}: {
  form: EmployeeForm;
  roleOptions: AssignableRole[] | undefined;
  setForm: SetEmployeeForm;
}) {
  const roleById = (value: string) => (roleOptions ?? []).find((role) => assignableRoleValue(role) === value);
  const labelOf = (value: string) => roleById(value)?.label ?? value;
  const isExclusive = (value: string) => roleById(value)?.exclusive ?? false;

  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      {/* Vai trò: chỉ những vai trò người thao tác được phép gán; Giám đốc / Vận hành đứng một mình. */}
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
    </Box>
  );
}
