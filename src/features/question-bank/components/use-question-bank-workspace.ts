import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuestionBankWorkspaceQuery } from "@/features/question-bank/api/question-bank-query";
import { loadQuizEditorDraft, useDeleteQuizEditorQuizMutation, usePublishQuizEditorDraftMutation } from "@/features/lcms/quiz/quiz-editor";
import { ApiClientError } from "@/lib/api-client/errors";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { QuestionBankApiData } from "@/features/question-bank/api/question-bank-api";
import type { QuestionBankQuestion, QuestionBankSubject, QuestionBankSubjectId, QuizBankItem } from "@/features/question-bank/types/question-bank-types";
import type { ContentScope } from "@/types/scope-types";
import type { QuestionBankCopy } from "./question-bank-copy";
import type { QuizKindFilter } from "./question-bank-workspace-types";
import { quizQuestionSlides, quizSlideKey } from "./quiz-package-draft";
import { useQuizPackageEdit } from "./use-quiz-package-edit";

const EMPTY_QUESTION_BANK_DATA: QuestionBankApiData = { questions: [], quizzes: [], subjects: [], questionPage: { page: 0, size: 50, totalItems: 0, totalPages: 0, hasNext: false, hasPrevious: false } };

/** State of "Ngân hàng bài tập": the package list, its filters, and the package actions. */
export function useQuestionBankWorkspaceController({ contentScope, copy }: { contentScope: ContentScope; copy: QuestionBankCopy }) {
  const [subjectId, setSubjectId] = useState<QuestionBankSubjectId>("");
  const [levelId, setLevelId] = useState("");
  const [quizKind, setQuizKind] = useState<QuizKindFilter>("all");
  const [searchValue, setSearchValue] = useState("");
  const [questionCache, setQuestionCache] = useState<Record<string, QuestionBankQuestion>>({});
  const deleteQuizMutation = useDeleteQuizEditorQuizMutation();
  const publishQuizMutation = usePublishQuizEditorDraftMutation();
  const { openUpdateQuizPackage, openingQuizId, quizPackageEdit, savingQuizPackage, setQuizPackageEdit, submitUpdateQuizPackage } = useQuizPackageEdit(copy);
  const [quickViewQuiz, setQuickViewQuiz] = useState<QuizBankItem | null>(null);
  const debouncedSearchValue = useDebouncedValue(searchValue);
  const questionBankFilters = useMemo(() => ({
    includeQuestions: true,
    page: 0,
    quizKind: quizKind !== "all" ? quizKind : undefined,
    search: debouncedSearchValue || undefined,
    size: 50,
  }), [debouncedSearchValue, quizKind]);
  const questionBankQuery = useQuestionBankWorkspaceQuery(undefined, questionBankFilters);
  const questionBankData = questionBankQuery.isError ? EMPTY_QUESTION_BANK_DATA : questionBankQuery.data ?? EMPTY_QUESTION_BANK_DATA;
  const { questions, quizzes, subjects } = questionBankData;
  const isQuestionBankFetching = questionBankQuery.isFetching;

  useEffect(() => {
    if (!questions.length) return;
    setQuestionCache((current) => {
      const next = { ...current };
      questions.forEach((question) => { next[question.id] = question; });
      return next;
    });
  }, [questions]);
  useEffect(() => {
    const nextSubject = subjects.find((subject) => subject.id === subjectId) ?? subjects[0];
    if (!nextSubject) return;
    const nextLevelId = (nextSubject.levels.find((level) => level.id === levelId) ?? nextSubject.levels[0])?.id ?? "";
    if (nextSubject.id !== subjectId) setSubjectId(nextSubject.id);
    if (nextLevelId !== levelId) setLevelId(nextLevelId);
  }, [levelId, subjectId, subjects]);

  const activeSubject = useMemo(() => findQuestionBankSubject(subjects, subjectId), [subjectId, subjects]);
  const activeLevel = useMemo(() => findQuestionBankLevel(activeSubject, levelId), [activeSubject, levelId]);
  const searchedQuizzes = useMemo(() => quizzes.filter((quiz) => {
    const normalizedSearch = debouncedSearchValue.trim().toLowerCase();
    return (!normalizedSearch || `${quiz.title} ${quiz.subjectLabel} ${quiz.levelLabel} ${quiz.topicLabels.join(" ")}`.toLowerCase().includes(normalizedSearch)) && canUseInScope(quiz.scope, contentScope);
  }), [contentScope, debouncedSearchValue, quizzes]);
  const visibleQuizzes = useMemo(() => searchedQuizzes.filter((quiz) => quizKind === "all" || quiz.kind === quizKind), [quizKind, searchedQuizzes]);
  const quizKindCounts = useMemo(() => ({ all: searchedQuizzes.length, train: searchedQuizzes.filter((quiz) => quiz.kind === "train").length, test: searchedQuizzes.filter((quiz) => quiz.kind === "test").length }), [searchedQuizzes]);
  const quizPackageEditQuestions = useMemo(() => quizPackageEdit ? getQuizPackageQuestions(quizPackageEdit.quiz, quizQuestionSlides(quizPackageEdit.doc.tree), questionCache) : [], [questionCache, quizPackageEdit]);
  const quickViewQuizQuestions = useMemo(() => quickViewQuiz?.questionIds.map((questionId) => questionCache[questionId]) ?? [], [questionCache, quickViewQuiz]);

  const pickSubject = (nextSubjectId: string) => { const nextSubject = findQuestionBankSubject(subjects, nextSubjectId); setSubjectId(nextSubject.id); setLevelId(nextSubject.levels[0]?.id ?? ""); };
  const pickLevel = (nextLevelId: string) => setLevelId(nextLevelId);
  // Callers ask first with ErgConfirmDialog (a browser confirm() is blocked in embedded views).
  const deleteQuiz = async (quiz: QuizBankItem) => { try { await deleteQuizMutation.mutateAsync(quiz.id); toast.success(copy.deleteQuizSuccess); setQuickViewQuiz((current) => (current?.id === quiz.id ? null : current)); } catch (error) { toast.error(error instanceof Error ? error.message : copy.deleteQuizError); } };

  // Publishes the server draft as it stands; the server checks every question and refuses with the reasons.
  const publishQuiz = async (quiz: QuizBankItem) => {
    try {
      const { docVersion } = await loadQuizEditorDraft(quiz.id);
      await publishQuizMutation.mutateAsync({ quizId: quiz.id, docVersion, idempotencyKey: `quiz-bank-publish:${quiz.id}:${docVersion}` });
      toast.success(copy.publishQuizSuccess);
    } catch (error) {
      toast.error(copy.publishQuizError, { description: publishErrorLines(error) });
    }
  };

  return { activeLevel, activeSubject, changeSearch: setSearchValue, deleteQuiz, deleteQuizMutation, isQuestionBankFetching, openUpdateQuizPackage, openingQuizId, pickLevel, pickSubject, publishQuiz, publishQuizMutation, questionBankQuery, quickViewQuiz, quickViewQuizQuestions, quizKind, quizKindCounts, quizPackageEdit, quizPackageEditQuestions, savingQuizPackage, searchValue, setQuickViewQuiz, setQuizKind, setQuizPackageEdit, submitUpdateQuizPackage, subjects, visibleQuizzes };
}

/** The server's per-question reasons (up to 3), else its message. */
function publishErrorLines(error: unknown) {
  const details = error instanceof ApiClientError && Array.isArray(error.details) ? error.details : [];
  const lines = details.flatMap((item: unknown) => {
    const message = typeof item === "string" ? item : (item as { message?: unknown } | null)?.message;
    return typeof message === "string" ? [message] : [];
  });
  return lines.length ? lines.slice(0, 3).join(" · ") : error instanceof Error ? error.message : undefined;
}
function canUseInScope(itemScope: ContentScope, activeScope: ContentScope) { if (activeScope.type === "global") return itemScope.type === "global"; return itemScope.type === "global" || itemScope.centerId === activeScope.centerId; }
/** The dialog lists the draft's question slides, keyed like their points; bank data fills in when cached. */
function getQuizPackageQuestions(quiz: QuizBankItem, slides: QuizEditorSlide[], cache: Record<string, QuestionBankQuestion>) {
  return slides.map((slide, index) => { const key = quizSlideKey(slide); return { ...(cache[key] ?? createQuizPackageQuestionFallback(quiz, key, index)), id: key, stem: cache[key]?.stem ?? (slide.title || `Câu hỏi ${index + 1}`) }; });
}
function createQuizPackageQuestionFallback(quiz: QuizBankItem, questionId: string, index: number): QuestionBankQuestion {
  const categoryLabel = quiz.topicLabels[0] ?? "Chủ đề";
  return { id: questionId, scope: quiz.scope, subjectId: quiz.subjectId, subjectLabel: quiz.subjectLabel, levelId: quiz.levelId, levelLabel: quiz.levelLabel, categoryId: quiz.categoryId ?? "", categoryLabel, gradeLabel: quiz.levelLabel, type: "multiple-choice", difficulty: "core", status: "ready", stem: `Câu hỏi ${index + 1}`, objective: "", tags: [], masteryRate: 0, usageCount: 0, schoolsUsing: 0, lastUsedAt: "", recommendedCluster: categoryLabel };
}
function findQuestionBankSubject(subjects: QuestionBankSubject[], subjectId: QuestionBankSubjectId) { return subjects.find((subject) => subject.id === subjectId) ?? subjects[0] ?? { id: "", label: "", description: "", companyScopeLabel: "", levels: [], categories: [] }; }
function findQuestionBankLevel(subject: QuestionBankSubject, levelId: string) { return subject.levels.find((level) => level.id === levelId) ?? subject.levels[0] ?? { id: "", label: "", description: "", categoryIds: [] }; }
