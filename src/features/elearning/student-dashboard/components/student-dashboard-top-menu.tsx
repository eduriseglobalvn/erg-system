import type { ReactNode } from "react";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import MessageSquare from "@mui/icons-material/ForumOutlined";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
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
import type { DashboardCopy, StudentDiscussionNotification, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type { StudentDashboardProfile } from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import { MUI_TEXT, MUI_MUTED, MUI_BORDER, MUI_DIVIDER, LOGO_URL, Stack } from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-styles";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TV";
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
  const studentName = account?.name || dashboardProfile.name || "Trần Quốc Vương";
  const studentHandle = account?.email ? `@${account.email.split("@")[0]}` : "@vuong010100";
  const currentNav = copy.navItems.find((item) => item.key === activePage);
  const currentPageLabel = currentNav?.label ?? (activePage === "account" ? copy.accountTitle : "Bài tập");

  const visibleNavItems = copy.navItems;

  return (
    <Box sx={{
      bgcolor: "#F4F7FB",
      backgroundImage: "radial-gradient(circle at 10% 12%, rgba(224,231,255,0.55) 0%, transparent 35%), radial-gradient(circle at 90% 15%, rgba(219,234,254,0.6) 0%, transparent 40%), radial-gradient(circle at 80% 85%, rgba(243,232,255,0.45) 0%, transparent 45%), radial-gradient(circle at 15% 90%, rgba(224,242,254,0.45) 0%, transparent 40%)",
      color: MUI_TEXT, display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100vh", position: "relative",
    }}>
      {/* Slim & compact left sidebar matching Image 1 */}
      <Box component="aside" sx={{
        bgcolor: "#FFFFFF", border: `1px solid ${MUI_BORDER}`, borderRadius: { xs: "18px", md: "20px" },
        boxShadow: "0 4px 24px -2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.03)",
        display: "flex", flexDirection: "column", flexShrink: 0, height: { md: "calc(100vh - 32px)" },
        m: { xs: 1.5, md: 2 }, mr: { md: 0 }, p: { xs: 1.25, md: 1.4 }, position: { md: "sticky" },
        top: { md: 16 }, width: { xs: "calc(100% - 24px)", md: 196, lg: 204 }, zIndex: 12,
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.5, py: 0.5, mb: 1.75 }}>
          <Box sx={{ alignItems: "center", display: "flex", height: 32, overflow: "hidden", width: 88 }}>
            <Box component="img" alt="ERG" src={LOGO_URL} onError={(e) => { e.currentTarget.style.display = "none"; }} sx={{ display: "block", height: "100%", objectFit: "contain", width: "100%" }} />
          </Box>
          <Box sx={{ bgcolor: "#2563EB", borderRadius: "50%", boxShadow: "0 0 0 3px rgba(37,99,235,0.18)", height: 7, width: 7 }} />
        </Stack>

        <Stack spacing={0.5} sx={{ flex: 1, minHeight: 0, mt: 0.5 }}>
          {visibleNavItems.map((item) => {
            const isSelected = activePage === item.key;
            const showBadge = item.key === "announcements" && totalUnread > 0;
            return (
              <Box
                key={item.key}
                component="button"
                onClick={() => onPageChange(item.key)}
                sx={{
                  alignItems: "center", bgcolor: isSelected ? "#2563EB" : "transparent", border: "none",
                  borderRadius: "10px", boxShadow: isSelected ? "0 4px 12px rgba(37,99,235,0.22)" : "none",
                  color: isSelected ? "#FFFFFF" : "#475569", cursor: "pointer", display: "flex",
                  fontFamily: "inherit", fontSize: "13.5px", gap: 1.15, outline: "none", px: 1.35, py: 0.85,
                  textAlign: "left", transition: "all 140ms ease", width: "100%",
                  "&:hover": { bgcolor: isSelected ? "#1D4ED8" : "rgba(37,99,235,0.05)", color: isSelected ? "#FFFFFF" : "#0F172A" },
                }}
              >
                <Box component="span" sx={{ color: isSelected ? "#FFFFFF" : "#64748B", display: "inline-flex", lineHeight: 1, "& svg": { fontSize: 18 } }}>
                  {item.icon}
                </Box>
                <Typography variant="body2" sx={{ color: "inherit", flex: 1, fontSize: "13.5px", fontWeight: isSelected ? 650 : 500, letterSpacing: "-0.01em" }}>
                  {item.label}
                </Typography>
                {showBadge ? (
                  <Box sx={{ bgcolor: isSelected ? "#FFFFFF" : "#EF4444", borderRadius: "99px", color: isSelected ? "#2563EB" : "#FFFFFF", fontSize: "11px", fontWeight: 800, px: 0.8, py: 0.1 }}>
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Stack>

        <Box onClick={onAccountOpen} sx={{
          alignItems: "center", bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px",
          cursor: "pointer", display: "flex", gap: 0.9, mt: "auto", p: 0.85, transition: "all 140ms ease",
          "&:hover": { bgcolor: "#F1F5F9", borderColor: "#CBD5E1" },
        }}>
          <Avatar sx={{ bgcolor: "#F97316", color: "#FFFFFF", fontSize: "12px", fontWeight: 700, height: 32, width: 32 }}>
            {getInitials(studentName)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ color: "#0F172A", fontSize: "12px", fontWeight: 650, lineHeight: 1.25 }}>
              {studentName}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: "#94A3B8", display: "block", fontSize: "10.5px", fontWeight: 500, lineHeight: 1.2 }}>
              {studentHandle}
            </Typography>
          </Box>
          <ChevronRightRoundedIcon sx={{ color: "#94A3B8", fontSize: 16 }} />
        </Box>
      </Box>

      {/* Main content right side */}
      <Box sx={{ display: "flex", flex: 1, flexDirection: "column", minWidth: 0, p: { xs: 1.5, md: 2.25, lg: 3 } }}>
        <Box component="header" sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", minHeight: 44, mb: 2, px: { xs: 0.5, md: 0 } }}>
          <Typography variant="h6" sx={{ color: "#0F172A", fontSize: "16.5px", fontWeight: 800, letterSpacing: "-0.015em" }}>
            {currentPageLabel}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1.15}>
            <Tooltip title={copy.notificationTitle}>
              <IconButton aria-label={copy.notificationTitle} onClick={(e) => onNotificationOpen(e.currentTarget)} sx={{ bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", boxShadow: "0 1px 2px rgba(15,23,42,0.04)", color: "#334155", height: 34, width: 34, "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" } }}>
                <Badge color="error" badgeContent={totalUnread}>
                  <MoreHorizRoundedIcon sx={{ fontSize: 19 }} />
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
          paper: { sx: { borderColor: MUI_DIVIDER, borderRadius: "14px", boxShadow: "0 20px 50px rgba(15,23,42,0.12)", maxWidth: "calc(100vw - 24px)", mt: 1, width: 360 } },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{copy.notificationTitle}</Typography>
          <Typography variant="caption" color="text.secondary">{totalUnread ? `${totalUnread} unread updates` : copy.notificationEmpty}</Typography>
        </Box>
        <Divider />
        {notifications.length ? (
          notifications.map((notification) => (
            <MenuItem key={notification.id} onClick={() => onNotificationClick(notification.threadId, notification.replyId)} sx={{ alignItems: "flex-start", gap: 1.25, py: 1.25, whiteSpace: "normal" }}>
              <Box sx={{ bgcolor: notification.unread ? "rgba(37,99,235,0.08)" : "rgba(145,158,171,0.12)", borderRadius: 1.5, color: notification.unread ? "#2563EB" : MUI_MUTED, display: "grid", flex: "0 0 32px", height: 32, placeItems: "center", width: 32 }}>
                <MessageSquare sx={{ fontSize: 16 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: MUI_TEXT, fontWeight: 700, lineHeight: 1.35 }}>{notification.primaryText}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>{notification.secondaryText}</Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>{copy.notificationEmpty}</MenuItem>
        )}
        <Divider />
        <MenuItem onClick={account ? onSignOut : onAccountOpen}>
          <Typography variant="body2" sx={{ color: account ? "#EF4444" : "#2563EB", fontWeight: 600 }}>{account ? copy.signOut : copy.signIn}</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}

export function ElearningFooter() {
  return (
    <Box component="footer" sx={{ alignItems: "center", borderTop: "1px solid rgba(226,232,240,0.8)", color: "#94A3B8", display: "flex", fontSize: "12px", justifyContent: "space-between", mt: 4, pt: 2, pb: 1 }}>
      <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 500 }}>© 2026 ERG Edurise Global. All rights reserved.</Typography>
      <Typography variant="caption" sx={{ color: "#94A3B8" }}>Student Learning Portal</Typography>
    </Box>
  );
}
