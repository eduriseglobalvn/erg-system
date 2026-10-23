import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";

import { ErgContentBand, ErgPageSurface, ErgSectionHeader } from "@/components/erg-mui/erg-layout";
import { ErgDataTableShell, ErgTable, ErgTableToolbar } from "@/components/erg-mui/erg-table";
import { ErgEmptyState, ErgErrorState, ErgLoadingSkeleton, ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { CreateEmployeeWizard } from "@/features/employee-management/components/create-employee-wizard";
import { EmployeeDetailDrawer } from "@/features/employee-management/components/employee-detail-drawer";
import { useEmployeeCommands, useEmployeeRoleOptions, useEmployees } from "@/features/employee-management/hooks/use-employee-management";
import type { EmployeeItem } from "@/features/employee-management/types/employee-management";

export function EmployeeListWorkspace({ tenantId }: { tenantId: string }) {
  const [search, setSearch] = useState("");
  const [querySearch, setQuerySearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [createOpen, setCreateOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [actionEmployee, setActionEmployee] = useState<EmployeeItem>();
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const commands = useEmployeeCommands(tenantId);
  const rolesQuery = useEmployeeRoleOptions(tenantId);
  useEffect(() => { const timer = window.setTimeout(() => setQuerySearch(search.trim()), 250); return () => window.clearTimeout(timer); }, [search]);
  const query = useEmployees(tenantId, { page: 1, limit: 25, search: querySearch || undefined });
  const employees = query.data?.users ?? [];

  const openMenu = (event: React.MouseEvent<HTMLElement>, employee: EmployeeItem) => {
    event.stopPropagation(); setMenuAnchor(event.currentTarget); setActionEmployee(employee);
  };
  const closeMenu = () => setMenuAnchor(null);
  const openRoleDialog = () => { setRoleName(""); setRoleDialogOpen(true); closeMenu(); };
  const assignRole = async () => {
    if (!actionEmployee || !roleName) return;
    await commands.roles.mutateAsync({ userId: actionEmployee.id, roles: [...new Set([...actionEmployee.roles, roleName])] });
    setRoleDialogOpen(false);
  };

  return <ErgContentBand>
    <ErgSectionHeader eyebrow="Quản lý" title="Tài khoản nhân sự" description="Quản lý hồ sơ, nhóm quyền, scope, trạng thái, credential, rủi ro và session trong một workspace." action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setCreateOpen(true)}>Tạo tài khoản</Button>} />
    <ErgPageSurface flush><ErgDataTableShell toolbar={<ErgTableToolbar title="Danh sách nhân sự" meta={query.data ? `${query.data.meta.total} tài khoản` : "Đang tải dữ liệu"} actions={<TextField size="small" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, mã nhân viên, email, điện thoại..." slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} />} />}>
      {query.isPending ? <Box sx={{ p: 2 }}><ErgLoadingSkeleton rows={7} /></Box> : null}
      {query.isError ? <Box sx={{ p: 2 }}><ErgErrorState title="Không tải được nhân sự" description="Không dùng danh sách giả khi API quản trị gặp lỗi." /></Box> : null}
      {!query.isPending && !query.isError && !employees.length ? <Box sx={{ p: 2 }}><ErgEmptyState title="Chưa có nhân sự phù hợp" /></Box> : null}
      {!query.isPending && !query.isError && employees.length ? <ErgTable aria-label="Danh sách nhân sự"><TableHead><TableRow><TableCell>Nhân sự</TableCell><TableCell>Phòng ban & chức danh</TableCell><TableCell>Nhóm quyền & scope</TableCell><TableCell>Trạng thái & rủi ro</TableCell><TableCell>Thiết bị</TableCell><TableCell>Lần đăng nhập cuối</TableCell><TableCell align="right">Thao tác</TableCell></TableRow></TableHead><TableBody>{employees.map((employee) => <TableRow hover key={employee.id} onClick={() => setSelectedUserId(employee.id)} sx={{ cursor: "pointer" }}>
        <TableCell><Typography variant="body2" sx={{ fontWeight: 800 }}>{employee.fullName}</Typography><Typography color="text.secondary" variant="caption">{employee.employeeCode || employee.id}</Typography><Typography color="text.secondary" variant="caption" sx={{ display: "block" }}>{employee.email}</Typography></TableCell>
        <TableCell><Typography variant="body2">{employee.jobTitle || "Chưa có chức danh"}</Typography><Typography color="text.secondary" variant="caption">{employee.departmentId || "Chưa có phòng ban"}</Typography></TableCell>
        <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{employee.roles.length ? employee.roles.join(", ") : "Chưa gán"}</Typography><Typography color="text.secondary" variant="caption">{employee.scopes?.join(", ") || "Chưa giới hạn scope"}</Typography></TableCell>
        <TableCell><Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}><ErgStatusChip label={employee.status} tone={employee.status === "ACTIVE" ? "success" : "warning"} />{employee.riskCode ? <ErgStatusChip label={employee.riskCode} tone="warning" /> : null}</Box></TableCell>
        <TableCell><Typography variant="body2">{employee.activeDeviceCount ?? 0} thiết bị</Typography><Typography color="text.secondary" variant="caption">{employee.activePlatforms?.join(" · ") || "Không có phiên active"}</Typography></TableCell>
        <TableCell>{employee.last_login_at ? new Date(employee.last_login_at).toLocaleString("vi-VN") : "Chưa đăng nhập"}</TableCell>
        <TableCell align="right"><IconButton aria-label={`Thao tác cho ${employee.fullName}`} onClick={(event) => openMenu(event, employee)}><MoreVertRoundedIcon /></IconButton></TableCell>
      </TableRow>)}</TableBody></ErgTable> : null}
    </ErgDataTableShell></ErgPageSurface>
    <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}><MenuItem onClick={() => { if (actionEmployee) setSelectedUserId(actionEmployee.id); closeMenu(); }}>Xem hồ sơ</MenuItem><MenuItem onClick={openRoleDialog}>Gán nhóm quyền</MenuItem><MenuItem onClick={() => { if (actionEmployee) void commands.status.mutateAsync({ userId: actionEmployee.id, status: actionEmployee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }); closeMenu(); }}>{actionEmployee?.status === "ACTIVE" ? "Deactive tài khoản" : "Active tài khoản"}</MenuItem></Menu>
    <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} fullWidth maxWidth="xs"><DialogTitle>Gán nhóm quyền</DialogTitle><DialogContent><DialogContentText sx={{ mb: 2 }}>Nhóm mới được cộng vào các nhóm hiện có. Thay đổi có audit và tăng authz version.</DialogContentText><TextField select fullWidth label="Nhóm quyền" value={roleName} onChange={(event) => setRoleName(event.target.value)}>{(rolesQuery.data ?? []).map((role) => <MenuItem key={role.id} value={role.name}>{role.name}</MenuItem>)}</TextField></DialogContent><DialogActions><Button color="inherit" onClick={() => setRoleDialogOpen(false)}>Hủy</Button><Button variant="contained" onClick={() => void assignRole()} disabled={!roleName || commands.roles.isPending}>Xác nhận gán quyền</Button></DialogActions></Dialog>
    <EmployeeDetailDrawer tenantId={tenantId} userId={selectedUserId} onClose={() => setSelectedUserId(undefined)} /><CreateEmployeeWizard tenantId={tenantId} open={createOpen} onClose={() => setCreateOpen(false)} />
  </ErgContentBand>;
}
