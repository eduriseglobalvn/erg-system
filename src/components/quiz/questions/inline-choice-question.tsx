import { useEffect, useState } from "react";

import { InlineChoiceSelect, QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { AppSelect } from "@/components/ui/app-select";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { AnswerPayload, InlineBlank } from "@/lib/types";

export function InlineChoiceQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  result,
  editable = false,
  onQuestionChange,
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

  function emitBlanks(nextBlanks: InlineBlank[]) {
    onQuestionChange?.({ ...question, inlineBlanks: nextBlanks });
  }

  function updateBlank(blankId: string, patch: Partial<InlineBlank>) {
    emitBlanks(blanks.map((blank) => (blank.id === blankId ? { ...blank, ...patch } : blank)));
  }

  function updateBlankOption(blank: InlineBlank, optionIndex: number, nextOption: string) {
    const previousOption = blank.options[optionIndex] ?? "";
    const nextOptions = blank.options.map((option, index) => (index === optionIndex ? nextOption : option));

    updateBlank(blank.id, {
      options: nextOptions,
      correctOptionId: blank.correctOptionId === previousOption ? nextOption : blank.correctOptionId,
    });
  }

  function addBlankOption(blank: InlineBlank) {
    const nextOption = createUniqueInlineOption(blank.options);
    updateBlank(blank.id, {
      options: [...blank.options, nextOption],
      correctOptionId: blank.correctOptionId || nextOption,
    });
  }

  function removeBlankOption(blank: InlineBlank, optionIndexToRemove: number) {
    if (blank.options.length <= 2) return;

    const optionToRemove = blank.options[optionIndexToRemove] ?? "";
    const nextOptions = blank.options.filter((_, index) => index !== optionIndexToRemove);
    updateBlank(blank.id, {
      options: nextOptions,
      correctOptionId: blank.correctOptionId === optionToRemove ? nextOptions[0] ?? "" : blank.correctOptionId,
    });
  }

  function addBlank() {
    const firstOption = "yes";
    emitBlanks([
      ...blanks,
      {
        id: createInlineBlankId("inline"),
        statement: `Statement ${blanks.length + 1}`,
        options: [firstOption, "no"],
        correctOptionId: firstOption,
        selectPosition: "after",
      },
    ]);
  }

  function removeBlank(blankId: string) {
    emitBlanks(blanks.filter((blank) => blank.id !== blankId));
  }

  if (editable && onQuestionChange) {
    return (
      <QuestionBodyWithImage question={question}>
        <div className={`quiz-answer-region relative flex flex-col ${isMobile ? "gap-2.5" : "gap-5"}`}>
          {blanks.map((blank, index) => (
            <div
              key={blank.id}
              className={`rounded-xl border bg-white shadow-sm ${isMobile ? "space-y-2 px-4 py-3" : "space-y-3 px-6 py-4"}`}
              style={{ borderColor: "var(--quiz-canvas-border)" }}
            >
              <div className={`${isMobile ? "flex flex-col gap-2" : "flex flex-wrap items-center gap-3"}`}>
                {blank.selectPosition !== "after" ? (
                  <EditableInlineChoiceSelect blank={blank} onChange={(correctOptionId) => updateBlank(blank.id, { correctOptionId })} />
                ) : null}
                <input
                  className={`${isMobile ? "text-[15px] leading-7" : "min-w-[260px] flex-1 text-[var(--quiz-readable-size-lg)] leading-[1.45]"} quiz-runtime-edit-input font-medium text-[#174f91]`}
                  value={blank.statement}
                  onChange={(event) => updateBlank(blank.id, { statement: event.target.value })}
                  aria-label={`Statement ${index + 1}`}
                />
                {blank.selectPosition === "after" ? (
                  <EditableInlineChoiceSelect blank={blank} onChange={(correctOptionId) => updateBlank(blank.id, { correctOptionId })} />
                ) : null}
              </div>

              <div className="quiz-runtime-inline-options relative z-[2] flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <AppSelect
                  aria-label="Select position"
                  className="min-w-[132px]"
                  value={blank.selectPosition ?? "before"}
                  onChange={(event) =>
                    updateBlank(blank.id, { selectPosition: event.target.value === "after" ? "after" : "before" })
                  }
                >
                  <option value="before">Select before</option>
                  <option value="after">Select after</option>
                </AppSelect>
                {blank.options.map((option, optionIndex) => (
                  <div key={`${blank.id}-option-${optionIndex}`} className="flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1">
                    <input
                      className="quiz-runtime-edit-input max-w-32 text-sm font-semibold text-slate-700"
                      value={option}
                      onChange={(event) => updateBlankOption(blank, optionIndex, event.target.value)}
                      aria-label={`Option ${optionIndex + 1}`}
                    />
                    {blank.options.length > 2 ? (
                      <button
                        type="button"
                        className="quiz-runtime-edit-remove"
                        onClick={() => removeBlankOption(blank, optionIndex)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
                <button type="button" className="quiz-runtime-edit-add min-h-8 px-3 text-xs" onClick={() => addBlankOption(blank)}>
                  Add option
                </button>
                {blanks.length > 1 ? (
                  <button type="button" className="quiz-runtime-edit-remove ml-auto" onClick={() => removeBlank(blank.id)}>
                    Remove row
                  </button>
                ) : null}
              </div>
            </div>
          ))}

          <button type="button" className="quiz-runtime-edit-add" onClick={addBlank}>
            Add row
          </button>
        </div>
      </QuestionBodyWithImage>
    );
  }

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
              <span className={`${isMobile ? "text-[15px] leading-7 text-slate-600" : "min-w-[260px] flex-1 text-[var(--quiz-readable-size-lg)] font-medium leading-[1.45] text-[#174f91]"}`}>
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

function EditableInlineChoiceSelect({
  blank,
  onChange,
}: {
  blank: InlineBlank;
  onChange: (value: string) => void;
}) {
  const options = normalizeEditableInlineOptions(blank);

  return (
    <AppSelect
      aria-label={blank.statement}
      className="min-w-[180px]"
      value={blank.correctOptionId || options[0] || ""}
      onChange={(event) => onChange(event.target.value)}
      style={{
        borderColor: "var(--quiz-canvas-border)",
        backgroundColor: "var(--quiz-input-bg)",
        color: "var(--quiz-option-text)",
      }}
    >
      {options.map((option, index) => (
        <option key={`${blank.id}-correct-${index}-${option}`} value={option}>
          {formatInlineValue(option)}
        </option>
      ))}
    </AppSelect>
  );
}

function normalizeEditableInlineOptions(blank: InlineBlank) {
  const options = blank.options.filter((option) => option.trim().length > 0);
  if (blank.correctOptionId && !options.includes(blank.correctOptionId)) {
    options.push(blank.correctOptionId);
  }
  return options;
}

function createUniqueInlineOption(options: string[]) {
  let index = options.length + 1;
  let nextOption = `option-${index}`;
  while (options.includes(nextOption)) {
    index += 1;
    nextOption = `option-${index}`;
  }
  return nextOption;
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

function createInlineBlankId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}
