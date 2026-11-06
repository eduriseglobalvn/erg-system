import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { ErgTable } from "@/components/erg-mui/erg-table";
import {
  EmployeeIdentity,
  EmployeeRoleSummary,
  EmployeeScopeSummary,
  EmployeeStatusChip,
  lastLoginText,
  type SchoolNames,
} from "@/features/employee-management/components/employee-list/employee-cells";
import type { EmployeeItem } from "@/features/employee-management/types/employee-management";

type OpenMenu = (event: React.MouseEvent<HTMLElement>, employee: EmployeeItem) => void;

export function EmployeeTable({
  employees,
  onOpenMenu,
  onSelect,
  schoolNames,
}: {
  employees: EmployeeItem[];
  onOpenMenu: OpenMenu;
  onSelect: (userId: string) => void;
  schoolNames: SchoolNames;
}) {
  return (
    <ErgTable aria-label="Danh sách nhân sự" sx={{ "& .MuiTableCell-head": { whiteSpace: "nowrap" } }}>
      <TableHead>
        <TableRow>
          <TableCell>Nhân sự</TableCell>
          <TableCell>Vai trò</TableCell>
          <TableCell>Phạm vi</TableCell>
          <TableCell>Trạng thái</TableCell>
          <TableCell>Đăng nhập cuối</TableCell>
          <TableCell align="right" sx={{ width: 56 }}>
            <Box component="span" sx={{ clipPath: "inset(50%)", position: "absolute" }}>Thao tác</Box>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {employees.map((employee) => (
          <TableRow hover key={employee.id} onClick={() => onSelect(employee.id)} sx={{ cursor: "pointer" }}>
            <TableCell sx={{ maxWidth: 280 }}><EmployeeIdentity employee={employee} /></TableCell>
            <TableCell sx={{ maxWidth: 220 }}><EmployeeRoleSummary roles={employee.roles} /></TableCell>
            <TableCell sx={{ maxWidth: 220 }}>
              <EmployeeScopeSummary schoolNames={schoolNames} scopes={employee.scopes} />
            </TableCell>
            <TableCell><EmployeeStatusChip status={employee.status} /></TableCell>
            <TableCell sx={{ whiteSpace: "nowrap" }}>
              <Typography color={employee.last_login_at ? "text.primary" : "text.secondary"} variant="body2">
                {lastLoginText(employee)}
              </Typography>
            </TableCell>
            <TableCell align="right">
              <IconButton
                aria-label={`Thao tác cho ${employee.fullName}`}
                onClick={(event) => onOpenMenu(event, employee)}
                size="small"
              >
                <MoreVertRoundedIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </ErgTable>
  );
}
