import Bell from "@mui/icons-material/NotificationsNoneRounded";
import MessageSquare from "@mui/icons-material/ForumOutlined";
import User from "@mui/icons-material/PersonOutlineRounded";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import {
  type ElearningViewerSession,
} from "@/platform/auth/api/elearning-viewer-session";
import type {
  DashboardCopy,
  StudentDiscussionNotification,
  StudentPageKey,
} from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import type {
  StudentDashboardProfile,
} from "@/features/elearning/student-dashboard/types/student-dashboard-types";
import {
  MUI_PRIMARY,
  MUI_RED,
  MUI_NAVY,
  MUI_TEXT,
  MUI_MUTED,
  MUI_BORDER,
  MUI_DIVIDER,
  LOGO_URL,
  Stack,
} from "@/features/elearning/student-dashboard/components/student-dashboard-workspace-styles";
export function TopMenuShell({
  account,
  activePage,
  copy,
  dashboardProfile,
  notificationAnchor,
  notifications,
  unreadAnnouncementCount,
  onAccountOpen,
  onNotificationClose,
  onNotificationClick,
  onNotificationOpen,
  onPageChange,
  onSignOut,
}: {
  account: ElearningViewerSession | null;
  activePage: StudentPageKey;
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

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        bgcolor: "rgba(243,246,250,0.82)",
        borderBottom: "none",
        backdropFilter: "blur(22px)",
        boxShadow: "none",
        overflow: "visible",
        px: { xs: 1.5, md: 2 },
        py: { xs: 1, md: 1.15 },
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 64, md: 68 },
          alignItems: { xs: "center", md: "stretch" },
          bgcolor: "#fff",
          border: `1px solid ${MUI_BORDER}`,
          borderRadius: { xs: "18px", md: "20px" },
          boxShadow: "0 1px 2px rgba(16,24,40,0.06), 0 18px 42px rgba(16,24,40,0.08)",
          flexWrap: { xs: "wrap", md: "nowrap" },
          gap: { xs: 1.25, md: 2 },
          mx: "auto",
          px: { xs: 1.25, md: 1.75 },
          py: { xs: 0.8, md: 0 },
          width: "100%",
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{ minWidth: { xs: 0, md: 220 }, order: { xs: 1, md: 0 } }}
        >
          <Box
            sx={{
              alignItems: "center",
              bgcolor: "transparent",
              border: "none",
              borderRadius: 0,
              boxShadow: "none",
              color: MUI_NAVY,
              display: "flex",
              flexShrink: 0,
              fontWeight: 800,
              height: 40,
              justifyContent: "center",
              overflow: "hidden",
              p: 0,
              position: "relative",
              width: 104,
            }}
          >
            <Box
              component="img"
              alt="ERG"
              src={LOGO_URL}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
              sx={{ display: "block", height: "100%", objectFit: "contain", width: "100%" }}
            />
          </Box>
        </Stack>

        <Tabs
          value={activePage}
          variant="scrollable"
          scrollButtons="auto"
          onChange={(_, nextValue: StudentPageKey) => onPageChange(nextValue)}
          sx={{
            flex: { xs: "0 0 100%", md: 1 },
            alignSelf: "center",
            bgcolor: "#fff",
            border: "none",
            borderRadius: 0,
            boxShadow: "none",
            minWidth: 0,
            order: { xs: 3, md: 0 },
            px: { xs: 0, md: 0.5 },
            width: { xs: "100%", md: "auto" },
            "& .MuiTabs-indicator": {
              background: `linear-gradient(90deg, ${MUI_PRIMARY} 0%, ${MUI_PRIMARY} 68%, ${MUI_RED} 100%)`,
              borderRadius: 999,
              height: 3,
            },
            "& .MuiTabs-flexContainer": { height: "100%", alignItems: "center" },
            "& .MuiTab-root": {
              mx: { xs: 0.1, md: 0.15 },
              minHeight: { xs: 42, md: 48 },
              borderRadius: "12px",
              color: MUI_MUTED,
              fontWeight: 800,
              whiteSpace: "nowrap",
              px: { xs: 1.15, md: 1.65 },
              transition: "background 180ms ease, color 180ms ease, box-shadow 180ms ease",
              "&:hover": {
                bgcolor: "rgba(15,108,189,0.055)",
                boxShadow: "none",
                color: MUI_NAVY,
              },
              "&.Mui-selected": {
                bgcolor: "transparent",
                boxShadow: "none",
                color: MUI_PRIMARY,
              },
            },
          }}
        >
          {copy.navItems.map((item) => (
            <Tab
              key={item.key}
              icon={<Box component="span" sx={{ display: "inline-flex", lineHeight: 0 }}>{item.icon}</Box>}
              iconPosition="start"
              label={item.label}
              value={item.key}
            />
          ))}
          <Tab icon={<User sx={{ fontSize: 16 }} />} iconPosition="start" label={copy.accountTitle} value="account" />
        </Tabs>

        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          sx={{ flexShrink: 0, ml: "auto", order: { xs: 2, md: 0 } }}
        >
          <Tooltip title={copy.notificationTitle}>
            <IconButton
              aria-label={copy.notificationTitle}
              onClick={(event) => onNotificationOpen(event.currentTarget)}
              sx={{
                border: `1px solid ${MUI_BORDER}`,
                borderRadius: "14px",
                bgcolor: "#fff",
                boxShadow: "0 1px 2px rgba(16,24,40,0.06), 0 8px 18px rgba(16,24,40,0.06)",
                color: MUI_PRIMARY,
                "&:hover": {
                  borderColor: "rgba(15,108,189,0.24)",
                  bgcolor: "rgba(15,108,189,0.06)",
                },
              }}
            >
              <Badge color="error" badgeContent={totalUnread}>
                <Bell sx={{ fontSize: 18 }} />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title={account ? copy.signOut : copy.accountTitle}>
            <IconButton
              aria-label={account ? copy.signOut : copy.accountTitle}
              onClick={account ? onSignOut : onAccountOpen}
              sx={{ p: 0.25 }}
            >
              <Avatar
                sx={{
                  bgcolor: MUI_NAVY,
                  border: "1px solid rgba(255,255,255,0.86)",
                  boxShadow: "0 1px 2px rgba(16,24,40,0.08), 0 8px 18px rgba(16,24,40,0.14)",
                  color: "#fff",
                  fontWeight: 900,
                }}
              >
                {(account?.name ?? dashboardProfile.name).slice(0, 1)}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>

      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={onNotificationClose}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 360,
              maxWidth: "calc(100vw - 24px)",
              borderColor: MUI_DIVIDER,
              boxShadow: "0 24px 70px rgba(15,23,42,0.12)",
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {copy.notificationTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {totalUnread ? `${totalUnread} unread updates` : copy.notificationEmpty}
          </Typography>
        </Box>
        <Divider />
        {notifications.length ? (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => onNotificationClick(notification.threadId, notification.replyId)}
              sx={{ alignItems: "flex-start", gap: 1.25, py: 1.25, whiteSpace: "normal" }}
            >
              <Box
                sx={{
                  bgcolor: notification.unread ? "rgba(15,108,189,0.08)" : "rgba(145,158,171,0.12)",
                  borderRadius: 1.5,
                  color: notification.unread ? MUI_PRIMARY : MUI_MUTED,
                  display: "grid",
                  flex: "0 0 32px",
                  height: 32,
                  placeItems: "center",
                  width: 32,
                }}
              >
                <MessageSquare sx={{ fontSize: 16 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ color: MUI_TEXT, fontWeight: 700, lineHeight: 1.35 }}>
                  {notification.primaryText}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                  {notification.secondaryText}
                </Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>{copy.notificationEmpty}</MenuItem>
        )}
      </Menu>
    </AppBar>
  );
}

export function ElearningFooter() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#F8FAFC",
        mt: "auto",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${MUI_RED} 0%, ${MUI_PRIMARY} 58%, ${MUI_RED} 100%)` }} />
      <Box
        sx={{
          minHeight: { xs: 168, md: 196 },
          px: { xs: 2.25, md: 3 },
          pt: { xs: 3.5, md: 4.5 },
          pb: { xs: 8.5, md: 10 },
          position: "relative",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.8, sm: 2.5 }}
          alignItems={{ xs: "center", sm: "flex-start" }}
          justifyContent={{ xs: "center", sm: "flex-start" }}
          sx={{ maxWidth: 1120, mx: "auto", position: "relative", zIndex: 1 }}
        >
          <Stack spacing={1.2} alignItems={{ xs: "center", sm: "flex-start" }} sx={{ maxWidth: 460, textAlign: { xs: "center", sm: "left" } }}>
            <Stack direction="row" spacing={1.35} alignItems="center">
              <Box component="img" alt="ERG" src={LOGO_URL} sx={{ display: "block", height: { xs: 42, md: 52 }, objectFit: "contain", width: { xs: 108, md: 136 } }} />
              <Typography variant="subtitle1" sx={{ color: "#020B7A", fontWeight: 950, lineHeight: 1.1 }}>
                Student Workspace
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: "#30405C", fontWeight: 650, lineHeight: 1.65 }}>
              Không gian học tập trực tuyến ERG, gọn gàng và tập trung cho mỗi buổi học.
            </Typography>
          </Stack>
        </Stack>

        <Box
          component="svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 170"
          aria-hidden="true"
          sx={{
            bottom: 0,
            display: "block",
            height: { xs: 78, md: 104 },
            left: 0,
            position: "absolute",
            width: "100%",
          }}
        >
          <path
            d="M0 62C150 88 306 97 464 80C641 61 734 22 929 44C1125 66 1254 132 1440 101V170H0V62Z"
            fill="#02058F"
          />
          <path
            d="M0 76C158 105 315 111 482 93C666 72 752 37 936 58C1136 81 1268 140 1440 116V170H0V76Z"
            fill="#000778"
            opacity="0.9"
          />
        </Box>

        <Typography
          variant="caption"
          sx={{
            bottom: { xs: 14, md: 18 },
            color: "rgba(255,255,255,0.82)",
            fontWeight: 650,
            left: "50%",
            position: "absolute",
            textAlign: "center",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            zIndex: 1,
          }}
        >
          © 2026 ERG Student Workspace
        </Typography>
      </Box>
    </Box>
  );
}
