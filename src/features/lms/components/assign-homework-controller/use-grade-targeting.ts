import { useState } from "react";
import { useQueries } from "@tanstack/react-query";

import { resolveAssignHomeworkClassStudents } from "@/features/lms/components/assign-homework-student-utils";
import {
  lmsAssignmentReadQueryKeys,
  lmsReadPersistMeta,
} from "@/features/lms/api/lms-assignment-command-query";
import { loadLmsClassWorkspace, mapClassWorkspaceToStudents } from "@/features/lms/api/lms-classroom-api";
import type { ClassroomSnapshot } from "@/domain/school/classroom-types";
import { QUERY_POLICIES } from "@/lib/query-policy";

export function useGradeTargeting({
  classes,
  selectedClass,
  apiBacked,
  targetType,
  getFallbackStudentsForClass,
}: {
  classes: ClassroomSnapshot[];
  selectedClass?: ClassroomSnapshot;
  apiBacked: boolean;
  targetType: "grade" | "class" | "group";
  getFallbackStudentsForClass: (classId?: string, className?: string) => ReturnType<typeof resolveAssignHomeworkClassStudents>;
}) {
  const gradeOptions = Array.from(new Set(classes.map((classroom) => classroom.gradeLabel))).filter(Boolean);
  const [selectedGradeLabel, setSelectedGradeLabel] = useState(selectedClass?.gradeLabel ?? gradeOptions[0] ?? "");
  const [selectedGradeClassIds, setSelectedGradeClassIds] = useState<Set<string>>(new Set());
  const [previewGradeClassId, setPreviewGradeClassId] = useState<string | null>(null);
  const [gradeStudentSearch, setGradeStudentSearch] = useState("");
  const [selectedGradeStudentIdsByClass, setSelectedGradeStudentIdsByClass] = useState<Record<string, string[]>>({});

  const gradeClasses = classes.filter((classroom) => classroom.gradeLabel === selectedGradeLabel);
  const gradeClassWorkspaceQueries = useQueries({
    queries: gradeClasses.map((classroom) => ({
      gcTime: QUERY_POLICIES.offlineCore.gcTime,
      meta: lmsReadPersistMeta(),
      queryFn: ({ signal }) =>
        loadLmsClassWorkspace({
          assignmentPage: 0,
          assignmentSize: 20,
          assignmentStatus: "active",
          classId: classroom.id,
          page: 0,
          schoolId: classroom.schoolId,
          size: 200,
          studentStatus: "active",
        }, signal),
      queryKey: lmsAssignmentReadQueryKeys.classWorkspace({
        classId: classroom.id,
        schoolId: classroom.schoolId,
        usage: "assign-homework-grade",
      }),
      refetchOnWindowFocus: false,
      staleTime: QUERY_POLICIES.transactional.staleTime,
      enabled: apiBacked && targetType === "grade" && Boolean(classroom.id),
    })),
  });
  const gradeStudentsByClass = new Map(
    gradeClasses.map((classroom, index) => {
      const workspace = gradeClassWorkspaceQueries[index]?.data;
      const workspaceClassStudents = workspace ? mapClassWorkspaceToStudents(workspace, classroom) : undefined;
      return [
        classroom.id,
        resolveAssignHomeworkClassStudents(
          workspaceClassStudents,
          getFallbackStudentsForClass(classroom.id, classroom.className),
          apiBacked,
        ),
      ] as const;
    }),
  );
  const getGradeStudentsForClassId = (classId?: string | null) => (classId ? gradeStudentsByClass.get(classId) ?? [] : []);
  const gradeStudentIdsByClass = Object.fromEntries(
    gradeClasses.map((classroom) => [classroom.id, getGradeStudentsForClassId(classroom.id).map((student) => student.id)]),
  );
  const previewGradeClass = gradeClasses.find((classroom) => classroom.id === previewGradeClassId) ?? null;
  const previewGradeClassStudents = getGradeStudentsForClassId(previewGradeClass?.id);
  const selectedPopupStudentIds = new Set(previewGradeClassId ? selectedGradeStudentIdsByClass[previewGradeClassId] ?? [] : []);
  const filteredPreviewGradeClassStudents = previewGradeClassStudents.filter((student) =>
    student.name.toLowerCase().includes(gradeStudentSearch.trim().toLowerCase()),
  );
  const allGradeClassesSelected = gradeClasses.length > 0 && gradeClasses.every((classroom) => selectedGradeClassIds.has(classroom.id));
  const allPreviewStudentsSelected =
    filteredPreviewGradeClassStudents.length > 0 &&
    filteredPreviewGradeClassStudents.every((student) => selectedPopupStudentIds.has(student.id));

  const toggleGradeClass = (classId: string) => {
    const next = new Set(selectedGradeClassIds);
    if (next.has(classId)) {
      next.delete(classId);
    } else {
      next.add(classId);
    }
    setSelectedGradeClassIds(next);
  };

  const toggleAllGradeClasses = () => {
    setSelectedGradeClassIds(allGradeClassesSelected ? new Set() : new Set(gradeClasses.map((classroom) => classroom.id)));
  };

  const openGradeClassPreview = (classId: string) => {
    const classStudents = getGradeStudentsForClassId(classId);
    setPreviewGradeClassId(classId);
    setGradeStudentSearch("");
    setSelectedGradeStudentIdsByClass((current) => ({
      ...current,
      [classId]: current[classId] ?? classStudents.map((student) => student.id),
    }));
  };

  const togglePreviewStudent = (studentId: string) => {
    if (!previewGradeClassId) return;
    const next = new Set(selectedPopupStudentIds);
    if (next.has(studentId)) {
      next.delete(studentId);
    } else {
      next.add(studentId);
    }
    setSelectedGradeStudentIdsByClass((current) => ({ ...current, [previewGradeClassId]: Array.from(next) }));
  };

  const toggleAllPreviewStudents = () => {
    if (!previewGradeClassId) return;
    const next = new Set(selectedPopupStudentIds);
    if (allPreviewStudentsSelected) {
      filteredPreviewGradeClassStudents.forEach((student) => next.delete(student.id));
    } else {
      filteredPreviewGradeClassStudents.forEach((student) => next.add(student.id));
    }
    setSelectedGradeStudentIdsByClass((current) => ({ ...current, [previewGradeClassId]: Array.from(next) }));
  };

  const resetPreviewStudents = () => {
    if (!previewGradeClassId) return;
    setGradeStudentSearch("");
    setSelectedGradeStudentIdsByClass((current) => ({
      ...current,
      [previewGradeClassId]: previewGradeClassStudents.map((student) => student.id),
    }));
  };

  return {
    gradeOptions,
    selectedGradeLabel,
    setSelectedGradeLabel,
    selectedGradeClassIds,
    setSelectedGradeClassIds,
    previewGradeClassId,
    setPreviewGradeClassId,
    gradeStudentSearch,
    setGradeStudentSearch,
    selectedGradeStudentIdsByClass,
    setSelectedGradeStudentIdsByClass,
    gradeClasses,
    gradeClassWorkspaceQueries,
    gradeStudentsByClass,
    getGradeStudentsForClassId,
    gradeStudentIdsByClass,
    previewGradeClass,
    previewGradeClassStudents,
    selectedPopupStudentIds,
    filteredPreviewGradeClassStudents,
    allGradeClassesSelected,
    allPreviewStudentsSelected,
    toggleGradeClass,
    toggleAllGradeClasses,
    openGradeClassPreview,
    togglePreviewStudent,
    toggleAllPreviewStudents,
    resetPreviewStudents,
  };
}
