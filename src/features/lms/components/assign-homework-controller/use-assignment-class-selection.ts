import { useMemo, useState, useEffect } from "react";

import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";

type StudentLike = { id: string };

export function useAssignmentClassSelection({
  classes,
  selectedClass,
  apiBacked,
  assignmentClass,
  assignmentClassId,
  students,
  getFallbackStudentsForClass,
  setAssignmentClassId,
  onSelectClass,
  setSelectedGradeLabel,
  fallbackClassId: defaultClassId,
}: {
  classes: ClassroomSnapshot[];
  selectedClass?: ClassroomSnapshot;
  apiBacked: boolean;
  assignmentClass?: ClassroomSnapshot;
  assignmentClassId: string;
  students: StudentLike[];
  getFallbackStudentsForClass: (classId?: string, className?: string) => StudentLike[];
  setAssignmentClassId: (classId: string) => void;
  onSelectClass?: (classId: string) => void;
  setSelectedGradeLabel: (label: string) => void;
  fallbackClassId: string;
}) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    () =>
      new Set(
        apiBacked
          ? []
          : getFallbackStudentsForClass(selectedClass?.id ?? defaultClassId, selectedClass?.className).map((student) => student.id),
      ),
  );
  const [lastClassId, setLastClassId] = useState(assignmentClass?.id);
  const [lastStudentHash, setLastStudentHash] = useState(() => (apiBacked ? "" : students.map((s) => s.id).join(",")));

  const currentStudentHash = useMemo(() => students.map((s) => s.id).join(","), [students]);

  if (assignmentClass?.id !== lastClassId) {
    setLastClassId(assignmentClass?.id);
    setLastStudentHash(currentStudentHash);
    setSelectedStudentIds(new Set(students.map((s) => s.id)));
  } else if (currentStudentHash !== lastStudentHash) {
    setLastStudentHash(currentStudentHash);
    if (apiBacked) {
      setSelectedStudentIds(new Set(students.map((s) => s.id)));
    }
  }
  const [searchQuery, setSearchQuery] = useState("");

  const handleAssignmentClassChange = (newClassId: string) => {
    setAssignmentClassId(newClassId);
    onSelectClass?.(newClassId);
    const nextClass = classes.find((classroom) => classroom.id === newClassId);
    if (nextClass?.gradeLabel) {
      setSelectedGradeLabel(nextClass.gradeLabel);
    }
    setSearchQuery("");
    if (!apiBacked) {
      setSelectedStudentIds(
        new Set(
          getFallbackStudentsForClass(newClassId, nextClass?.className).map((student) => student.id),
        ),
      );
    }
  };

  useEffect(() => {
    if (selectedClass?.id && selectedClass.id !== assignmentClassId) {
      setAssignmentClassId(selectedClass.id);
      if (selectedClass.gradeLabel) {
        setSelectedGradeLabel(selectedClass.gradeLabel);
      }
      setSearchQuery("");
      if (!apiBacked) {
        setSelectedStudentIds(
          new Set(
            getFallbackStudentsForClass(selectedClass.id, selectedClass.className).map((student) => student.id),
          ),
        );
      }
    }
    // getFallbackStudentsForClass is recreated every render by the caller; omitting it keeps the original effect cadence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass?.id, selectedClass?.gradeLabel, selectedClass?.className, apiBacked, assignmentClassId, setSelectedGradeLabel, setAssignmentClassId]);

  return { selectedStudentIds, setSelectedStudentIds, searchQuery, setSearchQuery, handleAssignmentClassChange };
}
