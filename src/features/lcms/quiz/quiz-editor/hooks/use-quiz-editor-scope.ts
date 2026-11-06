import { useEffect, useMemo, useState } from "react";

import { useQuestionBankWorkspaceQuery } from "@/features/question-bank/api/question-bank-query";
import type { QuizEditorWorkspaceData } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import {
  courseScopeOptions,
  emptyCourseScopeOption,
  levelScopeOptions,
  type CourseScopeOption,
  type LevelScopeOption,
} from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-scope-options";
import { hasApiBase } from "@/lib/api-client";

/** Course / level / topic selection and the taxonomy options derived from the question bank. */
export function useQuizEditorScope(setActiveQuizId: (quizId: string | null) => void) {
  const [selectedCourseId, setSelectedCourseId] = useState(() => (hasApiBase() ? "" : courseScopeOptions[0]!.id));
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(() => (hasApiBase() ? null : levelScopeOptions[0]?.id ?? null));
  const [selectedTopicId, setSelectedTopicId] = useState("all");

  const questionBankFilters = useMemo(
    () => ({
      levelId: selectedLevelId || undefined,
      page: 0,
      size: 50,
      status: "ready",
      subjectId: selectedCourseId || undefined,
      topicId: selectedTopicId === "all" ? undefined : selectedTopicId,
    }),
    [selectedCourseId, selectedLevelId, selectedTopicId],
  );
  const questionBankQuery = useQuestionBankWorkspaceQuery(undefined, questionBankFilters);

  const questionBankSubjects = questionBankQuery.data?.subjects ?? [];
  const apiBackedTaxonomy = hasApiBase() && questionBankSubjects.length > 0;
  const courseOptions = useMemo<CourseScopeOption[]>(
    () =>
      apiBackedTaxonomy
        ? questionBankSubjects.map((subject) => ({
            id: subject.id,
            label: subject.label,
            meta: `${subject.description || subject.label} · ${subject.levels.length} levels · ${subject.categories.length} chủ đề`,
          }))
        : courseScopeOptions,
    [apiBackedTaxonomy, questionBankSubjects],
  );

  const selectedSubject = useMemo(
    () => questionBankSubjects.find((subject) => subject.id === selectedCourseId) ?? null,
    [questionBankSubjects, selectedCourseId],
  );

  const levelOptions = useMemo<LevelScopeOption[]>(
    () =>
      apiBackedTaxonomy && selectedSubject
        ? selectedSubject.levels.map((level) => ({
            id: level.id,
            courseId: selectedSubject.id,
            label: level.label,
            meta: level.description,
          }))
        : apiBackedTaxonomy
          ? []
          : levelScopeOptions.filter((option) => option.courseId === selectedCourseId),
    [apiBackedTaxonomy, selectedCourseId, selectedSubject],
  );

  const selectedCourse =
    courseOptions.find((option) => option.id === selectedCourseId) ?? courseOptions[0] ?? emptyCourseScopeOption;
  const selectedLevel = levelOptions.find((option) => option.id === selectedLevelId) ?? levelOptions[0] ?? null;
  const selectedLevelScopeId = selectedLevel?.id ?? null;
  const levelTopics = useMemo(
    () =>
      selectedSubject?.categories.filter((topic) => !selectedLevelScopeId || topic.levelId === selectedLevelScopeId) ?? [],
    [selectedLevelScopeId, selectedSubject],
  );

  function handleCourseChange(nextCourseId: string) {
    const nextSubject = questionBankSubjects.find((subject) => subject.id === nextCourseId) ?? null;
    const nextLevel = nextSubject?.levels[0]
      ? {
          id: nextSubject.levels[0].id,
          courseId: nextSubject.id,
          label: nextSubject.levels[0].label,
          meta: nextSubject.levels[0].description,
        }
      : apiBackedTaxonomy
        ? null
        : levelScopeOptions.find((option) => option.courseId === nextCourseId) ?? null;
    setSelectedCourseId(nextCourseId);
    setSelectedLevelId(nextLevel?.id ?? null);
    setSelectedTopicId("all");
    setActiveQuizId(null);
  }

  function handleLevelChange(nextLevelId: string) {
    setSelectedLevelId(nextLevelId);
    setSelectedTopicId("all");
    setActiveQuizId(null);
  }

  function handleTopicChange(nextTopicId: string) {
    setSelectedTopicId(nextTopicId);
    setActiveQuizId(null);
  }

  return {
    selectedCourseId,
    selectedLevelId,
    selectedTopicId,
    setSelectedCourseId,
    setSelectedLevelId,
    setSelectedTopicId,
    questionBankQuery,
    questionBankSubjects,
    courseOptions,
    levelOptions,
    selectedCourse,
    selectedLevel,
    levelTopics,
    handleCourseChange,
    handleLevelChange,
    handleTopicChange,
  };
}

type ScopeState = Pick<
  ReturnType<typeof useQuizEditorScope>,
  | "selectedCourseId"
  | "selectedLevelId"
  | "selectedTopicId"
  | "setSelectedCourseId"
  | "setSelectedLevelId"
  | "setSelectedTopicId"
  | "questionBankSubjects"
>;

/** Keeps the selection valid for the loaded taxonomy and aligned with the opened quiz. */
export function useQuizEditorScopeSync({
  scope,
  effectiveQuizId,
  quizItems,
}: {
  scope: ScopeState;
  effectiveQuizId: string;
  quizItems: QuizEditorWorkspaceData["quizzes"]["items"] | undefined;
}) {
  const {
    selectedCourseId,
    selectedLevelId,
    selectedTopicId,
    setSelectedCourseId,
    setSelectedLevelId,
    setSelectedTopicId,
    questionBankSubjects,
  } = scope;

  useEffect(() => {
    if (!questionBankSubjects.length) return;

    const nextSubject = questionBankSubjects.find((subject) => subject.id === selectedCourseId) ?? questionBankSubjects[0]!;
    const nextLevel = nextSubject.levels.find((level) => level.id === selectedLevelId) ?? nextSubject.levels[0] ?? null;
    const nextLevelId = nextLevel?.id ?? null;
    const topicStillExists =
      selectedTopicId === "all" ||
      nextSubject.categories.some((topic) => topic.id === selectedTopicId && (!nextLevelId || topic.levelId === nextLevelId));

    if (nextSubject.id !== selectedCourseId) {
      setSelectedCourseId(nextSubject.id);
    }
    if (nextLevelId !== selectedLevelId) {
      setSelectedLevelId(nextLevelId);
    }
    if (!topicStillExists) {
      setSelectedTopicId("all");
    }
  }, [questionBankSubjects, selectedCourseId, selectedLevelId, selectedTopicId, setSelectedCourseId, setSelectedLevelId, setSelectedTopicId]);

  useEffect(() => {
    if (!effectiveQuizId || !quizItems) return;
    const currentQuizMeta = quizItems.find((q) => q.id === effectiveQuizId);
    if (!currentQuizMeta) return;

    if (currentQuizMeta.subjectId && currentQuizMeta.subjectId !== selectedCourseId) {
      setSelectedCourseId(currentQuizMeta.subjectId);
    }
    if (currentQuizMeta.levelId !== undefined && currentQuizMeta.levelId !== selectedLevelId) {
      setSelectedLevelId(currentQuizMeta.levelId);
    }
    if (currentQuizMeta.categoryId && currentQuizMeta.categoryId !== selectedTopicId) {
      setSelectedTopicId(currentQuizMeta.categoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately limited to quiz switch / list refresh (as before extraction)
  }, [effectiveQuizId, quizItems]);
}
