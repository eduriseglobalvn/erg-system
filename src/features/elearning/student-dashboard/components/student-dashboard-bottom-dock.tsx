import type { ComponentType } from "react";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import type { SvgIconProps } from "@mui/material/SvgIcon";

import { ErgMobileDock } from "@/components/portal/erg-mobile-dock";
import type { StudentDockPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";

const DOCK_ICONS: Record<StudentDockPageKey, ComponentType<SvgIconProps>> = {
  account: AccountCircleOutlinedIcon,
  announcements: InboxOutlinedIcon,
  assignments: AssignmentTurnedInOutlinedIcon,
  discussion: ForumOutlinedIcon,
  overview: HomeOutlinedIcon,
  ranking: LeaderboardOutlinedIcon,
  scores: AssignmentTurnedInOutlinedIcon,
};

/** Student tabs switch by state, not URL, so the dock item path carries the page key. */
export function StudentDashboardBottomDock({
  activePage,
  announcementUnreadCount = 0,
  items,
  onPageChange,
}: {
  activePage: string;
  announcementUnreadCount?: number;
  items: Array<{ key: StudentDockPageKey; label: string; avatarInitials?: string }>;
  onPageChange: (page: StudentDockPageKey) => void;
}) {
  return (
    <ErgMobileDock
      activeId={activePage}
      ariaLabel="Điều hướng học sinh"
      // The shell is only mounted on phone-width surfaces (useIsMobile, 768px), which no MUI breakpoint matches.
      hideAt="never"
      items={items.map((item) => ({
        avatarInitials: item.avatarInitials,
        badgeCount: item.key === "announcements" ? announcementUnreadCount : undefined,
        icon: DOCK_ICONS[item.key],
        id: item.key as string,
        label: item.label,
        path: item.key,
      }))}
      onNavigate={(page) => onPageChange(page as StudentDockPageKey)}
    />
  );
}
