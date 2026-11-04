import type { ReactNode } from "react";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

import type { StudentDockPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import { getInitials } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";
import { ergEnterpriseTokens } from "@/themes/erg-enterprise-tokens";

/** Mobile bottom nav: same items as the desktop menu plus the profile; every target is at least 44px. */
export function StudentDashboardBottomDock({
  activePage,
  announcementUnreadCount = 0,
  items,
  studentName = "",
  onPageChange,
}: {
  activePage: string;
  announcementUnreadCount?: number;
  items: Array<{ key: StudentDockPageKey; label: string; icon: ReactNode }>;
  studentName?: string;
  onPageChange: (page: StudentDockPageKey) => void;
}) {
  const initials = getInitials(studentName) || "HS";

  return (
    <Box
      aria-label="Điều hướng học sinh"
      component="nav"
      sx={{
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        bottom: 0,
        left: 0,
        pb: "env(safe-area-inset-bottom, 0px)",
        position: "fixed",
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
          maxWidth: 480,
          mx: "auto",
          px: 0.5,
        }}
      >
        {items.map((item) => {
          const active = activePage === item.key;
          const showBadge = item.key === "announcements" && announcementUnreadCount > 0;
          const icon = item.key === "account" ? (
            <Avatar sx={{ bgcolor: active ? "primary.main" : "text.disabled", height: 24, typography: "caption", width: 24 }}>{initials}</Avatar>
          ) : showBadge ? (
            <Badge badgeContent={announcementUnreadCount > 9 ? "9+" : announcementUnreadCount} color="error">{item.icon}</Badge>
          ) : (
            item.icon
          );

          return (
            <ButtonBase
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              data-selected={active ? "true" : undefined}
              key={item.key}
              onClick={() => onPageChange(item.key)}
              sx={{
                color: active ? "primary.main" : "text.secondary",
                flexDirection: "column",
                gap: 0.25,
                justifyContent: "center",
                minHeight: 56,
                minWidth: 44,
                py: 0.75,
                "&:active": { opacity: 0.7 },
              }}
            >
              <Box
                component="span"
                sx={{
                  alignItems: "center",
                  bgcolor: active ? ergEnterpriseTokens.color.primarySoft : "transparent",
                  borderRadius: 999,
                  display: "flex",
                  height: 28,
                  justifyContent: "center",
                  width: 52,
                }}
              >
                {icon}
              </Box>
              <Typography color="inherit" noWrap variant="caption" sx={{ maxWidth: "100%" }}>
                {item.label}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
