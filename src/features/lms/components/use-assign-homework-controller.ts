import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getClassStudents,
  resolveAssignHomeworkClassStudents,
} from "@/features/lms/components/assign-homework-student-utils";
import { classroomStudents, defaultClassId } from "@/features/lms/classroom/api/classroom-defaults";
import { useQuestionBankWorkspaceQuery } from "@/features/question-bank/api/question-bank-query";
import type { ClassroomSnapshot } from "@/domain/school/classroom-types";
import {
  lmsAssignmentReadQueryKeys,
  lmsReadPersistMeta,
  useCreateLmsAssignmentMutation,
} from "@/features/lms/api/lms-assignment-command-query";
import { loadLmsClassWorkspace, mapClassWorkspaceToStudents } from "@/features/lms/api/lms-classroom-api";
import { buildAvailableSubjects } from "@/features/lms/components/assign-homework-controller/build-available-subjects";
import { useAssignHomeworkSubmit } from "@/features/lms/components/assign-homework-controller/use-assign-homework-submit";
import { filterResourceTopics, formatSelectedResourceLabel } from "@/features/lms/components/assign-homework-controller/assign-homework-resource-utils";
import { useAssignmentClassSelection } from "@/features/lms/components/assign-homework-controller/use-assignment-class-selection";
import { useGradeTargeting } from "@/features/lms/components/assign-homework-controller/use-grade-targeting";
import { useGroupTargeting } from "@/features/lms/components/assign-homework-controller/use-group-targeting";
import { useLmsMobileBreakpoint } from "@/features/lms/mobile/hooks/use-lms-mobile-breakpoint";
import { hasApiBase } from "@/lib/api-client";
import { QUERY_POLICIES } from "@/lib/query-policy";

export interface AssignHomeworkPageProps {
  classes: ClassroomSnapshot[];
  selectedClass?: ClassroomSnapshot;
  onBack: () => void;
  onCreateAssignment: (title: string, subject: string) => void;
  onSelectClass?: (classId: string) => void;
}

function formatAssignDateTime(date: Date, time = "08:00:00") {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${day}/${month}/${year} ${time}`;
}

export function useAssignHomeworkController({
  classes,
  selectedClass,
  onBack,
  onCreateAssignment,
  onSelectClass,
}: AssignHomeworkPageProps) {
  const [step, setStep] = useState(1);
  const isMobile = useLmsMobileBreakpoint("(max-width: 767px)");
  const apiBacked = hasApiBase();
  const [title, setTitle] = useState("");
  const subject = "Tiếng Anh";
  const [startDate, setStartDate] = useState(() => formatAssignDateTime(new Date(), "08:00:00"));
  const [endDate, setEndDate] = useState(() => {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    return formatAssignDateTime(due, "23:59:59");
  });
  const [openDatePicker, setOpenDatePicker] = useState<"start" | "end" | null>(null);
  const [targetType, setTargetType] = useState<"grade" | "class" | "group">("class");
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [maxDurationMinutes, setMaxDurationMinutes] = useState(45);
  const [assignmentClassId, setAssignmentClassId] = useState(selectedClass?.id ?? defaultClassId);
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const assignmentClass = classes.find((classroom) => classroom.id === assignmentClassId) ?? selectedClass ?? classes[0];
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
    placeholderData: keepPreviousData,
    staleTime: QUERY_POLICIES.transactional.staleTime,
    gcTime: QUERY_POLICIES.offlineCore.gcTime,
    meta: lmsReadPersistMeta(),
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
  const {
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
  } = useGradeTargeting({ classes, selectedClass, apiBacked, targetType, getFallbackStudentsForClass });
  const {
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
  } = useGroupTargeting({ apiBacked, targetType, assignmentClass, students, fallbackStudents: classroomStudents });

  const { selectedStudentIds, setSelectedStudentIds, searchQuery, setSearchQuery, handleAssignmentClassChange } =
    useAssignmentClassSelection({
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
    });

  
  const questionBankQuery = useQuestionBankWorkspaceQuery();
  const availableSubjects = useMemo(
    () => buildAvailableSubjects(questionBankQuery.data?.quizzes),
    [questionBankQuery.data?.quizzes],
  );

  const [selectedSubjectId, setSelectedSubjectId] = useState(() => availableSubjects[0]?.id ?? "");
  const [selectedLevelId, setSelectedLevelId] = useState(() => availableSubjects[0]?.levels[0]?.id ?? "");
  const [selectedResourceIds, setSelectedResourceIds] = useState<Set<string>>(() => {
    const firstItem = availableSubjects[0]?.levels[0]?.topics[0]?.items[0];
    return firstItem ? new Set([firstItem.id]) : new Set();
  });

  useEffect(() => {
    if (!selectedSubjectId && availableSubjects.length > 0) {
      const firstSubject = availableSubjects[0];
      const firstLevel = firstSubject?.levels[0];
      const firstItem = firstLevel?.topics[0]?.items[0];
      setSelectedSubjectId(firstSubject?.id ?? "");
      setSelectedLevelId(firstLevel?.id ?? "");
      if (firstItem && selectedResourceIds.size === 0) {
        setSelectedResourceIds(new Set([firstItem.id]));
      }
    }
  }, [availableSubjects, selectedSubjectId, selectedResourceIds.size]);

  const [resourceSearch, setResourceSearch] = useState("");
  // Assignment drafts use the shared adapter, but remain default-deny offline
  // until BE publishes an explicit teacher capability for this operation.
  const createAssignmentMutation = useCreateLmsAssignmentMutation({ offline: {} });

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const filteredStudents = useMemo(() => {
    const term = deferredSearchQuery.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) => s.name.toLowerCase().includes(term));
  }, [students, deferredSearchQuery]);

  const allSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.has(s.id));

  const toggleSelectAll = useCallback(() => {
    setSelectedStudentIds((current) => {
      const next = new Set(current);
      const allChecked = filteredStudents.length > 0 && filteredStudents.every((s) => current.has(s.id));
      if (allChecked) {
        filteredStudents.forEach((s) => next.delete(s.id));
      } else {
        filteredStudents.forEach((s) => next.add(s.id));
      }
      return next;
    });
  }, [filteredStudents, setSelectedStudentIds]);

  const toggleStudent = useCallback((id: string) => {
    setSelectedStudentIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [setSelectedStudentIds]);


  const targetError =
    targetType === "class" && selectedStudentIds.size === 0 ? "Vui lòng chọn ít nhất một học sinh."
      : targetType === "grade" && selectedGradeClassIds.size === 0 ? "Vui lòng chọn ít nhất một lớp trong khối."
        : targetType === "group" && selectedAssignmentGroupIds.size === 0 ? "Vui lòng chọn ít nhất một nhóm học tập."
          : "";
  // One-page (mobile) form: the first reason the assignment cannot be sent yet, "" when ready.
  const formError = !title.trim()
    ? "Vui lòng nhập tên bài tập."
    : targetError || (selectedResourceIds.size === 0 ? "Vui lòng chọn ít nhất một bài tập." : "");

  const handleNext = () => {
    if (!title.trim()) {
      setValidationError("Vui lòng nhập tên bài tập trước khi tiếp tục.");
      return;
    }
    if (targetError) {
      setValidationError(targetError);
      return;
    }
    setValidationError("");
    setStep((currentStep) => Math.min(2, currentStep + 1));
  };

  const selectedSubject = availableSubjects.find((item) => item.id === selectedSubjectId) ?? availableSubjects[0];
  const selectedLevel = selectedSubject?.levels.find((item) => item.id === selectedLevelId) ?? selectedSubject?.levels[0];
  const resourceSearchTerm = resourceSearch.trim().toLowerCase();
  const filteredResourceTopics = filterResourceTopics(selectedLevel?.topics, resourceSearchTerm);
  const filteredResourceCount = filteredResourceTopics.reduce((total, topic) => total + topic.items.length, 0);
  const selectedResourceCount = selectedResourceIds.size;
  const selectedResourceLabel = formatSelectedResourceLabel(selectedResourceCount);

  const handleSubjectChange = (subjectId: string) => {
    const nextSubject = availableSubjects.find((item) => item.id === subjectId) ?? availableSubjects[0];
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
        if (!title.trim()) {
          const allItems = availableSubjects.flatMap((s) => s.levels.flatMap((l) => l.topics.flatMap((t) => t.items)));
          const found = allItems.find((i) => i.id === resourceId);
          if (found) setTitle(found.title);
        }
      }
      return next;
    });
  };

  const handleFinish = useAssignHomeworkSubmit({
    title,
    selectedResourceIds,
    setValidationError,
    setIsSubmitting,
    assignmentClass,
    selectedAssignmentGroupIds,
    selectedGradeClassIds,
    gradeStudentIdsByClass,
    selectedGradeStudentIdsByClass,
    selectedGroupStudentIdsByGroup,
    selectedStudentIds,
    activeAssignmentGroups,
    targetType,
    apiBacked,
    createAssignmentMutation,
    attemptLimit,
    endDate,
    startDate,
    maxDurationMinutes,
    selectedSubject,
    subject,
    onCreateAssignment,
  });
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
    handleAssignmentClassChange,
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
    validationError,
    setValidationError,
    isSubmitting,
    availableSubjects,
    isClassLoading: classWorkspaceQuery.isLoading,
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
    formError,
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
