import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
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
  Search,
  UsersRound,
} from "lucide-react";

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, Button, Input } from "@/components/ui/dashboard-kit";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { AssignHomeworkPage } from "@/features/lms/components/assign-homework-page";
import { HomeworkFloatingMenu } from "@/features/lms/components/homework-floating-menu";
import { LmsAccountPage } from "@/features/lms/components/lms-account-page";
import { LmsLoginLogsPage } from "@/features/lms/components/lms-login-logs-page";
import { LmsNotificationCenter } from "@/features/lms/components/lms-notification-center";
import { LmsNotificationDetailPage } from "@/features/lms/components/lms-notification-detail-page";
import { ExerciseBankPage } from "@/features/lms/components/exercise-bank-page";
import { StudentGroupsPage } from "@/features/lms/components/student-groups-page";
import { ClassManagementPage } from "@/features/lms/classroom/components/class-management-page";
import { hasApiBase } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";

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
  const [requestedSchoolId, setSelectedSchoolId] = useState("");
  const [requestedClassId, setSelectedClassId] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [runs, setRuns] = useState<AssignmentRun[]>(assignmentRuns);
  const [floatingMenuOpen, setFloatingMenuOpen] = useState(true);
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

  return (
    <div className="lms-teacher-shell flex h-screen max-h-screen overflow-hidden bg-[var(--erg-bg)] text-slate-950">

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 shrink-0 border-b border-[#d9e0ea] bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 xl:px-5">
            <button type="button" onClick={() => navigate("/homework")} className="group flex h-12 shrink-0 items-center rounded-lg px-1.5 transition hover:bg-[#f7f8fa]">
              <span className="flex h-11 w-[112px] items-center overflow-hidden">
                <img src={ERG_ASSETS.logo} alt="ERG EduRise Global" className="h-10 w-auto max-w-full object-contain" />
              </span>
            </button>

            <nav className="hidden min-w-0 flex-1 items-center justify-start gap-1.5 overflow-x-auto pl-1 pr-2 xl:flex">
              {lmsNavItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "relative inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold text-slate-600 transition-colors duration-150 hover:bg-[#f7f9fc] hover:text-slate-950",
                      "after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-[var(--erg-blue)] after:transition-transform",
                      active && "text-[var(--erg-blue)] after:scale-x-100",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 transition-colors", active ? "text-[var(--erg-blue)]" : "text-slate-500")} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2.5">
              <Select value={selectedSchoolId} onValueChange={selectSchool}>
                <SelectTrigger
                  aria-label="Chọn trường"
                  className="hidden h-10 w-[230px] rounded-lg border-[#d9e0ea] bg-white px-3 text-sm font-medium text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:border-[#c3cad5] lg:flex"
                >
                  <SelectValue placeholder="Chọn trường" />
                </SelectTrigger>
                <SelectContent position="popper" align="start" className="w-[230px] p-1 shadow-lg shadow-slate-900/10">
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id} className="font-medium">
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedClass?.id ?? ""} onValueChange={setSelectedClassId} disabled={!selectedClassOptions.length}>
                <SelectTrigger
                  aria-label="Chọn lớp"
                  className="h-10 min-w-[132px] rounded-lg border-[#d9e0ea] bg-white px-3 text-sm font-medium text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:border-[#c3cad5]"
                >
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent position="popper" align="start" className="min-w-[132px] p-1 shadow-lg shadow-slate-900/10">
                  {selectedClassOptions.length ? (
                    selectedClassOptions.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id} className="font-medium">
                        {classroom.className}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>
                      Chưa có lớp
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <LmsNotificationCenter />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  className="rounded-lg outline-none transition hover:brightness-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--erg-blue)]/20"
                  aria-label="Tài khoản giáo viên"
                  aria-expanded={accountMenuOpen}
                >
                  <OnlineTeacherAvatar avatarUrl={teacherAvatar} name={teacherName} />
                </button>
                {accountMenuOpen ? (
                  <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                      <OnlineTeacherAvatar avatarUrl={teacherAvatar} name={teacherName} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-950">{teacherName}</div>
                        <div className="truncate text-xs font-semibold text-slate-500">{teacherEmail}</div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button type="button" onClick={() => { setAccountMenuOpen(false); navigate("/account"); }} className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        Quản lý tài khoản
                      </button>
                      <button type="button" onClick={() => { setAccountMenuOpen(false); navigate("/account/login-logs"); }} className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        Lịch sử đăng nhập
                      </button>
                      <button type="button" onClick={signOut} className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto border-t border-[#edf1f6] bg-white px-3 py-2 xl:hidden">
            {lmsNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className={cn(
                  "relative whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition hover:bg-[#f7f9fc] after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-[var(--erg-blue)] after:transition-transform",
                  activeSection === item.id ? "text-[var(--erg-blue)] after:scale-x-100" : "text-slate-600",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <main
          className={cn(
            "min-h-0 flex-1 transition-[padding-right] duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            pathname === "/homework/assign" || pathname === "/homework/exercise-bank" || pathname === "/homework/progress" || pathname === "/classes" ? "overflow-hidden" : "overflow-y-auto",
            floatingMenuOpen ? "xl:pr-[132px]" : "xl:pr-[48px]",
          )}
        >
          {pathname === "/account" ? (
            <LmsAccountPage
              onLoginLogs={() => navigate("/account/login-logs")}
              onSignedOut={() => navigate("/login", { replace: true })}
            />
          ) : pathname === "/account/login-logs" ? (
            <LmsLoginLogsPage onManageAccount={() => navigate("/account")} />
          ) : pathname.startsWith("/notifications/") ? (
            <LmsNotificationDetailPage
              notificationId={pathname.replace("/notifications/", "").split("/")[0] ?? ""}
              onBack={() => navigate("/homework")}
            />
          ) : pathname === "/homework/assign" ? (
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
          ) : pathname === "/homework/student-groups" ? (
            <StudentGroupsPage
              classes={classes}
              selectedClass={selectedClass}
              selectedSchoolName={selectedSchoolName}
              onBack={() => navigate("/homework")}
            />
          ) : pathname === "/classes" ? (
            <ClassManagementPage
              classes={classes}
              selectedClass={selectedClass}
              selectedSchoolName={selectedSchoolName}
              students={classroomStudents.filter((student) => student.schoolId === selectedSchoolId)}
            />
          ) : pathname === "/homework/exercise-bank" ? (
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
          ) : (
            <TeacherWorkspaceFrame
              activeLabel={activeNav.label}
              selectedClass={selectedClass}
              selectedSchoolName={selectedSchoolName}
            >
              {activeSection === "homework" ? (
                <HomeworkPanel
                  selectedClass={selectedClass}
                  runs={runs}
                  onAssign={() => navigate("/homework/assign")}
                  onViewProgress={() => navigate("/classes")}
                />
              ) : null}
              {activeSection === "reports" ? <ReportsPanel selectedClass={selectedClass} selectedSchoolName={selectedSchoolName} /> : null}
            </TeacherWorkspaceFrame>
          )}
        </main>
      </div>

      <HomeworkFloatingMenu
        open={floatingMenuOpen}
        setOpen={setFloatingMenuOpen}
        onAction={(action) => {
          if (action === "assign") {
            navigate("/homework/assign");
          } else if (action === "classes") {
            navigate("/classes");
          } else if (action === "groups") {
            navigate("/homework/student-groups");
          } else if (action === "exerciseBank") {
            navigate("/homework/exercise-bank");
          } else {
            navigate("/classes");
          }
        }}
      />
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
    <div className="flex min-h-full flex-col gap-5 px-5 py-6 xl:px-8">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-400">Trang chủ / <span className="text-slate-600">{activeLabel}</span></div>
            <h1 className="mt-3 text-xl font-semibold tracking-normal text-slate-950">{selectedClass?.className ?? "Lớp học"}</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">{selectedSchoolName} - {selectedClass?.studentCount ?? 0} học sinh</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">Xuất dữ liệu</Button>
            <Button>Thao tác nhanh</Button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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

function ClassStat({ icon: Icon, label, value }: { icon: typeof ClipboardList; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-[var(--erg-blue)] shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium text-slate-500">{label}</span>
        <span className="mt-1 block truncate text-base font-semibold text-slate-950">{value}</span>
      </span>
    </div>
  );
}

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
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            <TableHeader columns="grid-cols-[72px_minmax(280px,1.4fr)_150px_170px_170px_220px_160px_64px]" labels={["STT", "Tên bài", "Môn học", "Loại bài", "Đối tượng", "Thời gian làm bài", "Trạng thái", ""]} />
            <div className="divide-y divide-slate-100">
              {runs.map((assignment, index) => (
                <article key={assignment.id} className="grid grid-cols-[72px_minmax(280px,1.4fr)_150px_170px_170px_220px_160px_64px] items-center gap-3 px-4 py-4 text-sm transition hover:bg-slate-50/80">
                  <span className="font-semibold text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <button type="button" onClick={() => onViewProgress(assignment.id)} className="truncate text-left font-semibold text-[#1677d2] hover:text-[#0b5fb3]">{assignment.title}</button>
                    <p className="mt-1 text-xs font-semibold text-slate-400">Công bố điểm tự động</p>
                  </div>
                  <span className="font-semibold text-slate-700">{assignment.subjectLabel}</span>
                  <span className="text-slate-600">{index % 2 === 0 ? "Kiểm tra đầu vào" : "Luyện tập"}</span>
                  <span className="font-semibold text-slate-700">{selectedClass?.className ?? "Cả lớp"}</span>
                  <span className="leading-6 text-slate-600">21/05/2026 10:{50 + index}<br />28/05/2026 10:{50 + index}</span>
                  <Badge tone={index > 3 ? "danger" : "success"} className="justify-self-start">{index > 3 ? "Đã kết thúc" : "Đang diễn ra"}</Badge>
                  <button type="button" onClick={() => onViewProgress(assignment.id)} aria-label="Mở thao tác" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-sm">
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
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-[70px_260px_repeat(7,minmax(120px,1fr))] bg-[#50a8e8] text-sm font-semibold text-white">
          <div className="px-4 py-4">STT</div>
          <div className="px-4 py-4">Học sinh</div>
          {days.map((day) => <div key={day} className="whitespace-pre-line px-4 py-4 text-center">{day}</div>)}
        </div>
        {students.slice(0, 10).map((student, index) => (
          <div key={student.id} className="grid min-h-20 grid-cols-[70px_260px_repeat(7,minmax(120px,1fr))] border-t border-slate-100 text-sm">
            <div className="px-4 py-5 text-slate-500">{index + 1}</div>
            <div className="px-4 py-5 font-medium text-[var(--erg-blue)]">{student.name}</div>
            {days.map((day, dayIndex) => (
              <div key={day} className={cn("px-4 py-5 text-center font-medium", dayIndex === 6 && "bg-[var(--erg-blue-light)]")}>
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
  const [sessionFilter, setSessionFilter] = useState("Tat ca buoi");
  const attendanceColumns = [
    { id: "mon-am", day: "Thu Hai", date: "18/05", session: "Sang" },
    { id: "mon-pm", day: "Thu Hai", date: "18/05", session: "Chieu" },
    { id: "tue-am", day: "Thu Ba", date: "19/05", session: "Sang" },
    { id: "wed-am", day: "Thu Tu", date: "20/05", session: "Sang" },
    { id: "thu-am", day: "Thu Nam", date: "21/05", session: "Sang" },
    { id: "fri-am", day: "Thu Sau", date: "22/05", session: "Sang" },
    { id: "fri-pm", day: "Thu Sau", date: "22/05", session: "Chieu" },
    { id: "sat-am", day: "Thu Bay", date: "23/05", session: "Sang" },
  ];
  const filteredStudents = students.filter((student) => student.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));
  const visibleColumns = attendanceColumns.filter((column) => sessionFilter === "Tat ca buoi" || column.session === sessionFilter);

  function updateAttendance(studentId: string, columnId: string) {
    const key = `${studentId}:${columnId}`;
    setAttendanceOverrides((current) => ({
      ...current,
      [key]: nextAttendanceStatus(current[key] ?? ""),
    }));
  }

  return (
    <div className="flex min-h-full flex-col gap-2 px-2 py-2 xl:px-3">
      <section className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm shadow-slate-200/30">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="mr-auto min-w-[190px]">
            <div className="text-sm font-semibold leading-5 text-slate-950">{selectedClass?.className ?? "Lop hoc"}</div>
            <div className="text-[11px] font-semibold text-slate-500">
              {selectedSchoolName} · {students.length} hoc sinh · {visibleColumns.length} cot diem danh
            </div>
          </div>
          <div className="relative min-w-[220px] flex-1 xl:max-w-[340px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tim hoc sinh"
              className="h-8 border-slate-200 bg-slate-50 pl-8 text-xs shadow-none focus:bg-white"
            />
          </div>
          <AppSelect className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none">
            <option>Tuan 12 (18/05 - 24/05)</option>
            <option>Tuan 13 (25/05 - 31/05)</option>
          </AppSelect>
          <AppSelect
            value={sessionFilter}
            onChange={(event) => setSessionFilter(event.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none"
          >
            <option>Tat ca buoi</option>
            <option>Sang</option>
            <option>Chieu</option>
          </AppSelect>
            <Button variant="outline">Xuất dữ liệu</Button>
          <Button className="h-8 rounded-md bg-slate-950 px-2.5 text-xs font-semibold text-white">Luu diem danh</Button>
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-2.5 py-1.5">
          <h2 className="text-sm font-semibold text-slate-950">Bang diem danh theo tuan</h2>
          <div className="flex items-center gap-1.5 text-[10px] font-medium">
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">Co mat</span>
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">Di muon</span>
            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">Vang</span>
            <span className="rounded bg-[var(--erg-blue-light)] px-1.5 py-0.5 text-[var(--erg-blue)]">Co phep</span>
          </div>
        </div>
        <div className="max-h-[620px] overflow-auto">
          <table className="min-w-[1500px] border-separate border-spacing-0 text-[11px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500">
                <AttendanceHeaderCell className="sticky left-0 top-0 z-40 w-[44px]">STT</AttendanceHeaderCell>
                <AttendanceHeaderCell className="sticky left-[44px] top-0 z-40 w-[190px] text-left">Hoc sinh</AttendanceHeaderCell>
                <AttendanceHeaderCell className="sticky left-[234px] top-0 z-40 w-[66px]">Lop</AttendanceHeaderCell>
                <AttendanceHeaderCell className="sticky left-[300px] top-0 z-40 w-[76px]">Tong</AttendanceHeaderCell>
                {visibleColumns.map((column) => (
                  <AttendanceHeaderCell key={column.id} className="sticky top-0 z-30 w-[136px]">
                    <span className="block">{column.day}</span>
                    <span className="mt-0.5 block text-[10px] font-medium normal-case text-slate-500">{column.date} · {column.session}</span>
                  </AttendanceHeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                const summary = attendanceSummary(student.id, visibleColumns.map((column) => column.id), attendanceOverrides, index);
                return (
                  <tr key={student.id} className="group">
                    <AttendanceStickyCell className="left-0 z-20 w-[44px] text-center text-slate-500">{index + 1}</AttendanceStickyCell>
                    <AttendanceStickyCell className="left-[44px] z-20 w-[190px]">
                      <button type="button" className="max-w-[166px] truncate text-left font-medium text-[var(--erg-blue)] hover:underline">
                        {student.name}
                      </button>
                    </AttendanceStickyCell>
                    <AttendanceStickyCell className="left-[234px] z-20 w-[66px] text-center font-semibold text-slate-600">
                      {student.className.replace("Lớp ", "").replace("Lop ", "")}
                    </AttendanceStickyCell>
                    <AttendanceStickyCell className="left-[300px] z-20 w-[76px] text-center">
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", summary.absent ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")}>
                        {summary.present}/{summary.total}
                      </span>
                    </AttendanceStickyCell>
                    {visibleColumns.map((column, columnIndex) => {
                      const status = attendanceOverrides[`${student.id}:${column.id}`] ?? getMockAttendanceStatus(index, columnIndex);
                      return (
                        <td key={column.id} className={cn("h-7 border-b border-r border-slate-100 px-1 text-center group-hover:!bg-[var(--erg-blue-light)]", attendanceCellClass(status))}>
                          <button
                            type="button"
                            onClick={() => updateAttendance(student.id, column.id)}
                            className="h-6 w-full rounded text-[11px] font-semibold outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
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

function AttendanceHeaderCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn("h-8 border-b border-r border-slate-200 bg-[#f8fbff] px-1.5 text-center align-middle", className)}>
      {children}
    </th>
  );
}

function AttendanceStickyCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("sticky h-7 border-b border-r border-slate-100 bg-white px-1.5 align-middle group-hover:bg-[var(--erg-blue-light)]", className)}>
      {children}
    </td>
  );
}

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
  if (status === "excused") return "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]";
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
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[280px] flex-1 xl:max-w-[520px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder={primaryPlaceholder} className="border-slate-200 bg-slate-50 pl-10 shadow-none focus:bg-white" />
        </div>
        {filters.map((filter) => (
          <AppSelect key={filter} className="h-11 min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-[#b8d6fa] focus:ring-2 focus:ring-[var(--erg-blue-ring)]">
            <option>{filter}</option>
          </AppSelect>
        ))}
        <Button variant="outline">Đặt lại</Button>
        <Button className="ml-auto bg-[#06112f] hover:bg-[#111d42]" onClick={onAssign}>Giao bài</Button>
      </div>
    </div>
  );
}
function TableHeader({ columns, labels }: { columns: string; labels: string[] }) {
  return (
    <div className={cn("grid gap-3 border-b border-slate-200 bg-slate-50 px-4 py-4 text-xs font-semibold text-slate-500", columns)}>
      {labels.map((label) => <span key={label}>{label}</span>)}
    </div>
  );
}

function Metric({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="mt-3 text-xl font-semibold text-slate-950">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{detail}</div>
    </article>
  );
}

function getClassStudents(classId?: string) {
  return classroomStudents.filter((student) => !classId || student.classId === classId);
}

function OnlineTeacherAvatar({ avatarUrl, name }: { avatarUrl: string; name: string }) {
  return (
    <Avatar size="lg" className="size-11 overflow-visible rounded-full bg-slate-950 shadow-sm ring-2 ring-white">
      <AvatarImage src={avatarUrl} alt={name} />
      <AvatarFallback className="bg-slate-800 text-xs font-semibold text-white">
        {getInitials(name)}
      </AvatarFallback>
      <AvatarBadge className="size-3.5 border border-white bg-emerald-500 ring-2 ring-white" aria-label="Đang online" />
    </Avatar>
  );
}

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
