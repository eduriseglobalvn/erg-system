import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QUERY_POLICIES } from "@/lib/query-policy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";

import {
  DashboardPageShell,
  DashboardSectionCard,
} from "@/components/dashboard/dashboard-page-shell";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
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
} from "@/features/lms/api/lms-classroom-api";
import { lmsAssignmentReadQueryKeys } from "@/features/lms/api/lms-assignment-command-query";
import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import { hasApiBase } from "@/lib/api-client";
import { runtimeFixturesEnabled } from "@/lib/runtime-fixtures";
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
  fixturesEnabled: boolean,
): ClassroomStudent[] {
  if (apiBacked) return workspaceStudents;
  return fixturesEnabled && workspaceStudents.length === 0 ? fallbackStudents : workspaceStudents;
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
  const fixturesEnabled = runtimeFixturesEnabled();
  const classWorkspaceQuery = useQuery({
    queryKey: lmsAssignmentReadQueryKeys.classWorkspace({
      classId: selectedClassId,
      schoolId: selectedSchoolId,
      usage: "class-students-workspace",
    }),
    queryFn: ({ signal }) =>
      loadLmsClassWorkspace({
        assignmentPage: 0,
        assignmentSize: 50,
        assignmentStatus: "active",
        classId: selectedClassId,
        page: 0,
        schoolId: selectedSchoolId,
        size: 50,
        studentStatus: "active",
      }, signal),
    enabled: apiBacked && Boolean(selectedClassId),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
    refetchOnWindowFocus: false,
  });

  const fallbackSelectedClass =
    fixturesEnabled
      ? classroomSnapshots.find((snapshot) => snapshot.id === selectedClassId && snapshot.schoolId === selectedSchoolId) ?? getSchoolSnapshots(selectedSchoolId)[0]
      : undefined;
  const selectedClass = useMemo(
    () =>
      classWorkspaceQuery.data
        ? mapClassWorkspaceToSnapshot(classWorkspaceQuery.data, fallbackSelectedClass, selectedSchoolId)
        : fallbackSelectedClass,
    [classWorkspaceQuery.data, fallbackSelectedClass, selectedSchoolId],
  );
  const school = fixturesEnabled ? classroomSchools.find((item) => item.id === selectedSchoolId) ?? classroomSchools[0] : undefined;
  const subjectOptions = useMemo(
    () => fixturesEnabled ? Array.from(new Set([...assignmentRuns, ...assignmentCatalog].map((assignment) => assignment.subjectLabel))) : [],
    [fixturesEnabled],
  );
  const fallbackSchoolStudents = useMemo(
    () => fixturesEnabled ? classroomStudents.filter((student) => student.schoolId === selectedSchoolId) : [],
    [fixturesEnabled, selectedSchoolId],
  );
  const workspaceStudents = useMemo(
    () => (classWorkspaceQuery.data ? mapClassWorkspaceToStudents(classWorkspaceQuery.data, selectedClass) : []),
    [classWorkspaceQuery.data, selectedClass],
  );
  const schoolStudents = useMemo(
    () => resolveClassStudentsWorkspaceStudents(workspaceStudents, fallbackSchoolStudents, apiBacked, fixturesEnabled),
    [apiBacked, fallbackSchoolStudents, fixturesEnabled, workspaceStudents],
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
  const canDeliver = fixturesEnabled && selectedStudents.length > 0 && selectedAssignments.length > 0 && Boolean(dueDate);

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
      <Box component="section" sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "minmax(0,1fr)", xl: "minmax(0,1fr) 360px" } }}>
        <DashboardSectionCard
          title={copy.listTitle}
          description={copy.listDescription(visibleStudents.length, supportCount)}
          action={
            <Button size="small" variant="outlined" onClick={selectSupportStudents} disabled={supportCount === 0}>
              {copy.selectSupport}
            </Button>
          }
        >
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "minmax(220px,1fr) 150px 150px 150px" } }}>
            <Box sx={{ position: "relative" }}>
              <TextField
                size="small"
                fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon color="primary" fontSize="small" /></InputAdornment> } }}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={copy.searchPlaceholder}
                value={searchValue}
              />
            </Box>
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
          </Box>

          <SelectionBar
            allVisibleSelected={allVisibleSelected}
            copy={copy}
            assignDisabled={!fixturesEnabled}
            assignDisabledReason={copy.assignmentUnavailable}
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

        <Stack component="aside" spacing={2} sx={{ position: { xl: "sticky" }, top: { xl: 20 }, alignSelf: { xl: "start" } }}>
          {focusedStudent ? <StudentDetailCard copy={copy} student={focusedStudent} /> : null}

          <DashboardSectionCard title={copy.recentTitle} description={copy.recentDescription}>
            <Stack spacing={1.5}>
            {(recentBatches.length ? recentBatches : fixturesEnabled ? getInitialBatches(copy) : []).map((batch) => (
                <Box key={batch.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, bgcolor: "background.paper", p: 2 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                    <Box sx={{ display: "grid", width: 36, height: 36, flexShrink: 0, placeItems: "center", borderRadius: 1, bgcolor: "success.50", color: "success.main" }}>
                      <CheckCircleIcon sx={{ fontSize: 16 }} />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ display: "-webkit-box", overflow: "hidden", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, fontSize: 14, fontWeight: 600 }}>{batch.assignmentTitle}</Typography>
                      <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 14 }}>
                        {batch.className} • {batch.recipients} {copy.studentUnit(batch.recipients)}
                      </Typography>
                      <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 13, fontWeight: 600 }}>
                        {copy.dueDateLabel}: {formatDueDate(batch.dueDate)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))}
              {!recentBatches.length && !fixturesEnabled ? <Typography color="text.secondary" variant="body2">{copy.assignmentUnavailable}</Typography> : null}
            </Stack>
          </DashboardSectionCard>
        </Stack>
      </Box>

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
        schoolName={selectedClass?.schoolName ?? school?.name ?? "Phạm vi hiện tại"}
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
    metricsAvailable: true,
  };
}

function formatClassWorkspaceDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Moi cap nhat";
  return date.toLocaleString("vi-VN", { day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit" });
}

function createStudentProfileDraft(student: { id: string; mentorNote: string; name: string }) {
  return {
    name: student.name,
    username: student.id,
    password: "",
    note: student.mentorNote,
  };
}
