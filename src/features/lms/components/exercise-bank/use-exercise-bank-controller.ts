import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { questionBankQueryKeys, useQuestionBankWorkspaceQuery } from "@/features/question-bank/api/question-bank-query";
import { viDateToInput } from "@/domain/formatters/format-date";
import type { QuizBankItem } from "@/features/question-bank/types/question-bank-types";
import {
  allExerciseFilter,
  filterExercises,
  summarizeExercises,
  type Exercise,
  type ExerciseSource,
  type ExerciseStatus,
} from "./exercise-bank-model";
import { copyQuizAsTeacherExercise, deleteTeacherExercise, saveTeacherExercise } from "./teacher-exercise-api";

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
    // The server labels a quiz a teacher built as «Giáo viên»; a teacher only ever receives their own.
    source: quiz.scopeLabel === "Giáo viên" ? "teacher" : "system",
    authorName: quiz.ownerLabel || "Hệ thống ERG",
    questionIds: quiz.questionIds,
  };
}

export function useExerciseBankController() {
  const { data: qbData } = useQuestionBankWorkspaceQuery();

  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);

  const items = useMemo(() => (qbData?.quizzes ?? []).map(quizToExercise), [qbData?.quizzes]);

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

  /** Runs a save, refreshes the bank and selects the result; returns the quiz id, or null after telling the teacher what went wrong. */
  async function runSave(save: () => Promise<string>) {
    setSaving(true);
    try {
      const id = await save();
      await queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root() });
      setSelectedExerciseId(id);
      return id;
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Không lưu được bài. Vui lòng thử lại.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  /** Saves on the server and publishes. `sourceId`: the quiz this one is made from, when it is not being saved over itself. */
  async function persist(exercise: Pick<Exercise, "title" | "type" | "durationMinutes" | "questionIds">, quizId?: string, sourceId?: string) {
    const kind = exercise.type === "exam" ? "test" : "train";
    const ids = exercise.questionIds ?? [];
    // A quiz built in the editor keeps its questions in itself, not in the bank: it is copied whole.
    const source = ids.length ? undefined : (qbData?.quizzes ?? []).find((quiz) => quiz.id === sourceId);
    if (source) {
      return runSave(() => copyQuizAsTeacherExercise({ sourceQuizId: source.id, title: exercise.title, kind, subjectId: source.subjectId, levelId: source.levelId }));
    }
    const byId = new Map((qbData?.questions ?? []).map((question) => [question.id, question]));
    const questions = ids.flatMap((id) => byId.get(id) ?? []);
    if (!questions.length || questions.length !== ids.length) {
      toast.error("Không tải được đủ câu hỏi của bài này. Tải lại trang rồi thử lại.");
      return null;
    }
    return runSave(() => saveTeacherExercise({ quizId, title: exercise.title, kind, questions, timeLimitMinutes: exercise.durationMinutes }));
  }

  function closeDialog() {
    setCreateDialogOpen(false);
    setExerciseToEdit(null);
  }

  async function addExercise(newExercise: Omit<Exercise, "id" | "updatedAt" | "assignedCount">) {
    const id = await persist(newExercise);
    if (!id) return false;
    toast.success("Đã lưu bài vào kho của bạn.");
    closeDialog();
    return true;
  }

  /** Changing a system exercise never touches it: the teacher gets their own copy. */
  async function updateExercise(updated: Exercise) {
    const own = updated.source === "teacher";
    const id = await persist(updated, own ? updated.id : undefined, own ? undefined : updated.id);
    if (!id) return false;
    toast.success(updated.source === "teacher" ? "Đã lưu thay đổi." : "Đã lưu thành bài riêng của bạn.");
    closeDialog();
    return true;
  }

  async function duplicateExercise(exerciseId?: string) {
    const target = items.find((e) => e.id === (exerciseId || selectedExercise?.id));
    if (!target) return;
    if (await persist({ ...target, title: `${target.title} (Bản sao)` }, undefined, target.id)) toast.success("Đã tạo bản sao trong kho của bạn.");
  }

  async function deleteExercise() {
    if (!exerciseToDelete) return;
    setSaving(true);
    try {
      await deleteTeacherExercise(exerciseToDelete.id);
      await queryClient.invalidateQueries({ queryKey: questionBankQueryKeys.root() });
      toast.success("Đã xoá bài khỏi kho. Bài đã giao cho lớp vẫn giữ nguyên.");
      setExerciseToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Không xoá được bài. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return {
    addExercise,
    clearFilters,
    createDialogOpen,
    deleteExercise,
    exerciseToDelete,
    difficultyFilter,
    duplicateExercise,
    exerciseToEdit,
    filteredExercises,
    items,
    levelFilter,
    openCreateDialog,
    openEditDialog,
    portableCatalogOpen,
    quickAssignExercise,
    saving,
    searchTerm,
    selectedExercise,
    selectedExerciseId,
    setCreateDialogOpen,
    setDifficultyFilter,
    setExerciseToDelete,
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
