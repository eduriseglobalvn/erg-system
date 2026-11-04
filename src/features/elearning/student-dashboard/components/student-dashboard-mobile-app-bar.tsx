import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";

import { getInitials } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";

/** 56px top app bar for the mobile student shell: class name, bell, avatar. */
export function StudentDashboardMobileAppBar({
  className,
  notificationLabel,
  studentName,
  unreadCount,
  onAccountOpen,
  onNotificationsOpen,
}: {
  className: string;
  notificationLabel: string;
  studentName: string;
  unreadCount: number;
  onAccountOpen: () => void;
  onNotificationsOpen: () => void;
}) {
  return (
    <Box
      component="header"
      data-testid="student-mobile-app-bar"
      sx={{
        alignItems: "center",
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
        boxSizing: "border-box",
        display: "flex",
        flexShrink: 0,
        gap: 0.5,
        height: "calc(56px + env(safe-area-inset-top, 0px))",
        pl: 2,
        pr: 0.5,
        pt: "env(safe-area-inset-top, 0px)",
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Typography component="h1" noWrap variant="h5" sx={{ flex: 1, minWidth: 0 }}>
        {className.trim() || "Học sinh"}
      </Typography>
      <IconButton aria-label={notificationLabel} onClick={onNotificationsOpen} sx={{ height: 44, width: 44 }}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsNoneRoundedIcon />
        </Badge>
      </IconButton>
      <IconButton aria-label="Hồ sơ" onClick={onAccountOpen} sx={{ height: 44, width: 44 }}>
        <Avatar sx={{ bgcolor: "primary.main", height: 32, typography: "caption", width: 32 }}>{getInitials(studentName) || "HS"}</Avatar>
      </IconButton>
    </Box>
  );
}
