import type { AnswerResult, Attempt, Question, QuizResultDisplay } from "@/lib/types";

type SubmitDialogMode = "all-answered" | "confirm";

export function FinalResultScreen({
  attempt,
  resultDisplay,
  onReview,
}: {
  attempt: Attempt;
  resultDisplay: QuizResultDisplay;
  onReview: () => void;
}) {
  const resultMessage = attempt.passed ? resultDisplay.passMessage : resultDisplay.failMessage;

  return (
    <div className="grid min-h-[420px] place-items-center overflow-hidden bg-white px-6 py-8">
      <div className="grid justify-items-center gap-4 text-center">
        <div
          className={`grid h-16 w-16 place-items-center rounded-lg text-xl font-semibold text-white ${
            attempt.passed ? "bg-emerald-500" : "bg-[var(--erg-red)]"
          }`}
        >
          {attempt.passed ? "✓" : "×"}
        </div>
        <h2 className="text-xl font-semibold text-[var(--erg-blue)] ">
          {resultMessage}
        </h2>
        <div className="grid gap-2">
          <span className="text-sm font-semibold text-slate-500">Điểm</span>
          <strong className="text-xl font-semibold text-[var(--erg-blue)]">
            {attempt.totalScore}/{attempt.maxScore}
          </strong>
          <span className="text-sm font-semibold text-slate-400">
            {attempt.percent}%
          </span>
        </div>
        {resultDisplay.showReviewButton ? (
          <button
            type="button"
            onClick={onReview}
            className="min-h-10 rounded-md border border-[var(--erg-blue)] bg-[var(--erg-blue)] px-4 text-sm font-semibold text-white shadow-sm"
          >
            {resultDisplay.reviewButtonLabel}
          </button>
        ) : null}
        <div className="text-base font-medium text-slate-500">
          {resultDisplay.thankYouMessage}
        </div>
      </div>
    </div>
  );
}

export function QuestionFeedbackPanel({ floating = false, result }: { floating?: boolean; result: AnswerResult }) {
  const title = result.correct ? "Đáp án chính xác!" : "Đáp án chưa đúng!";
  const headerClass = result.correct ? "bg-[#22C55E]" : "bg-[#e82828]";
  const message = result.correct ? result.message : "Câu trả lời chưa đúng. Em hãy xem lại đáp án và thử ở lần sau.";
  const panelClassName = floating
    ? "w-full max-w-[884px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.16)]"
    : "mx-auto mt-8 w-full max-w-[884px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm";

  return (
    <div className={panelClassName}>
      <div className={`flex min-h-12 items-center justify-between px-5 text-base font-semibold text-white ${headerClass}`}>
        <span>{title}</span>
      </div>
      <div className="px-5 py-5 text-base leading-7 text-slate-950">{message}</div>
    </div>
  );
}

export function SubmitConfirmDialog({
  mode,
  resultDisplay,
  submitting,
  onCancel,
  onConfirm,
}: {
  mode: SubmitDialogMode;
  resultDisplay: QuizResultDisplay;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isAllAnswered = mode === "all-answered";

  return (
    <div className="fixed inset-0 z-[260] grid place-items-center bg-black/10">
      <div className="flex w-[min(590px,calc(100vw-56px))] items-center gap-4 border border-slate-300 bg-white px-7 py-8 shadow-sm">
        <div className="grid h-8 w-8 flex-none place-items-center rounded-md border border-slate-300 text-base font-semibold text-slate-500">
          ?
        </div>
        <div className="grid flex-1 gap-6">
          <p className="text-sm font-medium text-slate-900">
            {isAllAnswered ? resultDisplay.submitAllPrompt : resultDisplay.confirmSubmitPrompt}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={onConfirm}
              className="min-h-9 min-w-[136px] rounded-md bg-[var(--erg-blue)] px-5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {submitting
                ? "ĐANG NỘP..."
                : isAllAnswered
                  ? resultDisplay.submitAllLabel
                  : resultDisplay.confirmYesLabel}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={onCancel}
              className="min-h-9 min-w-[136px] rounded-md bg-slate-100 px-5 text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60"
            >
              {isAllAnswered ? resultDisplay.returnToQuizLabel : resultDisplay.confirmNoLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnswerKeyCard({ question }: { question: Question }) {
  const lines = getAnswerKeyLines(question);

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-sm">
      <div className="bg-[var(--erg-blue)] px-4 py-3 text-sm font-semibold text-white">
        Đáp án
      </div>
      <div className="grid gap-2 px-4 py-4 text-sm leading-6 text-slate-600">
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  );
}

function getAnswerKeyLines(question: Question): string[] {
  switch (question.kind) {
    case "single_choice":
    case "true_false":
      return (question.choices ?? []).filter((choice) => choice.correct).map((choice) => `Đáp án đúng: ${choice.label}`);
    case "multiple_response":
      return (question.choices ?? []).filter((choice) => choice.correct).map((choice) => `Đáp án đúng: ${choice.label}`);
    case "short_answer":
    case "fill_blank":
      return (question.textBlanks ?? []).map(
        (blank, index) => `${index + 1}. ${blank.label}: ${blank.correctAnswers[0] ?? ""}`,
      );
    case "numeric":
      return question.numericAnswer
        ? [`Đáp án đúng: ${question.numericAnswer.correctValue}${question.numericAnswer.unit ? ` ${question.numericAnswer.unit}` : ""}`]
        : [];
    case "matching":
      return (question.matching ?? []).map((pair, index) => `${index + 1}. ${pair.prompt} -> ${pair.response}`);
    case "sequence":
      return (question.sequenceItems ?? []).map((item, index) => `${index + 1}. ${item.label}`);
    case "inline_choice":
    case "select_from_lists":
      return (question.inlineBlanks ?? []).map(
        (blank, index) => `${index + 1}. ${blank.statement}: ${formatInlineOption(blank.correctOptionId)}`,
      );
    case "drag_words":
      return (question.wordSlots ?? []).map((slot, index) => {
        const word = question.wordBank?.find((item) => item.id === slot.correctWordId);
        return `${index + 1}. ${slot.label}: ${word?.label ?? ""}`;
      });
    case "hotspot":
      return ["Vùng đáp án đúng đã được hiển thị trên hình."];
    case "drag_drop":
      return (question.dragDropItems ?? []).map((item, index) => {
        const target = question.dropTargets?.find((candidate) => candidate.id === item.correctTargetId);
        return `${index + 1}. ${item.label} -> ${target?.label ?? ""}`;
      });
    case "likert_scale":
      return ["Câu khảo sát ghi nhận mức độ lựa chọn, không có đáp án đúng sai tuyệt đối."];
    case "essay":
      return (question.essayRubric ?? []).map((item) => `${item.label}: ${item.points}đ`);
    default:
      return [];
  }
}

function formatInlineOption(option: string) {
  if (option === "yes") {
    return "Có";
  }

  if (option === "no") {
    return "Không";
  }

  return option;
}
