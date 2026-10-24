import { useState } from "react";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { useInstallPrompt } from "@/features/lms/mobile/hooks/use-install-prompt";
import { useOnlineStatus } from "@/features/lms/mobile/hooks/use-online-status";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { logoutStudentSession } from "@/platform/auth/api/student-auth-storage";
import { HEADER_ICON_BUTTON_SX } from "./portal-header-styles";

type PortalHeaderActionsProps = {
  notificationCount: number;
  onOpenNotifications: () => void;
  userName?: string;
  userEmail?: string;
  onSignOut?: () => void;
};

export function PortalHeaderActions({ notificationCount, onOpenNotifications, userName, userEmail, onSignOut }: PortalHeaderActionsProps) {
  const isOnline = useOnlineStatus();
  const initial = userName?.charAt(0).toUpperCase() || "E";
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const [installInfoOpen, setInstallInfoOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleInstallClick = () => {
    if (canInstall) void promptInstall();
    else setInstallInfoOpen(true);
  };

  const handleLogout = () => {
    setMenuAnchor(null);
    if (onSignOut) { onSignOut(); return; }
    logoutStudentSession();
    logoutAccount();
    window.location.reload();
  };

  return (
    <>
      {!isOnline ? (
        <Tooltip title="Mất kết nối mạng - Đang ở chế độ offline">
          <Box sx={{ alignItems: "center", bgcolor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "6px", color: "#EF4444", display: "inline-flex", gap: 0.6, height: 28, px: 0.85 }}>
            <WifiOffRoundedIcon sx={{ fontSize: 15 }} />
            <Typography sx={{ color: "#EF4444", fontSize: 11.5, fontWeight: 700 }}>Mất kết nối</Typography>
          </Box>
        </Tooltip>
      ) : null}

      <Tooltip title="Tìm kiếm nhanh (⌘K)">
        <Box component="button" type="button" sx={{ alignItems: "center", bgcolor: "rgba(145,158,171,0.06)", border: "1px solid rgba(145,158,171,0.14)", borderRadius: "8px", color: "#637381", cursor: "pointer", display: { xs: "none", md: "inline-flex" }, gap: 0.75, height: 32, ml: 0.5, px: 1, transition: "all 140ms ease", "&:hover": { bgcolor: "rgba(145,158,171,0.12)", color: "#1C252E" } }}>
          <SearchRoundedIcon sx={{ fontSize: 16 }} />
          <Box component="span" sx={{ color: "#919EAB", fontSize: 11.5, fontWeight: 500 }}>Tìm kiếm...</Box>
          <Box component="span" sx={{ bgcolor: "#FFFFFF", border: "1px solid rgba(145,158,171,0.2)", borderRadius: "4px", color: "#637381", fontSize: 10, fontWeight: 700, px: 0.5, py: 0.05 }}>⌘K</Box>
        </Box>
      </Tooltip>

      <Tooltip title="Thông báo">
        <IconButton onClick={onOpenNotifications} sx={{ ...HEADER_ICON_BUTTON_SX, height: 32, width: 32, ml: 0.5 }}>
          {notificationCount > 0 ? (
            <Badge badgeContent={notificationCount} color="error" max={99}>
              <NotificationsNoneRoundedIcon sx={{ fontSize: 19 }} />
            </Badge>
          ) : (
            <NotificationsNoneRoundedIcon sx={{ fontSize: 19 }} />
          )}
        </IconButton>
      </Tooltip>

      <Tooltip title={userName || "Tài khoản"}>
        <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ bgcolor: "transparent", border: 0, borderRadius: "50%", boxShadow: "none", height: 32, ml: 0.5, p: 0, width: 32, "&:hover": { opacity: 0.88 } }}>
          <Avatar sx={{ bgcolor: "#2563EB", color: "#FFFFFF", fontSize: 12, fontWeight: 700, height: 30, width: 30 }}>{initial}</Avatar>
        </IconButton>
      </Tooltip>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} slotProps={{ paper: { sx: { borderRadius: "12px", boxShadow: "0 10px 30px rgba(15,23,42,0.12)", minWidth: 200, mt: 0.75, p: 0.5 } } }}>
        <Box sx={{ px: 1.5, py: 0.75 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0F172A", fontSize: 13 }}>{userName || "Người dùng"}</Typography>
          <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: 11 }}>{userEmail || "Tài khoản ERG"}</Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        {!installed ? (
          <MenuItem onClick={() => { setMenuAnchor(null); handleInstallClick(); }} sx={{ borderRadius: "6px", gap: 1, py: 0.75 }}>
            <DownloadRoundedIcon sx={{ fontSize: 17, color: "#2563EB" }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>Cài đặt ứng dụng ERG</Typography>
          </MenuItem>
        ) : null}
        <MenuItem onClick={handleLogout} sx={{ borderRadius: "6px", color: "#EF4444", gap: 1, py: 0.75 }}>
          <LogoutRoundedIcon sx={{ fontSize: 17 }} />
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>Đăng xuất</Typography>
        </MenuItem>
      </Menu>

      <Dialog open={installInfoOpen} onClose={() => setInstallInfoOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 2.5, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 17, pb: 1 }}>Cài đặt ứng dụng ERG</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">Ứng dụng ERG có thể cài đặt về máy tính hoặc điện thoại để hoạt động độc lập toàn màn hình:</Typography>
            <Box sx={{ bgcolor: "background.default", p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Trên Chrome / Edge (Máy tính):</Typography>
              <Typography variant="body2" color="text.secondary">1. Nhấn biểu tượng <b>Cài đặt (Install)</b> trên thanh địa chỉ.<br />2. Hoặc mở menu <b>⋮</b> &gt; chọn <b>"Cài đặt ứng dụng..."</b>.</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">* Lưu ý: Trình duyệt yêu cầu kết nối HTTPS hợp lệ hoặc <b>localhost</b> để kích hoạt cài đặt tự động.</Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstallInfoOpen(false)} variant="contained" sx={{ borderRadius: 1.5, fontWeight: 700 }}>Đã hiểu</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
