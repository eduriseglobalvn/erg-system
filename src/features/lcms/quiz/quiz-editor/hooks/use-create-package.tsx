import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import type { CreateQuizFromBankOptions } from "@/features/lcms/create-quiz-from-bank";
import { levelBankQuestionsQueryKey, type RowBankEntry } from "@/features/lcms/quiz/quiz-editor/hooks/use-level-bank-questions";
import { createQuestionBankPlayerTemplate } from "@/features/question-bank/api/question-bank-to-quiz";
import { questionBankCopyFor } from "@/features/question-bank/components/question-bank-copy";
import { QuizCreatePackageDialog, type QuizCreateDraft } from "@/features/question-bank/components/quiz-create-package-dialog";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import { useI18n } from "@/platform/i18n";

/**
 * "Tạo gói bài tập" from the ticked rows. A package holds bank rows, i.e. each question as last published; a row with
 * none yet (never published, or in the topicless quiz) is left out and said so.
 */
export function useCreatePackage({ subjectId, levelId, onCreate }: {
  subjectId: string;
  levelId: string | null;
  onCreate?: (questions: QuestionBankQuestion[], options?: CreateQuizFromBankOptions) => Promise<void> | void;
}) {
  const { locale } = useI18n();
  const copy = questionBankCopyFor(locale);
  const queryClient = useQueryClient();
  const [state, setState] = useState<{ questions: QuestionBankQuestion[]; draft: QuizCreateDraft; onDone: () => void } | null>(null);

  function open(entries: readonly (RowBankEntry | null)[], onDone: () => void) {
    const questions = [...new Map(entries.flatMap((entry) => (entry ? [[entry.question.id, entry.question] as const] : []))).values()];
    const missing = entries.filter((entry) => !entry).length;
    if (!questions.length) {
      toast.error("Các câu đã chọn chưa có trong ngân hàng: xuất bản chủ đề của chúng trước (câu chưa có chủ đề thì xếp vào chủ đề).");
      return;
    }
    if (missing) toast.warning(`${missing} câu chưa có trong ngân hàng (chưa xuất bản hoặc chưa có chủ đề) nên không vào gói.`);
    const first = questions[0]!;
    setState({
      questions,
      onDone,
      draft: {
        title: `${first.subjectLabel} - ${first.levelLabel}`,
        kind: "train",
        timeLimitEnabled: false,
        timeLimitMinutes: 20,
        passingRate: 80,
        pointsMode: "equal",
        questionPoints: {},
        acceptPartial: false,
        playerTemplate: createQuestionBankPlayerTemplate(),
        shuffleQuestions: false,
        shuffleAnswers: true,
      },
    });
  }

  async function submit() {
    if (!state || !onCreate) return;
    const title = state.draft.title.trim();
    if (!title) {
      toast.error(copy.quizTitleRequired);
      return;
    }
    const { timeLimitEnabled, timeLimitMinutes, ...options } = state.draft;
    setState(null);
    state.onDone();
    await onCreate(state.questions, { ...options, title, timeLimitMinutes: timeLimitEnabled ? timeLimitMinutes : 0 });
    void queryClient.invalidateQueries({ queryKey: levelBankQuestionsQueryKey(subjectId, levelId) });
  }

  const dialog = state ? (
    <QuizCreatePackageDialog
      copy={copy}
      draft={state.draft}
      questions={state.questions}
      onChange={(draft) => setState((current) => (current ? { ...current, draft } : current))}
      onClose={() => setState(null)}
      onSubmit={() => void submit()}
    />
  ) : null;

  return { open: onCreate ? open : undefined, dialog };
}
