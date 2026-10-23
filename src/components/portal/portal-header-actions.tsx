import { useState } from "react";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { useInstallPrompt } from "@/features/lms/mobile/hooks/use-install-prompt";
import { HEADER_ICON_BUTTON_SX, HEADER_NETWORK_SHADOW } from "./portal-header-styles";

type PortalHeaderActionsProps = {
  notificationCount: number;
  onOpenNotifications: () => void;
  userName?: string;
};

export function PortalHeaderActions({ notificationCount, onOpenNotifications, userName }: PortalHeaderActionsProps) {
  const badgeCount = notificationCount > 0 ? notificationCount : 24;
  const initial = userName?.charAt(0).toUpperCase() || "E";
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const [installInfoOpen, setInstallInfoOpen] = useState(false);

  const handleInstallClick = () => {
    if (canInstall) {
      void promptInstall();
    } else {
      setInstallInfoOpen(true);
    }
  };

  return (
    <>
      <Tooltip title="Chất lượng kết nối">
        <Box sx={{ alignItems: "center", bgcolor: "#FFFFFF", border: 0, borderRadius: "8px", boxShadow: HEADER_NETWORK_SHADOW, color: "#22C55E", display: { xs: "none", sm: "flex" }, gap: 1, height: 34, px: 1 }}>
          <WifiRoundedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ color: "#22C55E", fontSize: 12, fontWeight: 400, lineHeight: "18px" }}>Mạng tốt</Typography>
        </Box>
      </Tooltip>
      <Tooltip title="Tìm kiếm nhanh">
        <Box component="button" type="button" sx={{ alignItems: "center", bgcolor: "rgba(145,158,171,0.08)", border: 0, borderRadius: "12px", boxShadow: "none", color: "#52616F", cursor: "pointer", display: { xs: "none", md: "flex" }, gap: 0.75, height: 36, ml: 1, px: 1, transition: "all 160ms ease", "&:hover": { bgcolor: "rgba(145,158,171,0.12)", color: "#1C252E" } }}>
          <SearchRoundedIcon sx={{ fontSize: 18 }} />
          <Box component="span" sx={{ bgcolor: "transparent", border: 0, borderRadius: 0, color: "#1C252E", fontSize: 12, fontWeight: 700, height: "auto", lineHeight: "18px", px: 0 }}>⌘K</Box>
        </Box>
      </Tooltip>
      <Tooltip title="Ngôn ngữ">
        <IconButton sx={{ border: 0, bgcolor: "rgba(245,31,36,0.94)", borderRadius: "10px", boxShadow: "none", color: "#FFDE59", display: { xs: "none", sm: "inline-flex" }, height: 40, ml: 1, width: 40, "&:hover": { bgcolor: "#DB1D22" } }}>
          <Typography sx={{ color: "inherit", fontSize: 10, fontWeight: 800, lineHeight: 1 }}>VN</Typography>
        </IconButton>
      </Tooltip>
      <Tooltip title="Trợ lý">
        <IconButton sx={{ ...HEADER_ICON_BUTTON_SX, display: { xs: "none", md: "inline-flex" } }}><AutoAwesomeRoundedIcon sx={{ color: "#696CFF", fontSize: 20 }} /></IconButton>
      </Tooltip>
      <Badge badgeContent={badgeCount} color="error" sx={{ ml: 0.5 }}>
        <Tooltip title="Thông báo">
          <IconButton onClick={onOpenNotifications} sx={HEADER_ICON_BUTTON_SX}><NotificationsNoneRoundedIcon sx={{ fontSize: 20 }} /></IconButton>
        </Tooltip>
      </Badge>
      {!installed ? (
        <Tooltip title="Cài đặt ứng dụng ERG (PWA)">
          <IconButton onClick={handleInstallClick} sx={{ ...HEADER_ICON_BUTTON_SX, color: "#0F6CBD", bgcolor: "rgba(15,108,189,0.08)", "&:hover": { bgcolor: "rgba(15,108,189,0.14)" } }}>
            <DownloadRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      ) : null}
      <Tooltip title="Thiết lập">
        <IconButton sx={{ ...HEADER_ICON_BUTTON_SX, display: { xs: "none", sm: "inline-flex" } }}><SettingsRoundedIcon sx={{ fontSize: 20 }} /></IconButton>
      </Tooltip>
      <Tooltip title={userName || "User"}>
        <IconButton sx={{ bgcolor: "transparent", border: 0, borderRadius: "10px", boxShadow: "none", height: 40, ml: 0.5, width: 40, "&:hover": { bgcolor: "rgba(145,158,171,0.08)" } }}>
          <Avatar sx={{ bgcolor: "#696CFF", border: "2px solid #FFD666", color: "#FFFFFF", fontSize: 13, fontWeight: 700, height: 40, width: 40 }}>{initial}</Avatar>
        </IconButton>
      </Tooltip>

      <Dialog open={installInfoOpen} onClose={() => setInstallInfoOpen(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 2.5, p: 1 } } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, pb: 1 }}>Cài đặt ứng dụng ERG</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Ứng dụng ERG có thể cài đặt về máy tính hoặc điện thoại để hoạt động độc lập toàn màn hình:
            </Typography>
            <Box sx={{ bgcolor: "background.default", p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Trên Chrome / Edge (Máy tính):</Typography>
              <Typography variant="body2" color="text.secondary">
                1. Nhấn biểu tượng <b>Cài đặt (Install)</b> trên thanh địa chỉ (bên phải URL).<br />
                2. Hoặc mở menu <b>⋮</b> góc trên bên phải &gt; chọn <b>"Cài đặt ứng dụng..."</b>.
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              * Lưu ý: Trình duyệt yêu cầu kết nối HTTPS hợp lệ (không bị cảnh báo "Not secure") hoặc truy cập qua <b>localhost</b> để kích hoạt tính năng cài đặt tự động.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstallInfoOpen(false)} variant="contained" sx={{ borderRadius: 1.5, fontWeight: 700 }}>
            Đã hiểu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}