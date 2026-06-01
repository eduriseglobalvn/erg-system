import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
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
  UserRound,
  UsersRound,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge, Button, Input, ProgressBar } from "@/components/ui/dashboard-kit";
import { ERG_ASSETS } from "@/config/seo";
import { logoutAccount } from "@/features/auth/api/auth-storage";
import { useAuthSession } from "@/features/auth/hooks/use-auth-session";
import {
  assignmentRuns,
  classroomSchools,
  classroomSnapshots,
  classroomStudents,
  defaultClassId,
  defaultSchoolId,
} from "@/features/classroom/api/mock-classroom-data";
import type { ClassroomSnapshot, ClassroomStudent } from "@/features/classroom/types/classroom-types";
import { loadLmsDashboardBootstrap } from "@/features/lms/infrastructure/lms-dashboard-api";
import { AttendanceSheetPanel } from "@/features/lms/components/attendance-sheet-panel";
import { ScoreSheetPanel } from "@/features/lms/components/score-sheet-panel";
import { TeachingSchedulePanel } from "@/features/lms/components/teaching-schedule/teaching-schedule-panel";
import { WeeklyClassLogPage } from "@/features/weekly-class-log";
import {
  getCurrentAcademicYear,
  LearningResourceDashboardScopeProvider,
  LearningResourceLibraryPage,
} from "@/features/lms/learning-resources";
import { hasApiBase } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type LmsSection = "homework" | "score" | "attendance" | "schedule" | "classLog" | "students" | "resources" | "reports";

const lmsNavItems: Array<{ id: LmsSection; label: string; path: string; icon: typeof ClipboardList }> = [
  { id: "homework", label: "Giao bÃ i", path: "/homework", icon: ClipboardList },
  { id: "score", label: "Báº£ng Ä‘iá»ƒm", path: "/score", icon: GraduationCap },
  { id: "attendance", label: "Äiá»ƒm danh", path: "/attendance", icon: CalendarCheck },
  { id: "schedule", label: "Lá»‹ch giáº£ng dáº¡y", path: "/calendar", icon: CalendarDays },
  { id: "classLog", label: "Sá»• Ä‘áº§u bÃ i", path: "/class-log", icon: BookOpenCheck },
  { id: "students", label: "Há»c sinh", path: "/students", icon: UserRound },
  { id: "resources", label: "TÃ i nguyÃªn", path: "/resources", icon: BookOpen },
  { id: "reports", label: "BÃ¡o cÃ¡o", path: "/reports", icon: FileText },
];

function resolveSection(pathname: string): LmsSection {
  const matched = lmsNavItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  return matched?.id ?? "homework";
}

export function LmsTeacherShell() {
  const { actions, account } = useAuthSession("lms");
  const navigate = useNavigate();
  const location = useLocation();
  const apiBacked = hasApiBase();
  const activeSection = resolveSection(location.pathname);
  const [selectedSchoolId, setSelectedSchoolId] = useState(defaultSchoolId);
  const [selectedClassId, setSelectedClassId] = useState(defaultClassId);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
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
  const selectedClassOptions = useMemo(
    () => classes.filter((classroom) => classroom.schoolId === selectedSchoolId),
    [classes, selectedSchoolId],
  );
  const selectedClass = selectedClassOptions.find((classroom) => classroom.id === selectedClassId) ?? selectedClassOptions[0];
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId) ?? schools[0] ?? classroomSchools[0];
  const selectedSchoolName = selectedSchool?.name ?? "ERG";
  const activeNav = lmsNavItems.find((item) => item.id === activeSection) ?? lmsNavItems[0];
  const teacherName = account?.fullName || "LÃª Thá»‹ ThÃ¹y";
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
    if (!bootstrapQuery.data) return;

    const nextSchools = bootstrapQuery.data.schools.length ? bootstrapQuery.data.schools : classroomSchools;
    const nextClasses = bootstrapQuery.data.classes.length ? bootstrapQuery.data.classes : classroomSnapshots;
    const scope = bootstrapQuery.data.managementScope;
    const scopedSchoolId =
      scope.centerId && nextSchools.some((school) => school.id === scope.centerId)
        ? scope.centerId
        : nextSchools[0]?.id ?? defaultSchoolId;
    const classInScope =
      scope.level === "class"
        ? nextClasses.find((classroom) => classroom.id === scope.classId && classroom.schoolId === scopedSchoolId)
        : undefined;
    const firstClassInSchool = nextClasses.find((classroom) => classroom.schoolId === scopedSchoolId);

    setSelectedSchoolId(scopedSchoolId);
    setSelectedClassId(classInScope?.id ?? firstClassInSchool?.id ?? nextClasses[0]?.id ?? defaultClassId);
  }, [bootstrapQuery.data]);

  useEffect(() => {
    if (!selectedClass || selectedClass.schoolId === selectedSchoolId) return;

    const nextSchoolId = schools.some((school) => school.id === selectedClass.schoolId)
      ? selectedClass.schoolId
      : schools[0]?.id ?? defaultSchoolId;
    const firstClass = classes.find((classroom) => classroom.schoolId === nextSchoolId);
    setSelectedSchoolId(nextSchoolId);
    setSelectedClassId(firstClass?.id ?? classes[0]?.id ?? defaultClassId);
  }, [classes, schools, selectedClass, selectedSchoolId]);

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
    <div className="flex h-screen max-h-screen overflow-hidden bg-[#f5f7fb] text-slate-950">

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="flex h-[72px] items-center gap-5 px-5 xl:px-8">
            <button type="button" onClick={() => navigate("/homework")} className="flex shrink-0 items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white shadow-sm">
                <img src={ERG_ASSETS.logo} alt="ERG" className="h-8 w-auto object-contain" />
              </span>
              <span className="hidden text-sm font-black uppercase tracking-tight text-[#0b1f80] lg:block">LMS ERG</span>
            </button>

            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto xl:flex">
              {lmsNavItems.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-[#0b6fcf]",
                      active && "bg-blue-50 text-[#0b6fcf]",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-3">
              <select
                value={selectedSchoolId}
                onChange={(event) => selectSchool(event.target.value)}
                className="hidden h-11 max-w-[230px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm outline-none focus:border-blue-300 lg:block"
                aria-label="Chá»n trÆ°á»ng"
              >
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedClass?.id ?? ""}
                onChange={(event) => setSelectedClassId(event.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm outline-none focus:border-blue-300"
                aria-label="Chá»n lá»›p"
                disabled={!selectedClassOptions.length}
              >
                {selectedClassOptions.length ? (
                  selectedClassOptions.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.className}
                    </option>
                  ))
                ) : (
                  <option value="">ChÆ°a cÃ³ lá»›p</option>
                )}
              </select>
              <button type="button" aria-label="ThÃ´ng bÃ¡o" className="grid h-10 w-10 place-items-center rounded-full text-slate-500 hover:bg-slate-100">
                <Bell className="h-5 w-5" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-[#0b1f80] text-xs font-black text-white ring-2 ring-white transition hover:ring-blue-200"
                  aria-label="TÃ i khoáº£n giÃ¡o viÃªn"
                  aria-expanded={accountMenuOpen}
                >
                  {teacherAvatar ? <img src={teacherAvatar} alt={teacherName} className="h-full w-full object-cover" /> : getInitials(teacherName)}
                </button>
                {accountMenuOpen ? (
                  <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                      <Avatar className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[#0b1f80] text-xs font-black text-white">
                        {teacherAvatar ? <img src={teacherAvatar} alt={teacherName} className="h-full w-full object-cover" /> : getInitials(teacherName)}
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-950">{teacherName}</div>
                        <div className="truncate text-xs font-semibold text-slate-500">{teacherEmail}</div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button type="button" onClick={() => { setAccountMenuOpen(false); navigate("/account"); }} className="w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">
                        Quáº£n lÃ½ tÃ i khoáº£n
                      </button>
                      <button type="button" onClick={() => { setAccountMenuOpen(false); navigate("/account/login-logs"); }} className="w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50">
                        Lá»‹ch sá»­ Ä‘Äƒng nháº­p
                      </button>
                      <button type="button" onClick={signOut} className="w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-rose-600 hover:bg-rose-50">
                        ÄÄƒng xuáº¥t
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 xl:hidden">
            {lmsNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-2 text-sm font-bold",
                  activeSection === item.id ? "bg-blue-50 text-[#0b6fcf]" : "text-slate-600",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          {activeSection === "resources" ? (
            <LearningResourceDashboardScopeProvider value={learningResourceScope}>
              <LearningResourceLibraryPage />
            </LearningResourceDashboardScopeProvider>
          ) : activeSection === "schedule" ? (
            <div className="flex h-full min-h-[720px]">
              <TeachingSchedulePanel selectedClass={selectedClass} teacherName={teacherName} />
            </div>
          ) : activeSection === "classLog" ? (
            <WeeklyClassLogPage
              selectedClass={selectedClass}
              selectedSchoolName={selectedSchoolName}
              teacherName={teacherName}
            />
          ) : activeSection === "score" ? (
            <ScoreSheetPanel selectedClass={selectedClass} selectedSchoolName={selectedSchoolName} students={getClassStudents(selectedClass?.id)} />
          ) : activeSection === "attendance" ? (
            <AttendanceSheetPanel selectedClass={selectedClass} selectedSchoolName={selectedSchoolName} students={getClassStudents(selectedClass?.id)} />
          ) : (
            <TeacherWorkspaceFrame
              activeLabel={activeNav.label}
              selectedClass={selectedClass}
              selectedSchoolName={selectedSchoolName}
            >
              {activeSection === "homework" ? <HomeworkPanel selectedClass={selectedClass} /> : null}
              {activeSection === "students" ? <StudentsPanel selectedClass={selectedClass} /> : null}
              {activeSection === "reports" ? <ReportsPanel selectedClass={selectedClass} selectedSchoolName={selectedSchoolName} /> : null}
            </TeacherWorkspaceFrame>
          )}
        </main>
      </div>
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
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-400">Trang chá»§ / <span className="text-slate-600">{activeLabel}</span></div>
            <h1 className="mt-4 text-[34px] font-black uppercase tracking-tight text-slate-950">{selectedClass?.className ?? "Lá»›p há»c"}</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">{selectedSchoolName} Â· {selectedClass?.studentCount ?? 0} há»c sinh</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">Xuáº¥t dá»¯ liá»‡u</Button>
            <Button>Thao tÃ¡c nhanh</Button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ClassStat icon={ClipboardList} label="BÃ i Ä‘ang má»Ÿ" value={String(selectedClass?.activeAssignments ?? 0)} />
          <ClassStat icon={CheckCircle2} label="HoÃ n thÃ nh" value={`${selectedClass?.completionRate ?? 0}%`} />
          <ClassStat icon={UsersRound} label="Cáº§n há»— trá»£" value={String(selectedClass?.riskStudents ?? 0)} />
          <ClassStat icon={Clock3} label="Ná»™p gáº§n nháº¥t" value={selectedClass?.lastSubmissionAt ?? "-"} />
        </div>
      </div>
      {children}
    </div>
  );
}

function ClassStat({ icon: Icon, label, value }: { icon: typeof ClipboardList; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-[#0b6fcf] shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>
        <span className="mt-1 block truncate text-lg font-black text-slate-950">{value}</span>
      </span>
    </div>
  );
}

function HomeworkPanel({ selectedClass }: { selectedClass?: ClassroomSnapshot }) {
  return (
    <>
      <FilterBar primaryPlaceholder="TÃ¬m kiáº¿m theo tÃªn bÃ i" filters={["MÃ´n há»c", "Há»c ká»³", "Tráº¡ng thÃ¡i", "Loáº¡i bÃ i", "TÃ­nh Ä‘iá»ƒm", "Äá»‘i tÆ°á»£ng giao"]} />
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40">
        <div className="overflow-x-auto">
          <div className="min-w-[1180px]">
            <TableHeader columns="grid-cols-[72px_minmax(280px,1.4fr)_150px_170px_170px_220px_160px_64px]" labels={["STT", "TÃªn bÃ i", "MÃ´n há»c", "Loáº¡i bÃ i", "Äá»‘i tÆ°á»£ng", "Thá»i gian lÃ m bÃ i", "Tráº¡ng thÃ¡i", ""]} />
            <div className="divide-y divide-slate-100">
              {assignmentRuns.map((assignment, index) => (
                <article key={assignment.id} className="grid grid-cols-[72px_minmax(280px,1.4fr)_150px_170px_170px_220px_160px_64px] items-center gap-3 px-4 py-4 text-sm transition hover:bg-slate-50/80">
                  <span className="font-semibold text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <button type="button" className="truncate text-left font-black text-[#1677d2] hover:text-[#0b5fb3]">{assignment.title}</button>
                    <p className="mt-1 text-xs font-semibold text-slate-400">CÃ´ng bá»‘ Ä‘iá»ƒm tá»± Ä‘á»™ng</p>
                  </div>
                  <span className="font-semibold text-slate-700">{assignment.subjectLabel}</span>
                  <span className="text-slate-600">{index % 2 === 0 ? "Kiá»ƒm tra Ä‘áº§u vÃ o" : "Luyá»‡n táº­p"}</span>
                  <span className="font-semibold text-slate-700">{selectedClass?.className ?? "Cáº£ lá»›p"}</span>
                  <span className="leading-6 text-slate-600">21/05/2026 10:{50 + index}<br />28/05/2026 10:{50 + index}</span>
                  <Badge tone={index > 3 ? "danger" : "success"} className="justify-self-start">{index > 3 ? "ÄÃ£ káº¿t thÃºc" : "Äang diá»…n ra"}</Badge>
                  <button type="button" aria-label="Má»Ÿ thao tÃ¡c" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-sm">
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
  const days = ["Thá»© Hai\n18/05/2026", "Thá»© Ba\n19/05/2026", "Thá»© TÆ°\n20/05/2026", "Thá»© NÄƒm\n21/05/2026", "Thá»© SÃ¡u\n22/05/2026", "Thá»© Báº£y\n23/05/2026", "Chá»§ Nháº­t\n24/05/2026"];
  return (
    <section className="space-y-5">
      <div className="flex justify-end gap-2">
        <Button variant="outline">â€¹</Button>
        <Button variant="outline">Tuáº§n 12 (18/05 - 24/05)</Button>
        <Button variant="outline">â€º</Button>
        <Button>Tuáº§n nÃ y</Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[70px_260px_repeat(7,minmax(120px,1fr))] bg-[#50a8e8] text-sm font-black text-white">
          <div className="px-4 py-4">STT</div>
          <div className="px-4 py-4">Há»c sinh</div>
          {days.map((day) => <div key={day} className="whitespace-pre-line px-4 py-4 text-center">{day}</div>)}
        </div>
        {students.slice(0, 10).map((student, index) => (
          <div key={student.id} className="grid min-h-20 grid-cols-[70px_260px_repeat(7,minmax(120px,1fr))] border-t border-slate-100 text-sm">
            <div className="px-4 py-5 text-slate-500">{index + 1}</div>
            <div className="px-4 py-5 font-bold text-[#3d9df0]">{student.name}</div>
            {days.map((day, dayIndex) => (
              <div key={day} className={cn("px-4 py-5 text-center font-bold", dayIndex === 6 && "bg-sky-100")}>
                {dayIndex > 0 && dayIndex < 5 ? <span className={dayIndex === 2 && index === 1 ? "text-rose-600" : "text-emerald-600"}>â—</span> : null}{" "}
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
            <div className="text-sm font-black uppercase leading-5 text-slate-950">{selectedClass?.className ?? "Lop hoc"}</div>
            <div className="text-[11px] font-semibold text-slate-500">
              {selectedSchoolName} Â· {students.length} hoc sinh Â· {visibleColumns.length} cot diem danh
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
          <select className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none">
            <option>Tuan 12 (18/05 - 24/05)</option>
            <option>Tuan 13 (25/05 - 31/05)</option>
          </select>
          <select
            value={sessionFilter}
            onChange={(event) => setSessionFilter(event.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none"
          >
            <option>Tat ca buoi</option>
            <option>Sang</option>
            <option>Chieu</option>
          </select>
          <Button variant="outline" className="h-8 rounded-md px-2.5 text-xs">Xuat Excel</Button>
          <Button className="h-8 rounded-md bg-slate-950 px-2.5 text-xs font-black text-white">Luu diem danh</Button>
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-2.5 py-1.5">
          <h2 className="text-sm font-black text-slate-950">Bang diem danh theo tuan</h2>
          <div className="flex items-center gap-1.5 text-[10px] font-bold">
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">Co mat</span>
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">Di muon</span>
            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-rose-700">Vang</span>
            <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700">Co phep</span>
          </div>
        </div>
        <div className="max-h-[620px] overflow-auto">
          <table className="min-w-[1500px] border-separate border-spacing-0 text-[11px]">
            <thead>
              <tr className="bg-[#f8fbff] text-[10px] font-black uppercase text-[#1d4ed8]">
                <AttendanceHeaderCell className="sticky left-0 top-0 z-40 w-[44px]">STT</AttendanceHeaderCell>
                <AttendanceHeaderCell className="sticky left-[44px] top-0 z-40 w-[190px] text-left">Hoc sinh</AttendanceHeaderCell>
                <AttendanceHeaderCell className="sticky left-[234px] top-0 z-40 w-[66px]">Lop</AttendanceHeaderCell>
                <AttendanceHeaderCell className="sticky left-[300px] top-0 z-40 w-[76px]">Tong</AttendanceHeaderCell>
                {visibleColumns.map((column) => (
                  <AttendanceHeaderCell key={column.id} className="sticky top-0 z-30 w-[136px]">
                    <span className="block">{column.day}</span>
                    <span className="mt-0.5 block text-[10px] font-bold normal-case text-slate-500">{column.date} Â· {column.session}</span>
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
                      <button type="button" className="max-w-[166px] truncate text-left font-bold text-[#2563eb] hover:underline">
                        {student.name}
                      </button>
                    </AttendanceStickyCell>
                    <AttendanceStickyCell className="left-[234px] z-20 w-[66px] text-center font-semibold text-slate-600">
                      {student.className.replace("LÃ¡Â»â€ºp ", "").replace("Lop ", "")}
                    </AttendanceStickyCell>
                    <AttendanceStickyCell className="left-[300px] z-20 w-[76px] text-center">
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-black", summary.absent ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700")}>
                        {summary.present}/{summary.total}
                      </span>
                    </AttendanceStickyCell>
                    {visibleColumns.map((column, columnIndex) => {
                      const status = attendanceOverrides[`${student.id}:${column.id}`] ?? getMockAttendanceStatus(index, columnIndex);
                      return (
                        <td key={column.id} className={cn("h-7 border-b border-r border-blue-100 px-1 text-center group-hover:!bg-blue-50", attendanceCellClass(status))}>
                          <button
                            type="button"
                            onClick={() => updateAttendance(student.id, column.id)}
                            className="h-6 w-full rounded text-[11px] font-black outline-none focus:ring-2 focus:ring-blue-200"
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
    <th className={cn("h-8 border-b border-r border-blue-200 bg-[#f8fbff] px-1.5 text-center align-middle", className)}>
      {children}
    </th>
  );
}

function AttendanceStickyCell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("sticky h-7 border-b border-r border-blue-100 bg-white px-1.5 align-middle group-hover:bg-blue-50", className)}>
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
  return "âœ“";
}

function attendanceCellClass(status: AttendanceStatus) {
  if (status === "absent") return "bg-rose-50 text-rose-700";
  if (status === "late") return "bg-amber-50 text-amber-700";
  if (status === "excused") return "bg-sky-50 text-sky-700";
  return "bg-emerald-50 text-emerald-700";
}

function attendanceSummary(studentId: string, columnIds: string[], overrides: Record<string, AttendanceStatus>, studentIndex: number) {
  const statuses = columnIds.map((columnId, columnIndex) => overrides[`${studentId}:${columnId}`] ?? getMockAttendanceStatus(studentIndex, columnIndex));
  const absent = statuses.filter((status) => status === "absent").length;
  const present = statuses.filter((status) => status === "present" || status === "late").length;
  return { absent, present, total: statuses.length };
}

void AttendancePanel;

function StudentsPanel({ selectedClass }: { selectedClass?: ClassroomSnapshot }) {
  const students = getClassStudents(selectedClass?.id);
  return (
    <>
      <FilterBar primaryPlaceholder="TÃ¬m há»c sinh" filters={["Tráº¡ng thÃ¡i", "Tiáº¿n Ä‘á»™", "Äiá»ƒm trung bÃ¬nh"]} />
      <section className="grid gap-4 xl:grid-cols-3">
        {students.slice(0, 12).map((student) => (
          <article key={student.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <Avatar className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-sm font-black text-[#0b6fcf]">{student.avatarSeed}</Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-slate-950">{student.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{student.currentAssignment}</p>
              </div>
              <Badge tone={student.status === "support" ? "warning" : student.status === "ahead" ? "success" : "secondary"}>{student.status}</Badge>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm font-bold">
              <span className="text-slate-500">Tiáº¿n Ä‘á»™</span>
              <span>{student.progressRate}%</span>
            </div>
            <ProgressBar value={student.progressRate} className="mt-2 h-2" />
            <p className="mt-4 text-sm leading-6 text-slate-500">{student.mentorNote}</p>
          </article>
        ))}
      </section>
    </>
  );
}

function ReportsPanel({ selectedClass, selectedSchoolName }: { selectedClass?: ClassroomSnapshot; selectedSchoolName: string }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Metric label="TrÆ°á»ng" value={selectedSchoolName} detail="Pháº¡m vi Ä‘ang xem" />
      <Metric label="Lá»›p" value={selectedClass?.className ?? "-"} detail={`${selectedClass?.studentCount ?? 0} há»c sinh`} />
      <Metric label="HoÃ n thÃ nh" value={`${selectedClass?.completionRate ?? 0}%`} detail="Trung bÃ¬nh bÃ i Ä‘ang má»Ÿ" />
      <Metric label="Cáº§n há»— trá»£" value={String(selectedClass?.riskStudents ?? 0)} detail="Há»c sinh cáº§n theo sÃ¡t" />
    </section>
  );
}

function FilterBar({ filters, primaryPlaceholder }: { filters: string[]; primaryPlaceholder: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/40">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[280px] flex-1 xl:max-w-[520px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder={primaryPlaceholder} className="border-slate-200 bg-slate-50 pl-10 shadow-none focus:bg-white" />
        </div>
        {filters.map((filter) => (
          <select key={filter} className="h-11 min-w-[150px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-2 focus:ring-blue-100">
            <option>{filter}</option>
          </select>
        ))}
        <Button variant="outline">Äáº·t láº¡i</Button>
        <Button className="ml-auto bg-[#06112f] hover:bg-[#111d42]">Giao bÃ i</Button>
      </div>
    </div>
  );
}

function TableHeader({ columns, labels }: { columns: string; labels: string[] }) {
  return (
    <div className={cn("grid gap-3 border-b border-slate-200 bg-[#eef6ff] px-4 py-4 text-xs font-black uppercase tracking-[0.08em] text-[#1d5f99]", columns)}>
      {labels.map((label) => <span key={label}>{label}</span>)}
    </div>
  );
}

function Metric({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{detail}</div>
    </article>
  );
}

function getClassStudents(classId?: string) {
  return classroomStudents.filter((student) => !classId || student.classId === classId);
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
