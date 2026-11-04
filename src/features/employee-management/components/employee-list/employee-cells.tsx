import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { AppleAvatar } from "@/features/employee-management/components/apple-ui-tokens";
import {
  employeeRoleLabel,
  employeeStatusView,
  scopeLabel,
  summarize,
} from "@/features/employee-management/lib/employee-display";
import type { EmployeeItem } from "@/features/employee-management/types/employee-management";
import { formatDateTimeVi } from "@/lib/format-date";

export type SchoolNames = ReadonlyMap<string, string>;

export function EmployeeIdentity({ employee, size = 36 }: { employee: EmployeeItem; size?: number }) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, minWidth: 0 }}>
      <AppleAvatar name={employee.fullName} size={size} />
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: "fontWeightMedium" }} variant="body2">
          {employee.fullName || "Chưa có tên"}
        </Typography>
        <Typography color="text.secondary" noWrap variant="caption">
          {employee.email}
        </Typography>
      </Box>
    </Box>
  );
}

/** Một chip + "+n"; tooltip liệt kê đủ. */
export function EmployeeRoleSummary({ roles }: { roles: string[] }) {
  const { all, first, rest } = summarize(roles.map(employeeRoleLabel));
  if (!first) return <Typography color="text.secondary" variant="body2">Chưa gán</Typography>;
  return (
    <Tooltip title={all.join(", ")}>
      <Box sx={{ alignItems: "center", display: "inline-flex", gap: 0.75, maxWidth: "100%" }}>
        <Chip label={first} size="small" sx={{ maxWidth: 200 }} variant="outlined" />
        {rest ? <Typography color="text.secondary" variant="caption">+{rest}</Typography> : null}
      </Box>
    </Tooltip>
  );
}

export function EmployeeScopeSummary({ schoolNames, scopes }: { schoolNames: SchoolNames; scopes?: string[] }) {
  const { all, first, rest } = summarize((scopes ?? []).map((scope) => scopeLabel(scope, schoolNames)));
  if (!first) return <Typography color="text.secondary" variant="body2">—</Typography>;
  return (
    <Tooltip title={all.join(", ")}>
      <Box sx={{ alignItems: "center", display: "inline-flex", gap: 0.75, maxWidth: "100%" }}>
        <Typography noWrap variant="body2">{first}</Typography>
        {rest ? <Typography color="text.secondary" variant="caption">+{rest}</Typography> : null}
      </Box>
    </Tooltip>
  );
}

export function EmployeeStatusChip({ status }: { status: string }) {
  const view = employeeStatusView(status);
  return <ErgStatusChip label={view.label} tone={view.tone} />;
}

export function lastLoginText(employee: EmployeeItem) {
  return formatDateTimeVi(employee.last_login_at) || "Chưa đăng nhập";
}
