import { lazy, Suspense } from "react";
import Box from "@mui/material/Box";

import { HomeworkPanel } from "@/features/lms/components/homework-panel";
import { ReportsPanel } from "@/features/lms/components/reports-panel";
import {
  AssignHomeworkPage,
  ClassManagementPage,
  ExerciseBankPage,
  HomeworkProgressPage,
  LearningResourceLibraryPage,
  LmsAccountPage,
  LmsLoginLogsPage,
  ScoreSheetPanel,
  StudentGroupsPage,
  TeachingSchedulePanel,
  ClassLogPage,
} from "@/features/lms/components/lms-teacher-shell-pages";
import { TeacherWorkspaceFrame } from "@/features/lms/components/lms-teacher-shell-frame";
import { ClassScoreBoard } from "@/features/lms/components/score/class-score-board";
import { TeacherClassRoster } from "@/features/lms/components/teacher-class-roster";
import { useLmsTeacherShellModel } from "@/features/lms/components/lms-teacher-shell-context";
import { TeacherLearningHub } from "@/features/lms/learning-hub/teacher-learning-hub";
import { LmsHomeDashboard } from "@/features/lms/components/lms-home-dashboard";
import { classroomStudents } from "@/features/lms/classroom/api/classroom-defaults";
import { LearningResourceDashboardScopeProvider } from "@/features/lms/learning-resources/hooks/use-learning-resource-dashboard-scope";
import { canNavigateToLmsPath } from "@/features/lms/navigation/lms-navigation";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

const LessonReportMobileGate = lazy(() =>
  import("@/features/class-log/reports/lesson-report-mobile").then((module) => ({ default: module.LessonReportMobileGate })),
);
const PeriodAttendancePage = lazy(() =>
  import("@/features/class-log/attendance/components/period-attendance-page").then((module) => ({ default: module.PeriodAttendancePage })),
);

/**
 * One component per Teacher child route. Each reads the shell state from context and owns its
 * mobile/desktop difference, so the shell itself only renders <Outlet />.
 */

export function TeacherHomeRoute() {
  const m = useLmsTeacherShellModel();
  return (
    <LmsHomeDashboard
      canPunch={canNavigateToLmsPath(teacherPath("/timekeeping"), m.grantedPermissions, m.deniedPermissions)}
      classes={m.selectedClassOptions}
      mobile={m.isMobile}
      onNavigate={(href) => void m.navigate({ href })}
      onOpenClassLog={() => void m.navigate({ href: teacherPath("/class-log") })}
      onOpenTimekeeping={() => void m.navigate({ href: teacherPath("/timekeeping") })}
      onClassChange={(classId) => m.handleClassChange({ target: { value: classId } })}
      onOpenNotifications={() => void m.navigate({ href: teacherPath("/notifications") })}
      onOpenProgress={() => void m.navigate({ href: teacherPath("/homework/progress") })}
      runs={m.runs}
      selectedClass={m.selectedClass}
      selectedSchoolName={m.selectedSchoolName}
      teacherName={m.teacherName}
      unreadNotificationCount={m.unreadNotificationCount}
      onAssign={() => void m.navigate({ href: teacherPath("/homework/assign") })}
      onOpenHomework={() => void m.navigate({ href: teacherPath("/homework") })}
      onOpenSchedule={() => void m.navigate({ href: teacherPath("/calendar") })}
    />
  );
}

export function TeacherLearningHubRoute() {
  return <TeacherLearningHub />;
}

export function TeacherHomeworkRoute() {
  const m = useLmsTeacherShellModel();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%", gap: 2, px: m.isMobile ? { xs: 1.5, sm: 2 } : { xs: 2, sm: 3 }, py: 2 }}>
      <HomeworkPanel
        selectedClass={m.selectedClass}
        runs={m.runs}
        onAssign={() => void m.navigate({ href: teacherPath("/homework/assign") })}
        onViewProgress={(runId) => void m.navigate({ href: `${teacherPath("/homework/progress")}?assignmentId=${encodeURIComponent(runId)}` })}
      />
    </Box>
  );
}

export function TeacherAssignHomeworkRoute() {
  const m = useLmsTeacherShellModel();
  return (
    <Suspense fallback={null}>
      <AssignHomeworkPage
        classes={m.selectedClassOptions.length > 0 ? m.selectedClassOptions : m.classes}
        selectedClass={m.selectedClass}
        onBack={() => void m.navigate({ href: teacherPath("/homework") })}
        onCreateAssignment={(title, subject) => m.handleLocalAssignmentCreated(title, subject, teacherPath("/homework"))}
        onSelectClass={(classId) => m.handleClassChange({ target: { value: classId } })}
      />
    </Suspense>
  );
}

export function TeacherExerciseBankRoute() {
  const m = useLmsTeacherShellModel();
  // Mobile returns to the assignment form it was opened from; desktop returns to the list.
  const back = teacherPath(m.isMobile ? "/homework/assign" : "/homework");
  return (
    <Suspense fallback={null}>
      <ExerciseBankPage
        currentClassId={m.selectedClass?.id}
        onBack={() => void m.navigate({ href: back })}
        onAssign={(exerciseTitle) => m.handleLocalAssignmentCreated(exerciseTitle, "Kho bài tập", back)}
      />
    </Suspense>
  );
}

export function TeacherHomeworkProgressRoute() {
  const m = useLmsTeacherShellModel();
  return (
    <Suspense fallback={null}>
      <HomeworkProgressPage
        initialRunId={m.progressAssignmentId}
        onBack={() => void m.navigate({ href: teacherPath("/homework") })}
        runs={m.runs}
        selectedClass={m.selectedClass}
        students={classroomStudents.filter((student) => student.schoolId === m.selectedSchoolId)}
      />
    </Suspense>
  );
}

export function TeacherStudentGroupsRoute() {
  const m = useLmsTeacherShellModel();
  return (
    <Suspense fallback={null}>
      <StudentGroupsPage
        classes={m.classes}
        selectedClass={m.selectedClass}
        selectedSchoolName={m.selectedSchoolName}
        onBack={() => void m.navigate({ href: teacherPath("/homework") })}
      />
    </Suspense>
  );
}

export function TeacherClassManagementRoute() {
  const m = useLmsTeacherShellModel();
  return (
    <Suspense fallback={null}>
      <ClassManagementPage
        // The page keeps its own scope; a new class in the header restarts it on that class.
        key={m.selectedClass?.id}
        classes={m.classes}
        selectedClass={m.selectedClass}
        selectedSchoolName={m.selectedSchoolName}
        students={classroomStudents.filter((student) => student.schoolId === m.selectedSchoolId)}
      />
    </Suspense>
  );
}

export function TeacherAccountRoute() {
  const { navigate } = useLmsTeacherShellModel();
  return (
    <LmsAccountPage
      onLoginLogs={() => void navigate({ href: teacherPath("/account/login-logs") })}
      onSignedOut={() => void navigate({ replace: true, to: "/login" })}
    />
  );
}

export function TeacherLoginLogsRoute() {
  const { navigate } = useLmsTeacherShellModel();
  return <LmsLoginLogsPage onManageAccount={() => void navigate({ href: teacherPath("/account") })} />;
}

export function TeacherCalendarRoute() {
  const m = useLmsTeacherShellModel();
  const panel = (
    <Suspense fallback={null}>
      <TeachingSchedulePanel
        isBootstrapLoading={m.apiBacked && m.bootstrapQuery.isPending}
        selectedClass={m.selectedClass}
        teacherName={m.teacherName}
      />
    </Suspense>
  );
  return m.isMobile ? panel : <Box sx={{ height: "100%", minHeight: 720 }}>{panel}</Box>;
}

export function TeacherClassLogRoute() {
  const m = useLmsTeacherShellModel();
  return (
    <Suspense fallback={null}>
      <LessonReportMobileGate><ClassLogPage classOptions={m.selectedClassOptions.map((c) => ({ id: c.id, label: c.className }))} defaultClassId={m.selectedClass?.id ?? ""} schoolName={m.selectedSchoolName} /></LessonReportMobileGate>
    </Suspense>
  );
}

export function TeacherScoreRoute() {
  const m = useLmsTeacherShellModel();
  return (
    <Suspense fallback={null}>
      <TeacherClassRoster selectedClass={m.selectedClass}>
        {(students) => <ClassScoreBoard classId={m.selectedClass?.id} manual={<ScoreSheetPanel selectedClass={m.selectedClass} selectedSchoolName={m.selectedSchoolName} students={students} />} />}
      </TeacherClassRoster>
    </Suspense>
  );
}

export function TeacherAttendanceRoute() {
  return (
    <Suspense fallback={null}>
      <PeriodAttendancePage />
    </Suspense>
  );
}

export function TeacherResourcesRoute() {
  const { learningResourceScope } = useLmsTeacherShellModel();
  return (
    <LearningResourceDashboardScopeProvider value={learningResourceScope}>
      <Suspense fallback={null}>
        <LearningResourceLibraryPage />
      </Suspense>
    </LearningResourceDashboardScopeProvider>
  );
}

export function TeacherReportsRoute() {
  const m = useLmsTeacherShellModel();
  return (
    <TeacherWorkspaceFrame selectedClass={m.selectedClass} selectedSchoolName={m.selectedSchoolName}>
      <TeacherClassRoster selectedClass={m.selectedClass}>
        {(students) => (
          <ReportsPanel
            classes={m.classes}
            onClassChange={(classId) => m.handleClassChange({ target: { value: classId } })}
            runs={m.runs}
            selectedClass={m.selectedClass}
            selectedSchoolName={m.selectedSchoolName}
            students={students}
          />
        )}
      </TeacherClassRoster>
    </TeacherWorkspaceFrame>
  );
}
