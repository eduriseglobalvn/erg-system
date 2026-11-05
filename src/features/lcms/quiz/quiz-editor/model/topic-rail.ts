import type { QuizEditorDraftDocument, QuizEditorSummary } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { fingerprintedSlides, quizLifecycle, type QuizLifecycle } from "@/features/lcms/quiz/quiz-editor/model/quiz-publish-state";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export type TopicRow = {
  id: string;
  label: string;
  quizId: string | null;
  questionCount: number;
  lifecycle: QuizLifecycle;
  slides: QuizEditorSlide[];
};

/** The topic's current quiz: the latest non-deleted one (ISO timestamps compare as text). */
function latestQuizByTopic(summaries: readonly QuizEditorSummary[]) {
  const latest = new Map<string, QuizEditorSummary>();
  for (const summary of summaries) {
    if (!summary.categoryId || summary.status === "deleted") continue;
    const current = latest.get(summary.categoryId);
    if (!current || (summary.updatedAt ?? "") > (current.updatedAt ?? "")) latest.set(summary.categoryId, summary);
  }
  return latest;
}

export function buildTopicRail(
  topics: readonly { id: string; label: string }[],
  summaries: readonly QuizEditorSummary[],
  drafts: Readonly<Record<string, QuizEditorDraftDocument | undefined>>,
): TopicRow[] {
  const latest = latestQuizByTopic(summaries);
  return topics.map(({ id, label }) => {
    const summary = latest.get(id);
    if (!summary) return { id, label, quizId: null, questionCount: 0, lifecycle: "none", slides: [] };
    const draft = drafts[summary.id];
    const slides = fingerprintedSlides(draft?.tree.flatMap((group) => group.slides) ?? []);
    return {
      id,
      label,
      quizId: summary.id,
      questionCount: draft ? slides.length : summary.questionCount,
      // Before the draft loads, the server status is all there is.
      lifecycle: quizLifecycle({ quizId: summary.id, serverStatus: summary.status ?? null, settings: draft?.settings ?? {}, slides }),
      slides,
    };
  });
}
