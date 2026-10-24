"use client";

import { useState } from "react";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { useInstallPrompt } from "@/features/lms/mobile/hooks/use-install-prompt";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { logoutStudentSession } from "@/platform/auth/api/student-auth-storage";
import type { PortalInfo } from "./ErgPortalLayout";
import { PORTAL_NOTIFICATIONS, type PortalNotificationTab } from "./portal-header-notification-data";
import { PortalHeaderNotifications } from "./portal-header-notifications";
import { SIDEBAR_MOTION_MS } from "./portal-sidebar-styles";

export function SidebarBottom({
  collapsed,
  portalInfo,
  notificationCount = 0,
  onNavigate,
  onSignOut,
}: {
  collapsed: boolean;
  portalInfo?: PortalInfo;
  notificationCount?: number;
  onNavigate?: (path: string) => void;
  onSignOut?: () => void;
}) {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PortalNotificationTab>("all");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  void onNavigate;

  const userName = portalInfo?.userName || "Người dùng";
  const userEmail = portalInfo?.userEmail || "Tài khoản ERG";
  const initial = userName.charAt(0).toUpperCase() || "E";

  const notifications = activeTab === "unread"
    ? PORTAL_NOTIFICATIONS.filter((n) => !n.isRead)
    : PORTAL_NOTIFICATIONS;

  const handleSearchClick = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true, bubbles: true }));
  };

  const handleLogout = () => {
    setMenuAnchor(null);
    if (onSignOut) { onSignOut(); return; }
    logoutStudentSession();
    logoutAccount();
    window.location.reload();
  };

  const actionBtnSx = {
    bgcolor: "rgba(145,158,171,0.06)",
    border: "1px solid rgba(145,158,171,0.14)",
    borderRadius: "8px",
    color: "#637381",
    height: 34,
    width: 34,
    "&:hover": { bgcolor: "rgba(145,158,171,0.12)", color: "#1C252E" },
  };

  return (
    <Box sx={{ borderTop: "1px solid rgba(145,158,171,0.12)", flexShrink: 0, p: collapsed ? 1 : 1.25, transition: `all ${SIDEBAR_MOTION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`, width: "100%" }}>
      {collapsed ? (
        <Box sx={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
          <Tooltip title="Tìm kiếm nhanh (⌘K)" placement="right">
            <IconButton onClick={handleSearchClick} size="small" sx={actionBtnSx}>
              <SearchRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Thông báo" placement="right">
            <IconButton onClick={() => setNotificationOpen(true)} size="small" sx={actionBtnSx}>
              {notificationCount > 0 ? (
                <Badge badgeContent={notificationCount} color="error" max={99}>
                  <NotificationsNoneRoundedIcon sx={{ fontSize: 18 }} />
                </Badge>
              ) : (
                <NotificationsNoneRoundedIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title={userName} placement="right">
            <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ p: 0, "&:hover": { opacity: 0.85 } }}>
              <Avatar sx={{ bgcolor: "#2563EB", color: "#FFFFFF", fontSize: 12, fontWeight: 700, height: 32, width: 32 }}>{initial}</Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
          <Box component="button" type="button" onClick={handleSearchClick} sx={{ alignItems: "center", bgcolor: "rgba(145,158,171,0.06)", border: "1px solid rgba(145,158,171,0.14)", borderRadius: "8px", color: "#637381", cursor: "pointer", display: "flex", gap: 0.75, height: 32, px: 1, textAlign: "left", width: "100%", "&:hover": { bgcolor: "rgba(145,158,171,0.12)", color: "#1C252E" } }}>
            <SearchRoundedIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ color: "#919EAB", flex: 1, fontSize: 11.5, fontWeight: 500 }}>Tìm kiếm...</Typography>
            <Box component="span" sx={{ bgcolor: "#FFFFFF", border: "1px solid rgba(145,158,171,0.2)", borderRadius: "4px", color: "#637381", fontSize: 10, fontWeight: 700, px: 0.5, py: 0.05 }}>⌘K</Box>
          </Box>
          <Box sx={{ alignItems: "center", display: "flex", gap: 0.75, width: "100%" }}>
            <Box onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ alignItems: "center", borderRadius: "8px", cursor: "pointer", display: "flex", flex: 1, gap: 1, minWidth: 0, p: "3px 5px", transition: "background 140ms ease", "&:hover": { bgcolor: "rgba(145,158,171,0.08)" } }}>
              <Avatar sx={{ bgcolor: "#2563EB", color: "#FFFFFF", fontSize: 12, fontWeight: 700, height: 32, width: 32 }}>{initial}</Avatar>
              <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <Typography noWrap sx={{ color: "#0F172A", fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>{userName}</Typography>
                <Typography noWrap sx={{ color: "#94A3B8", fontSize: 10, lineHeight: 1.2, mt: 0.2 }}>{userEmail}</Typography>
              </Box>
            </Box>
            <Tooltip title="Thông báo">
              <IconButton onClick={() => setNotificationOpen(true)} size="small" sx={actionBtnSx}>
                {notificationCount > 0 ? (
                  <Badge badgeContent={notificationCount} color="error" max={99}>
                    <NotificationsNoneRoundedIcon sx={{ fontSize: 18 }} />
                  </Badge>
                ) : (
                  <NotificationsNoneRoundedIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} slotProps={{ paper: { sx: { borderRadius: "12px", boxShadow: "0 10px 30px rgba(15,23,42,0.12)", minWidth: 200, p: 0.5 } } }}>
        <Box sx={{ px: 1.5, py: 0.75 }}>
          <Typography variant="subtitle2" sx={{ color: "#0F172A", fontSize: 13, fontWeight: 700 }}>{userName}</Typography>
          <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: 11 }}>{userEmail}</Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        {!installed && canInstall ? (
          <MenuItem onClick={() => { setMenuAnchor(null); void promptInstall(); }} sx={{ borderRadius: "8px", fontSize: 12.5, gap: 1 }}>
            <DownloadRoundedIcon sx={{ fontSize: 16 }} /> Cài đặt ứng dụng ERG
          </MenuItem>
        ) : null}
        <MenuItem onClick={handleLogout} sx={{ borderRadius: "8px", color: "#EF4444", fontSize: 12.5, gap: 1 }}>
          <LogoutRoundedIcon sx={{ fontSize: 16 }} /> Đăng xuất
        </MenuItem>
      </Menu>

      <PortalHeaderNotifications
        activeTab={activeTab}
        notifications={notifications}
        onClose={() => setNotificationOpen(false)}
        onTabChange={setActiveTab}
        open={notificationOpen}
      />
    </Box>
  );
}
