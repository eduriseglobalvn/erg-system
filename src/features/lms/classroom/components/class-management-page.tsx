import { useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/dashboard-kit";
import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { assignmentGroups } from "@/features/lms/components/assign-homework-groups";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { StudentProfileDetailDrawer, type StudentProfileDetailDraft } from "./student-profile-detail-drawer";
import { AppSelect } from "@/components/ui/app-select";

type Classification = "A" | "B" | "C" | "D" | "E";
type ProgressFilter = "all" | "not-started" | "in-progress" | "completed";
type ScopeMode = "class" | "grade" | "group";

type ClassManagementPageProps = {
  classes: ClassroomSnapshot[];
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  students: ClassroomStudent[];
};

const classificationOptions: Classification[] = ["A", "B", "C", "D", "E"];
const classificationFilterOptions: Array<Classification | "all"> = ["all", ...classificationOptions];
const progressOptions: Array<{ label: string; value: ProgressFilter }> = [
  { label: "Tất cả tiến độ", value: "all" },
  { label: "Chưa mở bài", value: "not-started" },
  { label: "Đang làm", value: "in-progress" },
  { label: "Hoàn thành", value: "completed" },
];
const scopeModeOptions: Array<{ label: string; value: ScopeMode }> = [
  { label: "Theo lớp", value: "class" },
  { label: "Theo khối", value: "grade" },
  { label: "Theo nhóm", value: "group" },
];

export function ClassManagementPage({ classes, selectedClass, selectedSchoolName, students }: ClassManagementPageProps) {
  const [scopeMode, setScopeMode] = useState<ScopeMode>("class");
  const [scopeId, setScopeId] = useState(selectedClass?.id ?? classes[0]?.id ?? "");
  const [searchValue, setSearchValue] = useState("");
  const [classificationFilter, setClassificationFilter] = useState<Classification | "all">("all");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [studentDrafts, setStudentDrafts] = useState<Record<string, StudentProfileDetailDraft>>({});
  const [manualClassifications, setManualClassifications] = useState<Record<string, Classification>>({});
  const debouncedSearchValue = useDebouncedValue(searchValue);

  const schoolClasses = useMemo(() => classes.filter((classroom) => !selectedClass || classroom.schoolId === selectedClass.schoolId), [classes, selectedClass]);
  const gradeLabels = useMemo(() => Array.from(new Set(schoolClasses.map((classroom) => classroom.gradeLabel))), [schoolClasses]);
  const scopeOptions = useMemo(() => {
    if (scopeMode === "grade") {
      return gradeLabels.map((grade) => ({ label: grade, value: grade }));
    }
    if (scopeMode === "group") {
      return assignmentGroups.map((group) => ({ label: group.name, value: group.id }));
    }
    return schoolClasses.map((classroom) => ({ label: classroom.className, value: classroom.id }));
  }, [gradeLabels, schoolClasses, scopeMode]);
  const resolvedScopeId = scopeOptions.some((option) => option.value === scopeId) ? scopeId : scopeOptions[0]?.value ?? "";
  const scopeStudents = useMemo(() => {
    if (scopeMode === "grade") {
      const classIds = new Set(schoolClasses.filter((classroom) => classroom.gradeLabel === resolvedScopeId).map((classroom) => classroom.id));
      return students.filter((student) => classIds.has(student.classId));
    }
    if (scopeMode === "group") {
      const group = assignmentGroups.find((item) => item.id === resolvedScopeId);
      const studentIds = new Set(group?.studentIds ?? []);
      return students.filter((student) => studentIds.has(student.id));
    }
    return students.filter((student) => student.classId === resolvedScopeId);
  }, [resolvedScopeId, schoolClasses, scopeMode, students]);

  const visibleStudents = useMemo(() => {
    const keyword = debouncedSearchValue.trim().toLowerCase();

    return scopeStudents.filter((student) => {
      const classification = getStudentClassification(student, manualClassifications);
      const matchesKeyword =
        !keyword ||
        `${student.name} ${student.className} ${student.currentAssignment} ${student.currentStage} ${student.mentorNote}`.toLowerCase().includes(keyword);
      const matchesClassification = classificationFilter === "all" || classification === classificationFilter;
      const matchesProgress =
        progressFilter === "all" ||
        (progressFilter === "not-started" && student.progressRate === 0) ||
        (progressFilter === "in-progress" && student.progressRate > 0 && student.progressRate < 100) ||
        (progressFilter === "completed" && student.progressRate === 100);

      return matchesKeyword && matchesClassification && matchesProgress;
    });
  }, [classificationFilter, debouncedSearchValue, manualClassifications, progressFilter, scopeStudents]);

  const detailStudent = students.find((student) => student.id === detailStudentId) ?? null;
  const scopeLabel = scopeOptions.find((option) => option.value === resolvedScopeId)?.label ?? selectedClass?.className ?? "Lớp học";

  function openStudentDetail(student: ClassroomStudent) {
    setDetailStudentId(student.id);
    setStudentDrafts((current) => ({
      ...current,
      [student.id]: current[student.id] ?? createStudentProfileDraft(student),
    }));
  }

  function updateStudentDraft(studentId: string, patch: Partial<StudentProfileDetailDraft>) {
    const student = students.find((item) => item.id === studentId);
    if (!student) return;
    setStudentDrafts((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] ?? createStudentProfileDraft(student)), ...patch },
    }));
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-2 bg-[#f8fafc] p-2 xl:p-3">
      <div className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm shadow-slate-200/30">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="mr-auto min-w-[220px]">
            <div className="text-sm font-semibold leading-5 text-slate-950">{scopeLabel}</div>
            <div className="text-[11px] font-semibold text-slate-500">
              {selectedSchoolName} · {visibleStudents.length}/{scopeStudents.length} học sinh
            </div>
          </div>
          <AppSelect
            aria-label="Kiểu xem"
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-[#b8d6fa] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
            value={scopeMode}
            onChange={(event) => {
              setScopeMode(event.target.value as ScopeMode);
              setScopeId("");
            }}
          >
            {scopeModeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AppSelect>
          <AppSelect
            aria-label="Phạm vi"
            className="h-8 max-w-[220px] rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-[#b8d6fa] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
            value={resolvedScopeId}
            onChange={(event) => setScopeId(event.target.value)}
          >
            {scopeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AppSelect>
          <div className="relative min-w-[220px] flex-1 xl:max-w-[340px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-8 rounded-md border-slate-200 bg-slate-50 pl-8 text-xs font-normal shadow-none focus:bg-white"
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Tìm học sinh"
              value={searchValue}
            />
          </div>
          <AppSelect
            aria-label="Lọc xếp loại"
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-[#b8d6fa] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
            value={classificationFilter}
            onChange={(event) => setClassificationFilter(event.target.value as Classification | "all")}
          >
            {classificationFilterOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "Tất cả xếp loại" : `Xếp loại ${option}`}
              </option>
            ))}
          </AppSelect>
          <AppSelect
            aria-label="Lọc tiến độ"
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-[#b8d6fa] focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
            value={progressFilter}
            onChange={(event) => setProgressFilter(event.target.value as ProgressFilter)}
          >
            {progressOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </AppSelect>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-2.5 py-1.5">
          <h2 className="text-sm font-semibold text-slate-950">Bảng theo dõi học sinh</h2>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">Hoàn thành</span>
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">Cần hỗ trợ</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">Theo lớp / khối / nhóm</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1120px] table-fixed border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500">
                <TableHeaderCell className="sticky left-0 top-0 z-40 w-[44px]">STT</TableHeaderCell>
                <TableHeaderCell className="sticky left-[44px] top-0 z-40 w-[210px] text-left">Học sinh</TableHeaderCell>
                <TableHeaderCell className="sticky left-[254px] top-0 z-40 w-[96px]">Lớp</TableHeaderCell>
                <TableHeaderCell className="sticky left-[350px] top-0 z-40 w-[112px]">
                  <span className="mx-auto block h-7 rounded border border-slate-200 bg-white px-2 py-1.5 text-center text-[10px] font-semibold text-slate-700 shadow-sm">
                    Xếp loại
                  </span>
                </TableHeaderCell>
                <TableHeaderCell className="sticky top-0 z-30 w-[280px] text-left">Bài đang làm</TableHeaderCell>
                <TableHeaderCell className="sticky top-0 z-30 w-[150px]">Tiến độ</TableHeaderCell>
                <TableHeaderCell className="sticky top-0 z-30 w-[90px]">Điểm TB</TableHeaderCell>
                <TableHeaderCell className="sticky top-0 z-30 w-[130px]">Trạng thái</TableHeaderCell>
                <TableHeaderCell className="sticky top-0 z-30 w-[100px]">Đã xong</TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {visibleStudents.map((student, index) => {
                const classification = getStudentClassification(student, manualClassifications);
                const status = student.status;
                return (
                  <tr key={student.id} className="group">
                    <StickyCell className="left-0 z-20 w-[44px] text-center text-slate-500">{index + 1}</StickyCell>
                    <StickyCell className="left-[44px] z-20 w-[210px]">
                      <button
                        type="button"
                        className="max-w-[188px] truncate text-left font-medium text-[var(--erg-blue)] hover:underline"
                        onClick={() => openStudentDetail(student)}
                      >
                        {studentDrafts[student.id]?.name ?? student.name}
                      </button>
                    </StickyCell>
                    <StickyCell className="left-[254px] z-20 w-[96px] text-center font-medium text-slate-600">
                      {student.className}
                    </StickyCell>
                    <StickyCell className="left-[350px] z-20 w-[112px]">
                      <AppSelect
                        data-classification-select="true"
                        data-classification={classification}
                        value={classification}
                        onChange={(event) => setManualClassifications((current) => ({ ...current, [student.id]: event.target.value as Classification }))}
                        className={cn("h-7 w-full rounded-md border text-center text-xs font-medium outline-none", classificationClass(classification))}
                        style={{ textAlignLast: "center" }}
                      >
                        {classificationOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </AppSelect>
                    </StickyCell>
                    <TableCell className="w-[280px] text-left">
                      <div className="truncate font-medium text-slate-800">{student.currentAssignment}</div>
                      <div className="mt-0.5 truncate text-[10px] font-semibold text-slate-400">{student.currentStage}</div>
                    </TableCell>
                    <TableCell className="w-[150px]">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-md bg-slate-100">
                          <div className={cn("h-full rounded-full", progressColor(student.progressRate))} style={{ width: `${student.progressRate}%` }} />
                        </div>
                        <span className="w-8 text-right font-semibold text-slate-600">{student.progressRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn("w-[90px] font-semibold", scoreTone(student.averageScore))}>{student.averageScore}</TableCell>
                    <TableCell className="w-[130px]">
                      <span className={cn("inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium", statusClass(status))}>{statusLabel(status)}</span>
                    </TableCell>
                    <TableCell className="w-[100px] font-medium text-slate-600">{student.completedAssignments} bài</TableCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {detailStudent ? (
        <StudentProfileDetailDrawer
          draft={studentDrafts[detailStudent.id] ?? createStudentProfileDraft(detailStudent)}
          onClose={() => setDetailStudentId(null)}
          onUpdate={(patch) => updateStudentDraft(detailStudent.id, patch)}
          student={detailStudent}
        />
      ) : null}
    </section>
  );
}

function TableHeaderCell({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("h-9 border-b border-r border-slate-200 bg-slate-50 px-2 text-center align-middle", className)}>{children}</th>;
}

function StickyCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("sticky h-9 border-b border-r border-slate-100 bg-white px-2 align-middle group-hover:bg-slate-50", className)}>{children}</td>;
}

function TableCell({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("h-9 border-b border-r border-slate-100 px-2 text-center align-middle font-normal group-hover:bg-slate-50", className)}>{children}</td>;
}

function getStudentClassification(student: ClassroomStudent, manual: Record<string, Classification>): Classification {
  if (manual[student.id]) return manual[student.id];
  if (student.averageScore >= 90) return "A";
  if (student.averageScore >= 80) return "B";
  if (student.averageScore >= 70) return "C";
  if (student.averageScore >= 60) return student.status === "support" ? "E" : "D";
  return "E";
}

function classificationClass(classification: Classification) {
  if (classification === "A") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (classification === "B") return "border-sky-200 bg-sky-50 text-[var(--erg-blue)]";
  if (classification === "C") return "border-slate-200 bg-slate-50 text-slate-600";
  if (classification === "D") return "border-amber-200 bg-amber-50 text-amber-700";
  if (classification === "E") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function progressColor(progress: number) {
  if (progress >= 80) return "bg-emerald-500";
  if (progress >= 50) return "bg-[var(--erg-blue)]";
  if (progress > 0) return "bg-amber-500";
  return "bg-slate-300";
}

function scoreTone(score: number) {
  if (score >= 85) return "bg-emerald-50 text-emerald-700";
  if (score < 60) return "bg-rose-50 text-rose-700";
  return "text-slate-800";
}

function statusLabel(status: ClassroomStudent["status"]) {
  if (status === "ahead") return "Bứt tốc";
  if (status === "support") return "Cần hỗ trợ";
  return "Ổn định";
}

function statusClass(status: ClassroomStudent["status"]) {
  if (status === "ahead") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "support") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-[var(--erg-blue-light)] text-[var(--erg-blue)]";
}

function createStudentProfileDraft(student: ClassroomStudent) {
  const baseUsername = removeVietnameseMarks(student.name).toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
  return {
    name: student.name,
    username: baseUsername || student.id,
    password: `${student.avatarSeed.toLowerCase()}@2026`,
    note: student.mentorNote,
  };
}

function removeVietnameseMarks(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}
