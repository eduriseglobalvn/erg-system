import type { ReactNode } from "react";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import MessageSquare from "@mui/icons-material/ForumOutlined";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { type ElearningViewerSession } from "@/platform/auth/api/elearning-viewer-session";
import { getAuthScope } from "@/platform/auth/api/auth-storage";
import { SidebarLeafItem } from "@/components/portal/portal-sidebar-leaf-item";
import { EXPANDED_SIDEBAR_WIDTH, SIDEBAR_GUTTER } from "@/components/portal/portal-sidebar-motion";
import { NAV_BORDER, NAV_CARD_RADIUS, NAV_CARD_SHADOW, NAV_PADDING } from "@/components/portal/portal-sidebar-styles";
import { PortalSidebarWorkspaceHeader } from "@/components/portal/portal-sidebar-workspace-header";
import type { DashboardCopy, StudentDiscussionNotification, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardProfile } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { MUI_TEXT, MUI_MUTED, MUI_BORDER, MUI_DIVIDER, LOGO_URL, Stack } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-styles";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TopMenuShell({
  account, activePage, children, copy, dashboardProfile,
  notificationAnchor, notifications, unreadAnnouncementCount,
  onAccountOpen, onNotificationClose, onNotificationClick,
  onNotificationOpen, onPageChange, onSignOut,
}: {
  account: ElearningViewerSession | null;
  activePage: StudentPageKey;
  children?: ReactNode;
  copy: DashboardCopy;
  dashboardProfile: StudentDashboardProfile;
  notificationAnchor: HTMLElement | null;
  notifications: StudentDiscussionNotification[];
  unreadAnnouncementCount: number;
  onAccountOpen: () => void;
  onNotificationClose: () => void;
  onNotificationClick: (threadId: string, replyId?: string) => void;
  onNotificationOpen: (element: HTMLElement) => void;
  onPageChange: (page: StudentPageKey) => void;
  onSignOut: () => void;
}) {
  const unreadDiscussionCount = notifications.filter((item) => item.unread).length;
  const totalUnread = unreadAnnouncementCount + unreadDiscussionCount;
  const studentName = account?.name || dashboardProfile.name || "Học sinh";
  const studentHandle = account?.email ?? dashboardProfile.className;
  const currentNav = copy.navItems.find((item) => item.key === activePage);
  const currentPageLabel = currentNav?.label ?? (activePage === "account" ? copy.accountTitle : "Bài tập");

  // Flat menu rendered with the same leaf item as the admin/teacher sidebar (path = page key).
  const menuItems = copy.navItems.map((item) => ({
    badge: item.key === "announcements" && totalUnread > 0 ? (totalUnread > 9 ? "9+" : String(totalUnread)) : undefined,
    icon: item.icon,
    label: item.label,
    path: item.key,
  }));

  return (
    <Box sx={{
      bgcolor: ergEnterpriseTokens.color.surfaceMuted,
      color: MUI_TEXT, display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100vh", position: "relative",
    }}>
      {/* Same floating card as the admin/teacher sidebar: shell radius, float shadow, token width. */}
      <Box component="aside" sx={{
        bgcolor: "background.paper", border: `1px solid ${NAV_BORDER}`, borderRadius: NAV_CARD_RADIUS, boxShadow: NAV_CARD_SHADOW,
        display: "flex", flexDirection: "column", flexShrink: 0, height: { md: `calc(100vh - ${SIDEBAR_GUTTER * 2}px)` },
        m: { xs: 1.5, md: `${SIDEBAR_GUTTER}px` }, mr: { md: 0 }, p: { xs: 1.25, md: `${NAV_PADDING}px` }, position: { md: "sticky" },
        top: { md: SIDEBAR_GUTTER }, width: { xs: "calc(100% - 24px)", md: EXPANDED_SIDEBAR_WIDTH }, zIndex: 12,
      }}>
        <Box sx={{ mb: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.5, py: 0.5, mb: 1.25 }}>
            <Box sx={{ alignItems: "center", display: "flex", height: 28, overflow: "hidden", width: 84 }}>
              <Box component="img" alt="ERG" src={LOGO_URL} onError={(e) => { e.currentTarget.style.display = "none"; }} sx={{ display: "block", height: "100%", objectFit: "contain", width: "100%" }} />
            </Box>
          </Stack>
          <PortalSidebarWorkspaceHeader
            active
            collapsed={false}
            fluid
            portalInfo={{ name: "Học sinh", workspaceCapabilities: getAuthScope().session?.workspaces }}
          />
        </Box>

        <Box component="nav" aria-label="Điều hướng học sinh" sx={{ flex: 1, minHeight: 0, mt: 0.5 }}>
          <Box component="ul" sx={{ display: "flex", flexDirection: "column", gap: 0.5, listStyle: "none", m: 0, p: 0 }}>
            {menuItems.map((item) => (
              <SidebarLeafItem key={item.path} currentPath={activePage} item={item} onNavigate={(path) => onPageChange(path as StudentPageKey)} />
            ))}
          </Box>
        </Box>

        <Box component="button" type="button" aria-label="Mở hồ sơ" onClick={onAccountOpen} sx={{
          alignItems: "center", bgcolor: "background.default", border: `1px solid ${MUI_BORDER}`, borderRadius: `${ergEnterpriseTokens.radius.md}px`,
          color: "inherit", cursor: "pointer", display: "flex", font: "inherit", gap: 0.9, minHeight: 44, mt: "auto", p: 0.85, textAlign: "left", width: "100%",
          "&:hover": { bgcolor: ergEnterpriseTokens.color.primarySofter },
        }}>
          <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", height: 32, typography: "caption", width: 32 }}>
            {getInitials(studentName)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>{studentName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{studentHandle}</Typography>
          </Box>
          <ChevronRightRoundedIcon color="disabled" fontSize="small" />
        </Box>
      </Box>

      {/* Main content right side */}
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0, p: { xs: 1.5, md: 2.25, lg: 3 } }}>
        <Box component="header" sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", minHeight: 44, mb: 2, px: { xs: 0.5, md: 0 } }}>
          <Typography variant="h5" component="h1">
            {currentPageLabel}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1.15}>
            <Tooltip title={copy.notificationTitle}>
              <IconButton aria-label={copy.notificationTitle} onClick={(e) => onNotificationOpen(e.currentTarget)} sx={{ bgcolor: "background.paper", border: `1px solid ${MUI_BORDER}`, borderRadius: `${ergEnterpriseTokens.radius.md}px`, color: "text.secondary", height: 44, width: 44 }}>
                <Badge color="error" badgeContent={totalUnread}>
                  <NotificationsNoneRoundedIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Box component="main" sx={{ flex: 1, minWidth: 0, width: "100%" }}>
          {children}
        </Box>

        <ElearningFooter />
      </Box>

      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={onNotificationClose}
        slotProps={{
          paper: { sx: { borderColor: MUI_DIVIDER, borderRadius: `${ergEnterpriseTokens.radius.lg}px`, maxWidth: "calc(100vw - 24px)", mt: 1, width: 360 } },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2">{copy.notificationTitle}</Typography>
          <Typography variant="caption" color="text.secondary">{totalUnread ? `${totalUnread} cập nhật chưa đọc` : copy.notificationEmpty}</Typography>
        </Box>
        <Divider />
        {notifications.length ? (
          notifications.map((notification) => (
            <MenuItem key={notification.id} onClick={() => onNotificationClick(notification.threadId, notification.replyId)} sx={{ alignItems: "flex-start", gap: 1.25, py: 1.25, whiteSpace: "normal" }}>
              <Box sx={{ bgcolor: notification.unread ? ergEnterpriseTokens.color.primarySoft : "action.hover", borderRadius: 1.5, color: notification.unread ? "primary.main" : MUI_MUTED, display: "grid", flex: "0 0 32px", height: 32, placeItems: "center", width: 32 }}>
                <MessageSquare sx={{ fontSize: 16 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: MUI_TEXT, fontWeight: 600, lineHeight: 1.35 }}>{notification.primaryText}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>{notification.secondaryText}</Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>{copy.notificationEmpty}</MenuItem>
        )}
        <Divider />
        <MenuItem onClick={account ? onSignOut : onAccountOpen}>
          <Typography variant="subtitle2" sx={{ color: account ? "error.main" : "primary.main" }}>{account ? copy.signOut : copy.signIn}</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}

export function ElearningFooter() {
  return (
    <Box component="footer" sx={{ alignItems: "center", borderTop: `1px solid ${MUI_BORDER}`, display: "flex", justifyContent: "space-between", mt: 4, pt: 2, pb: 1 }}>
      <Typography variant="caption" color="text.secondary">© {new Date().getFullYear()} ERG Edurise Global</Typography>
      <Typography variant="caption" color="text.disabled">Cổng học sinh</Typography>
    </Box>
  );
}
