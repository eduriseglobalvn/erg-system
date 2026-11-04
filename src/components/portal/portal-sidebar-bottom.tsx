"use client";

import { useState } from "react";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useLocation } from "@tanstack/react-router";

import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { logoutStudentSession } from "@/platform/auth/api/student-auth-storage";
import { adminPath, teacherPath } from "@/platform/workspaces/workspace-paths";
import type { PortalInfo } from "./ErgPortalLayout";
import type { PortalNotificationTab } from "./portal-header-notification-data";
import { PortalHeaderNotifications } from "./portal-header-notifications";
import { NavBadge } from "./portal-sidebar-parts";
import {
  NAV_BORDER,
  NAV_CARD_SHADOW,
  NAV_FS,
  NAV_FW,
  NAV_HOVER_BG,
  NAV_ICON_SIZE,
  NAV_ITEM_RADIUS,
  NAV_PADDING,
  NAV_PRIMARY,
  NAV_RAISED_RADIUS,
  NAV_TILE_SIZE,
} from "./portal-sidebar-styles";
import { notificationPortalFromPath, usePortalNotifications } from "./use-portal-notifications";

function profilePath(pathname: string) {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return adminPath("/profile");
  if (pathname === "/teacher" || pathname.startsWith("/teacher/")) return teacherPath("/profile");
  return undefined;
}

export function SidebarBottom({
  collapsed,
  notificationCount: notificationCountProp = 0,
  onNavigate,
  onSignOut,
  portalInfo,
}: {
  collapsed: boolean;
  notificationCount?: number;
  onNavigate?: (path: string) => void;
  onSignOut?: () => void;
  portalInfo?: PortalInfo;
}) {
  const pathname = useLocation()?.pathname ?? "";
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PortalNotificationTab>("all");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const { canInstall, installed, promptInstall } = useInstallPrompt();

  const userName = portalInfo?.userName || "Người dùng";
  const userEmail = portalInfo?.userEmail || "Tài khoản ERG";
  const initial = userName.charAt(0).toUpperCase() || "E";
  const profile = profilePath(pathname);

  const { notifications, unreadCount } = usePortalNotifications(
    notificationPortalFromPath(pathname),
    activeTab,
    notificationOpen,
  );
  const notificationCount = unreadCount ?? notificationCountProp;

  const closeMenu = () => setMenuAnchor(null);
  const openMenu = (event: { currentTarget: HTMLElement }) => setMenuAnchor(event.currentTarget);
  const handleSearchClick = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true, bubbles: true }));
  };
  const handleLogout = () => {
    closeMenu();
    if (onSignOut) return onSignOut();
    logoutStudentSession();
    logoutAccount();
    window.location.reload();
  };

  const avatar = (
    <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontSize: NAV_FS.label, fontWeight: NAV_FW.semi, height: NAV_TILE_SIZE, width: NAV_TILE_SIZE }}>
      {initial}
    </Avatar>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: "auto", p: `8px ${NAV_PADDING}px ${NAV_PADDING}px`, alignItems: collapsed ? "center" : "stretch" }}>
      {collapsed ? (
        <Tooltip placement="right" title="Tìm kiếm (⌘K)">
          <IconButton aria-label="Tìm kiếm" onClick={handleSearchClick} sx={{ borderRadius: NAV_ITEM_RADIUS, height: 44, width: 44, "&:hover": { bgcolor: NAV_HOVER_BG, color: NAV_PRIMARY } }}>
            <SearchRoundedIcon sx={{ fontSize: NAV_ICON_SIZE }} />
          </IconButton>
        </Tooltip>
      ) : (
        <ButtonBase
          aria-label="Tìm kiếm"
          onClick={handleSearchClick}
          sx={{
            bgcolor: "background.paper",
            border: `1px solid ${NAV_BORDER}`,
            borderRadius: NAV_ITEM_RADIUS,
            color: "text.secondary",
            gap: "8px",
            height: 40,
            justifyContent: "flex-start",
            px: "12px",
            width: "100%",
            "&:hover": { bgcolor: NAV_HOVER_BG, color: NAV_PRIMARY },
          }}
        >
          <SearchRoundedIcon sx={{ fontSize: NAV_ICON_SIZE }} />
          <Typography component="span" sx={{ color: "inherit", flex: 1, fontSize: NAV_FS.label, textAlign: "left" }}>Tìm kiếm...</Typography>
          <Typography component="span" sx={{ border: `1px solid ${NAV_BORDER}`, borderRadius: "6px", color: "text.secondary", fontSize: NAV_FS.caption, px: "6px" }}>⌘K</Typography>
        </ButtonBase>
      )}

      {collapsed ? (
        <Tooltip placement="right" title={userName}>
          <IconButton aria-label={`Tài khoản: ${userName}`} onClick={openMenu} sx={{ p: 0, position: "relative" }}>
            {avatar}
            {notificationCount > 0 ? (
              <Box aria-hidden sx={{ bgcolor: NAV_PRIMARY, border: "2px solid", borderColor: "background.paper", borderRadius: "50%", height: 12, position: "absolute", right: -2, top: -2, width: 12 }} />
            ) : null}
          </IconButton>
        </Tooltip>
      ) : (
        <Box sx={{ alignItems: "center", bgcolor: "background.default", borderRadius: NAV_RAISED_RADIUS, display: "flex", gap: "12px", p: "8px" }}>
          {avatar}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ color: "text.primary", fontSize: NAV_FS.label, fontWeight: NAV_FW.semi, lineHeight: 1.3 }}>{userName}</Typography>
            <Typography noWrap sx={{ color: "text.secondary", fontSize: NAV_FS.caption, lineHeight: 1.3 }}>{userEmail}</Typography>
          </Box>
          <IconButton aria-label="Tùy chọn tài khoản" aria-haspopup="menu" onClick={openMenu} size="small" sx={{ color: "text.secondary", position: "relative" }}>
            <MoreVertRoundedIcon />
            {notificationCount > 0 ? (
              <Box aria-hidden sx={{ bgcolor: NAV_PRIMARY, borderRadius: "50%", height: 8, position: "absolute", right: 4, top: 4, width: 8 }} />
            ) : null}
          </IconButton>
        </Box>
      )}

      <Menu
        anchorEl={menuAnchor}
        anchorOrigin={{ horizontal: collapsed ? "right" : "left", vertical: "top" }}
        onClose={closeMenu}
        open={Boolean(menuAnchor)}
        slotProps={{
          paper: { sx: { border: `1px solid ${NAV_BORDER}`, borderRadius: NAV_RAISED_RADIUS, boxShadow: NAV_CARD_SHADOW, minWidth: 220, p: "6px" } },
          root: { sx: { zIndex: 1400 } },
        }}
        transformOrigin={{ horizontal: "left", vertical: "bottom" }}
      >
        <Box sx={{ px: "10px", py: "6px" }}>
          <Typography noWrap sx={{ color: "text.primary", fontSize: NAV_FS.label, fontWeight: NAV_FW.semi }}>{userName}</Typography>
          <Typography noWrap sx={{ color: "text.secondary", fontSize: NAV_FS.caption }}>{userEmail}</Typography>
        </Box>
        <Divider sx={{ my: "4px" }} />
        <MenuItem onClick={() => { closeMenu(); setNotificationOpen(true); }} sx={{ borderRadius: NAV_ITEM_RADIUS, gap: "12px" }}>
          <NotificationsNoneRoundedIcon fontSize="small" />
          Thông báo
          {notificationCount > 0 ? <NavBadge active={false}>{notificationCount > 99 ? "99+" : notificationCount}</NavBadge> : null}
        </MenuItem>
        {profile && onNavigate ? (
          <MenuItem onClick={() => { closeMenu(); onNavigate(profile); }} sx={{ borderRadius: NAV_ITEM_RADIUS, gap: "12px" }}>
            <PersonOutlineRoundedIcon fontSize="small" />
            Hồ sơ
          </MenuItem>
        ) : null}
        {!installed && canInstall ? (
          <MenuItem onClick={() => { closeMenu(); void promptInstall(); }} sx={{ borderRadius: NAV_ITEM_RADIUS, gap: "12px" }}>
            <DownloadRoundedIcon fontSize="small" />
            Cài đặt ứng dụng ERG
          </MenuItem>
        ) : null}
        <Divider sx={{ my: "4px" }} />
        <MenuItem onClick={handleLogout} sx={{ borderRadius: NAV_ITEM_RADIUS, color: "error.main", gap: "12px" }}>
          <LogoutRoundedIcon fontSize="small" />
          Đăng xuất
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
