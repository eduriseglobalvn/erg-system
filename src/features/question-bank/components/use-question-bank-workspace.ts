import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { CreateQuizFromBankOptions } from "@/features/lcms/create-quiz-from-bank";
import { createQuestionBankPlayerTemplate } from "@/features/question-bank/api/question-bank-to-quiz";
import {
  useCreateQuestionBankQuestionMutation,
  useDeleteQuestionBankQuestionMutation,
  useQuestionBankWorkspaceQuery,
  useUpdateQuestionBankQuestionMutation,
} from "@/features/question-bank/api/question-bank-query";
import { useDeleteQuizEditorQuizMutation } from "@/features/lcms/quiz/quiz-editor";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { QuestionBankApiData, QuestionBankSaveQuestionInput } from "@/features/question-bank/api/question-bank-api";
import type { QuestionBankChoice, QuestionBankQuestion, QuestionBankSubject, QuestionBankSubjectId, QuizBankItem, QuizBankKind } from "@/features/question-bank/types/question-bank-types";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import type { ContentScope } from "@/types/scope-types";
import type { QuestionBankCopy } from "./question-bank-copy";
import type { QuestionFormDraft, QuestionFormMode } from "./question-bank-workspace-types";
import type { QuizCreateDraft } from "./quiz-create-package-dialog";
import { buildDuplicateQuestionInput } from "./question-quick-view-model";
import { quizQuestionSlides, quizSlideKey } from "./quiz-package-draft";
import { useQuizPackageEdit } from "./use-quiz-package-edit";

type QuizKindFilter = "all" | QuizBankKind;

const EMPTY_QUESTION_DRAFT: QuestionFormDraft = { stem: "", objective: "", type: "multiple-choice", difficulty: "core", status: "ready", tagsText: "", choiceA: "", choiceB: "", choiceC: "", choiceD: "", answer: "a" };
const NEW_QUIZ_SETTINGS = { passingRate: 80, pointsMode: "equal", questionPoints: {}, acceptPartial: false, shuffleAnswers: true } satisfies Partial<QuizCreateDraft>;
const EMPTY_QUESTION_BANK_DATA: QuestionBankApiData = { questions: [], quizzes: [], subjects: [], questionPage: { page: 0, size: 50, totalItems: 0, totalPages: 0, hasNext: false, hasPrevious: false } };

export function useQuestionBankWorkspaceController({ activeLeaf, contentScope, copy, onCreateQuiz }: {
  activeLeaf: DashboardLeaf;
  contentScope: ContentScope;
  copy: QuestionBankCopy;
  onCreateQuiz: (questions: QuestionBankQuestion[], options?: CreateQuizFromBankOptions) => void;
}) {
  const view = activeLeaf.variant === "quiz-bank" ? "quizzes" : "questions";
  const [subjectId, setSubjectId] = useState<QuestionBankSubjectId>("");
  const [levelId, setLevelId] = useState("");
  const [topicId, setTopicId] = useState("all");
  const [quizKind, setQuizKind] = useState<QuizKindFilter>("all");
  const [questionPage, setQuestionPage] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [questionCache, setQuestionCache] = useState<Record<string, QuestionBankQuestion>>({});
  const [autoTopicIds, setAutoTopicIds] = useState<string[]>([]);
  const [autoCount, setAutoCount] = useState(10);
  const deleteQuizMutation = useDeleteQuizEditorQuizMutation();
  const { openUpdateQuizPackage, openingQuizId, quizPackageEdit, savingQuizPackage, setQuizPackageEdit, submitUpdateQuizPackage } = useQuizPackageEdit(copy);
  const createQuestionMutation = useCreateQuestionBankQuestionMutation();
  const updateQuestionMutation = useUpdateQuestionBankQuestionMutation();
  const deleteQuestionMutation = useDeleteQuestionBankQuestionMutation();
  const [quickViewQuestion, setQuickViewQuestion] = useState<QuestionBankQuestion | null>(null);
  const [quickViewQuiz, setQuickViewQuiz] = useState<QuizBankItem | null>(null);
  const [questionForm, setQuestionForm] = useState<{ mode: QuestionFormMode; question?: QuestionBankQuestion; draft: QuestionFormDraft } | null>(null);
  const [quizCreateDraft, setQuizCreateDraft] = useState<QuizCreateDraft | null>(null);
  const debouncedSearchValue = useDebouncedValue(searchValue);
  const questionBankFilters = useMemo(() => ({
    includeQuestions: true,
    levelId: view === "questions" ? levelId || undefined : undefined,
    page: view === "questions" ? questionPage : 0,
    quizKind: view === "quizzes" && quizKind !== "all" ? quizKind : undefined,
    search: debouncedSearchValue || undefined,
    size: 50,
    status: view === "questions" ? "ready" : undefined,
    subjectId: view === "questions" ? subjectId || undefined : undefined,
    topicId: view === "questions" && topicId !== "all" ? topicId : undefined,
  }), [debouncedSearchValue, levelId, questionPage, quizKind, subjectId, topicId, view]);
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
  useEffect(() => { setQuestionPage(0); }, [debouncedSearchValue, levelId, subjectId, topicId, view]);
  useEffect(() => {
    const nextSubject = subjects.find((subject) => subject.id === subjectId) ?? subjects[0];
    if (!nextSubject) return;
    const nextLevel = nextSubject.levels.find((level) => level.id === levelId) ?? nextSubject.levels[0];
    const nextLevelId = nextLevel?.id ?? "";
    const topicStillExists = topicId === "all" || nextSubject.categories.some((category) => category.id === topicId && category.levelId === nextLevelId);
    if (nextSubject.id !== subjectId) setSubjectId(nextSubject.id);
    if (nextLevelId !== levelId) setLevelId(nextLevelId);
    if (!topicStillExists) setTopicId("all");
    const nextAutoTopicIds = getDefaultAutoTopicIds(subjects, nextSubject.id, nextLevelId);
    setAutoTopicIds((current) => {
      const currentStillValid = current.length > 0 && current.every((id) => nextSubject.categories.some((category) => category.id === id && category.levelId === nextLevelId));
      return currentStillValid || arraysEqual(current, nextAutoTopicIds) ? current : nextAutoTopicIds;
    });
  }, [levelId, subjectId, subjects, topicId]);

  const activeSubject = useMemo(() => findQuestionBankSubject(subjects, subjectId), [subjectId, subjects]);
  const activeLevel = useMemo(() => findQuestionBankLevel(activeSubject, levelId), [activeSubject, levelId]);
  const levelTopics = useMemo(() => activeSubject.categories.filter((category) => category.levelId === activeLevel.id), [activeLevel.id, activeSubject.categories]);
  const visibleQuestions = useMemo(() => questions.filter((question) => (!subjectId || question.subjectId === subjectId) && (!activeLevel.id || question.levelId === activeLevel.id) && (topicId === "all" || question.categoryId === topicId) && canUseInScope(question.scope, contentScope)), [activeLevel.id, contentScope, questions, subjectId, topicId]);
  const selectedQuestions = useMemo(() => selectedIds.map((id) => questionCache[id]).filter((question): question is QuestionBankQuestion => Boolean(question) && canUseInScope(question.scope, contentScope)), [contentScope, questionCache, selectedIds]);
  // shortcut: picks only from the loaded page (up to 50 questions of the current filter); move to a server-side random pick when the API offers one.
  const autoPickCandidates = useMemo(() => questions.filter((question) => question.subjectId === subjectId && question.levelId === activeLevel.id && question.status === "ready" && canUseInScope(question.scope, contentScope) && autoTopicIds.includes(question.categoryId)).sort((left, right) => pseudoRandomScore(left.id) - pseudoRandomScore(right.id)), [activeLevel.id, autoTopicIds, contentScope, questions, subjectId]);
  const autoPickedQuestions = useMemo(() => autoPickCandidates.slice(0, autoCount), [autoCount, autoPickCandidates]);
  const searchedQuizzes = useMemo(() => quizzes.filter((quiz) => {
    const normalizedSearch = debouncedSearchValue.trim().toLowerCase();
    return (!normalizedSearch || `${quiz.title} ${quiz.subjectLabel} ${quiz.levelLabel} ${quiz.topicLabels.join(" ")}`.toLowerCase().includes(normalizedSearch)) && canUseInScope(quiz.scope, contentScope);
  }), [contentScope, debouncedSearchValue, quizzes]);
  const visibleQuizzes = useMemo(() => searchedQuizzes.filter((quiz) => quizKind === "all" || quiz.kind === quizKind), [quizKind, searchedQuizzes]);
  const quizKindCounts = useMemo(() => ({ all: searchedQuizzes.length, train: searchedQuizzes.filter((quiz) => quiz.kind === "train").length, test: searchedQuizzes.filter((quiz) => quiz.kind === "test").length }), [searchedQuizzes]);
  const quizPackageEditQuestions = useMemo(() => quizPackageEdit ? getQuizPackageQuestions(quizPackageEdit.quiz, quizQuestionSlides(quizPackageEdit.doc.tree), questionCache) : [], [questionCache, quizPackageEdit]);
  const quickViewQuizQuestions = useMemo(() => quickViewQuiz?.questionIds.map((questionId) => questionCache[questionId]) ?? [], [questionCache, quickViewQuiz]);
  const getTopicQuestionCount = (categoryId: string, targetLevelId = activeLevel.id) => questions.filter((question) => question.subjectId === subjectId && question.levelId === targetLevelId && question.categoryId === categoryId && canUseInScope(question.scope, contentScope)).length;

  const pickSubject = (nextSubjectId: string) => { const nextSubject = findQuestionBankSubject(subjects, nextSubjectId); const nextLevel = nextSubject.levels[0]; setSubjectId(nextSubject.id); setLevelId(nextLevel.id); setTopicId("all"); setAutoTopicIds(getDefaultAutoTopicIds(subjects, nextSubject.id, nextLevel.id)); setSelectedIds([]); };
  const pickLevel = (nextLevelId: string) => { setLevelId(nextLevelId); setTopicId("all"); setAutoTopicIds(getDefaultAutoTopicIds(subjects, subjectId, nextLevelId)); setSelectedIds([]); };
  const pickTopic = (nextTopicId: string) => { setTopicId(nextTopicId); setSelectedIds([]); };
  const changeSearch = (nextSearchValue: string) => { setSearchValue(nextSearchValue); setSelectedIds([]); };
  const toggleQuestion = (questionId: string) => setSelectedIds((current) => current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId]);
  const toggleVisibleQuestions = () => {
    const visibleIds = visibleQuestions.map((question) => question.id); if (!visibleIds.length) return;
    setSelectedIds((current) => { const visibleIdSet = new Set(visibleIds); return visibleIds.every((id) => current.includes(id)) ? current.filter((id) => !visibleIdSet.has(id)) : Array.from(new Set([...current, ...visibleIds])); });
  };
  const toggleAutoTopic = (topicIdToToggle: string) => setAutoTopicIds((current) => current.includes(topicIdToToggle) ? current.filter((id) => id !== topicIdToToggle) : [...current, topicIdToToggle]);
  const applyAutoPick = () => { if (autoPickedQuestions.length < autoCount) return false; setSelectedIds(autoPickedQuestions.map((question) => question.id)); return true; };
  const clearSelection = () => setSelectedIds([]);
  const openCreateQuestionForm = () => setQuestionForm({ mode: "create", draft: EMPTY_QUESTION_DRAFT });
  const createQuizFromSelection = () => {
    if (!selectedQuestions.length) return; const firstQuestion = selectedQuestions[0];
    setQuizCreateDraft({ ...NEW_QUIZ_SETTINGS, kind: "train", title: `${firstQuestion.subjectLabel} - ${firstQuestion.levelLabel}`, playerTemplate: createQuestionBankPlayerTemplate(), shuffleQuestions: false, timeLimitEnabled: false, timeLimitMinutes: 20 });
  };
  const submitCreateQuizFromSelection = (draft: QuizCreateDraft) => {
    const title = draft.title.trim(); if (!title) { toast.error(copy.quizTitleRequired); return; } if (!selectedQuestions.length) return;
    const { timeLimitEnabled, timeLimitMinutes, ...options } = draft;
    onCreateQuiz(selectedQuestions, { ...options, title, timeLimitMinutes: timeLimitEnabled ? timeLimitMinutes : 0 }); setQuizCreateDraft(null);
  };
  const openEditQuestionForm = (question: QuestionBankQuestion) => onCreateQuiz([question], { kind: "train", title: `${question.subjectLabel} - ${question.levelLabel} - ${question.categoryLabel}`, passingScoreMode: "percent", passingScorePoints: 1000, passingRate: 100, shuffleAnswers: false, shuffleQuestions: false, timeLimitMinutes: 0 });
  const submitQuestionForm = async (draft: QuestionFormDraft) => {
    const targetTopicId = topicId === "all" ? levelTopics[0]?.id : topicId;
    if (!activeSubject.id || !activeLevel.id || !targetTopicId) { toast.error(copy.questionSaveMissingTaxonomy); return; }
    const payload: QuestionBankSaveQuestionInput = { questionId: questionForm?.question?.id, scopeType: contentScope.type === "global" ? "global" : "center", scopeId: contentScope.type === "center" ? contentScope.centerId : undefined, subjectId: activeSubject.id, levelId: activeLevel.id, topicId: targetTopicId, categoryId: targetTopicId, type: draft.type, stem: draft.stem.trim(), objective: draft.objective.trim(), difficulty: draft.difficulty, status: draft.status, tags: draft.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean), choices: buildQuestionChoices(draft), answer: draft.answer.trim() };
    if (!payload.stem) { toast.error(copy.questionSaveMissingStem); return; }
    try { if (questionForm?.mode === "edit") { await updateQuestionMutation.mutateAsync(payload); toast.success(copy.updateQuestionSuccess); } else { await createQuestionMutation.mutateAsync(payload); toast.success(copy.createQuestionSuccess); } setQuestionForm(null); } catch (error) { toast.error(error instanceof Error ? error.message : copy.saveQuestionError); }
  };
  // The quick view asks with its own dialog (confirmed = true); the row icon still uses window.confirm.
  const deleteQuiz = async (quiz: QuizBankItem, confirmed = false) => { if (!confirmed && !window.confirm(copy.confirmDeleteQuiz(quiz.title))) return; try { await deleteQuizMutation.mutateAsync(quiz.id); toast.success(copy.deleteQuizSuccess); setQuickViewQuiz((current) => (current?.id === quiz.id ? null : current)); } catch (error) { toast.error(error instanceof Error ? error.message : copy.deleteQuizError); } };

  // Errors reach the global mutation toast (MutationCache.onError); the drawer stays open.
  const deleteQuestion = async (question: QuestionBankQuestion) => {
    try { await deleteQuestionMutation.mutateAsync(question.id); } catch { return; }
    toast.success(copy.deleteQuestionSuccess); setQuickViewQuestion(null); setSelectedIds((current) => current.filter((id) => id !== question.id));
  };
  const duplicateQuestion = async (question: QuestionBankQuestion) => { try { await createQuestionMutation.mutateAsync(buildDuplicateQuestionInput(question)); } catch { return; } toast.success(copy.duplicateQuestionSuccess); };

  return { activeLevel, activeSubject, autoCount, autoPickAvailableCount: autoPickCandidates.length, autoPickedQuestions, clearSelection, openCreateQuestionForm, autoTopicIds, changeSearch, createQuestionMutation, createQuizFromSelection, deleteQuestion, deleteQuestionMutation, deleteQuiz, deleteQuizMutation, duplicateQuestion, getTopicQuestionCount, isQuestionBankFetching, levelTopics, openEditQuestionForm, openUpdateQuizPackage, openingQuizId, pickLevel, pickSubject, pickTopic, questionBankData, questionBankQuery, questionForm, quickViewQuestion, quickViewQuiz, quickViewQuizQuestions, quizCreateDraft, quizKind, quizKindCounts, quizPackageEdit, quizPackageEditQuestions, savingQuizPackage, selectedIds, selectedQuestions, setAutoCount, setQuestionForm, setQuestionPage, setQuickViewQuestion, setQuickViewQuiz, setQuizCreateDraft, setQuizKind, setQuizPackageEdit, submitCreateQuizFromSelection, submitQuestionForm, submitUpdateQuizPackage, searchValue, subjectId, subjects, toggleAutoTopic, toggleQuestion, toggleVisibleQuestions, topicId, updateQuestionMutation, applyAutoPick, view, visibleQuestions, visibleQuizzes };
}

function canUseInScope(itemScope: ContentScope, activeScope: ContentScope) { if (activeScope.type === "global") return itemScope.type === "global"; return itemScope.type === "global" || itemScope.centerId === activeScope.centerId; }
function arraysEqual(left: string[], right: string[]) { return left.length === right.length && left.every((value, index) => value === right[index]); }
function pseudoRandomScore(value: string) { return value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 97; }
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
function getDefaultAutoTopicIds(subjects: QuestionBankSubject[], subjectId: QuestionBankSubjectId, levelId: string) { return (subjects.find((subject) => subject.id === subjectId)?.categories ?? []).filter((category) => category.levelId === levelId).slice(0, 2).map((category) => category.id); }
function buildQuestionChoices(draft: QuestionFormDraft): QuestionBankChoice[] {
  const answer = draft.answer.trim().toLowerCase();
  return [["a", draft.choiceA], ["b", draft.choiceB], ["c", draft.choiceC], ["d", draft.choiceD]].filter(([, label]) => label.trim()).map(([id, label]) => ({ id, label: label.trim(), correct: id === answer }));
}
