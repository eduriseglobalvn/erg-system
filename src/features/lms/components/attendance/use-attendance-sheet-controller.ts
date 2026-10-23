import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import type { ClassroomSnapshot, ClassroomStudent } from "@/features/lms/classroom/types/classroom-types";
import { useCurriculumTeachingPlanQuery } from "@/features/lms/api/curriculum-teaching-plan-query";
import { useCurriculumTreeQuery } from "@/features/lms/api/curriculum-tree-api";
import { useCurriculumProgramReader } from "@/features/lms/api/curriculum-program-query-reader";
import { OfflineTeachingCommandError } from "@/features/lms/offline-teaching";
import { lmsSubjectOptions } from "@/features/lms/components/lms-subject-options";
import {
  resolveAcademicRecordIdentity,
  useAttendanceWorkspaceQuery,
  isPendingAcademicRecordMutation,
  useUpsertAttendanceMutation,
} from "@/features/lms/api/lms-academic-record-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useVirtualList } from "@/hooks/use-virtual-list";
import { runtimeFixturesEnabled } from "@/lib/runtime-fixtures";
import {
  attendanceSummary,
  attendanceText,
  buildAttendanceColumns,
  clampInputDateToToday,
  countLessonsThroughDate,
  createAttendanceStudentDraft,
  curriculumProgram,
  curriculumProgramFromTree,
  getCurriculumTopicSpans,
  getMockAttendanceStatus,
  getTodayInputDate,
  nextAttendanceStatus,
  type AttendanceColumn,
  type AttendanceStatus,
  type AttendanceStudentDraft,
} from "./attendance-sheet-model";

export type AttendancePanelProps = {
  selectedClass?: ClassroomSnapshot;
  selectedSchoolName: string;
  students: ClassroomStudent[];
};

export type AttendanceContextMenu = { x: number; y: number; student: ClassroomStudent } | null;

export function useAttendanceSheetController({ selectedClass, students }: AttendancePanelProps) {
  const [attendanceOverrides, setAttendanceOverrides] = useState<Record<string, AttendanceStatus>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(lmsSubjectOptions[0] ?? "");
  const [selectedDate, setSelectedDate] = useState(getTodayInputDate());
  const [contextMenu, setContextMenu] = useState<AttendanceContextMenu>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDrafts, setStudentDrafts] = useState<Record<string, AttendanceStudentDraft>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const debouncedSearchQuery = useDebouncedValue(searchQuery);

  const todayInputDate = getTodayInputDate();
  const curriculumTreeQuery = useCurriculumTreeQuery();
  const canonicalSubjects = curriculumTreeQuery.data?.subjects ?? [];
  const subjectToken = selectedSubject.split(" ")[0]?.toLocaleLowerCase("vi") ?? "";
  const canonicalSubject = canonicalSubjects.find((item) => item.subject.name === selectedSubject)
    ?? canonicalSubjects
      .filter((item) => item.subject.name.toLocaleLowerCase("vi").includes(subjectToken))
      .sort((left, right) => right.levels.length - left.levels.length)[0];
  const canonicalSubjectId = canonicalSubject?.subject.id ?? selectedSubject;
  const canonicalLevelId = canonicalSubject?.levels[0]?.level.id;
  const academicYearForProgram = `${selectedDate.slice(0, 4)}-${Number(selectedDate.slice(0, 4)) + 1}`;
  const curriculumProgramQuery = useCurriculumProgramReader({
    subjectId: canonicalSubjectId,
    levelId: canonicalLevelId,
    academicYear: academicYearForProgram,
  });
  const canonicalCurriculumProgram = useMemo(() => {
    if (curriculumProgramQuery.data?.rows.length) return curriculumProgramQuery.data.rows.map((row) => ({
      topic: row.topic,
      period: row.period,
      title: row.title,
    }));
    const resolved = curriculumProgramFromTree(canonicalSubject);
    return resolved.length ? resolved : curriculumProgram;
  }, [canonicalSubject, curriculumProgramQuery.data]);
  useEffect(() => {
    if (canonicalSubject && canonicalSubject.subject.name !== selectedSubject) setSelectedSubject(canonicalSubject.subject.name);
  }, [canonicalSubject, selectedSubject]);
  const dateColumns = useMemo(() => buildAttendanceColumns(selectedDate), [selectedDate]);
  const identity = resolveAcademicRecordIdentity();
  const attendanceScope = {
    ...identity,
    classId: selectedClass?.id,
    from: dateColumns.find((column) => !column.isFutureDate)?.id.slice(0, 10) ?? selectedDate,
    schoolId: selectedClass?.schoolId,
    subjectId: canonicalSubjectId,
    to: [...dateColumns].reverse().find((column) => !column.isFutureDate)?.id.slice(0, 10) ?? selectedDate,
  };
  const attendanceQuery = useAttendanceWorkspaceQuery(attendanceScope);
  const teachingPlanQuery = useCurriculumTeachingPlanQuery({
    schoolId: selectedClass?.schoolId,
    subjectId: canonicalSubjectId,
    academicYear: academicYearForProgram,
  });
  // The adapter is intentionally capability-less until BE publishes a teacher
  // offline policy. Online writes still use the same server mutation; offline
  // attempts fail closed instead of creating an untracked local truth.
  const attendanceMutation = useUpsertAttendanceMutation(attendanceScope, { offline: {} });
  const taughtLessonCount = teachingPlanQuery.data ? countLessonsThroughDate(selectedDate, teachingPlanQuery.data) : 0;
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? null;
  const curriculumTopicSpans = useMemo(() => getCurriculumTopicSpans(canonicalCurriculumProgram), [canonicalCurriculumProgram]);
  const filteredStudents = useMemo(() => {
    if (!debouncedSearchQuery) return students;
    const query = debouncedSearchQuery.toLowerCase();
    return students.filter((student) => student.name.toLowerCase().includes(query));
  }, [debouncedSearchQuery, students]);

  const rowVirtualizer = useVirtualList({
    count: filteredStudents.length,
    estimateSize: 32,
    overscan: 10,
    scrollRef: tableScrollRef,
  });
  const measuredVirtualRows = rowVirtualizer.getVirtualItems();
  const virtualTotalSize = rowVirtualizer.getTotalSize();

  function statusFor(studentId: string, studentIndex: number, column: AttendanceColumn, columnIndex: number) {
    if (column.isFutureDate) return "";
    const local = attendanceOverrides[`${studentId}:${column.id}`];
    if (local) return local;
    const record = attendanceQuery.data?.records.find((item) =>
      item.studentId === studentId && item.attendanceDate === column.id.slice(0, 10) && item.lessonIndex === column.lessonIndex,
    );
    if (record) return fromApiAttendanceStatus(record.status);
    return runtimeFixturesEnabled() ? getMockAttendanceStatus(studentIndex, columnIndex) : "";
  }

  function updateAttendance(studentId: string, studentIndex: number, column: AttendanceColumn, columnIndex: number) {
    if (column.isFutureDate) return;
    persistAttendance(studentId, column, nextAttendanceStatus(statusFor(studentId, studentIndex, column, columnIndex)));
  }

  function setAttendanceStatus(studentId: string, columnId: string, status: AttendanceStatus) {
    const column = dateColumns.find((item) => item.id === columnId);
    if (column && status) persistAttendance(studentId, column, status);
  }

  function persistAttendance(studentId: string, column: AttendanceColumn, status: Exclude<AttendanceStatus, "">) {
    const key = `${studentId}:${column.id}`;
    setAttendanceOverrides((current) => ({ ...current, [key]: status }));
    if (!selectedClass?.id || identity.accountId === "anonymous") return;
    const current = attendanceQuery.data?.records.find((item) =>
      item.studentId === studentId && item.attendanceDate === column.id.slice(0, 10) && item.lessonIndex === column.lessonIndex,
    );
    attendanceMutation.mutate({
      attendanceDate: column.id.slice(0, 10),
      classId: selectedClass.id,
      expectedVersion: current?.version,
      lessonIndex: column.lessonIndex,
      schoolId: selectedClass.schoolId,
      status: toApiAttendanceStatus(status),
      studentId,
      subjectId: canonicalSubjectId,
      tenantId: identity.tenantId,
    }, {
      onError: (error) => {
        clearAttendanceOverride(key);
        if (error instanceof OfflineTeachingCommandError) {
          toast.warning("Offline điểm danh chưa được máy chủ cấp quyền; thay đổi chưa được lưu.");
        }
      },
      onSuccess: () => clearAttendanceOverride(key),
    });
  }

  function clearAttendanceOverride(key: string) {
    setAttendanceOverrides((overrides) => {
      const next = { ...overrides };
      delete next[key];
      return next;
    });
  }

  function openStudentDetail(student: ClassroomStudent) {
    setSelectedStudentId(student.id);
    setStudentDrafts((current) => ({
      ...current,
      [student.id]: current[student.id] ?? createAttendanceStudentDraft(student),
    }));
  }

  async function exportXlsx() {
    const XLSX = await import("xlsx");
    const header = ["STT", "Học sinh", "Tổng vắng", ...dateColumns.map((column) => `${column.day} ${column.date} ${column.session}`)];
    const rows = filteredStudents.map((student, index) => {
      const statuses = dateColumns.map((column, columnIndex) => statusFor(student.id, index, column, columnIndex));
      const summary = attendanceSummary(statuses);
      return [String(index + 1), student.name, String(summary.absent), ...statuses.map(attendanceText)];
    });
    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    worksheet["!cols"] = [{ wch: 6 }, { wch: 28 }, { wch: 10 }, ...dateColumns.map(() => ({ wch: 18 }))];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Điểm danh");
    XLSX.writeFile(workbook, `diem-danh-${selectedClass?.className ?? "lop"}-${selectedDate}.xlsx`);
  }

  function showAction(message: string) {
    setNotice(message);
    toast.info(message);
  }

  return {
    attendanceSummary,
    clampSelectedDate: (value: string) => setSelectedDate(clampInputDateToToday(value)),
    contextMenu,
    curriculumProgram: canonicalCurriculumProgram,
    curriculumTopicSpans,
    dateColumns,
    exportXlsx,
    filteredStudents,
    measuredVirtualRows,
    virtualTotalSize,
    notice,
    offlinePending: isPendingAcademicRecordMutation(attendanceMutation.data),
    openStudentDetail,
    searchQuery,
    selectedDate,
    selectedStudent,
    selectedSubject,
    setAttendanceStatus,
    setContextMenu,
    setSearchQuery,
    setSelectedStudentId,
    setSelectedSubject,
    setStudentDrafts,
    showAction,
    statusFor,
    studentDrafts,
    subjectOptions: canonicalSubjects.length ? canonicalSubjects.map((item) => item.subject.name) : lmsSubjectOptions,
    tableScrollRef,
    teachingPlan: teachingPlanQuery.data,
    teachingPlanLoading: teachingPlanQuery.isLoading,
    teachingPlanMissing: !teachingPlanQuery.isLoading && !teachingPlanQuery.data,
    taughtLessonCount,
    todayInputDate,
    updateAttendance,
  };
}

function fromApiAttendanceStatus(status: string): AttendanceStatus {
  if (status === "PRESENT") return "present";
  if (status === "ABSENT") return "absent";
  if (status === "LATE") return "late";
  if (status === "EXCUSED") return "excused";
  return "";
}

function toApiAttendanceStatus(status: Exclude<AttendanceStatus, "">) {
  return status.toUpperCase();
}

export type AttendanceSheetController = ReturnType<typeof useAttendanceSheetController>;
