import type { ReactNode } from "react";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";

import type { StudentDockPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import { getInitials } from "@/features/elearning/student-dashboard/utils/student-dashboard-workspace-utils";

export function StudentDashboardBottomDock({
  activePage,
  announcementUnreadCount = 0,
  items,
  studentName = "",
  onPageChange,
}: {
  activePage: string;
  announcementUnreadCount?: number;
  items: Array<{ key: StudentDockPageKey; label: string; icon: ReactNode; badgeCount?: number }>;
  studentName?: string;
  onPageChange: (page: StudentDockPageKey) => void;
}) {
  const initials = getInitials(studentName) || "TV";

  return (
    <Box
      aria-label="Điều hướng Student Workspace"
      component="nav"
      sx={{
        backdropFilter: "blur(25px) saturate(190%)",
        WebkitBackdropFilter: "blur(25px) saturate(190%)",
        bgcolor: "rgba(255, 255, 255, 0.88)",
        borderTop: "1px solid rgba(226, 232, 240, 0.85)",
        bottom: 0,
        boxShadow: "0 -4px 16px rgba(15, 23, 42, 0.04)",
        left: 0,
        pb: "env(safe-area-inset-bottom, 0px)",
        position: "fixed",
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
          height: 52,
          maxWidth: 480,
          mx: "auto",
          px: 0.5,
        }}
      >
        {items.map((item) => {
          const active = activePage === item.key;
          const isAccount = item.key === "account";
          const isAnnouncements = item.key === "announcements";
          const showBadge = isAnnouncements && announcementUnreadCount > 0;

          return (
            <ButtonBase
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              data-selected={active ? "true" : undefined}
              key={item.key}
              onClick={() => onPageChange(item.key)}
              sx={{
                alignItems: "center",
                borderRadius: "10px",
                color: active ? "#2563EB" : "#8E8E93",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                justifyContent: "center",
                minWidth: 0,
                position: "relative",
                pt: 0.5,
                pb: 0.4,
                transition: "all 140ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                "&:active": {
                  opacity: 0.82,
                  transform: "scale(0.92)",
                },
              }}
            >
              {active ? (
                <Box
                  sx={{
                    bgcolor: "#2563EB",
                    borderRadius: "0 0 3px 3px",
                    height: 2.5,
                    left: "50%",
                    position: "absolute",
                    top: 0,
                    transform: "translateX(-50%)",
                    width: 20,
                  }}
                />
              ) : null}

              <Box
                component="span"
                sx={{
                  alignItems: "center",
                  display: "flex",
                  height: 24,
                  justifyContent: "center",
                  width: 24,
                  "& svg": {
                    fontSize: 21,
                    height: 21,
                    width: 21,
                  },
                }}
              >
                {isAccount ? (
                  <Avatar
                    sx={{
                      bgcolor: "#F97316",
                      boxShadow: active
                        ? "0 0 0 2px #2563EB, 0 0 0 4px rgba(37, 99, 235, 0.2)"
                        : "0 1px 2px rgba(15, 23, 42, 0.12)",
                      color: "#FFFFFF",
                      fontSize: 10,
                      fontWeight: 800,
                      height: 24,
                      letterSpacing: "0.02em",
                      transition: "box-shadow 0.15s ease",
                      width: 24,
                    }}
                  >
                    {initials || <PersonOutlineRoundedIcon sx={{ fontSize: 16 }} />}
                  </Avatar>
                ) : showBadge ? (
                  <Badge
                    badgeContent={announcementUnreadCount > 9 ? "9+" : announcementUnreadCount}
                    color="error"
                    sx={{
                      "& .MuiBadge-badge": {
                        bgcolor: "#EF4444",
                        fontSize: 9.5,
                        fontWeight: 800,
                        height: 16,
                        minWidth: 16,
                        padding: "0 3.5px",
                        right: -3,
                        top: 2,
                      },
                    }}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </Box>

              <Typography
                color="inherit"
                noWrap
                sx={{
                  fontSize: 10,
                  fontWeight: active ? 750 : 500,
                  letterSpacing: "-0.015em",
                  lineHeight: 1.2,
                  maxWidth: "100%",
                  mt: 0.25,
                }}
              >
                {item.label}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
