import { lazy, type ElementType } from "react";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import FileText from "@mui/icons-material/Description";

import type { MenuGroup } from "@/components/portal/ErgPortalLayout";
import type { LmsMobileDockItem } from "@/features/lms/mobile";
import { LEARNING_RESOURCE_WORKSPACE_LABEL } from "@/components/learning-resources/learning-resource-workspace-labels";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

export type LmsSection = "home" | "homework" | "score" | "attendance" | "schedule" | "classLog" | "resources" | "reports";
export type LmsMobileSection = "home" | "attendance" | "assignHomework" | "class" | "more";

export const LearningResourceLibraryPage = lazy(() =>
  import("@/features/lms/learning-resources/components/learning-resource-library-page").then((module) => ({
    default: module.LearningResourceLibraryPage,
  })),
);
export const TeachingSchedulePanel = lazy(() =>
  import("@/features/lms/components/teaching-schedule/lms-erg-calendar-workspace").then((module) => ({
    default: module.LmsErgCalendarWorkspace,
  })),
);
export const WeeklyClassLogPage = lazy(() =>
  import("@/features/lms/weekly-class-log").then((module) => ({
    default: module.WeeklyClassLogPage,
  })),
);
export const ScoreSheetPanel = lazy(() =>
  import("@/features/lms/components/score-sheet-panel").then((module) => ({
    default: module.ScoreSheetPanel,
  })),
);
export const AttendanceSheetPanel = lazy(() =>
  import("@/features/lms/components/attendance-sheet-panel").then((module) => ({
    default: module.AttendanceSheetPanel,
  })),
);
export const AssignHomeworkPage = lazy(() =>
  import("@/features/lms/components/assign-homework-page").then((module) => ({
    default: module.AssignHomeworkPage,
  })),
);
export const ExerciseBankPage = lazy(() =>
  import("@/features/lms/components/exercise-bank-page").then((module) => ({
    default: module.ExerciseBankPage,
  })),
);
export const StudentGroupsPage = lazy(() =>
  import("@/features/lms/components/student-groups-page").then((module) => ({
    default: module.StudentGroupsPage,
  })),
);
export const ClassManagementPage = lazy(() =>
  import("@/features/lms/classroom/components/class-management-page").then((module) => ({
    default: module.ClassManagementPage,
  })),
);
export const HomeworkProgressPage = lazy(() =>
  import("@/features/lms/components/homework-progress-page").then((module) => ({
    default: module.HomeworkProgressPage,
  })),
);
export const LmsAccountPage = lazy(() =>
  import("@/features/lms/components/lms-account-page").then((module) => ({
    default: module.LmsAccountPage,
  })),
);
export const LmsLoginLogsPage = lazy(() =>
  import("@/features/lms/components/lms-login-logs-page").then((module) => ({
    default: module.LmsLoginLogsPage,
  })),
);
export const LmsNotificationDetailPage = lazy(() =>
  import("@/features/lms/components/lms-notification-detail-page").then((module) => ({
    default: module.LmsNotificationDetailPage,
  })),
);
export const LmsNotificationListPage = lazy(() =>
  import("@/features/lms/components/lms-notification-detail-page").then((module) => ({
    default: module.LmsNotificationListPage,
  })),
);

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

export const lmsMobileDockItems: Array<LmsMobileDockItem<LmsMobileSection>> = [
  { id: "home", label: "Hôm nay", path: teacherPath("/"), icon: HomeRoundedIcon },
  { id: "attendance", label: "Điểm danh", path: teacherPath("/attendance"), icon: EventAvailableRoundedIcon },
  { id: "assignHomework", label: "Giao bài", path: teacherPath("/homework/assign"), icon: AssignmentRoundedIcon },
  { id: "class", label: "Lớp", path: teacherPath("/homework/class"), icon: GroupsRoundedIcon },
  // "Thêm" opens the menu sheet in LmsMobileShell; the path is only used for the permission check.
  { id: "more", label: "Thêm", path: teacherPath("/account"), icon: MoreHorizRoundedIcon, opensMenu: true },
];

/** Screens that left the dock; listed in the "Thêm" sheet so nothing becomes unreachable on mobile. */
export const lmsMobileMoreItems: Array<{ icon: LmsMobileDockItem<string>["icon"]; label: string; path: string }> = [
  { icon: CalendarMonthRoundedIcon, label: "Lịch làm việc", path: teacherPath("/calendar") },
  { icon: MenuBookRoundedIcon, label: "Kho luyện tập", path: teacherPath("/homework/exercise-bank") },
  { icon: InsightsRoundedIcon, label: "Tiến độ học tập", path: teacherPath("/homework/progress") },
  { icon: GroupsRoundedIcon, label: "Nhóm học sinh", path: teacherPath("/homework/student-groups") },
  { icon: FactCheckRoundedIcon, label: "Bảng điểm", path: teacherPath("/score") },
  { icon: MenuBookRoundedIcon, label: "Sổ đầu bài", path: teacherPath("/class-log") },
  { icon: FolderRoundedIcon, label: LEARNING_RESOURCE_WORKSPACE_LABEL, path: teacherPath("/resources") },
  { icon: BarChartRoundedIcon, label: "Báo cáo lớp học", path: teacherPath("/reports") },
  { icon: NotificationsNoneRoundedIcon, label: "Thông báo", path: teacherPath("/notifications") },
];

function matchesWorkspacePath(pathname: string, canonicalPath: string) {
  const legacyPath = canonicalPath.replace(/^\/teacher(?=\/|$)/, "") || "/";
  return [canonicalPath, legacyPath].some((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
}

export function resolveSection(pathname: string): LmsSection {
  if (pathname === "/" || pathname === "/teacher" || pathname === "/home" || pathname === "/dashboard" || pathname === teacherPath("/home") || pathname === teacherPath("/dashboard")) return "home";
  return lmsNavItems.find((item) => matchesWorkspacePath(pathname, item.path))?.id ?? "homework";
}

export function resolveMobileSection(pathname: string): LmsMobileSection {
  if (pathname === "/" || pathname === "/home" || pathname === "/dashboard" || pathname === teacherPath("/") || pathname === teacherPath("/home") || pathname === teacherPath("/dashboard")) return "home";
  if (matchesWorkspacePath(pathname, teacherPath("/attendance"))) return "attendance";
  if (matchesWorkspacePath(pathname, teacherPath("/homework/class")) || matchesWorkspacePath(pathname, teacherPath("/homework/student-groups"))) return "class";
  if (matchesWorkspacePath(pathname, teacherPath("/homework"))) return "assignHomework";
  return "more";
}

const MOBILE_TITLES: Array<[string, string]> = [
  ["/homework/exercise-bank", "Kho luyện tập"],
  ["/homework/progress", "Tiến độ học tập"],
  ["/homework/student-groups", "Nhóm học sinh"],
  ["/homework/class", "Lớp học"],
  ["/notifications", "Thông báo"],
  ["/account", "Tài khoản"],
];

/** Top-bar title on mobile: specific screen name first, then the dock label, then the desktop section label. */
export function resolveMobileTitle(pathname: string, section: LmsMobileSection, sectionLabel: string) {
  const specific = MOBILE_TITLES.find(([path]) => matchesWorkspacePath(pathname, teacherPath(path)));
  if (specific) return specific[1];
  return (section === "more" ? undefined : lmsMobileDockItems.find((item) => item.id === section)?.label) ?? sectionLabel;
}
