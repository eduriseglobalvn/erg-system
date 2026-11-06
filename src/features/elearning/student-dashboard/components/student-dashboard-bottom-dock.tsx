import type { ReactNode } from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

import type { StudentDockPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import { getInitials } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";

const { duration, easing } = t.motion;
const motion = `${duration.base}ms ${easing.standard}`;

/**
 * Floating capsule dock (design canvas): icon-only tabs, the current one becomes a solid pill with its label.
 * Notifications show a red dot, the profile is the learner's initials. Every target is 48px.
 */
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
        border: `1px solid ${t.color.border}`,
        borderRadius: `${t.radius.chip}px`,
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        boxShadow: t.shadow.float,
        display: "flex",
        gap: 0.5,
        left: "50%",
        maxWidth: "calc(100vw - 24px)",
        p: 0.75,
        position: "fixed",
        transform: "translateX(-50%)",
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      {items.map((item) => {
        const active = activePage === item.key;
        const unread = item.key === "announcements" && announcementUnreadCount > 0;
        const icon = item.key === "account" ? (
          <Avatar sx={{ bgcolor: active ? "primary.contrastText" : t.color.primarySofter, color: "primary.main", height: 30, typography: "caption", width: 30 }}>
            {initials}
          </Avatar>
        ) : item.icon;

        return (
          <ButtonBase
            aria-current={active ? "page" : undefined}
            aria-label={unread ? `${item.label}, ${announcementUnreadCount} chưa đọc` : item.label}
            data-selected={active ? "true" : undefined}
            key={item.key}
            onClick={() => onPageChange(item.key)}
            sx={{
              bgcolor: active ? "primary.main" : "transparent",
              borderRadius: `${t.radius.chip}px`,
              color: active ? "primary.contrastText" : "text.secondary",
              flexShrink: active ? 1 : 0,
              gap: 1,
              minHeight: 48,
              minWidth: 48,
              pl: 1.5,
              pr: active ? 2 : 1.5,
              position: "relative",
              transition: `background-color ${motion}, color ${motion}, padding ${motion}`,
              typography: "subtitle2",
              "&:hover": active ? { bgcolor: "primary.dark" } : { bgcolor: t.color.primarySofter, color: "text.primary" },
              "& .MuiSvgIcon-root": { fontSize: t.size.iconLg },
              "@media (prefers-reduced-motion: reduce)": { transition: "none" },
            }}
          >
            {icon}
            {active ? (
              <Box component="span" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.label}
              </Box>
            ) : null}
            {unread ? (
              <Box
                aria-hidden
                component="span"
                sx={{ bgcolor: "error.main", border: "2px solid", borderColor: "background.paper", borderRadius: "50%", height: 10, position: "absolute", right: 12, top: 11, width: 10 }}
              />
            ) : null}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
