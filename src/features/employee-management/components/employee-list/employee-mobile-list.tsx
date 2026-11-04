import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { AppleAvatar } from "@/features/employee-management/components/apple-ui-tokens";
import { EmployeeStatusChip } from "@/features/employee-management/components/employee-list/employee-cells";
import { employeeRoleLabel } from "@/features/employee-management/lib/employee-display";
import type { EmployeeItem } from "@/features/employee-management/types/employee-management";

/** Hai dòng mỗi nhân sự: tên + trạng thái / email · vai trò. */
export function EmployeeMobileList({
  employees,
  onOpenMenu,
  onSelect,
}: {
  employees: EmployeeItem[];
  onOpenMenu: (event: React.MouseEvent<HTMLElement>, employee: EmployeeItem) => void;
  onSelect: (userId: string) => void;
}) {
  return (
    <Box component="ul" aria-label="Danh sách nhân sự" sx={{ listStyle: "none", m: 0, p: 0 }}>
      {employees.map((employee) => (
        <Box
          component="li"
          key={employee.id}
          onClick={() => onSelect(employee.id)}
          sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", cursor: "pointer", display: "flex", gap: 1.5, px: 2, py: 1.25 }}
        >
          <AppleAvatar name={employee.fullName} size={36} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
              <Typography noWrap sx={{ fontWeight: "fontWeightMedium" }} variant="body2">{employee.fullName}</Typography>
              <EmployeeStatusChip status={employee.status} />
            </Box>
            <Typography color="text.secondary" noWrap variant="caption">
              {[employee.email, employee.roles[0] ? employeeRoleLabel(employee.roles[0]) : ""].filter(Boolean).join(" · ")}
            </Typography>
          </Box>
          <IconButton aria-label={`Thao tác cho ${employee.fullName}`} onClick={(event) => onOpenMenu(event, employee)} size="small">
            <MoreVertRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
    </Box>
  );
}
