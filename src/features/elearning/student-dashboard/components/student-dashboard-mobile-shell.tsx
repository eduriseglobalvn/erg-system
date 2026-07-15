import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import type { ReactNode } from "react";

import { StudentDashboardBottomDock } from "@/features/elearning/student-dashboard/components/student-dashboard-bottom-dock";
import type { StudentDockPageKey, StudentPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";

export function StudentDashboardMobileShell({
  activePage,
  announcementUnreadCount,
  children,
  currentPageLabel,
  dockItems,
  studentName,
  onAccountOpen,
  onAnnouncementsOpen,
  onPageChange,
}: {
  activePage: StudentPageKey;
  announcementUnreadCount: number;
  children: ReactNode;
  currentPageLabel: string;
  dockItems: Array<{ key: StudentDockPageKey; label: string; icon: ReactNode }>;
  studentName: string;
  onAccountOpen: () => void;
  onAnnouncementsOpen: () => void;
  onPageChange: (page: StudentDockPageKey) => void;
}) {
  const initial = studentName.trim().slice(0, 1).toUpperCase();

  return (
    <Box sx={{ bgcolor: "#f7f8fa", color: "text.primary", minHeight: "100vh", pb: 12 }}>
      <Box component="header" sx={{ backdropFilter: "blur(8px)", bgcolor: "rgba(255,255,255,0.98)", borderBottom: "1px solid #d7e0ec", boxShadow: "0 1px 0 rgba(15,23,42,0.04)", pb: 1.5, pt: "calc(env(safe-area-inset-top, 0px) + 0.8rem)", px: 2, position: "sticky", top: 0, zIndex: 30 }}>
        <Box sx={{ maxWidth: 448, mx: "auto" }}>
          <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1.5, justifyContent: "space-between" }}>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ alignItems: "flex-end", display: "flex", fontSize: 30, fontWeight: 600, lineHeight: 1 }}>
                <Box component="span" sx={{ color: "#696CFF" }}>ER</Box>
                <Box component="span" sx={{ color: "#FF5630" }}>G</Box>
              </Box>
              <Box sx={{ color: "text.secondary", fontSize: 11, fontWeight: 600, mt: 0.75 }}>Learning app</Box>
              <Box sx={{ fontSize: 17, fontWeight: 600, lineHeight: 1, mt: 0.75 }}>{currentPageLabel}</Box>
            </Box>

            <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
              <IconButton
                aria-label="Open announcements"
                sx={{ bgcolor: "background.paper", border: "1px solid #d1d9e6", borderRadius: 1, boxShadow: 1, color: "text.secondary", height: 40, position: "relative", width: 40 }}
                onClick={onAnnouncementsOpen}
              >
                <NotificationsNoneOutlinedIcon sx={{ fontSize: 16 }} />
                {announcementUnreadCount > 0 ? (
                  <Box component="span" sx={{ bgcolor: "#FF5630", borderRadius: 999, color: "common.white", display: "grid", fontSize: 10, fontWeight: 500, height: 16, minWidth: 16, placeItems: "center", position: "absolute", px: 0.5, right: 5, top: 5 }}>
                    {announcementUnreadCount}
                  </Box>
                ) : null}
              </IconButton>

              <IconButton
                aria-label={studentName ? `Open account for ${studentName}` : "Open account"}
                sx={{ bgcolor: "background.paper", border: "1px solid #d1d9e6", borderRadius: 1, boxShadow: activePage === "account" ? "0 0 0 1px rgba(105,108,255,0.24)" : 1, color: activePage === "account" ? "#696CFF" : "text.secondary", height: 40, position: "relative", width: 40 }}
                onClick={onAccountOpen}
              >
                <Box component="span" sx={{ bgcolor: "#696CFF", borderRadius: "50%", boxShadow: 1, color: "common.white", display: "grid", fontSize: 12, fontWeight: 600, height: 32, placeItems: "center", width: 32 }}>
                  {initial || <AccountCircleOutlinedIcon sx={{ fontSize: 16 }} />}
                </Box>
                <Box component="span" sx={{ bgcolor: "#22c55e", border: "2px solid white", borderRadius: "50%", bottom: 7, height: 10, position: "absolute", right: 7, width: 10 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box component="main" sx={{ maxWidth: 448, mx: "auto" }}>{children}</Box>

      <StudentDashboardBottomDock activePage={activePage} items={dockItems} onPageChange={onPageChange} />
    </Box>
  );
}
