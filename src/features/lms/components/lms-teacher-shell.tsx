import { lazy, memo, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/routes/router-compat";
import { Box, Button, MenuItem, Select, Stack, Typography } from "@mui/material";
import {
  Assignment,
  AssignmentTurnedIn,
  CheckCircle,
  Class,
  Description as FileText,
  People,
} from "@mui/icons-material";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import {
  Bell as BellIcon,
  BookOpen as BookOpenIcon,
  CalendarDays as CalendarDaysIcon,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

import ErgPortalLayout, { type MenuGroup } from "@/components/portal/ErgPortalLayout";
import { logoutAccount } from "@/platform/auth/api/auth-storage";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import {
  assignmentRuns,
  classroomSchools,
  classroomSnapshots,
  classroomStudents,
  defaultClassId,
  defaultSchoolId,
} from "@/features/lms/classroom/api/mock-classroom-data";
import type { ClassroomSnapshot, AssignmentRun } from "@/features/lms/classroom/types/classroom-types";
import { loadLmsTeacherHomeworkWorkspace, mapAssignmentsToRuns } from "@/features/lms/api/lms-graphql-api";
import { lmsAssignmentReadQueryKeys } from "@/features/lms/api/lms-assignment-command-query";
import { loadLmsDashboardBootstrap } from "@/features/lms/infrastructure/lms-dashboard-api";
import { getCurrentAcademicYear } from "@/features/lms/learning-resources/api/teacher-resource-dashboard-api";
import { LearningResourceDashboardScopeProvider } from "@/features/lms/learning-resources/hooks/use-learning-resource-dashboard-scope";
import { hasApiBase } from "@/lib/api-client";
import { LmsMobileShell, useLmsMobileBreakpoint } from "@/features/lms/mobile";
import { fetchUnreadNotificationCount, notificationQueryKeys } from "@/features/notifications/api/notification-api";
import { HomeworkPanel } from "@/features/lms/components/homework-panel";
import { isSchedulePublishedNotification, resolveLmsTeacherRuns } from "@/features/lms/components/lms-teacher-shell-utils";
import { teachingCalendarQueryKeys } from "@/features/teaching-calendar/api/teaching-calendar-api";
import { ReportsPanel } from "@/features/lms/components/reports-panel";
import { queryKeys } from "@/lib/query-keys";
import { canNavigateToLmsPath, filterLmsNavigation } from "@/features/lms/navigation/lms-navigation";

type LmsSection = "home" | "homework" | "score" | "attendance" | "schedule" | "classLog" | "resources" | "reports";
type LmsMobileSection = "assignHomework" | "exerciseBank" | "schedule" | "notifications";

const LearningResourceLibraryPage = lazy(() =>
  import("@/features/lms/learning-resources/components/learning-resource-library-page").then((module) => ({
    default: module.LearningResourceLibraryPage,
  })),
);
const TeachingSchedulePanel = lazy(() =>
  import("@/features/lms/components/teaching-schedule/lms-erg-calendar-workspace").then((module) => ({
    default: module.LmsErgCalendarWorkspace,
  })),
);
const WeeklyClassLogPage = lazy(() =>
  import("@/features/lms/weekly-class-log").then((module) => ({
    default: module.WeeklyClassLogPage,
  })),
);
const ScoreSheetPanel = lazy(() =>
  import("@/features/lms/components/score-sheet-panel").then((module) => ({
    default: module.ScoreSheetPanel,
  })),
);
const AttendanceSheetPanel = lazy(() =>
  import("@/features/lms/components/attendance-sheet-panel").then((module) => ({
    default: module.AttendanceSheetPanel,
  })),
);
const AssignHomeworkPage = lazy(() =>
  import("@/features/lms/components/assign-homework-page").then((module) => ({
    default: module.AssignHomeworkPage,
  })),
);
const ExerciseBankPage = lazy(() =>
  import("@/features/lms/components/exercise-bank-page").then((module) => ({
    default: module.ExerciseBankPage,
  })),
);
const StudentGroupsPage = lazy(() =>
  import("@/features/lms/components/student-groups-page").then((module) => ({
    default: module.StudentGroupsPage,
  })),
);
const ClassManagementPage = lazy(() =>
  import("@/features/lms/classroom/components/class-management-page").then((module) => ({
    default: module.ClassManagementPage,
  })),
);
const HomeworkProgressPage = lazy(() =>
  import("@/features/lms/components/homework-progress-page").then((module) => ({
    default: module.HomeworkProgressPage,
  })),
);
const LmsAccountPage = lazy(() =>
  import("@/features/lms/components/lms-account-page").then((module) => ({
    default: module.LmsAccountPage,
  })),
);
const LmsLoginLogsPage = lazy(() =>
  import("@/features/lms/components/lms-login-logs-page").then((module) => ({
    default: module.LmsLoginLogsPage,
  })),
);
const LmsNotificationDetailPage = lazy(() =>
  import("@/features/lms/components/lms-notification-detail-page").then((module) => ({
    default: module.LmsNotificationDetailPage,
  })),
);
const LmsNotificationListPage = lazy(() =>
  import("@/features/lms/components/lms-notification-detail-page").then((module) => ({
    default: module.LmsNotificationListPage,
  })),
);

type NavItem = {
  id: LmsSection;
  label: string;
  path: string;
  icon: React.ElementType;
};

const lmsNavItems: NavItem[] = [
  { id: "home", label: "Trang chủ", path: "/home", icon: DashboardRoundedIcon },
  { id: "homework", label: "Hoạt động học tập", path: "/homework", icon: AssignmentRoundedIcon },
  { id: "score", label: "Bảng điểm", path: "/score", icon: BarChartRoundedIcon },
  { id: "attendance", label: "Điểm danh", path: "/attendance", icon: EventAvailableRoundedIcon },
  { id: "schedule", label: "Lịch làm việc", path: "/calendar", icon: CalendarMonthRoundedIcon },
  { id: "classLog", label: "Sổ đầu bài", path: "/class-log", icon: MenuBookRoundedIcon },
  { id: "resources", label: "Tài nguyên", path: "/resources", icon: FolderRoundedIcon },
  { id: "reports", label: "Báo cáo", path: "/reports", icon: FileText },
];

const LMS_MENU_GROUPS: MenuGroup[] = [
  {
    label: "",
    items: [
      {
        id: "lms-home",
        label: "Trang chủ",
        icon: <DashboardRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/home",
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
          { id: "homework-list", label: "Danh sách hoạt động", path: "/homework" },
          { id: "assign-homework", label: "Giao bài tập", path: "/homework/assign" },
          { id: "exercise-bank", label: "Kho luyện tập", path: "/homework/exercise-bank" },
          { id: "homework-progress", label: "Tiến độ học tập", path: "/homework/progress" },
          { id: "class-management", label: "Lớp học", path: "/homework/class" },
          { id: "student-groups", label: "Nhóm học sinh", path: "/homework/student-groups" },
        ],
      },
      {
        id: "score",
        label: "Bảng điểm",
        icon: <BarChartRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/score",
      },
      {
        id: "attendance",
        label: "Điểm danh",
        icon: <EventAvailableRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/attendance",
      },
      {
        id: "schedule",
        label: "Lịch làm việc",
        icon: <CalendarMonthRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/calendar",
      },
      {
        id: "class-log",
        label: "Sổ đầu bài",
        icon: <MenuBookRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/class-log",
      },
    ],
  },
  {
    label: "Học liệu",
    items: [
      {
        id: "resources",
        label: "Tài nguyên",
        icon: <FolderRoundedIcon sx={{ fontSize: 24 }} />,
        path: "/resources",
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
        path: "/reports",
      },
    ],
  },
];

const lmsMobileDockItems: Array<{ id: LmsMobileSection; label: string; path: string; icon: LucideIcon }> = [
  { id: "assignHomework", label: "Giao bài", path: "/homework/assign", icon: ClipboardList },
  { id: "exerciseBank", label: "Kho bài", path: "/homework/exercise-bank", icon: BookOpenIcon },
  { id: "schedule", label: "Lịch", path: "/calendar", icon: CalendarDaysIcon },
  { id: "notifications", label: "Thông báo", path: "/notifications", icon: BellIcon },
];

function resolveSection(pathname: string): LmsSection {
  if (pathname === "/" || pathname === "/home" || pathname === "/dashboard") return "home";
  const matched = lmsNavItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  return matched?.id ?? "homework";
}

function resolveMobileSection(pathname: string): LmsMobileSection {
  if (pathname === "/homework/exercise-bank" || pathname.startsWith("/homework/exercise-bank/")) return "exerciseBank";
  if (pathname === "/calendar" || pathname.startsWith("/calendar/")) return "schedule";
  if (pathname === "/notifications" || pathname.startsWith("/notifications/")) return "notifications";
  return "assignHomework";
}
export function LmsTeacherShell() {
  const { actions, account, session } = useAuthSession("lms");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const apiBacked = hasApiBase();
  const tenantId = session?.tenantId ?? "";
  const notificationScope = useMemo(() => ({ accountId: account?.id, tenantId }), [account?.id, tenantId]);
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const progressAssignmentId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("assignmentId") : null;
  const activeSection = resolveSection(pathname);
  const activeMobileSection = resolveMobileSection(pathname);
  const shouldLoadHomeworkWorkspace = activeSection === "home" || activeSection === "homework";
  const [requestedSchoolId, setSelectedSchoolId] = useState("");
  const [requestedClassId, setSelectedClassId] = useState("");
  const [createdRuns, setCreatedRuns] = useState<AssignmentRun[]>([]);
  const bootstrapQuery = useQuery({
    queryKey: queryKeys.lmsTeacherShell.bootstrap(tenantId, account?.id),
    queryFn: loadLmsDashboardBootstrap,
    enabled: apiBacked,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  const notificationUnreadQuery = useQuery({
    queryKey: notificationQueryKeys.unreadCount("lms", notificationScope),
    queryFn: () => fetchUnreadNotificationCount("lms"),
    enabled: apiBacked,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
  const homeworkWorkspaceQuery = useQuery({
    queryKey: lmsAssignmentReadQueryKeys.homeworkWorkspace(tenantId),
    queryFn: () => loadLmsTeacherHomeworkWorkspace({ page: 0, size: 50, status: "active" }),
    enabled: apiBacked && shouldLoadHomeworkWorkspace,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const schools = bootstrapQuery.data?.schools.length ? bootstrapQuery.data.schools : apiBacked ? [] : classroomSchools;
  const classes = bootstrapQuery.data?.classes.length ? bootstrapQuery.data.classes : apiBacked ? [] : classroomSnapshots;
  const workspaceRuns = useMemo(
    () =>
      homeworkWorkspaceQuery.data
        ? mapAssignmentsToRuns(homeworkWorkspaceQuery.data.assignments.items, homeworkWorkspaceQuery.data.classOptions)
        : [],
    [homeworkWorkspaceQuery.data],
  );
  const runs = useMemo(
    () => resolveLmsTeacherRuns({ apiBacked, createdRuns, fallbackRuns: assignmentRuns, workspaceRuns }),
    [apiBacked, createdRuns, workspaceRuns],
  );
  const bootstrapSelection = useMemo(() => {
    const scope = bootstrapQuery.data?.managementScope;
    const scopedSchoolId =
      scope?.centerId && schools.some((school) => school.id === scope.centerId)
        ? scope.centerId
        : schools[0]?.id ?? (apiBacked ? "" : defaultSchoolId);
    const classInScope =
      scope?.level === "class"
        ? classes.find((classroom) => classroom.id === scope.classId && classroom.schoolId === scopedSchoolId)
        : undefined;
    const firstClassInSchool = classes.find((classroom) => classroom.schoolId === scopedSchoolId);

    return {
      schoolId: scopedSchoolId,
      classId: classInScope?.id ?? firstClassInSchool?.id ?? classes[0]?.id ?? (apiBacked ? "" : defaultClassId),
    };
  }, [apiBacked, bootstrapQuery.data?.managementScope, classes, schools]);
  const selectedSchoolId = schools.some((school) => school.id === requestedSchoolId)
    ? requestedSchoolId
    : bootstrapSelection.schoolId;
  const selectedClassOptions = useMemo(
    () => classes.filter((classroom) => classroom.schoolId === selectedSchoolId),
    [classes, selectedSchoolId],
  );
  const selectedClassId = selectedClassOptions.some((classroom) => classroom.id === requestedClassId)
    ? requestedClassId
    : selectedClassOptions.some((classroom) => classroom.id === bootstrapSelection.classId)
      ? bootstrapSelection.classId
      : selectedClassOptions[0]?.id ?? classes[0]?.id ?? (apiBacked ? "" : defaultClassId);
  const selectedClass = selectedClassOptions.find((classroom) => classroom.id === selectedClassId) ?? selectedClassOptions[0];
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId) ?? schools[0] ?? (apiBacked ? undefined : classroomSchools[0]);
  const selectedSchoolName = selectedSchool?.name ?? "ERG";
  const activeNav = lmsNavItems.find((item) => item.id === activeSection) ?? lmsNavItems[0];
  const activeMobileNav = lmsMobileDockItems.find((item) => item.id === activeMobileSection) ?? lmsMobileDockItems[0];
  const teacherName = account?.fullName || "Lê Thị Thùy";
  const teacherEmail = account?.email || "teacher@erg.edu.vn";
  const learningResourceScope = useMemo(
    () => ({
      accountId: account?.id,
      academicYear: getCurrentAcademicYear(),
      selectedSchoolId,
      tenantId,
    }),
    [account?.id, selectedSchoolId, tenantId],
  );
  const isMobile = useLmsMobileBreakpoint();
  const unreadNotificationCount = notificationUnreadQuery.data?.unread ?? 0;
  const grantedPermissions = bootstrapQuery.data?.permissions.grantedPermissions ?? session?.permissions ?? [];
  const deniedPermissions = bootstrapQuery.data?.permissions.deniedPermissions ?? session?.deniedPermissions ?? [];
  const filteredMenuGroups = useMemo(
    () => filterLmsNavigation(LMS_MENU_GROUPS, grantedPermissions, deniedPermissions),
    [deniedPermissions, grantedPermissions],
  );
  const mobileDockItems = useMemo(
    () =>
      lmsMobileDockItems
        .filter((item) => canNavigateToLmsPath(item.path, grantedPermissions, deniedPermissions))
        .map((item) => (item.id === "notifications" ? { ...item, badgeCount: unreadNotificationCount } : item)),
    [deniedPermissions, grantedPermissions, unreadNotificationCount],
  );

  useEffect(() => {
    if (!bootstrapQuery.error) return;
    console.error("Cannot load LMS teacher bootstrap", bootstrapQuery.error);
  }, [bootstrapQuery.error]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const handleNotificationMessage = (event: MessageEvent) => {
      if (event.data?.type !== "erg:notification-push") return;

      const portal = typeof event.data.payload?.portal === "string" ? event.data.payload.portal.toLowerCase() : "lms";
      if (portal !== "lms") return;

      void queryClient.invalidateQueries({ queryKey: notificationQueryKeys.root("lms", notificationScope) });
      if (isSchedulePublishedNotification(event.data.payload)) {
        void queryClient.invalidateQueries({ queryKey: teachingCalendarQueryKeys.portalRoot("lms", tenantId) });
      }
    };

    navigator.serviceWorker.addEventListener("message", handleNotificationMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleNotificationMessage);
  }, [notificationScope, queryClient, tenantId]);

  function selectSchool(schoolId: string) {
    const firstClass = classes.find((classroom) => classroom.schoolId === schoolId);
    setSelectedSchoolId(schoolId);
    setSelectedClassId(firstClass?.id ?? classes[0]?.id ?? defaultClassId);
  }

  function signOut() {
    actions.signOut();
    logoutAccount();
    navigate("/login", { replace: true });
  }

  function handleSchoolChange(e: { target: { value: string } }) {
    selectSchool(e.target.value);
  }

  function handleClassChange(e: { target: { value: string } }) {
    setSelectedClassId(e.target.value);
  }

  function handleLocalAssignmentCreated(title: string, subject: string, destination: string) {
    if (!apiBacked) {
      const newRun: AssignmentRun = {
        id: `assignment-${Date.now()}`,
        title,
        subjectLabel: subject,
        targetLevel: selectedClass?.className ?? "Cả lớp",
        activeClasses: 1,
        completionRate: 0,
        submittedCount: 0,
        inProgressCount: 0,
        needsReviewCount: 0,
        dueLabel: "Hạn nộp sau 7 ngày",
      };
      setCreatedRuns((current) => [newRun, ...current]);
    }
    navigate(destination);
  }

  const teacherContent = (
    <>
      {activeSection === "home" ? (
        <LmsHomeDashboard
          runs={runs}
          selectedClass={selectedClass}
          selectedSchoolName={selectedSchoolName}
          teacherName={teacherName}
          unreadNotificationCount={unreadNotificationCount}
          onAssign={() => navigate("/homework/assign")}
          onOpenHomework={() => navigate("/homework")}
          onOpenSchedule={() => navigate("/calendar")}
        />
      ) : pathname === "/account" ? (
        <LmsAccountPage
          onLoginLogs={() => navigate("/account/login-logs")}
          onSignedOut={() => navigate("/login", { replace: true })}
        />
      ) : pathname === "/account/login-logs" ? (
        <LmsLoginLogsPage onManageAccount={() => navigate("/account")} />
      ) : pathname === "/notifications" ? (
        <LmsNotificationListPage onOpenDetail={(notificationId) => navigate(`/notifications/${notificationId}`)} />
      ) : pathname.startsWith("/notifications/") ? (
        <LmsNotificationDetailPage
          notificationId={pathname.replace("/notifications/", "").split("/")[0] ?? ""}
          onBack={() => navigate("/notifications")}
        />
      ) : pathname === "/homework/assign" ? (
        <Suspense fallback={null}>
          <AssignHomeworkPage
            classes={classes}
            selectedClass={selectedClass}
            onBack={() => navigate("/homework")}
            onCreateAssignment={(title, subject) => handleLocalAssignmentCreated(title, subject, "/homework")}
          />
        </Suspense>
      ) : pathname === "/homework/student-groups" ? (
        <Suspense fallback={null}>
          <StudentGroupsPage
            classes={classes}
            selectedClass={selectedClass}
            selectedSchoolName={selectedSchoolName}
            onBack={() => navigate("/homework")}
          />
        </Suspense>
      ) : pathname === "/homework/class" ? (
        <Suspense fallback={null}>
          <ClassManagementPage
            classes={classes}
            selectedClass={selectedClass}
            selectedSchoolName={selectedSchoolName}
            students={classroomStudents.filter((student) => student.schoolId === selectedSchoolId)}
          />
        </Suspense>
      ) : pathname === "/homework/exercise-bank" ? (
        <Suspense fallback={null}>
          <ExerciseBankPage
            onBack={() => navigate("/homework")}
            onAssign={(exerciseTitle) => handleLocalAssignmentCreated(exerciseTitle, "Kho bài tập", "/homework")}
          />
        </Suspense>
      ) : pathname === "/homework/progress" ? (
        <Suspense fallback={null}>
          <HomeworkProgressPage
            initialRunId={progressAssignmentId}
            onBack={() => navigate("/homework")}
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
            onAssign={() => navigate("/homework/assign")}
            onViewProgress={(runId) => navigate(`/homework/progress?assignmentId=${encodeURIComponent(runId)}`)}
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

  const mobileContent = (() => {
    if (pathname === "/" || pathname === "/homework" || pathname === "/dashboard") {
      return (
        <Suspense fallback={null}>
          <AssignHomeworkPage
            classes={classes}
            selectedClass={selectedClass}
            onBack={() => navigate("/homework/assign")}
            onCreateAssignment={(title, subject) => handleLocalAssignmentCreated(title, subject, "/homework/assign")}
          />
        </Suspense>
      );
    }

    if (pathname === "/homework/assign") {
      return (
        <Suspense fallback={null}>
          <AssignHomeworkPage
            classes={classes}
            selectedClass={selectedClass}
            onBack={() => navigate("/homework/assign")}
            onCreateAssignment={(title, subject) => handleLocalAssignmentCreated(title, subject, "/homework/assign")}
          />
        </Suspense>
      );
    }

    if (pathname === "/homework/exercise-bank") {
      return (
        <Suspense fallback={null}>
          <ExerciseBankPage
            onBack={() => navigate("/homework/assign")}
            onAssign={(exerciseTitle) => handleLocalAssignmentCreated(exerciseTitle, "Kho bài tập", "/homework/assign")}
          />
        </Suspense>
      );
    }

    if (pathname === "/calendar" || pathname.startsWith("/calendar/")) {
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

    if (pathname === "/notifications") {
      return <LmsNotificationListPage onOpenDetail={(notificationId) => navigate(`/notifications/${notificationId}`)} />;
    }

    if (pathname.startsWith("/notifications/")) {
      return (
        <LmsNotificationDetailPage
          notificationId={pathname.replace("/notifications/", "").split("/")[0] ?? ""}
          onBack={() => navigate("/notifications")}
        />
      );
    }

    if (pathname === "/account") {
      return <LmsAccountPage onLoginLogs={() => navigate("/account/login-logs")} onSignedOut={() => navigate("/login", { replace: true })} />;
    }

    if (pathname === "/account/login-logs") {
      return <LmsLoginLogsPage onManageAccount={() => navigate("/account")} />;
    }

    return <MobileUnsupportedScreen activeLabel={activeNav.label} onGoHome={() => navigate("/homework/assign")} />;
  })();

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", minHeight: "100dvh", overflow: "hidden", bgcolor: "background.default" }}>
        <LmsMobileShell
          activeLabel={activeMobileNav.label}
          activeSection={activeMobileSection}
          classes={classes}
          dockItems={mobileDockItems}
          schoolName={selectedSchoolName}
          schools={schools}
          selectedClassId={selectedClass?.id ?? ""}
          selectedClassName={selectedClass?.className ?? "Lớp học"}
          selectedSchoolId={selectedSchoolId}
          teacherEmail={teacherEmail}
          teacherName={teacherName}
          unreadNotificationCount={unreadNotificationCount}
          onClassChange={setSelectedClassId}
          onOpenNotifications={() => navigate("/notifications")}
          onNavigate={(path) => navigate(path)}
          onSchoolChange={selectSchool}
          onSignOut={signOut}
        >
          {mobileContent}
        </LmsMobileShell>
      </Box>
    );
  }

  const lmsPortalInfo = {
    name: "LMS ERG",
    plan: "",
    centerName: selectedSchoolName,
    userName: teacherName,
    userEmail: teacherEmail,
  };
  return (
    <ErgPortalLayout
      contentMode="flush"
      headerControls={
        <LmsHeaderSchoolControl
          schoolId={selectedSchoolId}
          schools={schools}
          onSchoolChange={handleSchoolChange}
        />
      }
      headerTrailingControls={
        selectedClassOptions.length ? (
          <LmsHeaderClassControl
            classes={selectedClassOptions}
            selectedClassId={selectedClass?.id ?? ""}
            onClassChange={handleClassChange}
          />
        ) : null
      }
      menuGroups={filteredMenuGroups}
      notificationCount={unreadNotificationCount}
      portalInfo={lmsPortalInfo}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, bgcolor: "#FFFFFF" }}>
        <Box
          component="main"
          className="lms-teacher-shell"
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            overflowX: "hidden",
          }}
        >
          {teacherContent}
        </Box>
      </Box>
    </ErgPortalLayout>
  );
}

function LmsHomeDashboard({
  runs,
  selectedClass,
  selectedSchoolName,
  teacherName,
  unreadNotificationCount,
  onAssign,
  onOpenHomework,
  onOpenSchedule,
}: {
  runs: AssignmentRun[];
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  teacherName: string;
  unreadNotificationCount: number;
  onAssign: () => void;
  onOpenHomework: () => void;
  onOpenSchedule: () => void;
}) {
  const activeRuns = runs.slice(0, 3);
  const completionAverage = activeRuns.length
    ? Math.round(activeRuns.reduce((sum, run) => sum + run.completionRate, 0) / activeRuns.length)
    : 0;
  const supportCount = selectedClass?.riskStudents ?? activeRuns.reduce((sum, run) => sum + run.needsReviewCount, 0);

  return (
    <Box sx={{ bgcolor: "#F8FAFC", minHeight: "100%", px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, maxWidth: 1440, mx: "auto" }}>
        <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ color: "#1C252E", fontSize: 22, fontWeight: 800, lineHeight: "30px" }}>
              Chào buổi tốt, {teacherName}
            </Typography>
            <Typography sx={{ color: "#637381", fontSize: 13, fontWeight: 600, mt: 0.5 }}>
              {selectedSchoolName} · {selectedClass?.className ?? "Chưa chọn lớp"} · {selectedClass?.studentCount ?? 0} học sinh
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button onClick={onOpenSchedule} variant="outlined" sx={homeButtonSx}>
              Xem lịch
            </Button>
            <Button onClick={onAssign} variant="contained" sx={homePrimaryButtonSx}>
              Giao bài tập
            </Button>
          </Stack>
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
          <HomeMetricCard label="Hoạt động đang mở" value={String(runs.length)} tone="blue" />
          <HomeMetricCard label="Hoàn thành trung bình" value={`${completionAverage}%`} tone="green" />
          <HomeMetricCard label="Cần hỗ trợ" value={String(supportCount)} tone="amber" />
          <HomeMetricCard label="Thông báo mới" value={String(unreadNotificationCount)} tone="red" />
        </Box>

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.35fr) minmax(360px, 0.65fr)" } }}>
          <Box sx={homePanelSx}>
            <Box sx={{ alignItems: "center", display: "flex", justifyContent: "space-between", mb: 1.5 }}>
              <Typography sx={{ color: "#1C252E", fontSize: 15, fontWeight: 800 }}>Bài tập cần theo dõi</Typography>
              <Button onClick={onOpenHomework} size="small" sx={{ borderRadius: "8px", color: "#0F6CBD", fontSize: 13, fontWeight: 700, textTransform: "none" }}>
                Xem tất cả
              </Button>
            </Box>
            <Stack spacing={1}>
              {activeRuns.map((run) => (
                <Box key={run.id} sx={{ alignItems: "center", bgcolor: "#FFFFFF", border: "1px solid #D9E2EF", borderRadius: "10px", display: "grid", gap: 2, gridTemplateColumns: "minmax(0, 1fr) 150px 110px", px: 2, py: 1.5 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ color: "#1C252E", fontSize: 14, fontWeight: 800 }}>{run.title}</Typography>
                    <Typography noWrap sx={{ color: "#637381", fontSize: 12.5, fontWeight: 600, mt: 0.25 }}>{run.subjectLabel} · {run.targetLevel}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ color: "#637381", fontSize: 12, fontWeight: 700 }}>{run.completionRate}% hoàn thành</Typography>
                    <Box sx={{ bgcolor: "#EEF2F7", borderRadius: "999px", height: 6, mt: 0.75, overflow: "hidden" }}>
                      <Box sx={{ bgcolor: "#22C55E", height: "100%", width: `${run.completionRate}%` }} />
                    </Box>
                  </Box>
                  <Typography sx={{ color: run.needsReviewCount ? "#B76E00" : "#637381", fontSize: 12.5, fontWeight: 800, textAlign: "right" }}>
                    {run.needsReviewCount} cần xem
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box sx={homePanelSx}>
            <Typography sx={{ color: "#1C252E", fontSize: 15, fontWeight: 800, mb: 1.5 }}>Hôm nay</Typography>
            <Stack spacing={1}>
              {["08:00 · IC3 GS6 Level 1", "10:15 · Chấm bài lớp 6A1", "14:00 · Chuẩn bị học liệu"].map((item) => (
                <Box key={item} sx={{ bgcolor: "#FFFFFF", border: "1px solid #D9E2EF", borderRadius: "10px", color: "#334155", fontSize: 13, fontWeight: 700, px: 2, py: 1.4 }}>
                  {item}
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function HomeMetricCard({ label, value, tone }: { label: string; value: string; tone: "blue" | "green" | "amber" | "red" }) {
  const toneMap = {
    blue: ["#EAF4FF", "#0F6CBD"],
    green: ["#ECFDF5", "#118D57"],
    amber: ["#FFF7E6", "#B76E00"],
    red: ["#FFF1F2", "#D32F2F"],
  } as const;
  const [bg, color] = toneMap[tone];

  return (
    <Box sx={{ bgcolor: "#FFFFFF", border: "1px solid #D9E2EF", borderRadius: "12px", boxShadow: "0 10px 26px rgba(15,23,42,0.04)", p: 2 }}>
      <Box sx={{ bgcolor: bg, borderRadius: "10px", color, display: "inline-flex", fontSize: 12, fontWeight: 800, px: 1.25, py: 0.5 }}>
        {label}
      </Box>
      <Typography sx={{ color: "#1C252E", fontSize: 26, fontWeight: 850, lineHeight: "34px", mt: 1.4 }}>
        {value}
      </Typography>
    </Box>
  );
}

const homePanelSx = {
  bgcolor: "#FFFFFF",
  border: "1px solid #D9E2EF",
  borderRadius: "12px",
  boxShadow: "0 10px 26px rgba(15,23,42,0.04)",
  minWidth: 0,
  p: 2,
};

const homeButtonSx = {
  borderColor: "#D7E0EC",
  borderRadius: "10px",
  color: "#334155",
  fontSize: 13,
  fontWeight: 800,
  height: 38,
  textTransform: "none",
};

const homePrimaryButtonSx = {
  bgcolor: "#0F6CBD",
  borderRadius: "10px",
  boxShadow: "0 8px 18px rgba(15,108,189,0.22)",
  fontSize: 13,
  fontWeight: 800,
  height: 38,
  textTransform: "none",
  "&:hover": { bgcolor: "#0B5CAB" },
};

function LmsHeaderSchoolControl({
  schoolId,
  schools,
  onSchoolChange,
}: {
  schoolId: string;
  schools: typeof classroomSchools;
  onSchoolChange: (event: { target: { value: string } }) => void;
}) {
  return (
        <Select
          value={schoolId}
          onChange={onSchoolChange}
          size="small"
          displayEmpty
          MenuProps={scopeMenuProps}
          sx={scopeSelectSx({ minWidth: 176, variant: "title" })}
          renderValue={(value) => {
            const school = schools.find((item) => item.id === value);
            return (
              <Stack direction="row" spacing={0.85} sx={{ alignItems: "center", minWidth: 0 }}>
                <SchoolLogo school={school} />
                <Typography noWrap sx={{ color: "#1C252E", fontSize: 14, fontWeight: 700, lineHeight: "22px" }}>
                  {school?.name ?? "Trường"}
                </Typography>
              </Stack>
            );
          }}
        >
          {schools.map((school) => (
            <MenuItem key={school.id} value={school.id} sx={scopeMenuItemSx}>
              <SchoolLogo school={school} />
              <Typography noWrap sx={{ color: "#1C252E", flex: 1, fontSize: 14, fontWeight: 700, minWidth: 0 }}>
                {school.name}
              </Typography>
            </MenuItem>
          ))}
        </Select>
  );
}

function LmsHeaderClassControl({
  classes,
  selectedClassId,
  onClassChange,
}: {
  classes: ClassroomSnapshot[];
  selectedClassId: string;
  onClassChange: (event: { target: { value: string } }) => void;
}) {
  return (
    <Select
      value={selectedClassId}
      onChange={onClassChange}
      size="small"
      displayEmpty
      MenuProps={scopeMenuProps}
      sx={scopeSelectSx({ minWidth: 118, maxWidth: 184, variant: "title" })}
      renderValue={(value) => {
        const classroom = classes.find((item) => item.id === value);
        return (
          <Stack direction="row" spacing={0.85} sx={{ alignItems: "center", minWidth: 0 }}>
            <Box sx={scopeClassIconSx}>
              <Class sx={{ color: "#0F6CBD", fontSize: 16 }} />
            </Box>
            <Typography noWrap sx={{ color: "#1C252E", fontSize: 14, fontWeight: 700, lineHeight: "22px" }}>
              {classroom?.className ?? "Lớp"}
            </Typography>
          </Stack>
        );
      }}
    >
      {classes.map((classroom) => (
        <MenuItem key={classroom.id} value={classroom.id} sx={scopeMenuItemSx}>
          <Box sx={scopeClassIconSx}>
            <Class sx={{ color: "#0F6CBD", fontSize: 16 }} />
          </Box>
          <Typography noWrap sx={{ color: "#1C252E", flex: 1, fontSize: 14, fontWeight: 700, minWidth: 0 }}>
            {classroom.className}
          </Typography>
        </MenuItem>
      ))}
    </Select>
  );
}

function SchoolLogo({ school }: { school?: (typeof classroomSchools)[number] | { logoURL?: string; name?: string } }) {
  const logoUrl = school?.logoURL;
  const label = getSchoolLogoLabel(school?.name);

  if (logoUrl) {
    return (
      <Box
        component="img"
        alt={school?.name ?? "School"}
        src={logoUrl}
        sx={{
          borderRadius: "8px",
          flexShrink: 0,
          height: 24,
          objectFit: "cover",
          width: 24,
        }}
      />
    );
  }

  return <Box sx={scopeMenuLogoSx}>{label}</Box>;
}

function getSchoolLogoLabel(name?: string) {
  if (!name) return "EDU";
  const firstMeaningful = name
    .split(/\s+/)
    .filter(Boolean)
    .find((part) => !["campus", "center", "learning", "point", "studio"].includes(part.toLowerCase()));
  return (firstMeaningful ?? name).slice(0, 3).toUpperCase();
}

function scopeSelectSx({ minWidth, maxWidth, variant }: { minWidth: number; maxWidth?: number; variant: "title" | "pill" }) {
  const isTitle = variant === "title";
  return {
    background: isTitle ? "transparent" : "#F8FAFC",
    borderRadius: isTitle ? "8px" : "10px",
    minWidth,
    maxWidth: maxWidth ?? (isTitle ? 238 : minWidth + 54),
    transition: "background-color 160ms ease, box-shadow 160ms ease",
    "&:hover": {
      backgroundColor: isTitle ? "rgba(145,158,171,0.07)" : "#F4F6F8",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: isTitle ? "transparent" : "rgba(145,158,171,0.16)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: isTitle ? "rgba(15,108,189,0.10)" : "rgba(15,108,189,0.22)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(15,108,189,0.30)",
      borderWidth: 1,
    },
    "&.Mui-focused": {
      boxShadow: "0 0 0 3px rgba(15,108,189,0.08)",
    },
    "& .MuiSelect-select": {
      alignItems: "center",
      display: "flex",
      height: 32,
      minHeight: "32px !important",
      pl: isTitle ? "8px !important" : "10px !important",
      pr: isTitle ? "28px !important" : "30px !important",
      py: 0,
    },
    "& .MuiSelect-icon": {
      color: "#637381",
      fontSize: 18,
      right: isTitle ? 6 : 7,
    },
  };
}

const scopeMenuProps = {
  slotProps: {
    paper: {
      sx: {
        border: "1px solid rgba(145,158,171,0.14)",
        borderRadius: "12px",
        boxShadow: "0 18px 42px rgba(28,37,46,0.12)",
        mt: 1,
        p: 0.5,
        minWidth: 280,
        "& .MuiList-root": { p: 0 },
      },
    },
  },
};

const scopeMenuItemSx = {
  alignItems: "center",
  borderRadius: "9px",
  display: "flex",
  gap: 1.25,
  minHeight: 44,
  px: 1.25,
  py: 1,
  "&.Mui-selected": {
    bgcolor: "rgba(145,158,171,0.12)",
  },
  "&.Mui-selected:hover": {
    bgcolor: "rgba(145,158,171,0.16)",
  },
};

const scopeMenuLogoSx = {
  alignItems: "center",
  background: "linear-gradient(135deg, #FEE2F1 0%, #DBEAFE 100%)",
  borderRadius: "50%",
  color: "#0F6CBD",
  display: "flex",
  flexShrink: 0,
  fontSize: 9,
  fontWeight: 900,
  height: 28,
  justifyContent: "center",
  width: 28,
};

const scopeClassIconSx = {
  alignItems: "center",
  background: "linear-gradient(135deg, rgba(219,234,254,0.92) 0%, rgba(254,226,241,0.84) 100%)",
  border: "1px solid rgba(15,108,189,0.10)",
  borderRadius: "8px",
  display: "flex",
  flexShrink: 0,
  height: 24,
  justifyContent: "center",
  width: 24,
};

function TeacherWorkspaceFrame({
  children,
  selectedClass,
  selectedSchoolName,
}: {
  children: ReactNode;
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%", gap: 2, px: { xs: 2, sm: 3 }, py: 2 }}>
      {/* Header Card */}
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 700, color: "text.primary" }}>
              {selectedClass?.className ?? "Lớp học"}
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 14, color: "text.secondary" }}>
              {selectedSchoolName} - {selectedClass?.studentCount ?? 0} học sinh
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileText sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: 1.5,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Xuất dữ liệu
          </Button>
        </Box>

        {/* Stats Grid */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2, mt: 3 }}>
          <ClassStat icon={Assignment} label="Bài đang mở" value={String(selectedClass?.activeAssignments ?? 0)} />
          <ClassStat icon={CheckCircle} label="Hoàn thành" value={`${selectedClass?.completionRate ?? 0}%`} />
          <ClassStat icon={People} label="Cần hỗ trợ" value={String(selectedClass?.riskStudents ?? 0)} />
          <ClassStat icon={AssignmentTurnedIn} label="Nộp gần nhất" value={selectedClass?.lastSubmissionAt ?? "-"} />
        </Box>
      </Box>

      {children}
    </Box>
  );
}

const ClassStat = memo(function ClassStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 2,
          bgcolor: "primary.light",
          color: "primary.main",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Box>
      <Box>
        <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 500 }}>{label}</Typography>
        <Typography sx={{ fontSize: 16, fontWeight: 600, color: "text.primary", mt: 0.25 }}>{value}</Typography>
      </Box>
    </Box>
  );
});

function MobileUnsupportedScreen({ activeLabel, onGoHome }: { activeLabel: string; onGoHome: () => void }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%", justifyContent: "center", px: 3, py: 6 }}>
      <Box
        sx={{
          p: 4,
          borderRadius: 4,
          textAlign: "center",
          bgcolor: "background.paper",
          boxShadow: "0 16px 38px rgba(15,23,42,0.08)",
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            mx: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            bgcolor: "primary.light",
            color: "primary.main",
          }}
        >
          <FileText sx={{ fontSize: 28 }} />
        </Box>
        <Typography sx={{ mt: 3, fontSize: 20, fontWeight: 700 }}>
          {activeLabel} dùng trên web
        </Typography>
        <Typography sx={{ mt: 1, fontSize: 14, color: "text.secondary", lineHeight: 1.6 }}>
          Phiên bản mobile LMS hiện hỗ trợ Giao bài, Kho bài, Lịch và Thông báo. Mở máy tính để thao tác đầy đủ màn này.
        </Typography>
        <Button
          variant="contained"
          fullWidth
          onClick={onGoHome}
          sx={{ mt: 4, borderRadius: 3, py: 1.5, textTransform: "none", fontWeight: 600 }}
        >
          Về Giao bài
        </Button>
      </Box>
    </Box>
  );
}

function getClassStudents(classId?: string) {
  return classroomStudents.filter((student) => !classId || student.classId === classId);
}
