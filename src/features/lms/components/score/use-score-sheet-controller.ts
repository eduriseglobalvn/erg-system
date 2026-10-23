import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import { OfflineTeachingCommandError } from "@/features/lms/offline-teaching";
import {
  isPendingAcademicRecordMutation,
  resolveAcademicRecordIdentity,
  useGradebookWorkspaceQuery,
  useUpsertGradebookScoreMutation,
} from "@/features/lms/api/lms-academic-record-query";
import { lmsSubjectOptions } from "@/features/lms/components/lms-subject-options";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useVirtualList } from "@/hooks/use-virtual-list";
import { runtimeFixturesEnabled } from "@/lib/runtime-fixtures";
import {
  baseScoreColumns,
  classificationOptions,
  createScoreStudentDraft,
  getMockAttempts,
  getStudentClassification,
  type Classification,
  type ClassificationSort,
  type ScoreColumn,
  type StudentScoreDraft,
  type StudentState,
} from "./score-sheet-model";

export type ScoreContextMenu = { x: number; y: number; student: ClassroomStudent } | null;
export type PendingClassification = {
  student: ClassroomStudent;
  from: Classification;
  to: Classification;
} | null;

export function useScoreSheetController(students: ClassroomStudent[], selectedClass?: ClassroomSnapshot) {
  const [offlineColumns, setOfflineColumns] = useState<ScoreColumn[]>([]);
  const [offlineColumnName, setOfflineColumnName] = useState("");
  const [manualScores, setManualScores] = useState<Record<string, string>>({});
  const [bonusScores, setBonusScores] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(lmsSubjectOptions[0] ?? "");
  const [classificationFilter, setClassificationFilter] = useState<Classification[]>(classificationOptions);
  const [classificationSort, setClassificationSort] = useState<ClassificationSort>(null);
  const [manualClassifications, setManualClassifications] = useState<Record<string, Classification>>({});
  const [pendingClassification, setPendingClassification] = useState<PendingClassification>(null);
  const [classificationComment, setClassificationComment] = useState("");
  const [studentStates, setStudentStates] = useState<Record<string, StudentState>>({});
  const [studentDrafts, setStudentDrafts] = useState<Record<string, StudentScoreDraft>>({});
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ScoreContextMenu>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebouncedValue(searchQuery);
  const identity = resolveAcademicRecordIdentity();
  const gradebookScope = {
    ...identity,
    classId: selectedClass?.id,
    schoolId: selectedClass?.schoolId,
    subjectId: selectedSubject,
  };
  const gradebookQuery = useGradebookWorkspaceQuery(gradebookScope);
  // Keep offline teaching default-deny until the server publishes an explicit
  // capability for gradebook mutations.
  const scoreMutation = useUpsertGradebookScoreMutation(gradebookScope, { offline: {} });

  const serverColumns = (gradebookQuery.data?.columns ?? []).map((column) => ({
    id: column.id,
    kind: fromApiScoreKind(column.kind),
    label: column.label,
    maxScore: column.maxScore,
  }));
  const scoreColumns = [
    ...baseScoreColumns,
    ...serverColumns.filter((column) => !baseScoreColumns.some((base) => base.id === column.id)),
    ...offlineColumns.filter((column) => !serverColumns.some((server) => server.id === column.id)),
  ];
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;
  const filteredStudents = useMemo(() => {
    let result = [...students];
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter((student) => student.name.toLowerCase().includes(query));
    }
    result = result.filter((student) => classificationFilter.includes(getStudentClassification(student, manualClassifications)));
    if (classificationSort) {
      result.sort((left, right) => {
        const leftIndex = classificationOptions.indexOf(getStudentClassification(left, manualClassifications));
        const rightIndex = classificationOptions.indexOf(getStudentClassification(right, manualClassifications));
        return classificationSort === "asc" ? leftIndex - rightIndex : rightIndex - leftIndex;
      });
    }
    const active = result.filter((student) => (studentStates[student.id] ?? "active") === "active");
    const disabled = result.filter((student) => (studentStates[student.id] ?? "active") === "disabled");
    return [...active, ...disabled];
  }, [classificationFilter, classificationSort, debouncedSearchQuery, manualClassifications, studentStates, students]);

  const rowVirtualizer = useVirtualList({
    count: filteredStudents.length,
    estimateSize: 40,
    overscan: 10,
    scrollRef: tableScrollRef,
  });
  const measuredVirtualRows = rowVirtualizer.getVirtualItems();

  function addOfflineColumn() {
    const label = offlineColumnName.trim() || `Offline ${offlineColumns.length + 1}`;
    setOfflineColumns((columns) => [
      ...columns,
      { id: `offline-${Date.now()}-${columns.length}`, label, maxScore: 10, kind: "offline" },
    ]);
    setOfflineColumnName("");
  }

  function updateManualScore(columnId: string, studentId: string, score: string) {
    if (!/^\d*([.,]\d*)?$/.test(score)) return;
    setManualScores((current) => ({ ...current, [`${columnId}:${studentId}`]: score.replace(",", ".") }));
  }

  function updateBonusScore(studentId: string, score: string) {
    if (!/^-?\d*([.,]\d*)?$/.test(score)) return;
    setBonusScores((current) => ({ ...current, [studentId]: score.replace(",", ".") }));
  }

  function attemptsFor(student: ClassroomStudent, column: ScoreColumn, studentIndex: number, columnIndex: number) {
    const serverScore = gradebookQuery.data?.scores.find((score) => score.studentId === student.id && score.columnId === column.id);
    if (serverScore) {
      return [{ id: `${student.id}:${column.id}:${serverScore.version}`, score: serverScore.score, duration: "Đã đồng bộ", takenAt: formatUpdatedAt(serverScore.updatedAt) }];
    }
    return runtimeFixturesEnabled() ? getMockAttempts(student, column, studentIndex, columnIndex) : [];
  }

  function scoreValueFor(student: ClassroomStudent, column: ScoreColumn, studentIndex: number, columnIndex: number) {
    const manual = manualScores[`${column.id}:${student.id}`];
    if (manual !== undefined) return manual;
    const latest = attemptsFor(student, column, studentIndex, columnIndex)[0];
    return latest ? String(latest.score) : "";
  }

  function commitScore(columnId: string, studentId: string, nextValue?: string) {
    const column = scoreColumns.find((item) => item.id === columnId);
    const raw = nextValue ?? manualScores[`${columnId}:${studentId}`];
    const score = Number(raw);
    if (!column || !selectedClass?.id || identity.accountId === "anonymous" || !Number.isFinite(score)) return;
    const current = gradebookQuery.data?.scores.find((item) => item.studentId === studentId && item.columnId === columnId);
    const key = `${columnId}:${studentId}`;
    scoreMutation.mutate({
      classId: selectedClass.id,
      columnId,
      expectedVersion: current?.version,
      kind: column.kind.toUpperCase(),
      label: column.label,
      maxScore: column.maxScore,
      position: scoreColumns.findIndex((item) => item.id === columnId),
      schoolId: selectedClass.schoolId,
      score,
      studentId,
      subjectId: selectedSubject,
      tenantId: identity.tenantId,
    }, {
      onError: (error) => {
        clearManualScore(key);
        if (error instanceof OfflineTeachingCommandError) {
          toast.warning("Offline nhập điểm chưa được máy chủ cấp quyền; thay đổi chưa được lưu.");
          return;
        }
        toast.error("Không thể lưu điểm. Dữ liệu cũ đã được khôi phục.");
      },
      onSuccess: () => clearManualScore(key),
    });
  }

  function clearManualScore(key: string) {
    setManualScores((scores) => {
      const next = { ...scores };
      delete next[key];
      return next;
    });
  }

  function requestClassificationChange(student: ClassroomStudent, next: Classification) {
    const previous = getStudentClassification(student, manualClassifications);
    if (previous === next) return;
    setPendingClassification({ student, from: previous, to: next });
    setClassificationComment("");
  }

  function saveClassificationChange() {
    if (!pendingClassification || !classificationComment.trim()) return;
    setManualClassifications((current) => ({ ...current, [pendingClassification.student.id]: pendingClassification.to }));
    setPendingClassification(null);
    setClassificationComment("");
    toast.success("Đã cập nhật xếp loại");
  }

  function openStudentDetail(student: ClassroomStudent) {
    setSelectedStudentId(student.id);
    setStudentDrafts((current) => ({
      ...current,
      [student.id]: current[student.id] ?? createScoreStudentDraft(student, studentStates[student.id] ?? "active"),
    }));
  }

  function disableStudent(student: ClassroomStudent) {
    setStudentStates((current) => ({ ...current, [student.id]: "disabled" }));
    setNotice(`Đã khóa ${student.name}`);
    toast.success("Đã khóa tài khoản");
  }

  return {
    addOfflineColumn,
    attemptsFor,
    bonusScores,
    classificationComment,
    classificationFilter,
    classificationSort,
    commitScore,
    contextMenu,
    disableStudent,
    filteredStudents,
    filterAnchor,
    getClassification: (student: ClassroomStudent) => getStudentClassification(student, manualClassifications),
    getStudentState: (student: ClassroomStudent) => studentStates[student.id] ?? "active",
    manualClassifications,
    manualScores,
    measuredVirtualRows,
    notice,
    offlinePending: isPendingAcademicRecordMutation(scoreMutation.data),
    offlineColumnName,
    openStudentDetail,
    pendingClassification,
    requestClassificationChange,
    saveClassificationChange,
    scoreColumns,
    searchQuery,
    selectedStudent,
    selectedSubject,
    setClassificationComment,
    setClassificationFilter,
    setClassificationSort,
    setContextMenu,
    setFilterAnchor,
    setNotice,
    setOfflineColumnName,
    setPendingClassification,
    setSearchQuery,
    setSelectedStudentId,
    setSelectedSubject,
    setStudentDrafts,
    studentDrafts,
    studentNameFor: (student: ClassroomStudent) => studentDrafts[student.id]?.name ?? student.name,
    studentStates,
    subjectOptions: lmsSubjectOptions,
    tableScrollRef,
    updateBonusScore,
    updateManualScore,
    scoreValueFor,
  };
}

function fromApiScoreKind(kind: string): ScoreColumn["kind"] {
  if (kind === "QUIZ") return "quiz";
  if (kind === "OFFLINE") return "offline";
  return "topic";
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN");
}

export type ScoreSheetController = ReturnType<typeof useScoreSheetController>;
