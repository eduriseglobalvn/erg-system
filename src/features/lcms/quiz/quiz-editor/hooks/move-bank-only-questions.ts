import type { QueryClient } from "@tanstack/react-query";

import { loadQuizEditorDraft } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { quizEditorLevelQuizzesQueryOptions } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-query";
import { moveQuestionsToTopic } from "@/features/lcms/quiz/quiz-editor/hooks/move-questions-to-topic";
import type { QuizEditorSlide, QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { loadQuestionBankData } from "@/features/question-bank/api/question-bank-api";
import { createQuizSlideFromBankQuestion } from "@/features/question-bank/api/question-bank-to-quiz";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

type Level = { subjectId: string; levelId: string };
type Topic = { id: string; label: string };

/**
 * The Level's questions that live only in the bank: made in the bank (not mirrored by the quiz editor on publish)
 * and held by no quiz of the Level yet. Every quiz's draft is read from the server, plus the open quiz's unsaved
 * slides, so a question already moved is never moved twice.
 */
export async function findBankOnlyQuestions(queryClient: QueryClient, { subjectId, levelId }: Level, liveSlides: readonly QuizEditorSlide[]) {
  const summaries = await queryClient.fetchQuery({ ...quizEditorLevelQuizzesQueryOptions({ subjectId, levelId }), staleTime: 0 });
  const drafts = await Promise.all(summaries.filter((summary) => summary.status !== "deleted").map((summary) => loadQuizEditorDraft(summary.id)));
  const held = new Set(
    [...drafts.flatMap((draft) => draft.tree.flatMap((group) => group.slides)), ...liveSlides].flatMap((slide) => [slide.bankQuestionId, slide.questionId]),
  );
  const found: QuestionBankQuestion[] = [];
  for (let page = 0; ; page += 1) {
    const data = await loadQuestionBankData(undefined, { subjectId, levelId, page, size: 50 });
    found.push(...data.questions.filter((question) => !question.fromQuizEditor && !held.has(question.id)));
    if (!data.questionPage.hasNext) return found;
  }
}

/**
 * Puts each question into its own topic's quiz (saved on the server), and one without a topic of this Level into the
 * open topicless quiz through `importLoose`. The slides keep the bank id, so publishing links the same bank row:
 * its usage stays and no copy is made.
 */
export async function moveBankOnlyQuestions(queryClient: QueryClient, { level, topics, questions, createId, questionDefaults, importLoose }: {
  level: Level;
  topics: readonly Topic[];
  questions: readonly QuestionBankQuestion[];
  createId: (prefix: string) => string;
  questionDefaults: QuizProjectSettings["questionDefaults"];
  importLoose: (questions: QuestionBankQuestion[]) => void;
}) {
  for (const topic of topics) {
    const own = questions.filter((question) => question.topicId === topic.id);
    if (!own.length) continue;
    const slides = own.map((question) => createQuizSlideFromBankQuestion(question, createId, questionDefaults));
    await moveQuestionsToTopic(queryClient, { ...level, topicId: topic.id, topicLabel: topic.label }, slides);
  }
  const loose = questions.filter((question) => !topics.some((topic) => topic.id === question.topicId));
  if (loose.length) importLoose(loose);
}
