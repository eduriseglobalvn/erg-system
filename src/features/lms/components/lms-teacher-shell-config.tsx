import { type ElementType } from "react";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import FileText from "@mui/icons-material/Description";

import type { MenuGroup } from "@/components/portal/ErgPortalLayout";
import type { ErgMobileDockItem } from "@/components/portal/erg-mobile-dock";
import { LEARNING_RESOURCE_WORKSPACE_LABEL } from "@/components/learning-resources/learning-resource-workspace-labels";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

export type LmsSection = "home" | "homework" | "score" | "attendance" | "schedule" | "classLog" | "resources" | "reports";
export type LmsMobileSection = "home" | "calendar" | "learning" | "inbox" | "timekeeping" | "account";


type NavItem = {
  id: LmsSection;
  label: string;
  path: string;
  icon: ElementType;
};

export const lmsNavItems: NavItem[] = [
  { id: "home", label: "Trang chủ", path: teacherPath("/home"), icon: DashboardRoundedIcon },
  { id: "homework", label: "Hoạt động học tập", path: teacherPath("/homework"), icon: AssignmentRoundedIcon },
  { id: "score", label: "Bảng điểm", path: teacherPath("/score"), icon: BarChartRoundedIcon },
  { id: "attendance", label: "Điểm danh & KCT", path: teacherPath("/attendance"), icon: EventAvailableRoundedIcon },
  { id: "schedule", label: "Lịch làm việc", path: teacherPath("/calendar"), icon: CalendarMonthRoundedIcon },
  { id: "classLog", label: "Sổ đầu bài", path: teacherPath("/class-log"), icon: MenuBookRoundedIcon },
  { id: "resources", label: LEARNING_RESOURCE_WORKSPACE_LABEL, path: teacherPath("/resources"), icon: FolderRoundedIcon },
  { id: "reports", label: "Báo cáo", path: teacherPath("/reports"), icon: FileText },
];

export const LMS_MENU_GROUPS: MenuGroup[] = [
  {
    label: "",
    items: [
      {
        id: "lms-home",
        label: "Trang chủ",
        icon: <DashboardRoundedIcon sx={{ fontSize: 24 }} />,
        path: teacherPath("/home"),
      },
    ],
  },
  {
    label: "Giảng dạy",
    items: [
      {
        id: "learning-activities",
        label: "Hoạt động học tập",
        icon: <AssignmentRoundedIcon sx={{ fontSize: 24 }} />,
        children: [
          { id: "homework-list", label: "Danh sách hoạt động", path: teacherPath("/homework") },
          { id: "assign-homework", label: "Giao bài tập", path: teacherPath("/homework/assign") },
          { id: "exercise-bank", label: "Kho luyện tập", path: teacherPath("/homework/exercise-bank") },
          { id: "homework-progress", label: "Tiến độ học tập", path: teacherPath("/homework/progress") },
          { id: "class-management", label: "Lớp học", path: teacherPath("/homework/class") },
          { id: "student-groups", label: "Nhóm học sinh", path: teacherPath("/homework/student-groups") },
        ],
      },
      {
        id: "score",
        label: "Bảng điểm",
        icon: <BarChartRoundedIcon sx={{ fontSize: 24 }} />,
        path: teacherPath("/score"),
      },
      {
        id: "attendance",
        label: "Điểm danh & KCT",
        icon: <EventAvailableRoundedIcon sx={{ fontSize: 24 }} />,
        path: teacherPath("/attendance"),
      },
      {
        id: "schedule",
        label: "Lịch làm việc",
        icon: <CalendarMonthRoundedIcon sx={{ fontSize: 24 }} />,
        path: teacherPath("/calendar"),
      },
      {
        id: "class-log",
        label: "Sổ đầu bài",
        icon: <MenuBookRoundedIcon sx={{ fontSize: 24 }} />,
        path: teacherPath("/class-log"),
      },
    ],
  },
  {
    label: "Học liệu",
    items: [
      {
        id: "resources",
        label: LEARNING_RESOURCE_WORKSPACE_LABEL,
        icon: <FolderRoundedIcon sx={{ fontSize: 24 }} />,
        path: teacherPath("/resources"),
      },
    ],
  },
  {
    label: "Báo cáo",
    items: [
      {
        id: "reports",
        label: "Báo cáo lớp học",
        icon: <GroupsRoundedIcon sx={{ fontSize: 24 }} />,
        path: teacherPath("/reports"),
      },
    ],
  },
];

const lmsMobileDockItems: Array<ErgMobileDockItem<LmsMobileSection>> = [
  { id: "home", label: "Hôm nay", path: teacherPath("/"), icon: TodayRoundedIcon },
  { id: "calendar", label: "Lịch", path: teacherPath("/calendar"), icon: CalendarMonthRoundedIcon },
  { id: "learning", label: "Học tập", path: teacherPath("/learning"), icon: SchoolRoundedIcon },
  { id: "inbox", label: "Hộp thư", path: teacherPath("/notifications"), icon: InboxRoundedIcon },
  // The timekeeping route is not built yet; canAccess hides this tab until it exists.
  { id: "timekeeping", label: "Chấm công", path: teacherPath("/timekeeping"), icon: FingerprintRoundedIcon },
  // Opens the account sheet in LmsMobileShell; the path is only used for the permission check.
  { id: "account", label: "Tài khoản", path: teacherPath("/account"), icon: AccountCircleRoundedIcon, opensSheet: true },
];

export function visibleLmsDockItems(canAccess: (path: string) => boolean): Array<ErgMobileDockItem<LmsMobileSection>> {
  return lmsMobileDockItems.filter((item) => canAccess(item.path));
}

/** Screens that are neither on the dock nor in the Học tập hub; listed in the account sheet so nothing becomes unreachable on mobile. */
export const lmsMobileMoreItems: Array<{ icon: ErgMobileDockItem<string>["icon"]; label: string; path: string }> = [
  { icon: EventAvailableRoundedIcon, label: "Điểm danh", path: teacherPath("/attendance") },
  { icon: MenuBookRoundedIcon, label: "Sổ đầu bài", path: teacherPath("/class-log") },
  { icon: FactCheckRoundedIcon, label: "Điểm số", path: teacherPath("/score") },
];

function matchesWorkspacePath(pathname: string, canonicalPath: string) {
  const legacyPath = canonicalPath.replace(/^\/teacher(?=\/|$)/, "") || "/";
  return [canonicalPath, legacyPath].some((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
}

export function resolveSection(pathname: string): LmsSection {
  if (pathname === "/" || pathname === "/teacher" || pathname === "/home" || pathname === "/dashboard" || pathname === teacherPath("/home") || pathname === teacherPath("/dashboard")) return "home";
  return lmsNavItems.find((item) => matchesWorkspacePath(pathname, item.path))?.id ?? "homework";
}

export function resolveLmsMobileSection(pathname: string): LmsMobileSection | null {
  if (["/", "/home", "/dashboard", teacherPath("/"), teacherPath("/home"), teacherPath("/dashboard")].includes(pathname)) return "home";
  const sections: Array<[LmsMobileSection, string[]]> = [
    ["calendar", ["/calendar"]],
    ["learning", ["/learning", "/homework", "/reports"]],
    ["inbox", ["/notifications"]],
    ["timekeeping", ["/timekeeping"]],
    ["account", ["/account"]],
  ];
  return sections.find(([, paths]) => paths.some((path) => matchesWorkspacePath(pathname, teacherPath(path))))?.[0] ?? null;
}

const MOBILE_TITLES: Array<[string, string]> = [
  ["/homework/assign", "Giao bài"],
  ["/homework/exercise-bank", "Kho luyện tập"],
  ["/homework/progress", "Tiến độ học tập"],
  ["/homework/student-groups", "Nhóm học sinh"],
  ["/homework/class", "Lớp học"],
  ["/attendance", "Điểm danh"],
  ["/reports", "Báo cáo lớp học"],
  ["/notifications", "Thông báo"],
  ["/account", "Tài khoản"],
];

/** Top-bar title on mobile: specific screen name first, then the dock label, then the desktop section label. */
export function resolveMobileTitle(pathname: string, section: LmsMobileSection | null, sectionLabel: string) {
  const specific = MOBILE_TITLES.find(([path]) => matchesWorkspacePath(pathname, teacherPath(path)));
  if (specific) return specific[1];
  return lmsMobileDockItems.find((item) => item.id === section)?.label ?? sectionLabel;
}
