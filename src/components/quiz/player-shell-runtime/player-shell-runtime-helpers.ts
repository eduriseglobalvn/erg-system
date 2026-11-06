import type { QuizRuntimePortal } from "@/domain/quiz/quiz-runtime-types";
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
          : "Dùng Quay lại / Tiếp theo để rà soát bài trước khi nộp.";
}
