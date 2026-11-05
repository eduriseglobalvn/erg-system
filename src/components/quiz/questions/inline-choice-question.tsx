import { useEffect, useState } from "react";

import { InlineChoiceSelect, QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { AnswerPayload } from "@/domain/quiz/types";

export function InlineChoiceQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  result,
}: QuestionComponentProps) {
  const isMobile = useIsMobile();
  const [revealedBlankId, setRevealedBlankId] = useState<string | null>(null);
  const paceStateUpdate = usePacedStateBatch();
  const blanks = question.inlineBlanks ?? [];
  const revealedWrongBlank = reviewMode
    ? question.inlineBlanks?.find((blank) => {
        if (blank.id !== revealedBlankId) {
          return false;
        }

        const selected = value.inlineSelections?.[blank.id];
        const correct = result?.correctInlineSelections?.[blank.id] ?? blank.correctOptionId;
        return selected && selected !== correct;
      })
    : null;
  const revealedWrongCorrectValue = revealedWrongBlank
    ? result?.correctInlineSelections?.[revealedWrongBlank.id] ?? revealedWrongBlank.correctOptionId
    : null;

  useEffect(() => {
    if (!reviewMode || !revealedBlankId) {
      return;
    }

    const revealedBlank = question.inlineBlanks?.find((blank) => blank.id === revealedBlankId);
    const selected = revealedBlank ? value.inlineSelections?.[revealedBlank.id] : null;
    const correct = revealedBlank
      ? result?.correctInlineSelections?.[revealedBlank.id] ?? revealedBlank.correctOptionId
      : null;

    if (!revealedBlank || !selected || selected === correct) {
      paceStateUpdate(() => setRevealedBlankId(null));
    }
  }, [paceStateUpdate, question.inlineBlanks, result?.correctInlineSelections, revealedBlankId, reviewMode, value.inlineSelections]);

  function handleChange(nextValue: AnswerPayload) {
    setRevealedBlankId(null);
    onChange(nextValue);
  }

  const statementClass = isMobile ? "text-[15px] leading-7 text-slate-600" : "min-w-[260px] flex-1 text-[var(--quiz-readable-size-lg)] font-medium leading-[1.45] text-[#174f91]";

  return (
    <QuestionBodyWithImage question={question}>
      <div className={`quiz-answer-region relative flex flex-col ${isMobile ? "gap-2.5" : "gap-5"}`}>
        {blanks.map((blank) => (
          <div
            key={blank.id}
            className={`rounded-xl border bg-white shadow-sm ${isMobile ? "space-y-2 px-4 py-3" : "space-y-3 px-6 py-4"}`}
            style={{ borderColor: "var(--quiz-canvas-border)" }}
          >
            <div className={`${isMobile ? "flex items-start gap-2" : "flex flex-wrap items-center gap-3"}`}>
              {blank.selectPosition !== "after" ? (
                <InlineChoiceSelect
                  blank={blank}
                  correctValue={result?.correctInlineSelections?.[blank.id] ?? blank.correctOptionId}
                  reviewMode={reviewMode}
                  submitted={submitted}
                  value={value}
                  onChange={handleChange}
                  onRevealCorrectAnswer={() => setRevealedBlankId(blank.id)}
                />
              ) : null}
              <span className={statementClass}>
                {blank.statement}
              </span>
              {blank.selectPosition === "after" ? (
                <InlineChoiceSelect
                  blank={blank}
                  correctValue={result?.correctInlineSelections?.[blank.id] ?? blank.correctOptionId}
                  reviewMode={reviewMode}
                  submitted={submitted}
                  value={value}
                  onChange={handleChange}
                  onRevealCorrectAnswer={() => setRevealedBlankId(blank.id)}
                />
              ) : null}
              {blank.suffix ? (
                <span className={statementClass}>
                  {blank.suffix}
                </span>
              ) : null}
            </div>
          </div>
        ))}
        {revealedWrongBlank && revealedWrongCorrectValue ? (
          <div className={`${isMobile ? "rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm" : "ml-[min(44vw,520px)] mt-1 w-[244px] rounded-lg border border-slate-200 bg-white px-7 py-6 shadow-sm"}`}>
            <div className={`${isMobile ? "text-sm font-semibold text-slate-900" : "text-xl font-semibold text-slate-950"}`}>Đáp án đúng</div>
            <div className={`${isMobile ? "mt-2 flex items-center gap-2 text-sm font-medium text-slate-700" : "mt-5 flex items-center gap-3 text-base font-semibold text-slate-800"}`}>
              <span className={`${isMobile ? "grid h-5 w-5 place-items-center rounded-full bg-[#78b816] text-xs font-semibold text-white" : "grid h-7 w-7 place-items-center rounded-full bg-[#78b816] text-sm font-semibold text-white"}`}>
                ✓
              </span>
              <span>{formatInlineValue(revealedWrongCorrectValue)}</span>
            </div>
          </div>
        ) : null}
      </div>
    </QuestionBodyWithImage>
  );
}

function formatInlineValue(value: string) {
  if (value === "yes") {
    return "Có";
  }

  if (value === "no") {
    return "Không";
  }

  return value;
}
