import { useMemo, useState } from "react";

import { useQuestionBankWorkspaceQuery } from "@/features/question-bank/api/question-bank-query";
import { todayInput, viDateToInput } from "@/domain/formatters/format-date";
import type { QuizBankItem } from "@/features/question-bank/types/question-bank-types";
import { getPersistedJsonValue, setPersistedJsonValue } from "@/stores/persisted-store";
import {
  allExerciseFilter,
  exercises,
  filterExercises,
  summarizeExercises,
  type Exercise,
  type ExerciseSource,
  type ExerciseStatus,
} from "./exercise-bank-model";

const TEACHER_EXERCISES_STORAGE_KEY = "erg:teacher-created-exercises:v1";

export function quizToExercise(quiz: QuizBankItem): Exercise {
  return {
    id: quiz.id,
    title: quiz.title,
    subject: quiz.subjectLabel || quiz.subjectId,
    level: quiz.levelLabel || quiz.levelId,
    classTargets: ["Lớp phụ trách"],
    type: quiz.kind === "test" ? "exam" : "quiz",
    difficulty: "easy",
    status: quiz.status === "ready" ? "published" : quiz.status === "draft" ? "draft" : "archived",
    questionCount: quiz.questionCount || quiz.questionIds?.length || 10,
    durationMinutes: Math.max(15, Math.round((quiz.questionCount || quiz.questionIds?.length || 10) * 2)),
    // The bank mapper already turned the timestamp into a dd/MM/yyyy label.
    updatedAt: viDateToInput(quiz.updatedAt),
    assignedCount: 0,
    tags: [quiz.subjectLabel, quiz.levelLabel, ...(quiz.topicLabels || [])].filter(Boolean),
    source: quiz.ownerLabel === "Giáo viên" ? "teacher" : "system",
    authorName: quiz.ownerLabel || "Hệ thống ERG",
    questionIds: quiz.questionIds,
  };
}

export function useExerciseBankController() {
  const { data: qbData } = useQuestionBankWorkspaceQuery();

  const [customItems, setCustomItems] = useState<Exercise[]>(() =>
    getPersistedJsonValue<Exercise[]>(TEACHER_EXERCISES_STORAGE_KEY, [])
  );

  const baseExercises = useMemo(() => {
    if (qbData?.quizzes && qbData.quizzes.length > 0) {
      return qbData.quizzes.map(quizToExercise);
    }
    return exercises;
  }, [qbData?.quizzes]);

  const items = useMemo(() => {
    const customIds = new Set(customItems.map((e) => e.id));
    return [...customItems, ...baseExercises.filter((e) => !customIds.has(e.id))];
  }, [customItems, baseExercises]);

  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState(allExerciseFilter);
  const [levelFilter, setLevelFilter] = useState(allExerciseFilter);
  const [difficultyFilter, setDifficultyFilter] = useState(allExerciseFilter);
  const [typeFilter, setTypeFilter] = useState(allExerciseFilter);
  const [statusFilter, setStatusFilter] = useState<ExerciseStatus | typeof allExerciseFilter>("published");
  const [sourceFilter, setSourceFilter] = useState<"all" | ExerciseSource>("all");
  const [portableCatalogOpen, setPortableCatalogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);
  const [quickAssignTitle, setQuickAssignTitle] = useState("");

  function openCreateDialog() {
    setExerciseToEdit(null);
    setCreateDialogOpen(true);
  }

  function openEditDialog(exercise: Exercise) {
    setExerciseToEdit(exercise);
    setSelectedExerciseId(exercise.id);
    setCreateDialogOpen(true);
  }

  const filteredExercises = useMemo(
    () =>
      filterExercises(
        {
          searchTerm,
          subject: subjectFilter,
          level: levelFilter,
          difficulty: difficultyFilter,
          type: typeFilter,
          status: statusFilter,
          source: sourceFilter,
        },
        items
      ),
    [difficultyFilter, items, levelFilter, searchTerm, sourceFilter, statusFilter, subjectFilter, typeFilter]
  );

  const selectedExercise = useMemo(
    () => items.find((exercise) => exercise.id === selectedExerciseId) || filteredExercises[0] || items[0],
    [filteredExercises, items, selectedExerciseId]
  );
  const quickAssignExercise = items.find((exercise) => exercise.title === quickAssignTitle);
  const totals = useMemo(() => summarizeExercises(filteredExercises, items), [filteredExercises, items]);

  function clearFilters() {
    setSearchTerm("");
    setSubjectFilter(allExerciseFilter);
    setLevelFilter(allExerciseFilter);
    setDifficultyFilter(allExerciseFilter);
    setTypeFilter(allExerciseFilter);
    setStatusFilter(allExerciseFilter);
    setSourceFilter("all");
  }

  function addExercise(newExercise: Omit<Exercise, "id" | "updatedAt" | "assignedCount">) {
    const created: Exercise = {
      ...newExercise,
      id: `ex-${Date.now()}`,
      updatedAt: todayInput(),
      assignedCount: 0,
      source: newExercise.source ?? "teacher",
      authorName: newExercise.authorName ?? "Giáo viên",
    };
    setCustomItems((prev) => {
      const next = [created, ...prev];
      setPersistedJsonValue(TEACHER_EXERCISES_STORAGE_KEY, next);
      return next;
    });
    setSelectedExerciseId(created.id);
    setCreateDialogOpen(false);
    setExerciseToEdit(null);
  }

  function updateExercise(updated: Exercise) {
    setCustomItems((prev) => {
      const exists = prev.some((e) => e.id === updated.id);
      let next: Exercise[];
      if (exists) {
        next = prev.map((e) =>
          e.id === updated.id
            ? {
                ...updated,
                updatedAt: todayInput(),
              }
            : e
        );
      } else {
        // Nếu là bài tập hệ thống được giáo viên chỉnh sửa, lưu vào danh sách bài tập tùy chỉnh của giáo viên
        next = [
          {
            ...updated,
            source: "teacher",
            authorName: updated.authorName === "Hệ thống ERG" ? "Giáo viên tùy chỉnh" : updated.authorName,
            updatedAt: todayInput(),
          },
          ...prev,
        ];
      }
      setPersistedJsonValue(TEACHER_EXERCISES_STORAGE_KEY, next);
      return next;
    });
    setSelectedExerciseId(updated.id);
    setCreateDialogOpen(false);
    setExerciseToEdit(null);
  }

  function duplicateExercise(exerciseId?: string) {
    const target = items.find((e) => e.id === (exerciseId || selectedExercise?.id));
    if (!target) return;
    const duplicated: Exercise = {
      ...target,
      id: `ex-${Date.now()}`,
      title: `${target.title} (Bản sao)`,
      status: "draft",
      source: "teacher",
      authorName: "Giáo viên",
      updatedAt: todayInput(),
      assignedCount: 0,
    };
    setCustomItems((prev) => {
      const next = [duplicated, ...prev];
      setPersistedJsonValue(TEACHER_EXERCISES_STORAGE_KEY, next);
      return next;
    });
    setSelectedExerciseId(duplicated.id);
  }

  return {
    addExercise,
    clearFilters,
    createDialogOpen,
    difficultyFilter,
    duplicateExercise,
    exerciseToEdit,
    filteredExercises,
    levelFilter,
    openCreateDialog,
    openEditDialog,
    portableCatalogOpen,
    quickAssignExercise,
    searchTerm,
    selectedExercise,
    selectedExerciseId,
    setCreateDialogOpen,
    setDifficultyFilter,
    setExerciseToEdit,
    setLevelFilter,
    setPortableCatalogOpen,
    setQuickAssignTitle,
    setSearchTerm,
    setSelectedExerciseId,
    setSourceFilter,
    setStatusFilter,
    setSubjectFilter,
    setTypeFilter,
    sourceFilter,
    statusFilter,
    subjectFilter,
    totals,
    typeFilter,
    updateExercise,
  };
}

export type ExerciseBankController = ReturnType<typeof useExerciseBankController>;
