import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Search } from "lucide-react";

import {
  DashboardPageShell,
  DashboardSectionCard,
} from "@/components/dashboard/dashboard-page-shell";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {
  assignmentRuns,
  classroomSnapshots,
  classroomSchools,
  classroomStudents,
  getSchoolSnapshots,
} from "@/features/lms/classroom/api/mock-classroom-data";
import {
  loadLmsClassWorkspace,
  mapClassWorkspaceToStudents,
  type LmsClassWorkspace,
} from "@/features/lms/api/lms-graphql-api";
import { lmsAssignmentReadQueryKeys } from "@/features/lms/api/lms-assignment-command-query";
import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import { hasApiBase } from "@/lib/api-client";
import { useI18n } from "@/platform/i18n";
import {
  AssignmentDialog,
  SelectControl,
  SelectionBar,
  StudentDataTable,
  StudentDetailCard,
} from "./class-students-workspace.parts";
import { StudentProfileDetailDrawer, type StudentProfileDetailDraft } from "./student-profile-detail-drawer";
import { assignmentCatalog, assignmentSubjects } from "./class-students-workspace.constants";
import { enCopy, viCopy } from "./class-students-workspace.copy";
import type { DeliveryBatch, ProgressFilter, StatusFilter } from "./class-students-workspace.types";
import {
  formatDueDate,
  formatSelectedAssignmentsTitle,
  getInitialBatches,
  getStudentAssignmentSubject,
} from "./class-students-workspace.utils";

export function resolveClassStudentsWorkspaceStudents(
  workspaceStudents: ClassroomStudent[],
  fallbackStudents: ClassroomStudent[],
  apiBacked: boolean,
): ClassroomStudent[] {
  if (apiBacked) return workspaceStudents;
  return workspaceStudents.length ? workspaceStudents : fallbackStudents;
}

export function ClassStudentsWorkspace({
  activeLeaf,
  onOpenLeaf,
  selectedClassId,
  selectedSchoolId,
}: {
  activeLeaf: DashboardLeaf;
  onOpenLeaf: (leafId: string) => void;
  selectedClassId: string;
  selectedSchoolId: string;
}) {
  const { locale } = useI18n();
  const copy = locale === "vi" ? viCopy : enCopy;
  const [subject, setSubject] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const [searchValue, setSearchValue] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [focusedStudentId, setFocusedStudentId] = useState<string | null>(null);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [studentDrafts, setStudentDrafts] = useState<Record<string, StudentProfileDetailDraft>>({});
  const [studentStatusDrafts, setStudentStatusDrafts] = useState<Record<string, "ahead" | "steady" | "support">>({});
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(assignmentSubjects[0]?.id ?? "");
  const [selectedLevelId, setSelectedLevelId] = useState(assignmentSubjects[0]?.levels[0]?.id ?? "");
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>(
    assignmentCatalog[0]?.id ? [assignmentCatalog[0].id] : [],
  );
  const [dueDate, setDueDate] = useState("2026-04-30T20:30");
  const [teacherNote, setTeacherNote] = useState("");
  const [recentBatches, setRecentBatches] = useState<DeliveryBatch[]>([]);
  const debouncedSearchValue = useDebouncedValue(searchValue);
  const paceStateUpdate = usePacedStateBatch();
  const apiBacked = hasApiBase();
  const classWorkspaceQuery = useQuery({
    queryKey: lmsAssignmentReadQueryKeys.classWorkspace({
      classId: selectedClassId,
      schoolId: selectedSchoolId,
      usage: "class-students-workspace",
    }),
    queryFn: () =>
      loadLmsClassWorkspace({
        assignmentPage: 0,
        assignmentSize: 50,
        assignmentStatus: "active",
        classId: selectedClassId,
        page: 0,
        schoolId: selectedSchoolId,
        size: 50,
        studentStatus: "active",
      }),
    enabled: apiBacked && Boolean(selectedClassId),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const fallbackSelectedClass =
    classroomSnapshots.find((snapshot) => snapshot.id === selectedClassId && snapshot.schoolId === selectedSchoolId) ??
    getSchoolSnapshots(selectedSchoolId)[0];
  const selectedClass = useMemo(
    () =>
      classWorkspaceQuery.data
        ? mapClassWorkspaceToSnapshot(classWorkspaceQuery.data, fallbackSelectedClass, selectedSchoolId)
        : fallbackSelectedClass,
    [classWorkspaceQuery.data, fallbackSelectedClass, selectedSchoolId],
  );
  const school = classroomSchools.find((item) => item.id === selectedSchoolId) ?? classroomSchools[0];
  const subjectOptions = useMemo(
    () => Array.from(new Set([...assignmentRuns, ...assignmentCatalog].map((assignment) => assignment.subjectLabel))),
    [],
  );
  const fallbackSchoolStudents = useMemo(
    () => classroomStudents.filter((student) => student.schoolId === selectedSchoolId),
    [selectedSchoolId],
  );
  const workspaceStudents = useMemo(
    () => (classWorkspaceQuery.data ? mapClassWorkspaceToStudents(classWorkspaceQuery.data, selectedClass) : []),
    [classWorkspaceQuery.data, selectedClass],
  );
  const schoolStudents = useMemo(
    () => resolveClassStudentsWorkspaceStudents(workspaceStudents, fallbackSchoolStudents, apiBacked),
    [apiBacked, fallbackSchoolStudents, workspaceStudents],
  );

  const visibleStudents = useMemo(() => {
    const keyword = debouncedSearchValue.trim().toLowerCase();

    return schoolStudents.filter((student) => {
      const currentAssignmentSubject = getStudentAssignmentSubject(student);
      const matchesClass = !selectedClass || student.classId === selectedClass.id;
      const matchesSubject = subject === "all" || currentAssignmentSubject === subject;
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;
      const matchesProgress =
        progressFilter === "all" ||
        (progressFilter === "not-started" && student.progressRate === 0) ||
        (progressFilter === "in-progress" && student.progressRate > 0 && student.progressRate < 100) ||
        (progressFilter === "completed" && student.progressRate === 100);
      const haystack =
        `${student.name} ${student.className} ${student.currentAssignment} ${student.currentStage} ${student.mentorNote}`.toLowerCase();
      const matchesKeyword = !keyword || haystack.includes(keyword);

      return matchesClass && matchesSubject && matchesStatus && matchesProgress && matchesKeyword;
    });
  }, [debouncedSearchValue, progressFilter, schoolStudents, selectedClass, statusFilter, subject]);

  const visibleStudentIds = visibleStudents.map((student) => student.id);
  const selectedVisibleIds = selectedStudentIds.filter((id) => visibleStudentIds.includes(id));
  const selectedStudents = visibleStudents.filter((student) => selectedVisibleIds.includes(student.id));
  const focusedStudent =
    visibleStudents.find((student) => student.id === focusedStudentId) ?? selectedStudents[0] ?? visibleStudents[0] ?? null;
  const detailStudent = schoolStudents.find((student) => student.id === detailStudentId) ?? null;
  const supportCount = visibleStudents.filter((student) => student.status === "support").length;
  const allVisibleSelected = visibleStudents.length > 0 && selectedVisibleIds.length === visibleStudents.length;
  const selectedSubject = assignmentSubjects.find((subjectItem) => subjectItem.id === selectedSubjectId) ?? assignmentSubjects[0];
  const selectedLevel = selectedSubject?.levels.find((level) => level.id === selectedLevelId) ?? selectedSubject?.levels[0];
  const levelAssignments = selectedLevel?.topics.flatMap((topic) => topic.items) ?? [];
  const selectedAssignments = levelAssignments.filter((assignment) => selectedAssignmentIds.includes(assignment.id));
  const canDeliver = selectedStudents.length > 0 && selectedAssignments.length > 0 && Boolean(dueDate);

  useEffect(() => {
    paceStateUpdate(() => setFocusedStudentId(null));
  }, [debouncedSearchValue, paceStateUpdate, progressFilter, selectedClass?.id, statusFilter, subject]);

  useEffect(() => {
    if (selectedVisibleIds.length === 0) {
      paceStateUpdate(() => setAssignDialogOpen(false));
    }
  }, [paceStateUpdate, selectedVisibleIds.length]);

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) =>
      current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId],
    );
  }

  function openStudentDetail(studentId: string) {
    const student = schoolStudents.find((item) => item.id === studentId);
    if (!student) return;
    setFocusedStudentId(studentId);
    setDetailStudentId(studentId);
    setStudentDrafts((current) => ({
      ...current,
      [studentId]: current[studentId] ?? createStudentProfileDraft(student),
    }));
    setStudentStatusDrafts((current) => ({
      ...current,
      [studentId]: current[studentId] ?? student.status,
    }));
  }

  function updateStudentDraft(studentId: string, patch: Partial<StudentProfileDetailDraft>) {
    const student = schoolStudents.find((item) => item.id === studentId);
    if (!student) return;
    setStudentDrafts((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] ?? createStudentProfileDraft(student)), ...patch },
    }));
  }

  function toggleVisibleStudents() {
    if (allVisibleSelected) {
      setSelectedStudentIds((current) => current.filter((id) => !visibleStudentIds.includes(id)));
      return;
    }

    setSelectedStudentIds((current) => Array.from(new Set([...current, ...visibleStudentIds])));
  }

  function selectSupportStudents() {
    setSelectedStudentIds(visibleStudents.filter((student) => student.status === "support").map((student) => student.id));
  }

  function pickSubject(subjectId: string) {
    const nextSubject = assignmentSubjects.find((subjectItem) => subjectItem.id === subjectId) ?? assignmentSubjects[0];
    const nextLevel = nextSubject?.levels[0];
    const nextAssignment = nextLevel?.topics.flatMap((topic) => topic.items)[0];

    setSelectedSubjectId(nextSubject?.id ?? "");
    setSelectedLevelId(nextLevel?.id ?? "");
    if (nextAssignment) {
      setSelectedAssignmentIds([nextAssignment.id]);
    } else {
      setSelectedAssignmentIds([]);
    }
  }

  function pickLevel(levelId: string) {
    const nextLevel = selectedSubject?.levels.find((level) => level.id === levelId) ?? selectedSubject?.levels[0];
    const nextAssignment = nextLevel?.topics.flatMap((topic) => topic.items)[0];

    setSelectedLevelId(nextLevel?.id ?? "");
    if (nextAssignment) {
      setSelectedAssignmentIds([nextAssignment.id]);
    } else {
      setSelectedAssignmentIds([]);
    }
  }

  function toggleAssignment(assignmentId: string) {
    setSelectedAssignmentIds((current) =>
      current.includes(assignmentId) ? current.filter((id) => id !== assignmentId) : [...current, assignmentId],
    );
  }

  function deliverAssignment() {
    if (!canDeliver || !selectedClass) return;

    setRecentBatches((current) => [
      {
        id: `delivery-${Date.now()}`,
        assignmentTitle: formatSelectedAssignmentsTitle(selectedAssignments, copy),
        className: selectedClass.className,
        dueDate,
        recipients: selectedStudents.length,
      },
      ...current,
    ]);
    setSelectedStudentIds([]);
    setTeacherNote("");
    setAssignDialogOpen(false);
  }

  return (
    <DashboardPageShell
      badge={copy.badge}
      title={activeLeaf.title}
      description={copy.description}
      breadcrumbs={activeLeaf.breadcrumb}
      actions={
        <Button variant="outlined" onClick={() => onOpenLeaf("class-reports")}>
          {copy.openReports}
        </Button>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DashboardSectionCard
          title={copy.listTitle}
          description={copy.listDescription(visibleStudents.length, supportCount)}
          action={
            <Button size="small" variant="outlined" onClick={selectSupportStudents} disabled={supportCount === 0}>
              {copy.selectSupport}
            </Button>
          }
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_150px_150px_150px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--erg-blue)]" />
              <TextField
                size="small"
                fullWidth
                sx={{ "& .MuiInputBase-input": { pl: "1.75rem" } }}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={copy.searchPlaceholder}
                value={searchValue}
              />
            </div>
            <SelectControl
              ariaLabel={copy.subjectFilter}
              options={[
                { value: "all", label: copy.allSubjects },
                ...subjectOptions.map((item) => ({ value: item, label: item })),
              ]}
              value={subject}
              onChange={(value) => {
                setSubject(value);
                setSelectedStudentIds([]);
              }}
            />
            <SelectControl
              ariaLabel={copy.statusFilter}
              options={[
                { value: "all", label: copy.allStatuses },
                { value: "ahead", label: copy.status.ahead },
                { value: "steady", label: copy.status.steady },
                { value: "support", label: copy.status.support },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
            />
            <SelectControl
              ariaLabel={copy.progressFilter}
              options={[
                { value: "all", label: copy.allProgress },
                { value: "not-started", label: copy.progress.notStarted },
                { value: "in-progress", label: copy.progress.inProgress },
                { value: "completed", label: copy.progress.completed },
              ]}
              value={progressFilter}
              onChange={(value) => setProgressFilter(value as ProgressFilter)}
            />
          </div>

          <SelectionBar
            allVisibleSelected={allVisibleSelected}
            copy={copy}
            onAssign={() => setAssignDialogOpen(true)}
            onClear={() => setSelectedStudentIds([])}
            onToggleAll={toggleVisibleStudents}
            selectedCount={selectedVisibleIds.length}
            visibleCount={visibleStudents.length}
          />

          <StudentDataTable
            copy={copy}
            focusedStudentId={focusedStudent?.id ?? null}
            onFocusStudent={openStudentDetail}
            onToggleStudent={toggleStudent}
            selectedIds={selectedVisibleIds}
            students={visibleStudents}
          />
        </DashboardSectionCard>

        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          {focusedStudent ? <StudentDetailCard copy={copy} student={focusedStudent} /> : null}

          <DashboardSectionCard title={copy.recentTitle} description={copy.recentDescription}>
            <div className="space-y-3">
              {(recentBatches.length ? recentBatches : getInitialBatches(copy)).map((batch) => (
                <div key={batch.id} className="rounded-lg border border-[#cbd7e6] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-sm font-semibold text-slate-950">{batch.assignmentTitle}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {batch.className} • {batch.recipients} {copy.studentUnit(batch.recipients)}
                      </div>
                      <div className="mt-2 text-[13px] font-semibold text-slate-600">
                        {copy.dueDateLabel}: {formatDueDate(batch.dueDate)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardSectionCard>
        </aside>
      </section>

      <AssignmentDialog
        assignments={selectedAssignments}
        canDeliver={canDeliver}
        copy={copy}
        dueDate={dueDate}
        levels={selectedSubject?.levels ?? []}
        note={teacherNote}
        onAssignmentToggle={toggleAssignment}
        onClose={() => setAssignDialogOpen(false)}
        onDeliver={deliverAssignment}
        onDueDateChange={setDueDate}
        onLevelChange={pickLevel}
        onNoteChange={setTeacherNote}
        onSubjectChange={pickSubject}
        open={assignDialogOpen}
        schoolName={selectedClass?.schoolName ?? school.name}
        selectedCount={selectedStudents.length}
        selectedAssignmentIds={selectedAssignmentIds}
        selectedLevelId={selectedLevel?.id ?? ""}
        selectedStudentNames={selectedStudents.map((student) => student.name)}
        selectedSubjectId={selectedSubject?.id ?? ""}
        subjects={assignmentSubjects}
        topics={selectedLevel?.topics ?? []}
      />
      {detailStudent ? (
        <StudentProfileDetailDrawer
          draft={studentDrafts[detailStudent.id] ?? createStudentProfileDraft(detailStudent)}
          onClose={() => setDetailStudentId(null)}
          onUpdate={(patch) => updateStudentDraft(detailStudent.id, patch)}
          onStatusChange={(status) => setStudentStatusDrafts((current) => ({ ...current, [detailStudent.id]: status }))}
          statusOptions={[
            { label: copy.status.ahead, value: "ahead" },
            { label: copy.status.steady, value: "steady" },
            { label: copy.status.support, value: "support" },
          ]}
          statusValue={studentStatusDrafts[detailStudent.id] ?? detailStudent.status}
          student={detailStudent}
        />
      ) : null}
    </DashboardPageShell>
  );
}

function mapClassWorkspaceToSnapshot(
  workspace: LmsClassWorkspace,
  fallback: ClassroomSnapshot | undefined,
  selectedSchoolId: string,
): ClassroomSnapshot {
  const classInfo = workspace.classInfo;
  const schoolId = classInfo.schoolId || fallback?.schoolId || selectedSchoolId;
  const grade = classInfo.grade?.replace(/^grade[-_]?/i, "");
  const studentCount = Math.round(classInfo.studentCount ?? workspace.students.totalItems ?? workspace.students.items.length);
  const activeAssignments = Math.round(classInfo.assignmentCount ?? workspace.assignments.totalItems ?? workspace.assignments.items.length);
  const averageScore = Math.round(workspace.scoreSummary?.averagePercent ?? fallback?.averageScore ?? 0);

  return {
    id: classInfo.id || fallback?.id || selectedSchoolId,
    schoolId,
    schoolName: fallback?.schoolName || classInfo.schoolId || "ERG Learning",
    clusterId: fallback?.clusterId ?? "central",
    className: classInfo.name || fallback?.className || classInfo.id || "Lop hoc",
    gradeLabel: grade ? `Khoi ${grade}` : fallback?.gradeLabel ?? "ERG",
    homeroomTeacher: fallback?.homeroomTeacher || classInfo.homeroomTeacherId || "Giao vien chu nhiem",
    studentCount,
    activeAssignments,
    completionRate: averageScore,
    averageScore,
    riskStudents: Math.round(
      workspace.riskSummary?.missingOverdueStudentCount ??
        workspace.riskSummary?.lowScoreStudentCount ??
        fallback?.riskStudents ??
        0,
    ),
    competitionPoints: fallback?.competitionPoints ?? 0,
    lastSubmissionAt: classInfo.updatedAt ? formatClassWorkspaceDate(classInfo.updatedAt) : fallback?.lastSubmissionAt ?? "Chua co du lieu",
  };
}

function formatClassWorkspaceDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Moi cap nhat";
  return date.toLocaleString("vi-VN", { day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit" });
}

function createStudentProfileDraft(student: { avatarSeed: string; id: string; mentorNote: string; name: string }) {
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
