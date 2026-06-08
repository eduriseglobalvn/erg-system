import { lazy, memo, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@/routes/router-compat";
import {
  BookOpen,
  BookOpenCheck,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardList,
  FileText,
  GraduationCap,
  MoreVertical,
  RotateCcw,
  Search,
  UsersRound,
} from "lucide-react";

import { Badge, Button, Input } from "@/components/ui/dashboard-kit";
import { ERG_ASSETS } from "@/config/seo";
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
import type { ClassroomSnapshot, ClassroomStudent, AssignmentRun } from "@/features/lms/classroom/types/classroom-types";
import { loadLmsDashboardBootstrap } from "@/features/lms/infrastructure/lms-dashboard-api";
import { getCurrentAcademicYear } from "@/features/lms/learning-resources/api/teacher-resource-dashboard-api";
import { LearningResourceDashboardScopeProvider } from "@/features/lms/learning-resources/hooks/use-learning-resource-dashboard-scope";
import { hasApiBase } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { LmsSelect } from "@/components/ui/lms-kit";
import { LmsMobileShell, useLmsMobileBreakpoint } from "@/features/lms/mobile";

type LmsSection = "homework" | "score" | "attendance" | "schedule" | "classLog" | "resources" | "reports";

const LearningResourceLibraryPage = lazy(() =>
  import("@/features/lms/learning-resources/components/learning-resource-library-page").then((module) => ({
    default: module.LearningResourceLibraryPage,
  })),
);
const TeachingSchedulePanel = lazy(() =>
  import("@/features/lms/components/teaching-schedule/teaching-schedule-panel").then((module) => ({
    default: module.TeachingSchedulePanel,
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
const HomeworkFloatingMenu = lazy(() =>
  import("@/features/lms/components/homework-floating-menu").then((module) => ({
    default: module.HomeworkFloatingMenu,
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
const LmsNotificationCenter = lazy(() =>
  import("@/features/lms/components/lms-notification-center").then((module) => ({
    default: module.LmsNotificationCenter,
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

const lmsNavItems: Array<{ id: LmsSection; label: string; path: string; icon: typeof ClipboardList }> = [
  { id: "homework", label: "Bài tập", path: "/homework", icon: ClipboardList },
  { id: "score", label: "Bảng điểm", path: "/score", icon: GraduationCap },
  { id: "attendance", label: "Điểm danh", path: "/attendance", icon: CalendarCheck },
  { id: "schedule", label: "Lịch làm việc", path: "/calendar", icon: CalendarDays },
  { id: "classLog", label: "Sổ đầu bài", path: "/class-log", icon: BookOpenCheck },
  { id: "resources", label: "Tài nguyên", path: "/resources", icon: BookOpen },
  { id: "reports", label: "Báo cáo", path: "/reports", icon: FileText },
];

function resolveSection(pathname: string): LmsSection {
  const matched = lmsNavItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  return matched?.id ?? "homework";
}

export function LmsTeacherShell() {
  const { actions, account } = useAuthSession("lms");
  const navigate = useNavigate();
  const apiBacked = hasApiBase();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const activeSection = resolveSection(pathname);
  const showHomeworkFloatingMenu = pathname.startsWith("/homework");
  const [requestedSchoolId, setSelectedSchoolId] = useState("");
  const [requestedClassId, setSelectedClassId] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [runs, setRuns] = useState<AssignmentRun[]>(assignmentRuns);
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(false);
  const bootstrapQuery = useQuery({
    queryKey: ["lms-teacher-shell", "bootstrap"],
    queryFn: loadLmsDashboardBootstrap,
    enabled: apiBacked,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
  const schools = bootstrapQuery.data?.schools.length ? bootstrapQuery.data.schools : classroomSchools;
  const classes = bootstrapQuery.data?.classes.length ? bootstrapQuery.data.classes : classroomSnapshots;
  const bootstrapSelection = useMemo(() => {
    const scope = bootstrapQuery.data?.managementScope;
    const scopedSchoolId =
      scope?.centerId && schools.some((school) => school.id === scope.centerId)
        ? scope.centerId
        : schools[0]?.id ?? defaultSchoolId;
    const classInScope =
      scope?.level === "class"
        ? classes.find((classroom) => classroom.id === scope.classId && classroom.schoolId === scopedSchoolId)
        : undefined;
    const firstClassInSchool = classes.find((classroom) => classroom.schoolId === scopedSchoolId);

    return {
      schoolId: scopedSchoolId,
      classId: classInScope?.id ?? firstClassInSchool?.id ?? classes[0]?.id ?? defaultClassId,
    };
  }, [bootstrapQuery.data?.managementScope, classes, schools]);
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
      : selectedClassOptions[0]?.id ?? classes[0]?.id ?? defaultClassId;
  const selectedClass = selectedClassOptions.find((classroom) => classroom.id === selectedClassId) ?? selectedClassOptions[0];
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId) ?? schools[0] ?? classroomSchools[0];
  const selectedSchoolName = selectedSchool?.name ?? "ERG";
  const activeNav = lmsNavItems.find((item) => item.id === activeSection) ?? lmsNavItems[0];
  const teacherName = account?.fullName || "Lê Thị Thùy";
  const teacherEmail = account?.email || "teacher@erg.edu.vn";
  const teacherAvatar = account?.avatarUrl || "";
  const learningResourceScope = useMemo(
    () => ({
      selectedSchoolId,
      academicYear: getCurrentAcademicYear(),
    }),
    [selectedSchoolId],
  );
  const isMobile = useLmsMobileBreakpoint();
  const mobileDockItems = useMemo(() => lmsNavItems.slice(0, 4), []);

  useEffect(() => {
    if (!bootstrapQuery.error) return;
    console.error("Cannot load LMS teacher bootstrap", bootstrapQuery.error);
  }, [bootstrapQuery.error]);

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


  const teacherContent = (
    <>
          {pathname === "/account" ? (
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
                onCreateAssignment={(title, subject) => {
                  const newRun: AssignmentRun = {
                    id: `assignment-${Date.now()}`,
                    title: title,
                    subjectLabel: subject,
                    targetLevel: selectedClass?.className ?? "Cả lớp",
                    activeClasses: 1,
                    completionRate: 0,
                    submittedCount: 0,
                    inProgressCount: 0,
                    needsReviewCount: 0,
                    dueLabel: "Hạn nộp sau 7 ngày",
                  };
                  setRuns([newRun, ...runs]);
                  navigate("/homework");
                }}
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
                onAssign={(exerciseTitle) => {
                  const newRun: AssignmentRun = {
                    id: `assignment-${Date.now()}`,
                    title: exerciseTitle,
                    subjectLabel: "Kho bài tập",
                    targetLevel: selectedClass?.className ?? "Cả lớp",
                    activeClasses: 1,
                    completionRate: 0,
                    submittedCount: 0,
                    inProgressCount: 0,
                    needsReviewCount: 0,
                    dueLabel: "Hạn nộp sau 7 ngày",
                  };
                  setRuns([newRun, ...runs]);
                  navigate("/homework");
                }}
              />
            </Suspense>
          ) : pathname === "/homework/progress" ? (
            <ClassManagementPage
              classes={classes}
              selectedClass={selectedClass}
              selectedSchoolName={selectedSchoolName}
              students={classroomStudents.filter((student) => student.schoolId === selectedSchoolId)}
            />
          ) : activeSection === "resources" ? (
            <LearningResourceDashboardScopeProvider value={learningResourceScope}>
              <Suspense fallback={null}>
                <LearningResourceLibraryPage />
              </Suspense>
            </LearningResourceDashboardScopeProvider>
          ) : activeSection === "schedule" ? (
            <div className="flex h-full min-h-[720px]">
              <Suspense fallback={null}>
                <TeachingSchedulePanel selectedClass={selectedClass} teacherName={teacherName} />
              </Suspense>
            </div>
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
            <div className="flex min-h-full flex-col gap-3 px-4 py-4 xl:px-6">
              <HomeworkPanel
                selectedClass={selectedClass}
                runs={runs}
                onAssign={() => navigate("/homework/assign")}
                onViewProgress={() => navigate("/homework/class")}
              />
            </div>
          ) : (
            <TeacherWorkspaceFrame
              activeLabel={activeNav.label}
              selectedClass={selectedClass}
              selectedSchoolName={selectedSchoolName}
            >
              {activeSection === "reports" ? <ReportsPanel selectedClass={selectedClass} selectedSchoolName={selectedSchoolName} /> : null}
            </TeacherWorkspaceFrame>
          )}

    </>
  );

  if (isMobile) {
    return (
      <div className="lms-teacher-shell flex min-h-[100dvh] overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
        <LmsMobileShell
          activeLabel={activeNav.label}
          activeSection={activeSection}
          classes={classes}
          dockItems={mobileDockItems}
          navItems={lmsNavItems}
          notificationCenter={<LmsNotificationCenter />}
          schoolName={selectedSchoolName}
          schools={schools}
          selectedClassId={selectedClass?.id ?? ""}
          selectedClassName={selectedClass?.className ?? "Lop hoc"}
          selectedSchoolId={selectedSchoolId}
          teacherEmail={teacherEmail}
          teacherName={teacherName}
          onClassChange={setSelectedClassId}
          onNavigate={(path) => navigate(path)}
          onSchoolChange={selectSchool}
          onSignOut={signOut}
        >
          {teacherContent}
        </LmsMobileShell>
      </div>
    );
  }
  return (
    <div className="lms-teacher-shell flex h-screen max-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 shrink-0 border-b border-[var(--border)] bg-[var(--card)]/95 shadow-[var(--shadow-xs)] backdrop-blur-xl">
          <div className="flex h-16 items-center gap-4 px-4 xl:px-5">
            <button type="button" onClick={() => navigate("/homework")} className="group flex h-12 shrink-0 items-center rounded-[10px] px-1.5 transition hover:bg-[var(--surface-hover)]">
              <span className="flex h-11 w-[112px] items-center overflow-hidden">
                <img src={ERG_ASSETS.logo} alt="ERG EduRise Global" className="h-10 w-auto max-w-full object-contain" />
              </span>
            </button>

            <nav className="hidden min-w-0 flex-1 items-center justify-start gap-3 overflow-x-auto pl-0 pr-4 xl:flex">
              {lmsNavItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "relative inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3.5 text-[15px] font-extrabold tracking-0 text-[#243044] transition-all duration-150 hover:bg-[#f2f7ff] hover:text-slate-950",
                      active && "bg-[#eef6ff] text-[var(--primary)]",
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px] transition-colors", active ? "text-[var(--primary)]" : "text-slate-600")} strokeWidth={2.45} />
                    <span className="relative inline-flex h-full items-center leading-none">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2.5">
              <LmsSelect
                aria-label="Chọn trường"
                value={selectedSchoolId}
                onChange={(event) => selectSchool(event.target.value)}
                className="hidden w-[230px] lg:block"
              >
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </LmsSelect>
              <LmsSelect
                aria-label="Chọn lớp"
                value={selectedClass?.id ?? ""}
                onChange={(event) => setSelectedClassId(event.target.value)}
                disabled={!selectedClassOptions.length}
                className="min-w-[132px]"
              >
                {selectedClassOptions.length ? (
                  selectedClassOptions.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.className}
                    </option>
                  ))
                ) : (
                  <option value="empty" disabled>
                    Chưa có lớp
                  </option>
                )}
              </LmsSelect>
              <LmsNotificationCenter />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  className="rounded-[10px] outline-none transition hover:brightness-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/20"
                  aria-label="Tài khoản giáo viên"
                  aria-expanded={accountMenuOpen}
                >
                  <OnlineTeacherAvatar avatarUrl={teacherAvatar} name={teacherName} />
                </button>
                {accountMenuOpen ? (
                  <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
                    <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
                      <OnlineTeacherAvatar avatarUrl={teacherAvatar} name={teacherName} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[var(--foreground)]">{teacherName}</div>
                        <div className="truncate text-xs font-semibold text-[var(--muted-foreground)]">{teacherEmail}</div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button type="button" onClick={() => { setAccountMenuOpen(false); navigate("/account"); }} className="w-full rounded-[10px] px-3 py-2 text-left text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)]">
                        Quản lý tài khoản
                      </button>
                      <button type="button" onClick={() => { setAccountMenuOpen(false); navigate("/account/login-logs"); }} className="w-full rounded-[10px] px-3 py-2 text-left text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)]">
                        Lịch sử đăng nhập
                      </button>
                      <button type="button" onClick={signOut} className="w-full rounded-[10px] px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-[var(--border)] bg-[var(--card)] px-4 py-2 xl:hidden">
            {lmsNavItems.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "relative h-9 whitespace-nowrap rounded-lg px-3 text-[14px] font-extrabold tracking-0 transition hover:bg-[#f2f7ff] hover:text-slate-950",
                    active ? "bg-[#eef6ff] text-[var(--primary)]" : "text-slate-700",
                  )}
                >
                  <span className="relative inline-flex h-full items-center">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </header>

        <main
          className={cn(
            "min-h-0 flex-1",
            pathname === "/homework/assign" || pathname === "/homework/exercise-bank" || pathname === "/homework/progress" || pathname === "/homework/class" ? "overflow-hidden" : "overflow-y-auto",
          )}
        >
          {teacherContent}
        </main>
      </div>
      {showHomeworkFloatingMenu ? (
        <HomeworkFloatingMenu
          open={floatingMenuOpen}
          setOpen={setFloatingMenuOpen}
          onAction={(action) => {
            if (action === "assign") {
              navigate("/homework/assign");
            } else if (action === "classes") {
              navigate("/homework/class");
            } else if (action === "groups") {
              navigate("/homework/student-groups");
            } else if (action === "exerciseBank") {
              navigate("/homework/exercise-bank");
            } else {
              navigate("/homework");
            }
          }}
        />
      ) : null}
    </div>
  );
}

function TeacherWorkspaceFrame({
  activeLabel,
  children,
  selectedClass,
  selectedSchoolName,
}: {
  activeLabel: string;
  children: ReactNode;
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
}) {
  return (
    <div className="flex min-h-full flex-col gap-3 px-4 py-4 xl:px-6">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-[var(--muted-foreground)]">Trang chủ / <span className="text-[var(--foreground)]">{activeLabel}</span></div>
            <h1 className="mt-2 font-[var(--font-heading)] text-xl font-semibold tracking-normal text-[var(--foreground)]">{selectedClass?.className ?? "Lớp học"}</h1>
            <p className="mt-1 text-sm font-semibold text-[var(--muted-foreground)]">{selectedSchoolName} - {selectedClass?.studentCount ?? 0} học sinh</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">Xuất dữ liệu</Button>
          </div>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <ClassStat icon={ClipboardList} label="Bài đang mở" value={String(selectedClass?.activeAssignments ?? 0)} />
          <ClassStat icon={CheckCircle2} label="Hoàn thành" value={`${selectedClass?.completionRate ?? 0}%`} />
          <ClassStat icon={UsersRound} label="Cần hỗ trợ" value={String(selectedClass?.riskStudents ?? 0)} />
          <ClassStat icon={Clock3} label="Nộp gần nhất" value={selectedClass?.lastSubmissionAt ?? "-"} />
        </div>
      </div>
      {children}
    </div>
  );
}

const ClassStat = memo(function ClassStat({ icon: Icon, label, value }: { icon: typeof ClipboardList; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-xs)]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
        <span className="mt-1 block truncate text-base font-semibold text-[var(--foreground)]">{value}</span>
      </span>
    </div>
  );
});

function HomeworkPanel({
  selectedClass,
  runs,
  onAssign,
  onViewProgress,
}: {
  selectedClass?: ClassroomSnapshot;
  runs: AssignmentRun[];
  onAssign: () => void;
  onViewProgress: (runId: string) => void;
}) {
  return (
    <>
      <FilterBar
        primaryPlaceholder="Tìm kiếm theo tên bài"
        filters={["Môn học", "Học kỳ", "Trạng thái", "Loại bài", "Tính điểm", "Đối tượng giao"]}
        onAssign={onAssign}
      />
      <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            <TableHeader columns="grid-cols-[72px_minmax(280px,1.4fr)_150px_170px_170px_220px_160px_64px]" labels={["STT", "Tên bài", "Môn học", "Loại bài", "Đối tượng", "Thời gian làm bài", "Trạng thái", ""]} />
            <div className="divide-y divide-[var(--border)]">
              {runs.map((assignment, index) => (
                <article key={assignment.id} className="grid grid-cols-[72px_minmax(280px,1.4fr)_150px_170px_170px_220px_160px_64px] items-center gap-3 px-4 py-4 text-sm transition hover:bg-[var(--surface-hover)]">
                  <span className="font-semibold text-[var(--muted-foreground)]">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <button type="button" onClick={() => onViewProgress(assignment.id)} className="truncate text-left font-semibold text-[var(--primary)] hover:text-[var(--primary)]/80">{assignment.title}</button>
                    <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">Công bố điểm tự động</p>
                  </div>
                  <span className="font-semibold text-[var(--foreground)]">{assignment.subjectLabel}</span>
                  <span className="text-[var(--muted-foreground)]">{index % 2 === 0 ? "Kiểm tra đầu vào" : "Luyện tập"}</span>
                  <span className="font-semibold text-[var(--foreground)]">{selectedClass?.className ?? "Cả lớp"}</span>
                  <span className="leading-6 text-[var(--muted-foreground)]">21/05/2026 10:{50 + index}<br />28/05/2026 10:{50 + index}</span>
                  <Badge tone={index > 3 ? "danger" : "success"} className="justify-self-start">{index > 3 ? "Đã kết thúc" : "Đang diễn ra"}</Badge>
                  <button type="button" onClick={() => onViewProgress(assignment.id)} aria-label="Mở thao tác" className="grid h-9 w-9 place-items-center rounded-[10px] text-[var(--muted-foreground)] hover:bg-[var(--card)] hover:text-[var(--foreground)] hover:shadow-[var(--shadow-xs)]">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function LegacyAttendancePanel({ selectedClass }: { selectedClass?: ClassroomSnapshot }) {
  const students = getClassStudents(selectedClass?.id);
  const days = ["Thứ Hai\n18/05/2026", "Thứ Ba\n19/05/2026", "Thứ Tư\n20/05/2026", "Thứ Năm\n21/05/2026", "Thứ Sáu\n22/05/2026", "Thứ Bảy\n23/05/2026", "Chủ Nhật\n24/05/2026"];
  return (
    <section className="space-y-5">
      <div className="flex justify-end gap-2">
        <Button variant="outline">‹</Button>
        <Button variant="outline">Tuần 12 (18/05 - 24/05)</Button>
        <Button variant="outline">⬺</Button>
        <Button>Tuần này</Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="grid grid-cols-[70px_260px_repeat(7,minmax(120px,1fr))] bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)]">
          <div className="px-4 py-4">STT</div>
          <div className="px-4 py-4">Học sinh</div>
          {days.map((day) => <div key={day} className="whitespace-pre-line px-4 py-4 text-center">{day}</div>)}
        </div>
        {students.slice(0, 10).map((student, index) => (
          <div key={student.id} className="grid min-h-20 grid-cols-[70px_260px_repeat(7,minmax(120px,1fr))] border-t border-[var(--border)] text-sm">
            <div className="px-4 py-5 text-[var(--muted-foreground)]">{index + 1}</div>
            <div className="px-4 py-5 font-medium text-[var(--primary)]">{student.name}</div>
            {days.map((day, dayIndex) => (
              <div key={day} className={cn("px-4 py-5 text-center font-medium", dayIndex === 6 && "bg-[var(--accent-soft)]")}>
                {dayIndex > 0 && dayIndex < 5 ? <span className={dayIndex === 2 && index === 1 ? "text-rose-600" : "text-emerald-600"}>●</span> : null}{" "}
                {dayIndex > 0 && dayIndex < 5 ? "1/1" : ""}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

void LegacyAttendancePanel;

type AttendanceStatus = "present" | "absent" | "late" | "excused" | "";

function AttendancePanel({
  selectedClass,
  selectedSchoolName,
  students,
}: {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  students: ClassroomStudent[];
}) {
  const [attendanceOverrides, setAttendanceOverrides] = useState<Record<string, AttendanceStatus>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionFilter, setSessionFilter] = useState("Tất cả buổi");
  const attendanceColumns = [
    { id: "mon-am", day: "Thứ Hai", date: "18/05", session: "Sáng" },
    { id: "mon-pm", day: "Thứ Hai", date: "18/05", session: "Chiều" },
    { id: "tue-am", day: "Thứ Ba", date: "19/05", session: "Sáng" },
    { id: "wed-am", day: "Thứ Tư", date: "20/05", session: "Sáng" },
    { id: "thu-am", day: "Thứ Năm", date: "21/05", session: "Sáng" },
    { id: "fri-am", day: "Thứ Sáu", date: "22/05", session: "Sáng" },
    { id: "fri-pm", day: "Thứ Sáu", date: "22/05", session: "Chiều" },
    { id: "sat-am", day: "Thứ Bảy", date: "23/05", session: "Sáng" },
  ];
  const filteredStudents = students.filter((student) => student.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));
  const visibleColumns = attendanceColumns.filter((column) => sessionFilter === "Tất cả buổi" || column.session === sessionFilter);

  function updateAttendance(studentId: string, columnId: string) {
    const key = `${studentId}:${columnId}`;
    setAttendanceOverrides((current) => ({
      ...current,
      [key]: nextAttendanceStatus(current[key] ?? ""),
    }));
  }

  return (
    <div className="flex min-h-full flex-col gap-2 px-2 py-2 xl:px-3">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="mr-auto min-w-[190px]">
            <div className="text-sm font-semibold leading-5 text-[var(--foreground)]">{selectedClass?.className ?? "Lớp hoc"}</div>
            <div className="text-[13px] font-semibold text-[var(--muted-foreground)]">
              {selectedSchoolName} · {students.length} hoc sinh · {visibleColumns.length} cot diem danh
            </div>
          </div>
          <div className="relative min-w-[220px] flex-1 xl:max-w-[340px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--primary)]" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm học sinh"
              className="h-10 rounded-lg border-[#d7e0ec] bg-white pl-9 text-[14px] font-semibold shadow-none focus:bg-[var(--card)]"
            />
          </div>
          <LmsSelect className="h-9 min-w-[150px] text-[13px]">
            <option>Tuần 12 (18/05 - 24/05)</option>
            <option>Tuần 13 (25/05 - 31/05)</option>
          </LmsSelect>
          <LmsSelect
            value={sessionFilter}
            onChange={(event) => setSessionFilter(event.target.value)}
            className="h-9 min-w-[132px] text-[13px]"
          >
            <option>Tất cả buổi</option>
            <option>Sáng</option>
            <option>Chiều</option>
          </LmsSelect>
            <Button variant="outline">Xuất dữ liệu</Button>
          <Button className="h-10 rounded-[10px] px-3 text-[14px] font-bold">Lưu điểm danh</Button>
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-2.5 py-1.5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Bảng điểm danh theo tuần</h2>
          <div className="flex items-center gap-1.5 text-[13px] font-bold">
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">Có mặt</span>
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">Đi muộn</span>
            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">Vắng</span>
            <span className="rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-[var(--primary)]">Có phép</span>
          </div>
        </div>
        <div className="max-h-[620px] overflow-auto">
          <table className="erg-data-table min-w-[1500px] border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr className="bg-[#eef4fb] text-[13px] font-bold text-slate-700">
                <AttendanceHeaderCell className="sticky left-0 top-0 z-40 w-[44px]">STT</AttendanceHeaderCell>
                <AttendanceHeaderCell className="sticky left-[44px] top-0 z-40 w-[190px] text-left">Học sinh</AttendanceHeaderCell>
                <AttendanceHeaderCell className="sticky left-[234px] top-0 z-40 w-[66px]">Lớp</AttendanceHeaderCell>
                <AttendanceHeaderCell className="sticky left-[300px] top-0 z-40 w-[76px]">Tổng</AttendanceHeaderCell>
                {visibleColumns.map((column) => (
                  <AttendanceHeaderCell key={column.id} className="sticky top-0 z-30 w-[136px]">
                    <span className="block">{column.day}</span>
                    <span className="mt-1 block text-[12px] font-semibold normal-case text-slate-600">{column.date} · {column.session}</span>
                  </AttendanceHeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                const summary = attendanceSummary(student.id, visibleColumns.map((column) => column.id), attendanceOverrides, index);
                return (
                  <tr key={student.id} className="group">
                    <AttendanceStickyCell className="left-0 z-20 w-[44px] text-center text-[var(--muted-foreground)]">{index + 1}</AttendanceStickyCell>
                    <AttendanceStickyCell className="left-[44px] z-20 w-[190px]">
                      <button type="button" className="max-w-[166px] truncate text-left font-medium text-[var(--primary)] hover:underline">
                        {student.name}
                      </button>
                    </AttendanceStickyCell>
                    <AttendanceStickyCell className="left-[234px] z-20 w-[66px] text-center font-semibold text-[var(--muted-foreground)]">
                      {student.className.replace("Lớp ", "").replace("Lớp ", "")}
                    </AttendanceStickyCell>
                    <AttendanceStickyCell className="left-[300px] z-20 w-[76px] text-center">
                      <span className={cn("rounded-lg border px-2 py-1 text-[13px] font-bold", summary.absent ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700")}>
                        {summary.present}/{summary.total}
                      </span>
                    </AttendanceStickyCell>
                    {visibleColumns.map((column, columnIndex) => {
                      const status = attendanceOverrides[`${student.id}:${column.id}`] ?? getMockAttendanceStatus(index, columnIndex);
                      return (
                        <td key={column.id} className={cn("h-9 border-b border-r border-[#cbd7e6] px-1.5 text-center group-hover:!bg-[var(--accent-soft)]", attendanceCellClass(status))}>
                          <button
                            type="button"
                            onClick={() => updateAttendance(student.id, column.id)}
                            className="h-8 w-full rounded-lg text-[13px] font-bold outline-none focus:ring-2 focus:ring-[var(--ring)]"
                            aria-label={`${student.name} ${column.day} ${column.session}`}
                          >
                            {attendanceLabel(status)}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const AttendanceHeaderCell = memo(function AttendanceHeaderCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn("h-8 border-b border-r border-[var(--border)] bg-[var(--muted)]/70 px-1.5 text-center align-middle", className)}>
      {children}
    </th>
  );
});

const AttendanceStickyCell = memo(function AttendanceStickyCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("sticky h-7 border-b border-r border-[var(--border)] bg-[var(--card)] px-1.5 align-middle group-hover:bg-[var(--accent-soft)]", className)}>
      {children}
    </td>
  );
});

function getMockAttendanceStatus(studentIndex: number, columnIndex: number): AttendanceStatus {
  if ((studentIndex + columnIndex) % 17 === 0) return "late";
  if ((studentIndex * 3 + columnIndex) % 23 === 0) return "absent";
  if ((studentIndex + columnIndex * 2) % 29 === 0) return "excused";
  return "present";
}

function nextAttendanceStatus(status: AttendanceStatus): AttendanceStatus {
  if (status === "present" || status === "") return "late";
  if (status === "late") return "absent";
  if (status === "absent") return "excused";
  return "present";
}

function attendanceLabel(status: AttendanceStatus) {
  if (status === "absent") return "V";
  if (status === "late") return "M";
  if (status === "excused") return "P";
  return "✓";
}

function attendanceCellClass(status: AttendanceStatus) {
  if (status === "absent") return "bg-rose-50 text-rose-700";
  if (status === "late") return "bg-amber-50 text-amber-700";
  if (status === "excused") return "bg-[var(--accent-soft)] text-[var(--primary)]";
  return "bg-emerald-50 text-emerald-700";
}

function attendanceSummary(studentId: string, columnIds: string[], overrides: Record<string, AttendanceStatus>, studentIndex: number) {
  const statuses = columnIds.map((columnId, columnIndex) => overrides[`${studentId}:${columnId}`] ?? getMockAttendanceStatus(studentIndex, columnIndex));
  const absent = statuses.filter((status) => status === "absent").length;
  const present = statuses.filter((status) => status === "present" || status === "late").length;
  return { absent, present, total: statuses.length };
}

void AttendancePanel;

function ReportsPanel({ selectedClass, selectedSchoolName }: { selectedClass?: ClassroomSnapshot; selectedSchoolName: string }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Metric label="Trường" value={selectedSchoolName} detail="Phạm vi đang xem" />
      <Metric label="Lớp" value={selectedClass?.className ?? "-"} detail={`${selectedClass?.studentCount ?? 0} học sinh`} />
      <Metric label="Hoàn thành" value={`${selectedClass?.completionRate ?? 0}%`} detail="Trung bình bài đang mở" />
      <Metric label="Cần hỗ trợ" value={String(selectedClass?.riskStudents ?? 0)} detail="Học sinh cần theo sát" />
    </section>
  );
}

function FilterBar({
  filters,
  primaryPlaceholder,
  onAssign,
}: {
  filters: string[];
  primaryPlaceholder: string;
  onAssign: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5 shadow-[var(--shadow-sm)]">
      <div className="grid items-center gap-2 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1 xl:max-w-[520px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <Input placeholder={primaryPlaceholder} className="pl-10 shadow-none" />
          </div>
          {filters.map((filter) => (
            <LmsSelect key={filter} className="h-10 min-w-[128px]">
              <option>{filter}</option>
            </LmsSelect>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-10 min-w-[104px] rounded-lg border border-[#d7e0ec] px-4 text-[14px] font-bold text-slate-900 shadow-none hover:border-[#b8c8db] hover:bg-[#f8fbff]"
            style={{ backgroundColor: "#ffffff", border: "1px solid #d7e0ec", borderRadius: 8, paddingInline: 16 }}
          >
            <RotateCcw className="h-4 w-4" />
            Đặt lại
          </Button>
        </div>
        <div className="flex shrink-0 justify-end gap-2">
          <Button
            className="min-w-[88px] px-4"
            size="sm"
            style={{ backgroundColor: "#0078d4", borderColor: "#0078d4", color: "#ffffff" }}
            onClick={onAssign}
          >
            Giao bài
          </Button>
        </div>
      </div>
    </div>
  );
}
function TableHeader({ columns, labels }: { columns: string; labels: string[] }) {
  return (
    <div className={cn("grid gap-3 border-b border-[var(--border)] bg-[var(--muted)]/70 px-4 py-4 text-xs font-semibold text-[var(--muted-foreground)]", columns)}>
      {labels.map((label) => <span key={label}>{label}</span>)}
    </div>
  );
}

const Metric = memo(function Metric({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
      <div className="text-xs font-semibold text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-3 text-xl font-semibold text-[var(--foreground)]">{value}</div>
      <div className="mt-2 text-sm text-[var(--muted-foreground)]">{detail}</div>
    </article>
  );
});

function getClassStudents(classId?: string) {
  return classroomStudents.filter((student) => !classId || student.classId === classId);
}

const OnlineTeacherAvatar = memo(function OnlineTeacherAvatar({ avatarUrl, name }: { avatarUrl: string; name: string }) {
  return (
    <span className="relative grid size-11 place-items-center overflow-visible rounded-full bg-[var(--primary)] text-xs font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-xs)] ring-2 ring-[var(--card)]">
      {avatarUrl ? <img src={avatarUrl} alt={name} className="size-full rounded-full object-cover" /> : getInitials(name)}
      <span className="absolute bottom-0 right-0 size-3.5 rounded-full border border-[var(--card)] bg-emerald-500 ring-2 ring-[var(--card)]" aria-label="Đang online" />
    </span>
  );
});

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

// -----------------------------------------------------------------------------
// NEW REDESIGNED SCREEN COMPONENTS FOR HOMEWORK & QUICK ACTIONS
// -----------------------------------------------------------------------------
