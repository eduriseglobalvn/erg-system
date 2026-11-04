import type { QuizEditorDraftDocument, QuizEditorWorkspaceData } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import type { QuestionBankSubject } from "@/features/question-bank/types/question-bank-types";
import type { QuizEditorSlide, QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

type QuizSummary = QuizEditorWorkspaceData["quizzes"]["items"][number];

export function createClientIdempotencyKey(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}:${crypto.randomUUID()}`;
  }
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 10)}`;
}

export function isLegacyMockDraft(doc?: QuizEditorDraftDocument | null): boolean {
  if (!doc?.tree?.length) return false;
  const slides = doc.tree.flatMap((g) => g.slides);
  return slides.some((s) => s.id === "slide-elearning-json-intro" || s.id === "slide-matching" || s.id.startsWith("lcms-q") || s.id === "slide-intro-1");
}

export function findScopeMatchingDraft(
  items: QuizSummary[] | undefined,
  selectedCourseId: string,
  selectedLevelId: string | null,
  selectedTopicId: string,
): QuizSummary | null {
  if (!items || items.length === 0 || !selectedCourseId) return null;

  if (selectedTopicId !== "all") {
    const topicMatch = items.find(
      (q) => q.status === "draft" && q.subjectId === selectedCourseId && (!selectedLevelId || q.levelId === selectedLevelId) && q.categoryId === selectedTopicId,
    );
    if (topicMatch) return topicMatch;
  }

  if (selectedLevelId) {
    const levelMatch = items.find(
      (q) => q.status === "draft" && q.subjectId === selectedCourseId && q.levelId === selectedLevelId,
    );
    if (levelMatch) return levelMatch;
  }

  return items.find((q) => q.status === "draft" && q.subjectId === selectedCourseId) ?? null;
}

/** Scope fields sent when a not-yet-saved quiz is created on first save/publish. */
export function resolveNewQuizScope(
  subjects: QuestionBankSubject[],
  selectedCourseId: string,
  selectedLevelId: string | null,
  selectedTopicId: string,
) {
  const currentSubject = subjects.find((s) => s.id === selectedCourseId) || subjects[0];
  const subjectId = selectedCourseId || currentSubject?.id || undefined;
  const validLevel = currentSubject?.levels.find((lvl) => lvl.id === selectedLevelId);
  const validTopic = selectedTopicId !== "all"
    ? currentSubject?.categories.find((cat) => cat.id === selectedTopicId)
    : undefined;
  return {
    subjectId,
    levelId: validLevel ? validLevel.id : undefined,
    categoryId: validTopic ? validTopic.id : undefined,
    subtitle: validTopic?.label,
  };
}

export function createQuizInformationSlide(quizProject: QuizProjectSettings): QuizEditorSlide | null {
  if (!quizProject.info.showIntroductionPage) {
    return null;
  }

  return {
    id: "quiz-information-slide",
    title: quizProject.info.page.courseTitle || quizProject.info.title,
    kind: "info-slide",
    description: quizProject.info.introduction,
    instructions: quizProject.info.introduction ? [quizProject.info.introduction] : [],
    infoPage: quizProject.info.page,
  };
}

export function createConfiguredResultSlide(
  resultSlide: QuizEditorSlide,
  quizProject: QuizProjectSettings,
): QuizEditorSlide {
  return {
    ...resultSlide,
    feedbackRows: [
      {
        id: "result-pass-message",
        kind: "correct",
        feedback: quizProject.result.passMessage,
        score: 0,
        branching: "By Result",
      },
      {
        id: "result-fail-message",
        kind: "incorrect",
        feedback: quizProject.result.failMessage,
        score: 0,
        branching: "By Result",
      },
    ],
  };
}
