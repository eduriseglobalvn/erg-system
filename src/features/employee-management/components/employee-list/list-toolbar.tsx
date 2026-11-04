import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  EMPLOYEE_STATUS_FILTER_OPTIONS,
  employeeRoleLabel,
} from "@/features/employee-management/lib/employee-display";

type RoleOption = { id: string; name: string };

export function EmployeeListToolbar({
  onRoleChange,
  onSearchChange,
  onStatusChange,
  role,
  roles,
  search,
  status,
  total,
  loading,
}: {
  loading: boolean;
  onRoleChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  role: string;
  roles: RoleOption[];
  search: string;
  status: string;
  total?: number;
}) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", display: "grid", gap: 1.5, p: { md: 2.5, xs: 2 } }}>
      {total !== undefined || loading ? (
        <Typography color="text.secondary" variant="body2">
          {total !== undefined ? `${total} tài khoản` : "Đang tải dữ liệu"}
        </Typography>
      ) : null}
      <Box sx={{ display: "flex", flexDirection: { sm: "row", xs: "column" }, gap: 1.5 }}>
        <TextField
          fullWidth
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm theo tên, mã nhân viên, email, điện thoại"
          size="small"
          slotProps={{
            htmlInput: { "aria-label": "Tìm nhân sự" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          value={search}
        />
        <TextField
          label="Vai trò"
          onChange={(event) => onRoleChange(event.target.value)}
          select
          size="small"
          sx={{ minWidth: { sm: 220 } }}
          value={role}
        >
          <MenuItem value="">Tất cả vai trò</MenuItem>
          {roles.map((item) => (
            <MenuItem key={item.id} value={item.name}>{employeeRoleLabel(item.name)}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Trạng thái"
          onChange={(event) => onStatusChange(event.target.value)}
          select
          size="small"
          sx={{ minWidth: { sm: 180 } }}
          value={status}
        >
          <MenuItem value="">Tất cả trạng thái</MenuItem>
          {EMPLOYEE_STATUS_FILTER_OPTIONS.map((item) => (
            <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
          ))}
        </TextField>
      </Box>
    </Box>
  );
}
