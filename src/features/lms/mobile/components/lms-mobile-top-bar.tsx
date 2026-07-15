import type { ReactNode } from "react";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ERG_ASSETS } from "@/config/seo";

export function LmsMobileTopBar({
  canInstall, selectedClassName, installed, notificationCenter, online, schoolName, teacherName,
  unreadNotificationCount = 0, updateAvailable, onAccountOpen, onInstall, onOpenNotifications, onScopeOpen, onUpdate,
}: {
  activeLabel: string; canInstall: boolean; selectedClassName: string; installed: boolean;
  notificationCenter?: ReactNode; online: boolean; schoolName: string; teacherName: string;
  unreadNotificationCount?: number; updateAvailable: boolean; onAccountOpen: () => void; onInstall: () => void;
  onOpenNotifications?: () => void; onScopeOpen: () => void; onUpdate: () => void;
}) {
  const initial = teacherName.trim().slice(0, 1).toUpperCase() || "GV";
  const iconButtonSx = { bgcolor: "background.paper", border: "1px solid", borderColor: "divider", height: 40, width: 40 };

  return (
    <Box component="header" sx={{ bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", boxShadow: "0 8px 24px rgba(15,23,42,0.06)", display: { xs: "block", xl: "none" }, pb: 1.25, pt: "calc(env(safe-area-inset-top, 0px) + 8px)", px: 1.5, position: "sticky", top: 0, zIndex: (theme) => theme.zIndex.appBar }}>
      <Stack alignItems="center" direction="row" spacing={1} sx={{ minHeight: 48 }}>
        <IconButton aria-label="Chọn lớp" onClick={onScopeOpen} sx={iconButtonSx}>
          <Box alt="ERG" component="img" src={ERG_ASSETS.logo} sx={{ maxHeight: 24, maxWidth: 28, objectFit: "contain" }} />
        </IconButton>

        <ButtonBase onClick={onScopeOpen} sx={{ bgcolor: "background.default", border: "1px solid", borderColor: "divider", borderRadius: 5, flex: 1, minHeight: 40, minWidth: 0, px: 1.5, py: 0.5, textAlign: "left" }}>
          <Box sx={{ minWidth: 0, width: "100%" }}>
            <Stack alignItems="center" direction="row" spacing={0.5}>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1.4 }}>{selectedClassName || "Lớp học"}</Typography>
              <ExpandMoreRoundedIcon sx={{ color: "text.secondary", flexShrink: 0, fontSize: 17 }} />
            </Stack>
            <Typography color="text.secondary" noWrap sx={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1.4 }}>{schoolName}</Typography>
          </Box>
        </ButtonBase>

        <Stack alignItems="center" direction="row" spacing={0.5}>
          {updateAvailable ? <IconButton aria-label="Cập nhật ứng dụng" onClick={onUpdate} sx={iconButtonSx}><RefreshRoundedIcon sx={{ fontSize: 19 }} /></IconButton> : null}
          {canInstall && !installed ? <IconButton aria-label="Cài LMS PWA" onClick={onInstall} sx={iconButtonSx}><DownloadRoundedIcon sx={{ fontSize: 19 }} /></IconButton> : null}
          {!online ? <Box aria-label="Đang offline" sx={{ alignItems: "center", bgcolor: "warning.light", borderRadius: "50%", color: "warning.dark", display: "flex", height: 40, justifyContent: "center", width: 40 }}><WifiOffRoundedIcon sx={{ fontSize: 19 }} /></Box> : null}
          {notificationCenter ?? (
            <IconButton aria-label="Thông báo" onClick={onOpenNotifications} sx={iconButtonSx}>
              <Badge badgeContent={unreadNotificationCount > 9 ? "9+" : unreadNotificationCount} color="error"><NotificationsNoneRoundedIcon sx={{ fontSize: 19 }} /></Badge>
            </IconButton>
          )}
          <IconButton aria-label={`Tài khoản ${teacherName}`} onClick={onAccountOpen} sx={{ height: 40, p: 0.5, width: 40 }}>
            <Avatar sx={{ bgcolor: "warning.main", fontSize: 12, fontWeight: 800, height: 32, width: 32 }}>{initial}</Avatar>
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
}
