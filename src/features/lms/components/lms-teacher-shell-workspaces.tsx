import { Suspense } from "react";
import Box from "@mui/material/Box";

import { HomeworkPanel } from "@/features/lms/components/homework-panel";
import {
  AssignHomeworkPage,
  ClassManagementPage,
  ExerciseBankPage,
  HomeworkProgressPage,
  StudentGroupsPage,
} from "@/features/lms/components/lms-teacher-shell-pages";
import { LmsTeacherMobileSecondaryContent } from "@/features/lms/components/lms-teacher-shell-mobile-secondary";
import { LmsHomeDashboard } from "@/features/lms/components/lms-home-dashboard";
import type { LmsTeacherShellController } from "@/features/lms/components/use-lms-teacher-shell-controller";
import { classroomStudents } from "@/features/lms/classroom/api/classroom-defaults";
import { teacherPath } from "@/platform/workspaces/workspace-paths";

interface WorkspaceProps {
  model: LmsTeacherShellController;
}

export function LmsTeacherMobileContent({ model }: WorkspaceProps) {
  const {
    navigate,
    pathname,
    progressAssignmentId,
    selectedSchoolId,
    classes,
    selectedClassOptions,
    selectedClass,
    selectedSchoolName,
    runs,
    unreadNotificationCount,
    teacherName,
    handleLocalAssignmentCreated,
    handleClassChange,
  } = model;
  const localPathname = pathname.startsWith("/teacher") ? pathname.slice("/teacher".length) || "/" : pathname;

  return (() => {
    if (localPathname === "/" || localPathname === "/home" || localPathname === "/dashboard") {
      return (
        <LmsHomeDashboard
          classes={selectedClassOptions}
          onClassChange={(classId) => handleClassChange({ target: { value: classId } })}
          onOpenNotifications={() => void navigate({ href: teacherPath("/notifications") })}
          onOpenProgress={() => void navigate({ href: teacherPath("/homework/progress") })}
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
            classes={selectedClassOptions.length > 0 ? selectedClassOptions : classes}
            selectedClass={selectedClass}
            onBack={() => void navigate({ href: teacherPath("/homework") })}
            onCreateAssignment={(title, subject) => handleLocalAssignmentCreated(title, subject, teacherPath("/homework"))}
            onSelectClass={(classId) => handleClassChange({ target: { value: classId } })}
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

    if (localPathname === "/homework/progress") {
      return (
        <Suspense fallback={null}>
          <HomeworkProgressPage
            initialRunId={progressAssignmentId}
            onBack={() => void navigate({ href: teacherPath("/homework") })}
            runs={runs}
            selectedClass={selectedClass}
            students={classroomStudents.filter((student) => student.schoolId === selectedSchoolId)}
          />
        </Suspense>
      );
    }

    if (localPathname === "/homework/student-groups") {
      return (
        <Suspense fallback={null}>
          <StudentGroupsPage
            classes={classes}
            selectedClass={selectedClass}
            selectedSchoolName={selectedSchoolName}
            onBack={() => void navigate({ href: teacherPath("/homework") })}
          />
        </Suspense>
      );
    }

    if (localPathname === "/homework/class") {
      return (
        <Suspense fallback={null}>
          <ClassManagementPage
            classes={classes}
            selectedClass={selectedClass}
            selectedSchoolName={selectedSchoolName}
            students={classroomStudents.filter((student) => student.schoolId === selectedSchoolId)}
          />
        </Suspense>
      );
    }

    return <LmsTeacherMobileSecondaryContent model={model} />;
  })();
}
