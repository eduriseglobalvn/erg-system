import type { LocalQuizAttemptSession } from "@/features/lcms/quiz/quiz-runtime";
import type {
  AnswerPayload,
  AnswerRecord,
  Attempt,
  Question,
  Quiz,
  QuizPackage,
  QuizResultDisplay,
} from "@/lib/types";

export type PlayerLoadState =
  | { status: "loading" }
  | {
      status: "ready";
      attempt: Attempt;
      quizPackage: QuizPackage;
      restored: boolean;
      session: LocalQuizAttemptSession;
    }
  | { status: "error"; message: string };

export type SubmitDialogMode = "all-answered" | "confirm";

export const defaultResultDisplay: QuizResultDisplay = {
  passMessage: "Chúc mừng, bạn đã đạt!",
  failMessage: "Rất tiếc, bạn chưa đạt.",
  reviewButtonLabel: "XEM LẠI BÀI",
  thankYouMessage: "Cảm ơn bạn đã hoàn thành bài làm.",
  showReviewButton: true,
  submitAllPrompt: "Bạn đã trả lời hết câu hỏi. Bạn muốn nộp bài ngay không?",
  confirmSubmitPrompt: "Bạn chắc chắn muốn nộp bài và kết thúc lượt làm này chứ?",
  submitAllLabel: "NỘP BÀI",
  returnToQuizLabel: "QUAY LẠI BÀI",
  confirmYesLabel: "ĐỒNG Ý",
  confirmNoLabel: "HỦY",
};

export function applyTrainingQuestionResult({
  answer,
  attempt,
  question,
  questions,
  quiz,
  result,
}: {
  answer: AnswerPayload;
  attempt: Attempt;
  question: Question;
  questions: Question[];
  quiz: Quiz;
  result: AnswerRecord["result"];
}): Attempt {
  const answers: Record<string, AnswerRecord> = {
    ...attempt.answers,
    [question.id]: { questionId: question.id, input: answer, result },
  };
  const submittedCount = Object.keys(answers).length;
  const totalScore = Object.values(answers).reduce((sum, record) => sum + record.result.awardedPoints, 0);
  const maxScore = questions.reduce((sum, item) => sum + item.points, 0);
  const percent = maxScore > 0 ? Math.floor((totalScore / maxScore) * 100) : 0;
  return {
    ...attempt,
    answers,
    maxScore,
    passed: percent >= quiz.settings.passPercent,
    percent,
    submittedCount,
    totalQuestions: questions.length,
    totalScore,
  };
}

export function isEditableKeyboardTarget(target: EventTarget | null, key?: string) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tagName = target.tagName.toLowerCase();
  if (key === "Enter" && tagName === "input" && target.closest(".quiz-answer-region")) return false;
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

export function isEventRecord(value: unknown): value is { id?: unknown } {
  return Boolean(value && typeof value === "object");
}
