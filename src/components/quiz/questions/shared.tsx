import type { ReactNode } from "react";

import { useI18n } from "@/platform/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import type { AnswerPayload, Question } from "@/lib/types";
import { AppSelect } from "@/components/ui/app-select";

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
      className={`overflow-hidden border bg-white shadow-sm ${className} ${isMobile ? "rounded-md" : "rounded-lg"}`.trim()}
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
  const successColor = "#118D57";
  const dangerColor = "#e82828";

  return (
    <div className="relative flex-none">
      <AppSelect
        aria-label={blank.statement}
        data-quiz-player-select="true"
        className={`outline-none transition ${
          isMobile
            ? "min-w-[104px]"
            : "min-w-[220px]"
        }`}
        disabled={submitted}
        style={{
          borderColor: isCorrect ? "rgba(17,141,87,0.62)" : isWrong ? "rgba(232,40,40,0.62)" : "var(--quiz-canvas-border)",
          backgroundColor: isCorrect ? "rgba(34,197,94,0.08)" : isWrong ? "rgba(232,40,40,0.055)" : "var(--quiz-input-bg)",
          color: isCorrect ? successColor : isWrong ? dangerColor : "var(--quiz-option-text)",
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
      </AppSelect>
      {isWrong ? (
        <button
          type="button"
          aria-label="Xem đáp án đúng"
          className={`absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full border border-[rgba(232,40,40,0.45)] font-semibold text-[#e82828] transition hover:bg-[rgba(232,40,40,0.08)] focus:outline-none focus:ring-2 focus:ring-[rgba(232,40,40,0.22)] ${
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
