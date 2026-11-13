import type { ReactNode } from "react";
import MessageSquare from "@mui/icons-material/ForumOutlined";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
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
import { NAV_BORDER, NAV_CARD_RADIUS, NAV_CARD_SHADOW, NAV_PADDING } from "@/components/portal/portal-sidebar-styles";
import { PortalSidebarWorkspaceHeader } from "@/components/portal/portal-sidebar-workspace-header";
import type { DashboardCopy, StudentDiscussionNotification, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardProfile } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { MUI_TEXT, MUI_MUTED, MUI_BORDER, MUI_DIVIDER } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-styles";
import { StudentSidebar } from "@/features/elearning/student-dashboard/components/student-sidebar";
import type { StudentSidebarData } from "@/features/elearning/student-dashboard/hooks/use-student-sidebar-data";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

const TITLED_BY_PAGE = new Set<StudentPageKey>(["assignments", "ranking", "discussion", "announcements"]);

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HS";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Canvas ".desk": 16px padding and gap around a 232px floating sidebar card (spec 7.0). */
const DESK_GAP = 16;
const SIDEBAR_CARD_WIDTH = 232;

export function TopMenuShell({
  account, activePage, children, copy, dashboardProfile,
  notificationAnchor, notifications, sidebarData, todoCount, unreadAnnouncementCount,
  onAccountOpen, onTierOpen, onNotificationClose, onNotificationClick,
  onNotificationOpen, onPageChange, onSignOut,
}: {
  account: ElearningViewerSession | null;
  activePage: StudentPageKey;
  children?: ReactNode;
  copy: DashboardCopy;
  dashboardProfile: StudentDashboardProfile;
  notificationAnchor: HTMLElement | null;
  notifications: StudentDiscussionNotification[];
  sidebarData: StudentSidebarData;
  todoCount: number;
  unreadAnnouncementCount: number;
  onAccountOpen: () => void;
  onTierOpen?: () => void;
  onNotificationClose: () => void;
  onNotificationClick: (threadId: string, replyId?: string) => void;
  onNotificationOpen: (element: HTMLElement) => void;
  onPageChange: (page: StudentPageKey) => void;
  onSignOut: () => void;
}) {
  const unreadDiscussionCount = notifications.filter((item) => item.unread).length;
  const totalUnread = unreadAnnouncementCount + unreadDiscussionCount;
  const studentName = account?.name || dashboardProfile.name || "Học sinh";
  const currentNav = copy.navItems.find((item) => item.key === activePage);
  const currentPageLabel = currentNav?.label ?? (activePage === "account" ? copy.accountTitle : "Bài tập");

  const workspaces = getAuthScope().session?.workspaces ?? [];

  return (
    <Box sx={{
      bgcolor: ergEnterpriseTokens.color.surfaceMuted,
      color: MUI_TEXT, display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100vh", position: "relative",
    }}>
      {/* Same floating card as the admin/teacher sidebar: shell radius, float shadow, token width. */}
      <Box component="aside" sx={{
        bgcolor: "background.paper", border: `1px solid ${NAV_BORDER}`, borderRadius: NAV_CARD_RADIUS, boxShadow: NAV_CARD_SHADOW,
        display: "flex", flexDirection: "column", flexShrink: 0, height: { md: `calc(100vh - ${DESK_GAP * 2}px)` },
        m: { xs: 1.5, md: `${DESK_GAP}px` }, mr: { md: 0 }, p: { xs: 1.25, md: `${NAV_PADDING}px` }, position: { md: "sticky" },
        top: { md: DESK_GAP }, width: { xs: "calc(100% - 24px)", md: SIDEBAR_CARD_WIDTH }, zIndex: 12,
      }}>
        {/* A plain student has nowhere to switch to, so the switcher only shows for accounts with another workspace (e.g. teacher). */}
        {workspaces.some((workspace) => workspace !== "STUDENT") ? (
          <Box sx={{ mb: 1.5 }}><PortalSidebarWorkspaceHeader active collapsed={false} fluid portalInfo={{ name: "Học sinh", workspaceCapabilities: workspaces }} /></Box>
        ) : null}
        <StudentSidebar
          activePage={activePage} data={sidebarData} initials={getInitials(studentName)} name={studentName}
          rankingEnabled={copy.navItems.some((item) => item.key === "ranking")} signedIn={Boolean(account)}
          todoCount={todoCount} unreadCount={unreadAnnouncementCount}
          notificationSlot={(
            <Tooltip title={copy.notificationTitle}>
              <IconButton aria-label={copy.notificationTitle} onClick={(e) => onNotificationOpen(e.currentTarget)} sx={{ color: "text.secondary", flexShrink: 0, height: 36, width: 36 }}>
                <Badge color="error" badgeContent={totalUnread}><NotificationsNoneRoundedIcon /></Badge>
              </IconButton>
            </Tooltip>
          )}
          onAccountOpen={onAccountOpen} onTierOpen={onTierOpen} onPageChange={onPageChange} onSignOut={onSignOut}
        />
      </Box>

      {/* Main content right side */}
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0, p: { xs: 1.5, md: `${DESK_GAP}px` } }}>
        {/* Design has no bar above the page: ranking, tier, inbox, discussion and assignment pages carry their own title. */}
        {TITLED_BY_PAGE.has(activePage) ? null : <Typography variant="h5" component="h1" sx={{ mb: 2, px: { xs: 0.5, md: 0 } }}>{currentPageLabel}</Typography>}

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
