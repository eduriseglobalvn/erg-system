import { Suspense } from "react";

import { ReportsPanel } from "@/features/lms/components/reports-panel";
import {
  AttendanceSheetPanel,
  LearningResourceLibraryPage,
  LmsAccountPage,
  LmsLoginLogsPage,
  LmsNotificationDetailPage,
  LmsNotificationListPage,
  ScoreSheetPanel,
  TeachingSchedulePanel,
  WeeklyClassLogPage,
} from "@/features/lms/components/lms-teacher-shell-pages";
import {
  getClassStudents,
  MobileUnsupportedScreen,
  TeacherWorkspaceFrame,
} from "@/features/lms/components/lms-teacher-shell-frame";
import type { LmsTeacherShellController } from "@/features/lms/components/use-lms-teacher-shell-controller";
import { LearningResourceDashboardScopeProvider } from "@/features/lms/learning-resources/hooks/use-learning-resource-dashboard-scope";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

/** Mobile screens other than home and the homework flow; see LmsTeacherMobileContent for those. */
export function LmsTeacherMobileSecondaryContent({ model }: { model: LmsTeacherShellController }) {
  const {
    navigate,
    apiBacked,
    pathname,
    bootstrapQuery,
    classes,
    selectedClass,
    selectedSchoolName,
    learningResourceScope,
    runs,
    activeNav,
    teacherName,
    handleClassChange,
  } = model;
  const localPathname = pathname.startsWith("/teacher") ? pathname.slice("/teacher".length) || "/" : pathname;

  if (localPathname === "/calendar" || localPathname.startsWith("/calendar/")) {
    return (
      <Suspense fallback={null}>
        <TeachingSchedulePanel
          isBootstrapLoading={apiBacked && bootstrapQuery.isPending}
          selectedClass={selectedClass}
          teacherName={teacherName}
        />
      </Suspense>
    );
  }

  if (localPathname === "/notifications") {
    return <LmsNotificationListPage onOpenDetail={(notificationId) => void navigate({ href: `${teacherPath("/notifications")}/${notificationId}` })} />;
  }

  if (localPathname.startsWith("/notifications/")) {
    return (
      <LmsNotificationDetailPage
        notificationId={localPathname.replace("/notifications/", "").split("/")[0] ?? ""}
        onBack={() => void navigate({ href: teacherPath("/notifications") })}
      />
    );
  }

  if (localPathname === "/account") {
    return <LmsAccountPage onLoginLogs={() => void navigate({ href: teacherPath("/account/login-logs") })} onSignedOut={() => void navigate({ replace: true, to: "/login" })} />;
  }

  if (localPathname === "/account/login-logs") {
    return <LmsLoginLogsPage onManageAccount={() => void navigate({ href: teacherPath("/account") })} />;
  }

  if (localPathname === "/score") {
    return (
      <Suspense fallback={null}>
        <ScoreSheetPanel selectedClass={selectedClass} selectedSchoolName={selectedSchoolName} students={getClassStudents(selectedClass?.id)} />
      </Suspense>
    );
  }

  if (localPathname === "/attendance") {
    return (
      <Suspense fallback={null}>
        <AttendanceSheetPanel selectedClass={selectedClass} selectedSchoolName={selectedSchoolName} students={getClassStudents(selectedClass?.id)} />
      </Suspense>
    );
  }

  if (localPathname === "/class-log") {
    return (
      <Suspense fallback={null}>
        <WeeklyClassLogPage selectedClass={selectedClass} selectedSchoolName={selectedSchoolName} teacherName={teacherName} />
      </Suspense>
    );
  }

  if (localPathname === "/resources") {
    return (
      <LearningResourceDashboardScopeProvider value={learningResourceScope}>
        <Suspense fallback={null}>
          <LearningResourceLibraryPage />
        </Suspense>
      </LearningResourceDashboardScopeProvider>
    );
  }

  if (localPathname === "/reports") {
    return (
      <TeacherWorkspaceFrame selectedClass={selectedClass} selectedSchoolName={selectedSchoolName}>
        <ReportsPanel classes={classes} onClassChange={(classId) => handleClassChange({ target: { value: classId } })} runs={runs} selectedClass={selectedClass} selectedSchoolName={selectedSchoolName} students={getClassStudents(selectedClass?.id)} />
      </TeacherWorkspaceFrame>
    );
  }

  return <MobileUnsupportedScreen activeLabel={activeNav.label} onGoHome={() => void navigate({ href: teacherPath("/homework/assign") })} />;
}
