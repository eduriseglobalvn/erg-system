import type { ReactNode } from "react";

import { useI18n } from "@/platform/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import type { AnswerPayload, Question } from "@/lib/types";

export function QuestionBodyWithImage({
  question,
  children,
}: {
  question: Question;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();

  return (
    <div className={`flex flex-col ${isMobile ? "gap-3" : "gap-5"}`}>
      {question.contentImage ? <QuestionContentImage question={question} /> : null}
      {children}
    </div>
  );
}

export function QuestionContentImage({
  question,
  className = "",
}: {
  question: Question;
  className?: string;
}) {
  const isMobile = useIsMobile();

  if (!question.contentImage) {
    return null;
  }

  return (
    <div
      className={`overflow-hidden border bg-white shadow-sm ${className} ${isMobile ? "rounded-md" : "rounded-xl"}`.trim()}
      style={{ borderColor: "var(--quiz-canvas-border)" }}
    >
      <img
        src={question.contentImage.url}
        alt={question.contentImage.alt ?? question.title}
        className={`block h-auto w-full object-contain ${isMobile ? "max-h-[180px]" : "max-h-[420px]"}`}
      />
    </div>
  );
}

export function InlineChoiceSelect({
  blank,
  correctValue,
  reviewMode = false,
  submitted,
  value,
  onChange,
  onRevealCorrectAnswer,
}: {
  blank: NonNullable<Question["inlineBlanks"]>[number];
  correctValue?: string;
  reviewMode?: boolean;
  submitted: boolean;
  value: AnswerPayload;
  onChange: (next: AnswerPayload) => void;
  onRevealCorrectAnswer?: () => void;
}) {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const selectedValue = value.inlineSelections?.[blank.id] ?? "";
  const isAnswered = Boolean(selectedValue);
  const isCorrect = reviewMode && isAnswered && selectedValue === correctValue;
  const isWrong = reviewMode && isAnswered && selectedValue !== correctValue;

  return (
    <div className="relative flex-none">
      <select
        aria-label={blank.statement}
        className={`outline-none transition ${
          isMobile
            ? "min-h-10 min-w-[92px] rounded-md border px-3 pr-9 text-sm font-medium"
            : "min-h-13 min-w-[180px] rounded-lg border-2 px-4 pr-10 text-xl font-bold"
        }`}
        disabled={submitted}
        style={{
          borderColor: isCorrect ? "#78b816" : isWrong ? "#ef6b5f" : "var(--quiz-canvas-border)",
          backgroundColor: isCorrect ? "#fbfff4" : isWrong ? "#fff8f7" : "var(--quiz-input-bg)",
          color: isCorrect ? "#66a80f" : isWrong ? "#df4f43" : "var(--quiz-option-text)",
        }}
        value={selectedValue}
        onChange={(event) =>
          onChange({
            inlineSelections: {
              ...(value.inlineSelections ?? {}),
              [blank.id]: event.target.value,
            },
          })
        }
      >
        <option value="">{t("player.selectPlaceholder")}</option>
        {blank.options.map((option) => (
          <option key={option} value={option}>
            {option === "yes"
              ? t("player.yes")
              : option === "no"
                ? t("player.no")
                : option}
          </option>
        ))}
      </select>
      {isWrong ? (
        <button
          type="button"
          aria-label="Xem đáp án đúng"
          className={`absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full border-2 border-[#ef6b5f] font-black text-[#df4f43] transition hover:bg-[#fff0ee] focus:outline-none focus:ring-2 focus:ring-[#ef6b5f]/30 ${
            isMobile ? "right-1.5 h-6 w-6 text-sm" : "right-2 h-7 w-7 text-base"
          }`}
          onClick={onRevealCorrectAnswer}
        >
          ?
        </button>
      ) : null}
    </div>
  );
}
