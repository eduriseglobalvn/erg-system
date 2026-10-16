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
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import FileText from "@mui/icons-material/Description";

import type { MenuGroup } from "@/components/portal/ErgPortalLayout";
import type { LmsMobileDockItem } from "@/features/lms/mobile";
import { LEARNING_RESOURCE_WORKSPACE_LABEL } from "@/components/learning-resources/learning-resource-workspace-labels";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

export type LmsSection = "home" | "homework" | "score" | "attendance" | "schedule" | "classLog" | "resources" | "reports";
export type LmsMobileSection = "assignHomework" | "exerciseBank" | "home" | "schedule" | "notifications" | "none";

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
  { id: "assignHomework", label: "Giao bài", path: teacherPath("/homework/assign"), icon: AssignmentRoundedIcon },
  { id: "exerciseBank", label: "Kho bài", path: teacherPath("/homework/exercise-bank"), icon: MenuBookRoundedIcon },
  { id: "home", label: "Home", path: teacherPath("/"), icon: HomeRoundedIcon },
  { id: "schedule", label: "Lịch", path: teacherPath("/calendar"), icon: CalendarMonthRoundedIcon },
  { id: "notifications", label: "Thông báo", path: teacherPath("/notifications"), icon: NotificationsNoneRoundedIcon },
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
  if (matchesWorkspacePath(pathname, teacherPath("/homework/exercise-bank"))) return "exerciseBank";
  if (matchesWorkspacePath(pathname, teacherPath("/homework/assign"))) return "assignHomework";
  if (matchesWorkspacePath(pathname, teacherPath("/homework"))) return "assignHomework";
  if (matchesWorkspacePath(pathname, teacherPath("/calendar"))) return "schedule";
  if (matchesWorkspacePath(pathname, teacherPath("/notifications"))) return "notifications";
  if (pathname === "/" || pathname === "/home" || pathname === "/dashboard" || pathname === teacherPath("/") || pathname === teacherPath("/home") || pathname === teacherPath("/dashboard")) return "home";
  return "none";
}
