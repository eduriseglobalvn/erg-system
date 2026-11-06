import { useEffect, useMemo, useState } from "react";

import { allGroupSourcesFilterValue, assignmentGroups } from "@/features/lms/components/assign-homework-groups";
import {
  mapLmsStudentGroupsToAssignHomeworkGroups,
  resolveAssignHomeworkClassStudents,
  resolveAssignHomeworkGroups,
} from "@/features/lms/components/assign-homework-student-utils";
import type { ClassroomSnapshot } from "@/domain/school/classroom-types";
import { useLmsStudentGroupsQuery } from "@/features/lms/api/lms-assignment-command-query";

export function useGroupTargeting({
  apiBacked,
  targetType,
  assignmentClass,
  students,
  fallbackStudents,
}: {
  apiBacked: boolean;
  targetType: "grade" | "class" | "group";
  assignmentClass?: ClassroomSnapshot;
  students: ReturnType<typeof resolveAssignHomeworkClassStudents>;
  /** Offline/mock roster used when the API is not available. */
  fallbackStudents: ReturnType<typeof resolveAssignHomeworkClassStudents>;
}) {
  const [selectedGroupSource, setSelectedGroupSource] = useState(allGroupSourcesFilterValue);
  const [selectedAssignmentGroupIds, setSelectedAssignmentGroupIds] = useState<Set<string>>(new Set());
  const [previewAssignmentGroupId, setPreviewAssignmentGroupId] = useState<string | null>(null);
  const [groupStudentSearch, setGroupStudentSearch] = useState("");
  const [selectedGroupStudentIdsByGroup, setSelectedGroupStudentIdsByGroup] = useState<Record<string, string[]>>({});

  const studentGroupsQuery = useLmsStudentGroupsQuery(undefined, assignmentClass?.id, {
    enabled: apiBacked && targetType === "group" && Boolean(assignmentClass?.id),
  });
  const apiAssignmentGroups = useMemo(
    () => (studentGroupsQuery.data ? mapLmsStudentGroupsToAssignHomeworkGroups(studentGroupsQuery.data.groups) : undefined),
    [studentGroupsQuery.data],
  );
  const activeAssignmentGroups = useMemo(
    () => resolveAssignHomeworkGroups(apiAssignmentGroups, assignmentGroups, apiBacked),
    [apiAssignmentGroups, apiBacked],
  );
  const groupSourceOptions = useMemo(
    () => Array.from(new Set(activeAssignmentGroups.map((group) => group.source))),
    [activeAssignmentGroups],
  );
  const filteredAssignmentGroups = activeAssignmentGroups.filter(
    (group) => selectedGroupSource === allGroupSourcesFilterValue || group.source === selectedGroupSource,
  );
  const previewAssignmentGroup = activeAssignmentGroups.find((group) => group.id === previewAssignmentGroupId) ?? null;
  const previewAssignmentGroupStudents = (apiBacked ? students : fallbackStudents).filter((student) => previewAssignmentGroup?.studentIds.includes(student.id));
  const selectedGroupPopupStudentIds = new Set(previewAssignmentGroupId ? selectedGroupStudentIdsByGroup[previewAssignmentGroupId] ?? [] : []);
  const filteredPreviewAssignmentGroupStudents = previewAssignmentGroupStudents.filter((student) =>
    student.name.toLowerCase().includes(groupStudentSearch.trim().toLowerCase()),
  );
  const allAssignmentGroupsSelected =
    filteredAssignmentGroups.length > 0 && filteredAssignmentGroups.every((group) => selectedAssignmentGroupIds.has(group.id));
  const filteredSelectedAssignmentGroupCount = filteredAssignmentGroups.filter((group) => selectedAssignmentGroupIds.has(group.id)).length;
  const allGroupPopupStudentsSelected =
    filteredPreviewAssignmentGroupStudents.length > 0 &&
    filteredPreviewAssignmentGroupStudents.every((student) => selectedGroupPopupStudentIds.has(student.id));

  useEffect(() => {
    if (selectedGroupSource !== allGroupSourcesFilterValue && !groupSourceOptions.includes(selectedGroupSource)) {
      setSelectedGroupSource(allGroupSourcesFilterValue);
    }
    const validGroupIds = new Set(activeAssignmentGroups.map((group) => group.id));
    setSelectedAssignmentGroupIds((current) => {
      const next = new Set(Array.from(current).filter((groupId) => validGroupIds.has(groupId)));
      return next.size === current.size ? current : next;
    });
  }, [activeAssignmentGroups, groupSourceOptions, selectedGroupSource]);

  const toggleAssignmentGroup = (groupId: string) => {
    const next = new Set(selectedAssignmentGroupIds);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    setSelectedAssignmentGroupIds(next);
  };

  const toggleAllAssignmentGroups = () => {
    setSelectedAssignmentGroupIds((current) => {
      const next = new Set(current);
      if (allAssignmentGroupsSelected) {
        filteredAssignmentGroups.forEach((group) => next.delete(group.id));
      } else {
        filteredAssignmentGroups.forEach((group) => next.add(group.id));
      }
      return next;
    });
  };

  const openAssignmentGroupPreview = (groupId: string) => {
    const group = activeAssignmentGroups.find((item) => item.id === groupId);
    setPreviewAssignmentGroupId(groupId);
    setGroupStudentSearch("");
    setSelectedGroupStudentIdsByGroup((current) => ({
      ...current,
      [groupId]: current[groupId] ?? group?.studentIds ?? [],
    }));
  };

  const toggleGroupPreviewStudent = (studentId: string) => {
    if (!previewAssignmentGroupId) return;
    const next = new Set(selectedGroupPopupStudentIds);
    if (next.has(studentId)) {
      next.delete(studentId);
    } else {
      next.add(studentId);
    }
    setSelectedGroupStudentIdsByGroup((current) => ({ ...current, [previewAssignmentGroupId]: Array.from(next) }));
  };

  const toggleAllGroupPreviewStudents = () => {
    if (!previewAssignmentGroupId) return;
    const next = new Set(selectedGroupPopupStudentIds);
    if (allGroupPopupStudentsSelected) {
      filteredPreviewAssignmentGroupStudents.forEach((student) => next.delete(student.id));
    } else {
      filteredPreviewAssignmentGroupStudents.forEach((student) => next.add(student.id));
    }
    setSelectedGroupStudentIdsByGroup((current) => ({ ...current, [previewAssignmentGroupId]: Array.from(next) }));
  };

  const resetGroupPreviewStudents = () => {
    if (!previewAssignmentGroupId) return;
    setGroupStudentSearch("");
    setSelectedGroupStudentIdsByGroup((current) => ({
      ...current,
      [previewAssignmentGroupId]: previewAssignmentGroup?.studentIds ?? [],
    }));
  };

  return {
    selectedGroupSource,
    setSelectedGroupSource,
    selectedAssignmentGroupIds,
    setSelectedAssignmentGroupIds,
    previewAssignmentGroupId,
    setPreviewAssignmentGroupId,
    groupStudentSearch,
    setGroupStudentSearch,
    selectedGroupStudentIdsByGroup,
    setSelectedGroupStudentIdsByGroup,
    studentGroupsQuery,
    apiAssignmentGroups,
    activeAssignmentGroups,
    groupSourceOptions,
    filteredAssignmentGroups,
    previewAssignmentGroup,
    previewAssignmentGroupStudents,
    selectedGroupPopupStudentIds,
    filteredPreviewAssignmentGroupStudents,
    allAssignmentGroupsSelected,
    filteredSelectedAssignmentGroupCount,
    allGroupPopupStudentsSelected,
    toggleAssignmentGroup,
    toggleAllAssignmentGroups,
    openAssignmentGroupPreview,
    toggleGroupPreviewStudent,
    toggleAllGroupPreviewStudents,
    resetGroupPreviewStudents,
  };
}
