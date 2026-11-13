import type { StudentDockPageKey } from "@/features/elearning/student-dashboard/types/dashboard-view-types";
import { ErgMobileDock } from "@/components/portal/erg-mobile-dock";
import type { TierKey } from "@/domain/student-tier/tiers";
import { STUDENT_NAV_ICONS } from "@/features/elearning/student-dashboard/utils/student-nav-icons";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

/** Phone dock (spec 7.0): home, assignments, leaderboard, inbox and the profile avatar; the rest is reached from the overview. */
const DOCK_PAGES: StudentDockPageKey[] = ["overview", "assignments", "ranking", "announcements"];

/** Student tabs switch by state, not URL, so the dock item path carries the page key. */
export function StudentDashboardBottomDock({
  activePage,
  announcementUnreadCount = 0,
  avatarTier = null,
  items,
  onPageChange,
}: {
  activePage: string;
  announcementUnreadCount?: number;
  avatarTier?: TierKey | null;
  items: Array<{ key: StudentDockPageKey; label: string; avatarInitials?: string }>;
  onPageChange: (page: StudentDockPageKey) => void;
}) {
  return (
    <ErgMobileDock
      activeId={activePage}
      ariaLabel="Điều hướng học sinh"
      // The shell is only mounted on phone-width surfaces (useIsMobile, 768px), which no MUI breakpoint matches.
      hideAt="never"
      items={items
        .filter((item) => item.key === "account" || DOCK_PAGES.includes(item.key))
        .map((item) => ({
          activeIcon: STUDENT_NAV_ICONS[item.key]?.activeIcon,
          avatarInitials: item.avatarInitials,
          avatarTier: item.key === "account" ? avatarTier : undefined,
          badgeCount: item.key === "announcements" ? announcementUnreadCount : undefined,
          icon: STUDENT_NAV_ICONS[item.key]?.icon ?? AccountCircleOutlinedIcon,
          id: item.key as string,
          label: item.label,
          path: item.key,
        }))}
      onNavigate={(page) => onPageChange(page as StudentDockPageKey)}
    />
  );
}
