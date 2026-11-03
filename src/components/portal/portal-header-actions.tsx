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
import { useLocation } from "@tanstack/react-router";

import { useInstallPrompt } from "@/features/lms/mobile/hooks/use-install-prompt";
import { useOnlineStatus } from "@/features/lms/mobile/hooks/use-online-status";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { logoutStudentSession } from "@/platform/auth/api/student-auth-storage";
import type { Workspace } from "@/platform/workspaces/workspace-domain";
import { workspaceCapabilities, workspacesFromLegacyPortals } from "@/platform/workspaces/workspace-switcher";
import { HEADER_ICON_BUTTON_SX } from "./portal-header-styles";

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

type PortalHeaderActionsProps = {
  notificationCount: number;
  onOpenNotifications: () => void;
  userName?: string;
  userEmail?: string;
  workspaceCapabilities?: readonly Workspace[];
  workspacePortals?: string[];
  onNavigate?: (path: string) => void;
  onSignOut?: () => void;
};

export function PortalHeaderActions({
  notificationCount,
  onOpenNotifications,
  userName,
  userEmail,
  workspaceCapabilities: inputWorkspaces,
  workspacePortals = [],
  onNavigate,
  onSignOut,
}: PortalHeaderActionsProps) {
  const isOnline = useOnlineStatus();
  const location = useLocation();
  const initial = userName?.charAt(0).toUpperCase() || "E";
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const [installInfoOpen, setInstallInfoOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const current = workspaceFromPath(location?.pathname ?? "");
  const granted = inputWorkspaces?.length ? [...inputWorkspaces] : workspacesFromLegacyPortals(workspacePortals, current);
  const capabilities = workspaceCapabilities(granted, current, location?.pathname ?? "");

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

  const handleWorkspaceSelect = (path: string) => {
    setMenuAnchor(null);
    if (onNavigate) onNavigate(path);
    else if (typeof window !== "undefined") window.location.assign(path);
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

        {capabilities.length >= 2 ? (
          <>
            <Box sx={{ px: 1.5, py: 0.5 }}>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, textTransform: "uppercase", fontSize: 10.5, letterSpacing: "0.05em" }}>
                Không gian làm việc
              </Typography>
            </Box>
            {capabilities.map((cap) => {
              const isCurrent = cap.workspace === current;
              return (
                <MenuItem
                  key={cap.workspace}
                  onClick={() => handleWorkspaceSelect(WORKSPACE_LOCAL_PATHS[cap.workspace])}
                  sx={{ bgcolor: isCurrent ? "action.selected" : "transparent", borderRadius: "6px", gap: 1, py: 0.75, fontWeight: isCurrent ? 700 : 500 }}
                >
                  {WORKSPACE_ICONS[cap.workspace]}
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: "inherit", fontSize: 13 }}>{cap.label}</Typography>
                  {isCurrent ? <CheckRoundedIcon sx={{ color: "primary.main", fontSize: 16 }} /> : null}
                </MenuItem>
              );
            })}
            <Divider sx={{ my: 0.5 }} />
          </>
        ) : null}

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
            <Typography variant="body2" color="text.secondary">
              1. Nhấn biểu tượng <b>Cài đặt (Install)</b> trên thanh địa chỉ.<br />
              2. Hoặc mở menu <b>⋮</b> &gt; chọn <b>"Cài đặt ứng dụng..."</b>.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ pb: 1.5, px: 2 }}>
          <Button onClick={() => setInstallInfoOpen(false)} variant="contained" size="small" sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 700 }}>
            Đã hiểu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
