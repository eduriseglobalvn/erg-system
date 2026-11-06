import { lazy } from "react";

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
