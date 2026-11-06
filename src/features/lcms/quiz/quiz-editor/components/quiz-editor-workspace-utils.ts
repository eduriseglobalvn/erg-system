import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import type { QuestionBankSubject } from "@/features/question-bank/types/question-bank-types";

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
