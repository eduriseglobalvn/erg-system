import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";

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
import { useQuestionBankWorkspaceQuery } from "@/features/lcms/quiz/question-bank/api/question-bank-query";
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
    placeholderData: keepPreviousData,
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
  }, [selectedClass?.id, selectedClass?.gradeLabel, selectedClass?.className, apiBacked, assignmentClassId]);
  
  const questionBankQuery = useQuestionBankWorkspaceQuery();
  const availableSubjects = useMemo(() => {
    const qbQuizzes = questionBankQuery.data?.quizzes;
    if (qbQuizzes && qbQuizzes.length > 0) {
      const bySubject = new Map<string, typeof qbQuizzes>();
      for (const q of qbQuizzes) {
        const sub = q.subjectLabel || "Bài tập chung";
        if (!bySubject.has(sub)) bySubject.set(sub, []);
        bySubject.get(sub)!.push(q);
      }
      return Array.from(bySubject.entries()).map(([subLabel, quizzes]) => {
        const subId = quizzes[0]?.subjectId || `sub-${subLabel}`;
        const byLevel = new Map<string, typeof quizzes>();
        for (const q of quizzes) {
          const lvl = q.levelLabel || "Cơ bản";
          if (!byLevel.has(lvl)) byLevel.set(lvl, []);
          byLevel.get(lvl)!.push(q);
        }
        return {
          id: subId,
          label: subLabel,
          levels: Array.from(byLevel.entries()).map(([lvlLabel, lvlQuizzes]) => {
            const lvlId = lvlQuizzes[0]?.levelId || `lvl-${lvlLabel}`;
            const byTopic = new Map<string, typeof lvlQuizzes>();
            for (const q of lvlQuizzes) {
              const top = (q.topicLabels && q.topicLabels[0]) || "Chủ đề học tập";
              if (!byTopic.has(top)) byTopic.set(top, []);
              byTopic.get(top)!.push(q);
            }
            return {
              id: lvlId,
              label: lvlLabel,
              description: `${lvlQuizzes.length} bài tập`,
              topics: Array.from(byTopic.entries()).map(([topLabel, topQuizzes], topIdx) => ({
                id: `${lvlId}-topic-${topIdx}`,
                label: topLabel,
                items: topQuizzes.map((q) => ({
                  id: q.id,
                  title: q.title,
                  activityLabel: q.scopeLabel || "Bài luyện tập",
                  subjectLabel: subLabel,
                  targetLevel: lvlLabel,
                  activeClasses: 1,
                  completionRate: 0,
                  submittedCount: 0,
                  inProgressCount: 0,
                  needsReviewCount: 0,
                  dueLabel: "Theo lịch giáo viên",
                  durationLabel: q.durationLabel || "30 phút",
                  kind: q.kind === "test" ? ("test" as const) : ("train" as const),
                  levelId: lvlId,
                  levelLabel: lvlLabel,
                  programLabel: subLabel,
                  questionCount: q.questionCount || q.questionIds?.length || 10,
                  subjectId: subId,
                  topicId: `${lvlId}-topic-${topIdx}`,
                  topicLabel: topLabel,
                })),
              })),
            };
          }),
        };
      });
    }
    return assignmentSubjects;
  }, [questionBankQuery.data?.quizzes]);

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
  }, [filteredStudents]);

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
  }, []);

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
      setValidationError("Vui lòng nhập tên bài tập trước khi tiếp tục.");
      return;
    }
    if (targetType === "class" && selectedStudentIds.size === 0) {
      setValidationError("Vui lòng chọn ít nhất một học sinh.");
      return;
    }
    if (targetType === "grade" && selectedGradeClassIds.size === 0) {
      setValidationError("Vui lòng chọn ít nhất một lớp trong khối.");
      return;
    }
    if (targetType === "group" && selectedAssignmentGroupIds.size === 0) {
      setValidationError("Vui lòng chọn ít nhất một nhóm học tập.");
      return;
    }
    setValidationError("");
    setStep((currentStep) => Math.min(2, currentStep + 1));
  };

  const selectedSubject = availableSubjects.find((item) => item.id === selectedSubjectId) ?? availableSubjects[0];
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

  const handleFinish = async () => {
    if (!title.trim()) {
      setValidationError("Vui lòng nhập tên bài tập.");
      return;
    }
    if (selectedResourceIds.size === 0) {
      setValidationError("Vui lòng chọn ít nhất một bài tập.");
      return;
    }

    setValidationError("");
    setIsSubmitting(true);
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
        setValidationError("Vui lòng chọn ít nhất một học sinh hoặc nhóm/lớp hợp lệ.");
        setIsSubmitting(false);
        return;
      }

      if (apiBacked) {
        try {
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
            setValidationError("Bài giao đã được giữ ở trạng thái chờ đồng bộ; chưa được xác nhận trên máy chủ.");
            setIsSubmitting(false);
            return;
          }
        } catch (apiError) {
          console.error("LMS assignment create error:", apiError);
          setValidationError(
            apiError instanceof Error
              ? `Lỗi khi lưu trên máy chủ: ${apiError.message}`
              : "Máy chủ không thể lưu bài tập. Vui lòng kiểm tra lại kết nối.",
          );
          setIsSubmitting(false);
          return;
        }
      }
      setValidationError("");
      onCreateAssignment(title, selectedSubject?.label ?? subject);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Không thể giao bài. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
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
    mobileValidationError: validationError,
    setMobileValidationError: setValidationError,
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
