"use client";

import { useState, type ReactNode } from "react";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
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
import { useLocation } from "@tanstack/react-router";

import { useInstallPrompt } from "@/features/lms/mobile/hooks/use-install-prompt";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { logoutStudentSession } from "@/platform/auth/api/student-auth-storage";
import type { Workspace } from "@/platform/workspaces/workspace-domain";
import { workspaceCapabilities, workspacesFromLegacyPortals } from "@/platform/workspaces/workspace-switcher";
import type { PortalInfo } from "./ErgPortalLayout";
import type { PortalNotificationTab } from "./portal-header-notification-data";
import { PortalHeaderNotifications } from "./portal-header-notifications";
import { SIDEBAR_MOTION_MS } from "./portal-sidebar-styles";
import { notificationPortalFromPath, usePortalNotifications } from "./use-portal-notifications";

function workspaceFromPath(pathname: string): Workspace {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment === "admin") return "ADMIN";
  if (segment === "student") return "STUDENT";
  if (segment === "crm") return "CRM";
  return "TEACHER";
}

const WORKSPACE_ICONS: Record<Workspace, ReactNode> = {
  ADMIN: <AdminPanelSettingsRoundedIcon sx={{ fontSize: 17, color: "primary.main" }} />,
  TEACHER: <SchoolRoundedIcon sx={{ fontSize: 17, color: "success.main" }} />,
  STUDENT: <MenuBookRoundedIcon sx={{ fontSize: 17, color: "info.main" }} />,
  CRM: <BusinessRoundedIcon sx={{ fontSize: 17, color: "warning.main" }} />,
};

const WORKSPACE_LOCAL_PATHS: Record<Workspace, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher/home",
  STUDENT: "/student",
  CRM: "/",
};

export function SidebarBottom({
  collapsed,
  portalInfo,
  notificationCount: notificationCountProp = 0,
  onNavigate,
  onSignOut,
}: {
  collapsed: boolean;
  portalInfo?: PortalInfo;
  notificationCount?: number;
  onNavigate?: (path: string) => void;
  onSignOut?: () => void;
}) {
  const location = useLocation();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PortalNotificationTab>("all");
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const { canInstall, installed, promptInstall } = useInstallPrompt();

  const userName = portalInfo?.userName || "Người dùng";
  const userEmail = portalInfo?.userEmail || "Tài khoản ERG";
  const initial = userName.charAt(0).toUpperCase() || "E";

  const current = workspaceFromPath(location?.pathname ?? "");
  const granted = portalInfo?.workspaceCapabilities?.length
    ? [...portalInfo.workspaceCapabilities]
    : workspacesFromLegacyPortals(portalInfo?.workspacePortals ?? [], current);
  const capabilities = workspaceCapabilities(granted, current, location?.pathname ?? "");

  const { notifications, unreadCount } = usePortalNotifications(
    notificationPortalFromPath(location?.pathname ?? ""),
    activeTab,
    notificationOpen,
  );
  const notificationCount = unreadCount ?? notificationCountProp;

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

  const handleWorkspaceSelect = (path: string) => {
    setMenuAnchor(null);
    if (onNavigate) {
      onNavigate(path);
    } else if (typeof window !== "undefined") {
      window.location.assign(path);
    }
  };

  const actionBtnSx = {
    color: "#637381",
    height: 32,
    width: 32,
    "&:hover": { bgcolor: "rgba(145,158,171,0.08)", color: "#1C252E" },
  };

  return (
    <Box
      sx={{
        borderTop: "1px solid",
        borderColor: "divider",
        mt: "auto",
        p: collapsed ? "12px 8px" : "12px 14px",
        transition: `padding ${SIDEBAR_MOTION_MS}`,
      }}
    >
      {collapsed ? (
        <Box sx={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 1 }}>
          <Tooltip title="Tìm kiếm (⌘K)" placement="right">
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

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        sx={{ zIndex: 1400 }}
        slotProps={{
          root: { sx: { zIndex: 1400 } },
          paper: {
            sx: {
              bgcolor: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
              minWidth: 200,
              p: 0.5,
              zIndex: 1400,
            },
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 0.75 }}>
          <Typography variant="subtitle2" sx={{ color: "#0F172A", fontSize: 13, fontWeight: 700 }}>{userName}</Typography>
          <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: 11 }}>{userEmail}</Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />

        {capabilities.length >= 2 ? (
          <>
            <Box sx={{ px: 1.5, py: 0.5 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", fontSize: 10.5, letterSpacing: "0.05em" }}>
                Không gian làm việc
              </Typography>
            </Box>
            {capabilities.map((cap) => {
              const isCurrent = cap.workspace === current;
              const targetPath = WORKSPACE_LOCAL_PATHS[cap.workspace];
              return (
                <MenuItem
                  key={cap.workspace}
                  onClick={() => handleWorkspaceSelect(targetPath)}
                  sx={{
                    bgcolor: isCurrent ? "action.selected" : "transparent",
                    borderRadius: "8px",
                    fontSize: 12.5,
                    gap: 1.25,
                    fontWeight: isCurrent ? 700 : 500,
                    my: 0.25,
                  }}
                >
                  <Box component="span" sx={{ display: "inline-flex" }}>
                    {WORKSPACE_ICONS[cap.workspace]}
                  </Box>
                  <Typography variant="body2" sx={{ flex: 1, fontSize: "inherit", fontWeight: "inherit" }}>
                    {cap.label}
                  </Typography>
                  {isCurrent ? <CheckRoundedIcon sx={{ color: "primary.main", fontSize: 16 }} /> : null}
                </MenuItem>
              );
            })}
            <Divider sx={{ my: 0.5 }} />
          </>
        ) : null}

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
