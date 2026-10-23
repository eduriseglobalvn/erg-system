import { useEffect, useState } from "react";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";
import { AUTH_ACCOUNT_CHANGED_EVENT, getCurrentAccount } from "@/platform/auth/api/auth-storage";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

function getInitials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function DashboardAccountMenu({ onLogout }: { onLogout: () => void }) {
  const [account, setAccount] = useState(() => getCurrentAccount());
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const syncAccount = () => setAccount(getCurrentAccount());
    window.addEventListener(AUTH_ACCOUNT_CHANGED_EVENT, syncAccount);
    return () => window.removeEventListener(AUTH_ACCOUNT_CHANGED_EVENT, syncAccount);
  }, []);

  const accountName = account?.fullName || "Giáo viên ERG";
  const accountEmail = account?.email || "teacher@erg.edu.vn";
  const accountAvatar = account?.avatarUrl || undefined;

  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
      <IconButton aria-label="Thông báo"><NotificationsNoneRoundedIcon /></IconButton>
      <IconButton aria-label={`Mở tài khoản ${accountName}`} onClick={(event) => setAnchor(event.currentTarget)} sx={{ p: 0.5 }}>
        <Badge color="success" overlap="circular" variant="dot"><Avatar src={accountAvatar} sx={{ bgcolor: "primary.main", fontSize: 11, fontWeight: 700, height: 34, width: 34 }}>{getInitials(accountName)}</Avatar></Badge>
      </IconButton>
      <Menu anchorEl={anchor} onClose={() => setAnchor(null)} open={Boolean(anchor)} slotProps={{ paper: { sx: { mt: 1, p: 1, width: 288 } } }}>
        <Box sx={{ bgcolor: "background.default", borderRadius: 2, p: 1.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Avatar src={accountAvatar} variant="rounded" sx={{ bgcolor: "primary.main", height: 48, width: 48 }}>{getInitials(accountName)}</Avatar>
            <Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ fontSize: 14, fontWeight: 750 }}>{accountName}</Typography><Typography color="text.secondary" noWrap variant="caption">{accountEmail}</Typography><Typography color="success.main" sx={{ fontSize: 11, mt: 0.5 }}>Online</Typography></Box>
          </Stack>
        </Box>
        <Divider sx={{ my: 1 }} />
        <MenuItem component={Link} to={teacherPath("/profile")} onClick={() => setAnchor(null)} sx={{ borderRadius: 1.5, gap: 1.25 }}><PersonOutlineRoundedIcon fontSize="small" /><Typography variant="body2">Hồ sơ cá nhân</Typography></MenuItem>
        <MenuItem onClick={() => setAnchor(null)} sx={{ borderRadius: 1.5, gap: 1.25 }}><SettingsOutlinedIcon fontSize="small" /><Typography variant="body2">Cài đặt</Typography></MenuItem>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={() => { onLogout(); setAnchor(null); }} sx={{ borderRadius: 1.5, color: "error.main", gap: 1.25 }}><LogoutRoundedIcon fontSize="small" /><Typography variant="body2">Đăng xuất</Typography></MenuItem>
      </Menu>
    </Stack>
  );
}
