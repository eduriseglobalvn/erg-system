import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { QuestionListRow } from "@/features/lcms/quiz/quiz-editor/components/quiz-list/question-table-row";
import { loadQuestionBankData } from "@/features/question-bank/api/question-bank-api";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

export const levelBankQuestionsQueryKey = (subjectId: string, levelId: string | null) => ["quiz-editor", "level-bank-questions", subjectId, levelId] as const;

/** A list row's bank row and how many packages use it. */
export type RowBankEntry = { question: QuestionBankQuestion; packages: number };

/** Every bank row of the Level, page by page. */
async function loadLevelBankQuestions(subjectId: string, levelId: string) {
  const found: QuestionBankQuestion[] = [];
  for (let page = 0; ; page += 1) {
    const data = await loadQuestionBankData(undefined, { subjectId, levelId, page, size: 50 });
    found.push(...data.questions);
    if (!data.questionPage.hasNext) return found;
  }
}

/**
 * The bank row behind each list row. A slide made from a bank row carries its id; a slide authored here is found by
 * the quiz and slide its published copy came from (so it has none until its topic is published, and a topicless
 * quiz is never copied to the bank). Usage counts every quiz holding the row: a linked slide's own topic quiz is one
 * of them, so it is not a package.
 */
export function bankEntryFor(row: QuestionListRow, openQuizId: string, byId: ReadonlyMap<string, QuestionBankQuestion>, bySource: ReadonlyMap<string, QuestionBankQuestion>): RowBankEntry | null {
  const linkedId = row.slide.bankQuestionId ?? row.slide.questionId;
  const linked = linkedId ? byId.get(linkedId) : undefined;
  if (linked) return { question: linked, packages: Math.max(0, linked.usageCount - 1) };
  const mirrored = bySource.get(`${row.topic?.quizId ?? openQuizId}:${row.slide.id}`);
  return mirrored ? { question: mirrored, packages: mirrored.usageCount } : null;
}

export function useLevelBankQuestions({ subjectId, levelId, openQuizId, rows }: {
  subjectId: string;
  levelId: string | null;
  openQuizId: string;
  rows: readonly QuestionListRow[];
}) {
  const query = useQuery({
    queryKey: levelBankQuestionsQueryKey(subjectId, levelId),
    queryFn: () => loadLevelBankQuestions(subjectId, levelId!),
    enabled: Boolean(subjectId && levelId),
  });
  return useMemo(() => {
    const questions = query.data ?? [];
    const byId = new Map(questions.map((question) => [question.id, question]));
    const bySource = new Map(questions.flatMap((question) => question.sourceQuizId && question.sourceSlideId ? [[`${question.sourceQuizId}:${question.sourceSlideId}`, question] as const] : []));
    return new Map(rows.map((row) => [row, bankEntryFor(row, openQuizId, byId, bySource)]));
  }, [query.data, rows, openQuizId]);
}
