import type { QuizEditorDraftDocument, QuizEditorSummary } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { fingerprintedSlides, quizLifecycle, type QuizLifecycle } from "@/features/lcms/quiz/quiz-editor/model/quiz-publish-state";
import type { QuizEditorSlide, QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export type TopicRow = {
  id: string;
  label: string;
  quizId: string | null;
  questionCount: number;
  lifecycle: QuizLifecycle;
  slides: QuizEditorSlide[];
};

/** The quiz open in the editor: its live state, ahead of the server draft until the next autosave lands. */
export type OpenQuiz = { quizId: string; topicId: string; settings: QuizProjectSettings; slides: QuizEditorSlide[] };

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
  openQuiz: OpenQuiz | null = null,
): TopicRow[] {
  const latest = latestQuizByTopic(summaries);
  return topics.map(({ id, label }) => {
    const summary = latest.get(id);
    // A quiz this tab just created is open before the workspace refetch lists it: it claims its topic.
    const open = openQuiz && (summary ? openQuiz.quizId === summary.id : openQuiz.topicId === id) ? openQuiz : null;
    if (!summary && !open) return { id, label, quizId: null, questionCount: 0, lifecycle: "none", slides: [] };
    const quizId = summary?.id ?? open!.quizId;
    const draft = drafts[quizId];
    const slides = fingerprintedSlides(open?.slides ?? draft?.tree.flatMap((group) => group.slides) ?? []);
    return {
      id,
      label,
      quizId,
      questionCount: open || draft ? slides.length : (summary?.questionCount ?? 0),
      // Before the draft loads, the server status is all there is.
      lifecycle: quizLifecycle({ quizId, serverStatus: summary?.status ?? null, settings: open?.settings ?? draft?.settings ?? {}, slides }),
      slides,
    };
  });
}
