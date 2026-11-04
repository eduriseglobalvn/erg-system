import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export function EmployeeActionMenu({
  anchorEl,
  onAssignRole,
  onClose,
  onToggleStatus,
  onView,
  status,
}: {
  anchorEl: HTMLElement | null;
  onAssignRole: () => void;
  onClose: () => void;
  onToggleStatus: () => void;
  onView: () => void;
  status?: string;
}) {
  return (
    <Menu anchorEl={anchorEl} onClose={onClose} open={Boolean(anchorEl)}>
      <MenuItem onClick={onView}>Xem hồ sơ</MenuItem>
      <MenuItem onClick={onAssignRole}>Gán nhóm quyền</MenuItem>
      <MenuItem onClick={onToggleStatus}>{status === "ACTIVE" ? "Khoá tài khoản" : "Mở khoá tài khoản"}</MenuItem>
    </Menu>
  );
}
