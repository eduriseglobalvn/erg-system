import { Suspense } from "react";
import { Box } from "@mui/material";

import { HomeworkPanel } from "@/features/lms/components/homework-panel";
import { ReportsPanel } from "@/features/lms/components/reports-panel";
import {
  AssignHomeworkPage,
  AttendanceSheetPanel,
  ClassManagementPage,
  ExerciseBankPage,
  HomeworkProgressPage,
  LearningResourceLibraryPage,
  LmsAccountPage,
  LmsLoginLogsPage,
  LmsNotificationDetailPage,
  LmsNotificationListPage,
  ScoreSheetPanel,
  StudentGroupsPage,
  TeachingSchedulePanel,
  WeeklyClassLogPage,
} from "@/features/lms/components/lms-teacher-shell-config";
import {
  getClassStudents,
  LmsHomeDashboard,
  MobileUnsupportedScreen,
  TeacherWorkspaceFrame,
} from "@/features/lms/components/lms-teacher-shell-presentation";
import type { LmsTeacherShellController } from "@/features/lms/components/use-lms-teacher-shell-controller";
import { classroomStudents } from "@/features/lms/classroom/api/mock-classroom-data";
import { LearningResourceDashboardScopeProvider } from "@/features/lms/learning-resources/hooks/use-learning-resource-dashboard-scope";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

interface WorkspaceProps {
  model: LmsTeacherShellController;
}

export function LmsTeacherDesktopContent({ model }: WorkspaceProps) {
  const {
    navigate,
    apiBacked,
    pathname,
    progressAssignmentId,
    activeSection,
    bootstrapQuery,
    classes,
    runs,
    selectedSchoolId,
    selectedClass,
    selectedSchoolName,
    teacherName,
    learningResourceScope,
    unreadNotificationCount,
    handleLocalAssignmentCreated,
  } = model;
  const localPathname = pathname.startsWith("/teacher") ? pathname.slice("/teacher".length) || "/" : pathname;

  return (
    <>
      {activeSection === "home" ? (
        <LmsHomeDashboard
          runs={runs}
          selectedClass={selectedClass}
          selectedSchoolName={selectedSchoolName}
          teacherName={teacherName}
          unreadNotificationCount={unreadNotificationCount}
          onAssign={() => void navigate({ href: teacherPath("/homework/assign") })}
          onOpenHomework={() => void navigate({ href: teacherPath("/homework") })}
          onOpenSchedule={() => void navigate({ href: teacherPath("/calendar") })}
        />
      ) : localPathname === "/account" ? (
        <LmsAccountPage
          onLoginLogs={() => void navigate({ href: teacherPath("/account/login-logs") })}
          onSignedOut={() => void navigate({ replace: true, to: "/login" })}
        />
      ) : localPathname === "/account/login-logs" ? (
        <LmsLoginLogsPage onManageAccount={() => void navigate({ href: teacherPath("/account") })} />
      ) : localPathname === "/notifications" ? (
        <LmsNotificationListPage onOpenDetail={(notificationId) => void navigate({ href: `${teacherPath("/notifications")}/${notificationId}` })} />
      ) : localPathname.startsWith("/notifications/") ? (
        <LmsNotificationDetailPage
          notificationId={localPathname.replace("/notifications/", "").split("/")[0] ?? ""}
          onBack={() => void navigate({ href: teacherPath("/notifications") })}
        />
      ) : localPathname === "/homework/assign" ? (
        <Suspense fallback={null}>
          <AssignHomeworkPage
            classes={classes}
            selectedClass={selectedClass}
            onBack={() => void navigate({ href: teacherPath("/homework") })}
            onCreateAssignment={(title, subject) => handleLocalAssignmentCreated(title, subject, teacherPath("/homework"))}
          />
        </Suspense>
      ) : localPathname === "/homework/student-groups" ? (
        <Suspense fallback={null}>
          <StudentGroupsPage
            classes={classes}
            selectedClass={selectedClass}
            selectedSchoolName={selectedSchoolName}
            onBack={() => void navigate({ href: teacherPath("/homework") })}
          />
        </Suspense>
      ) : localPathname === "/homework/class" ? (
        <Suspense fallback={null}>
          <ClassManagementPage
            classes={classes}
            selectedClass={selectedClass}
            selectedSchoolName={selectedSchoolName}
            students={classroomStudents.filter((student) => student.schoolId === selectedSchoolId)}
          />
        </Suspense>
      ) : localPathname === "/homework/exercise-bank" ? (
        <Suspense fallback={null}>
          <ExerciseBankPage
            onBack={() => void navigate({ href: teacherPath("/homework") })}
            onAssign={(exerciseTitle) => handleLocalAssignmentCreated(exerciseTitle, "Kho bài tập", teacherPath("/homework"))}
          />
        </Suspense>
      ) : localPathname === "/homework/progress" ? (
        <Suspense fallback={null}>
          <HomeworkProgressPage
            initialRunId={progressAssignmentId}
            onBack={() => void navigate({ href: teacherPath("/homework") })}
            runs={runs}
            selectedClass={selectedClass}
            students={classroomStudents.filter((student) => student.schoolId === selectedSchoolId)}
          />
        </Suspense>
      ) : activeSection === "resources" ? (
        <LearningResourceDashboardScopeProvider value={learningResourceScope}>
          <Suspense fallback={null}>
            <LearningResourceLibraryPage />
          </Suspense>
        </LearningResourceDashboardScopeProvider>
      ) : activeSection === "schedule" ? (
        <Box sx={{ height: "100%", minHeight: 720 }}>
          <Suspense fallback={null}>
            <TeachingSchedulePanel
              isBootstrapLoading={apiBacked && bootstrapQuery.isPending}
              selectedClass={selectedClass}
              teacherName={teacherName}
            />
          </Suspense>
        </Box>
      ) : activeSection === "classLog" ? (
        <Suspense fallback={null}>
          <WeeklyClassLogPage
            selectedClass={selectedClass}
            selectedSchoolName={selectedSchoolName}
            teacherName={teacherName}
          />
        </Suspense>
      ) : activeSection === "score" ? (
        <Suspense fallback={null}>
          <ScoreSheetPanel selectedClass={selectedClass} selectedSchoolName={selectedSchoolName} students={getClassStudents(selectedClass?.id)} />
        </Suspense>
      ) : activeSection === "attendance" ? (
        <Suspense fallback={null}>
          <AttendanceSheetPanel selectedClass={selectedClass} selectedSchoolName={selectedSchoolName} students={getClassStudents(selectedClass?.id)} />
        </Suspense>
      ) : activeSection === "homework" ? (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%", gap: 2, px: { xs: 2, sm: 3 }, py: 2 }}>
          <HomeworkPanel
            selectedClass={selectedClass}
            runs={runs}
            onAssign={() => void navigate({ href: teacherPath("/homework/assign") })}
            onViewProgress={(runId) => void navigate({ href: `${teacherPath("/homework/progress")}?assignmentId=${encodeURIComponent(runId)}` })}
          />
        </Box>
      ) : (
            <TeacherWorkspaceFrame
              selectedClass={selectedClass}
              selectedSchoolName={selectedSchoolName}
            >
          {activeSection === "reports" ? <ReportsPanel selectedClass={selectedClass} selectedSchoolName={selectedSchoolName} /> : null}
        </TeacherWorkspaceFrame>
      )}
    </>
  );
}

export function LmsTeacherMobileContent({ model }: WorkspaceProps) {
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
    unreadNotificationCount,
    activeNav,
    teacherName,
    handleLocalAssignmentCreated,
  } = model;
  const localPathname = pathname.startsWith("/teacher") ? pathname.slice("/teacher".length) || "/" : pathname;

  return (() => {
    if (localPathname === "/" || localPathname === "/home" || localPathname === "/dashboard") {
      return (
        <LmsHomeDashboard
          runs={runs}
          selectedClass={selectedClass}
          selectedSchoolName={selectedSchoolName}
          teacherName={teacherName}
          unreadNotificationCount={unreadNotificationCount}
          onAssign={() => void navigate({ href: teacherPath("/homework/assign") })}
          onOpenHomework={() => void navigate({ href: teacherPath("/homework") })}
          onOpenSchedule={() => void navigate({ href: teacherPath("/calendar") })}
        />
      );
    }

    if (localPathname === "/homework") {
      return (
        <Suspense fallback={null}>
          <Box sx={{ minHeight: "100%", px: { xs: 1.5, sm: 2 }, py: 2 }}>
            <HomeworkPanel
              selectedClass={selectedClass}
              runs={runs}
              onAssign={() => void navigate({ href: teacherPath("/homework/assign") })}
              onViewProgress={(runId) => void navigate({ href: `${teacherPath("/homework/progress")}?assignmentId=${encodeURIComponent(runId)}` })}
            />
          </Box>
        </Suspense>
      );
    }

    if (localPathname === "/homework/assign") {
      return (
        <Suspense fallback={null}>
          <AssignHomeworkPage
            classes={classes}
            selectedClass={selectedClass}
            onBack={() => void navigate({ href: teacherPath("/homework") })}
            onCreateAssignment={(title, subject) => handleLocalAssignmentCreated(title, subject, teacherPath("/homework"))}
          />
        </Suspense>
      );
    }

    if (localPathname === "/homework/exercise-bank") {
      return (
        <Suspense fallback={null}>
          <ExerciseBankPage
            onBack={() => void navigate({ href: teacherPath("/homework/assign") })}
            onAssign={(exerciseTitle) => handleLocalAssignmentCreated(exerciseTitle, "Kho bài tập", teacherPath("/homework/assign"))}
          />
        </Suspense>
      );
    }

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
          <ReportsPanel selectedClass={selectedClass} selectedSchoolName={selectedSchoolName} />
        </TeacherWorkspaceFrame>
      );
    }

    return <MobileUnsupportedScreen activeLabel={activeNav.label} onGoHome={() => void navigate({ href: teacherPath("/homework/assign") })} />;
  })();
}
