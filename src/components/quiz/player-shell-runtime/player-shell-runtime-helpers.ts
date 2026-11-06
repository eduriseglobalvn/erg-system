import type { QuizRuntimePortal } from "@/domain/quiz/quiz-runtime-types";
import type { AnswerPayload, Question } from "@/domain/quiz/types";
import { questionGridLayout } from "@/components/quiz/question-grid-layout";
import type { QuestionCell } from "@/components/quiz/question-navigator";
import { isEventRecord } from "@/components/quiz/player-shell-runtime-model";
import type { LocalQuizAttemptSession } from "@/domain/quiz/quiz-runtime-types";

export function offlineAttemptScope(scope: { accountId?: string | null; tenantId?: string | null; portal?: QuizRuntimePortal | null }, runtimePortal: QuizRuntimePortal) {
  return {
    accountId: scope.accountId ?? "",
    tenantId: scope.tenantId ?? "",
    workspace: scope.portal ?? runtimePortal,
  };
}

export function buildReconnectSignature(activeSession: Pick<LocalQuizAttemptSession, "attemptId" | "clientEvents">) {
  const lastEvent = activeSession.clientEvents.at(-1);
  return `${activeSession.attemptId}:${activeSession.clientEvents.length}:${String(
    isEventRecord(lastEvent) ? lastEvent.id : "",
  )}`;
}

export function buildFooterMessage({
  reviewingAttempt,
  submitFailed,
  allQuestionsAnswered,
  isTrainingMode,
}: {
  reviewingAttempt: boolean;
  submitFailed: boolean;
  allQuestionsAnswered: boolean;
  isTrainingMode: boolean;
}) {
  return reviewingAttempt
    ? "Đang xem lại kết quả. Màu xanh là đáp án đúng, màu đỏ/cam là câu trả lời cần sửa."
    : submitFailed
      ? "Nộp bài chưa thành công. Câu trả lời vẫn được lưu trên thiết bị này, bạn có thể thử lại."
      : allQuestionsAnswered
        ? "Tất cả câu hỏi đã có câu trả lời. Bạn có thể nộp bài."
        : isTrainingMode
          ? "Chọn đáp án rồi bấm Nộp bài cho từng câu. Có thể dùng mục lục để chuyển câu."
          : "Dùng Câu trước / Câu tiếp để rà soát bài trước khi nộp.";
}

/** Grid cells while taking: `answered` stays true on the current cell so the "Chưa làm" count is right. Pass -1 before the quiz starts. */
export function buildTakingCells(total: number, answered: ReadonlySet<number>, flagged: ReadonlySet<number>, current: number): QuestionCell[] {
  return Array.from({ length: total }, (_, index) => ({
    index,
    state: index === current ? "current" : answered.has(index) ? "done" : "todo",
    flagged: flagged.has(index),
    answered: answered.has(index),
  }));
}

type ChoiceQuestion = Pick<Question, "kind" | "choices">;

const MAX_PICK_KEYS = 9;

function isPickable(question: ChoiceQuestion) {
  return question.kind === "single_choice" || question.kind === "true_false" || question.kind === "multiple_response";
}

/** Answer after pressing the key for the i-th choice, same as clicking it. Null when there is nothing to pick. */
export function pickChoiceAnswer(question: ChoiceQuestion, value: AnswerPayload, index: number): AnswerPayload | null {
  const choice = isPickable(question) ? question.choices?.[index] : undefined;
  if (!choice) return null;
  if (question.kind !== "multiple_response") return { choiceId: choice.id };
  const next = new Set(value.choiceIds ?? []);
  if (!next.delete(choice.id)) next.add(choice.id);
  return { choiceIds: [...next] };
}

/** Hint row under the question card; lists only the keys that are wired for this question. */
export function buildKeyHint(question: ChoiceQuestion, total: number) {
  const count = isPickable(question) ? Math.min(question.choices?.length ?? 0, MAX_PICK_KEYS) : 0;
  return [
    count > 0 ? `${count === 1 ? "1" : `1–${count}`} chọn` : null,
    "← → đổi câu",
    "F đánh dấu",
    questionGridLayout(total, "web").showGoTo ? "N đi tới câu" : null,
  ].filter(Boolean).join(" · ");
}
