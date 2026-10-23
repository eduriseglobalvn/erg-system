import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import { allGroupSourcesFilterValue, assignmentGroups } from "@/features/lms/components/assign-homework-groups";
import {
  getClassStudents,
  mapLmsStudentGroupsToAssignHomeworkGroups,
  resolveAssignHomeworkClassStudents,
  resolveAssignHomeworkGroups,
} from "@/features/lms/components/assign-homework-student-utils";
import {
  buildAssignmentRecipientInput,
  createAssignmentIdempotencyKey,
  parseAssignDateTime,
} from "@/features/lms/components/assign-homework-recipient";
import { classroomStudents, defaultClassId } from "@/features/lms/classroom/api/mock-classroom-data";
import { assignmentSubjects } from "@/features/lms/classroom/components/class-students-workspace.constants";
import type { ClassroomSnapshot } from "@/features/lms/classroom/types/classroom-types";
import {
  lmsAssignmentReadQueryKeys,
  useCreateLmsAssignmentMutation,
  useLmsStudentGroupsQuery,
} from "@/features/lms/api/lms-assignment-command-query";
import { loadLmsClassWorkspace, mapClassWorkspaceToStudents } from "@/features/lms/api/lms-classroom-api";
import { useLmsMobileBreakpoint } from "@/features/lms/mobile/hooks/use-lms-mobile-breakpoint";
import { hasApiBase } from "@/lib/api-client";
import { QUERY_POLICIES } from "@/lib/query-policy";

export interface AssignHomeworkPageProps {
  classes: ClassroomSnapshot[];
  selectedClass?: ClassroomSnapshot;
  onBack: () => void;
  onCreateAssignment: (title: string, subject: string) => void;
}

export function useAssignHomeworkController({
  classes,
  selectedClass,
  onBack,
  onCreateAssignment,
}: AssignHomeworkPageProps) {
  const [step, setStep] = useState(1);
  const isMobile = useLmsMobileBreakpoint("(max-width: 767px)");
  const apiBacked = hasApiBase();
  const [title, setTitle] = useState("a");
  const subject = "Tiếng Anh";
  const [startDate, setStartDate] = useState("03/06/2026 14:40:35");
  const [endDate, setEndDate] = useState("10/06/2026 14:40:35");
  const [openDatePicker, setOpenDatePicker] = useState<"start" | "end" | null>(null);
  const [targetType, setTargetType] = useState<"grade" | "class" | "group">("class");
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [maxDurationMinutes, setMaxDurationMinutes] = useState(45);
  const [assignmentClassId, setAssignmentClassId] = useState(selectedClass?.id ?? defaultClassId);
  const gradeOptions = Array.from(new Set(classes.map((classroom) => classroom.gradeLabel))).filter(Boolean);
  const [selectedGradeLabel, setSelectedGradeLabel] = useState(selectedClass?.gradeLabel ?? gradeOptions[0] ?? "");
  const [selectedGradeClassIds, setSelectedGradeClassIds] = useState<Set<string>>(new Set());
  const [previewGradeClassId, setPreviewGradeClassId] = useState<string | null>(null);
  const [gradeStudentSearch, setGradeStudentSearch] = useState("");
  const [selectedGradeStudentIdsByClass, setSelectedGradeStudentIdsByClass] = useState<Record<string, string[]>>({});
  const [selectedGroupSource, setSelectedGroupSource] = useState(allGroupSourcesFilterValue);
  const [selectedAssignmentGroupIds, setSelectedAssignmentGroupIds] = useState<Set<string>>(new Set());
  const [previewAssignmentGroupId, setPreviewAssignmentGroupId] = useState<string | null>(null);
  const [groupStudentSearch, setGroupStudentSearch] = useState("");
  const [selectedGroupStudentIdsByGroup, setSelectedGroupStudentIdsByGroup] = useState<Record<string, string[]>>({});
  
  const assignmentClass = classes.find((classroom) => classroom.id === assignmentClassId) ?? selectedClass ?? classes[0];
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
  const getFallbackStudentsForClass = (classId?: string, className?: string) => {
    const directStudents = getClassStudents(classId);
    if (directStudents.length > 0) return directStudents;

    const normalizedClassName = className?.replace(/^Lớp\s+/i, "").trim().toLowerCase();
    const matchedStudents = normalizedClassName
      ? classroomStudents.filter((student) => student.className.replace(/^Lớp\s+/i, "").trim().toLowerCase() === normalizedClassName)
      : [];

    return matchedStudents.length > 0 ? matchedStudents : getClassStudents(defaultClassId);
  };
  const classWorkspaceQuery = useQuery({
    queryKey: lmsAssignmentReadQueryKeys.classWorkspace({
      classId: assignmentClass?.id,
      schoolId: assignmentClass?.schoolId,
      usage: "assign-homework",
    }),
    queryFn: ({ signal }) =>
      loadLmsClassWorkspace({
        assignmentPage: 0,
        assignmentSize: 50,
        assignmentStatus: "active",
        classId: assignmentClass?.id ?? assignmentClassId,
        page: 0,
        schoolId: assignmentClass?.schoolId,
        size: 200,
        studentStatus: "active",
      }, signal),
    enabled: apiBacked && targetType !== "grade" && Boolean(assignmentClass?.id ?? assignmentClassId),
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.transactional.gcTime,
    refetchOnWindowFocus: false,
  });
  const workspaceStudents = useMemo(
    () => (classWorkspaceQuery.data ? mapClassWorkspaceToStudents(classWorkspaceQuery.data, assignmentClass) : undefined),
    [assignmentClass, classWorkspaceQuery.data],
  );
  const students = useMemo(
    () =>
      resolveAssignHomeworkClassStudents(
        workspaceStudents,
        getFallbackStudentsForClass(assignmentClass?.id, assignmentClass?.className),
        apiBacked,
      ),
    [apiBacked, assignmentClass?.className, assignmentClass?.id, workspaceStudents],
  );
  const gradeClasses = classes.filter((classroom) => classroom.gradeLabel === selectedGradeLabel);
  const gradeClassWorkspaceQueries = useQueries({
    queries: gradeClasses.map((classroom) => ({
      gcTime: QUERY_POLICIES.transactional.gcTime,
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
  const filteredAssignmentGroups = activeAssignmentGroups.filter(
    (group) => selectedGroupSource === allGroupSourcesFilterValue || group.source === selectedGroupSource,
  );
  const previewAssignmentGroup = activeAssignmentGroups.find((group) => group.id === previewAssignmentGroupId) ?? null;
  const previewAssignmentGroupStudents = (apiBacked ? students : classroomStudents).filter((student) => previewAssignmentGroup?.studentIds.includes(student.id));
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

  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    () =>
      new Set(
        apiBacked
          ? []
          : getFallbackStudentsForClass(selectedClass?.id ?? defaultClassId, selectedClass?.className).map((student) => student.id),
      ),
  );
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedSubjectId, setSelectedSubjectId] = useState(() => assignmentSubjects[0]?.id ?? "");
  const [selectedLevelId, setSelectedLevelId] = useState(() => assignmentSubjects[0]?.levels[0]?.id ?? "");
  const [selectedResourceIds, setSelectedResourceIds] = useState<Set<string>>(() => {
    const firstItem = assignmentSubjects[0]?.levels[0]?.topics[0]?.items[0];
    return firstItem ? new Set([firstItem.id]) : new Set();
  });
  const [resourceSearch, setResourceSearch] = useState("");
  const [mobileValidationError, setMobileValidationError] = useState("");
  // Assignment drafts use the shared adapter, but remain default-deny offline
  // until BE publishes an explicit teacher capability for this operation.
  const createAssignmentMutation = useCreateLmsAssignmentMutation({ offline: {} });

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  useEffect(() => {
    if (!apiBacked) return;
    setSelectedStudentIds(new Set(students.map((student) => student.id)));
  }, [apiBacked, assignmentClass?.id, students]);

  const allSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudentIds.has(s.id));
  
  const toggleSelectAll = () => {
    const next = new Set(selectedStudentIds);
    if (allSelected) {
      filteredStudents.forEach(s => next.delete(s.id));
    } else {
      filteredStudents.forEach(s => next.add(s.id));
    }
    setSelectedStudentIds(next);
  };

  const toggleStudent = (id: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedStudentIds(next);
  };

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

  const handleNext = () => {
    if (!title.trim()) {
      setMobileValidationError("Vui lòng nhập tên bài tập trước khi tiếp tục.");
      return;
    }
    setMobileValidationError("");
    setStep((currentStep) => Math.min(2, currentStep + 1));
  };

  const selectedSubject = assignmentSubjects.find((item) => item.id === selectedSubjectId) ?? assignmentSubjects[0];
  const selectedLevel = selectedSubject?.levels.find((item) => item.id === selectedLevelId) ?? selectedSubject?.levels[0];
  const resourceSearchTerm = resourceSearch.trim().toLowerCase();
  const filteredResourceTopics =
    selectedLevel?.topics
      .map((topic) => ({
        ...topic,
        items: topic.items.filter((item) =>
          [item.title, item.activityLabel, item.topicLabel, item.kind, item.durationLabel]
            .join(" ")
            .toLowerCase()
            .includes(resourceSearchTerm),
        ),
      }))
      .filter((topic) => topic.items.length > 0) ?? [];
  const filteredResourceCount = filteredResourceTopics.reduce((total, topic) => total + topic.items.length, 0);
  const selectedResourceCount = selectedResourceIds.size;
  const selectedResourceLabel =
    selectedResourceCount === 0
      ? "Chưa chọn bài"
      : selectedResourceCount === 1
        ? "1 bài đã chọn"
        : `${selectedResourceCount} bài đã chọn`;

  const handleSubjectChange = (subjectId: string) => {
    const nextSubject = assignmentSubjects.find((item) => item.id === subjectId) ?? assignmentSubjects[0];
    setSelectedSubjectId(nextSubject?.id ?? "");
    setSelectedLevelId(nextSubject?.levels[0]?.id ?? "");
    setResourceSearch("");
  };

  const toggleResourceSelection = (resourceId: string) => {
    setSelectedResourceIds((current) => {
      const next = new Set(current);
      if (next.has(resourceId)) {
        next.delete(resourceId);
      } else {
        next.add(resourceId);
      }
      return next;
    });
  };

  const handleFinish = async () => {
    if (!title.trim()) {
      setMobileValidationError("Vui lòng nhập tên bài tập.");
      return;
    }
    if (selectedResourceIds.size === 0) {
      setMobileValidationError("Vui lòng chọn ít nhất một bài tập.");
      return;
    }

    if (!apiBacked) {
      onCreateAssignment(title, selectedSubject?.label ?? subject);
      return;
    }
    try {
      const recipient = buildAssignmentRecipientInput({
        assignmentClassId: assignmentClass?.id,
        selectedAssignmentGroupIds,
        selectedGradeClassIds,
        gradeStudentIdsByClass,
        selectedGradeStudentIdsByClass,
        selectedGroupStudentIdsByGroup,
        selectedStudentIds,
        assignmentGroups: activeAssignmentGroups,
        targetType,
      });
      if (recipient.recipientMode === "students" && (recipient.studentIds?.length ?? 0) === 0) {
        setMobileValidationError("Vui lòng chọn ít nhất một học sinh hoặc nhóm/lớp hợp lệ.");
        return;
      }
      const result = await createAssignmentMutation.mutateAsync({
        attemptLimit,
        dueAt: parseAssignDateTime(endDate),
        idempotencyKey: createAssignmentIdempotencyKey({
          dueAt: endDate,
          quizIds: Array.from(selectedResourceIds),
          startAt: startDate,
          title,
        }),
        maxDurationMinutes,
        quizIds: Array.from(selectedResourceIds),
        startAt: parseAssignDateTime(startDate),
        teacherNote: selectedSubject?.label ?? subject,
        title,
        ...recipient,
      });
      if (result && typeof result === "object" && "status" in result && result.status === "pending") {
        setMobileValidationError("Bài giao đã được giữ ở trạng thái chờ đồng bộ; chưa được xác nhận trên máy chủ.");
        return;
      }
      setMobileValidationError("");
      onCreateAssignment(title, selectedSubject?.label ?? subject);
    } catch (error) {
      setMobileValidationError(error instanceof Error ? error.message : "Không thể giao bài. Vui lòng thử lại.");
    }
  };
  return {
    classes,
    selectedClass,
    onBack,
    onCreateAssignment,
    step,
    setStep,
    title,
    setTitle,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    openDatePicker,
    setOpenDatePicker,
    targetType,
    setTargetType,
    attemptLimit,
    setAttemptLimit,
    maxDurationMinutes,
    setMaxDurationMinutes,
    assignmentClassId,
    setAssignmentClassId,
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
    selectedStudentIds,
    setSelectedStudentIds,
    searchQuery,
    setSearchQuery,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedLevelId,
    setSelectedLevelId,
    selectedResourceIds,
    setSelectedResourceIds,
    resourceSearch,
    setResourceSearch,
    mobileValidationError,
    setMobileValidationError,
    isMobile,
    apiBacked,
    subject,
    gradeOptions,
    assignmentClass,
    studentGroupsQuery,
    apiAssignmentGroups,
    activeAssignmentGroups,
    groupSourceOptions,
    getFallbackStudentsForClass,
    classWorkspaceQuery,
    workspaceStudents,
    students,
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
    filteredAssignmentGroups,
    previewAssignmentGroup,
    previewAssignmentGroupStudents,
    selectedGroupPopupStudentIds,
    filteredPreviewAssignmentGroupStudents,
    allAssignmentGroupsSelected,
    filteredSelectedAssignmentGroupCount,
    allGroupPopupStudentsSelected,
    createAssignmentMutation,
    filteredStudents,
    allSelected,
    toggleSelectAll,
    toggleStudent,
    toggleGradeClass,
    toggleAllGradeClasses,
    openGradeClassPreview,
    togglePreviewStudent,
    toggleAllPreviewStudents,
    resetPreviewStudents,
    toggleAssignmentGroup,
    toggleAllAssignmentGroups,
    openAssignmentGroupPreview,
    toggleGroupPreviewStudent,
    toggleAllGroupPreviewStudents,
    resetGroupPreviewStudents,
    handleNext,
    selectedSubject,
    selectedLevel,
    resourceSearchTerm,
    filteredResourceTopics,
    filteredResourceCount,
    selectedResourceCount,
    selectedResourceLabel,
    handleSubjectChange,
    toggleResourceSelection,
    handleFinish,
  };
}

export type AssignHomeworkController = ReturnType<typeof useAssignHomeworkController>;
