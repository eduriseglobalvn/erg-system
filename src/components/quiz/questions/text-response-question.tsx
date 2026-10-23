import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { useIsMobile } from "@/hooks/use-mobile";
import type { EssayRubricCriterion, NumericAnswer, TextBlank } from "@/lib/types";

export function ShortAnswerQuestion(props: QuestionComponentProps) {
  return <TextBlankQuestion {...props} variant="short" />;
}

export function FillBlankQuestion(props: QuestionComponentProps) {
  return <TextBlankQuestion {...props} variant="blank" />;
}

export function NumericQuestion({
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
  const isCorrect = reviewMode && result?.correct;
  const successColor = "#118D57";
  const dangerColor = "#e82828";
  const numericAnswer = question.numericAnswer ?? { correctValue: 0, unit: "" };

  function updateNumericAnswer(patch: Partial<NumericAnswer>) {
    onQuestionChange?.({ ...question, numericAnswer: { ...numericAnswer, ...patch } });
  }

  if (editable && onQuestionChange) {
    return (
      <QuestionBodyWithImage question={question}>
        <div className="quiz-answer-region grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
          <input
            type="number"
            value={numericAnswer.correctValue}
            onChange={(event) => updateNumericAnswer({ correctValue: Number(event.target.value) })}
            className="min-h-16 rounded-lg border bg-white px-5 text-[var(--quiz-readable-size-lg)] font-semibold outline-none transition focus:ring-2"
            style={{
              borderColor: "var(--quiz-canvas-border)",
              color: "var(--quiz-option-text)",
              ["--tw-ring-color" as string]: "rgba(0,0,139,0.14)",
            }}
            placeholder="Answer number"
          />
          <input
            value={numericAnswer.unit ?? ""}
            onChange={(event) => updateNumericAnswer({ unit: event.target.value })}
            className="min-h-16 rounded-lg border border-slate-200 bg-slate-50 px-5 text-center text-[var(--quiz-readable-size)] font-semibold text-slate-600 outline-none transition focus:ring-2"
            placeholder="Unit"
          />
        </div>
      </QuestionBodyWithImage>
    );
  }

  if (isMobile) {
    const currentValue = value.numericValue ?? "";
    const inputWidth = `${Math.max(currentValue.length + 2, 5)}ch`;

    return (
      <QuestionBodyWithImage question={question}>
        <div className="flex flex-wrap items-end gap-2">
          <input
            type="number"
            value={currentValue}
            disabled={submitted}
            onChange={(event) => onChange({ numericValue: event.target.value })}
            className="min-h-9 max-w-full border-0 border-b-2 border-slate-300 bg-transparent px-1 pb-1 text-[var(--quiz-control-text-size)] font-semibold outline-none disabled:cursor-default"
            style={{
              width: inputWidth,
              borderColor: isCorrect ? successColor : reviewMode ? dangerColor : "#cbd5e1",
              color: "var(--quiz-option-text)",
            }}
            placeholder="....."
          />
          <span className="pb-1 text-[18px] font-semibold text-slate-700">
            {question.numericAnswer?.unit ?? ""}
          </span>
        </div>
        {reviewMode && result?.correctNumericValue ? (
          <div className="text-sm font-semibold" style={{ color: successColor }}>Đáp án đúng: {result.correctNumericValue}</div>
        ) : null}
      </QuestionBodyWithImage>
    );
  }

  if (editable && onQuestionChange) {
    return (
      <QuestionBodyWithImage question={question}>
        <div className="quiz-answer-region grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
          <input
            type="number"
            value={numericAnswer.correctValue}
            onChange={(event) => updateNumericAnswer({ correctValue: Number(event.target.value) })}
            className="min-h-16 rounded-lg border bg-white px-5 text-[var(--quiz-readable-size-lg)] font-semibold outline-none transition focus:ring-2"
            style={{
              borderColor: "var(--quiz-canvas-border)",
              color: "var(--quiz-option-text)",
              ["--tw-ring-color" as string]: "rgba(0,0,139,0.14)",
            }}
            placeholder="Nhập số"
          />
          <input
            value={numericAnswer.unit ?? ""}
            onChange={(event) => updateNumericAnswer({ unit: event.target.value })}
            className="min-h-16 rounded-lg border border-slate-200 bg-slate-50 px-5 text-center text-[var(--quiz-readable-size)] font-semibold text-slate-600 outline-none transition focus:ring-2"
            placeholder="đơn vị"
          />
        </div>
      </QuestionBodyWithImage>
    );
  }

  return (
    <QuestionBodyWithImage question={question}>
      <div className="quiz-answer-region grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
        <input
          type="number"
          value={value.numericValue ?? ""}
          disabled={submitted}
          onChange={(event) => onChange({ numericValue: event.target.value })}
          className="min-h-16 rounded-lg border bg-white px-5 text-[var(--quiz-readable-size-lg)] font-semibold outline-none transition focus:ring-2 disabled:cursor-default"
          style={{
            borderColor: isCorrect ? successColor : reviewMode ? dangerColor : "var(--quiz-canvas-border)",
            color: "var(--quiz-option-text)",
            ["--tw-ring-color" as string]: "rgba(0,0,139,0.14)",
          }}
          placeholder="Nhập số"
        />
        <div className="grid min-h-16 place-items-center rounded-lg border border-slate-200 bg-slate-50 px-5 text-[var(--quiz-readable-size)] font-semibold text-slate-600">
          {question.numericAnswer?.unit ?? "đơn vị"}
        </div>
        {reviewMode && result?.correctNumericValue ? (
          <div className="sm:col-span-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Đáp án đúng: {result.correctNumericValue}
          </div>
        ) : null}
      </div>
    </QuestionBodyWithImage>
  );
}

export function EssayQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  editable = false,
  onQuestionChange,
}: QuestionComponentProps) {
  const rubric = question.essayRubric ?? [];

  function updateCriterion(criterionId: string, patch: Partial<EssayRubricCriterion>) {
    onQuestionChange?.({
      ...question,
      essayRubric: rubric.map((item) => (item.id === criterionId ? { ...item, ...patch } : item)),
    });
  }

  function addCriterion() {
    onQuestionChange?.({
      ...question,
      essayRubric: [
        ...rubric,
        {
          id: createRuntimeId("rubric"),
          label: `Criterion ${rubric.length + 1}`,
          points: 1,
        },
      ],
    });
  }

  function removeCriterion(criterionId: string) {
    onQuestionChange?.({
      ...question,
      essayRubric: rubric.filter((item) => item.id !== criterionId),
    });
  }

  if (editable && onQuestionChange) {
    return (
      <QuestionBodyWithImage question={question}>
        <div className="quiz-answer-region grid gap-4">
          <textarea
            disabled
            className="min-h-52 w-full resize-y rounded-lg border bg-white p-5 text-[var(--quiz-readable-size-lg)] font-medium leading-8 outline-none transition"
            style={{
              borderColor: "var(--quiz-canvas-border)",
              color: "var(--quiz-option-text)",
            }}
            placeholder="Học sinh sẽ viết câu trả lời ở đây..."
          />
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
            <div className="text-sm font-semibold text-slate-500">Rubric gợi ý</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {rubric.map((item) => (
                <div key={item.id} className="grid gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                  <input
                    className="quiz-runtime-edit-input"
                    value={item.label}
                    onChange={(event) => updateCriterion(item.id, { label: event.target.value })}
                  />
                  <input
                    className="quiz-runtime-edit-input"
                    type="number"
                    value={item.points}
                    onChange={(event) => updateCriterion(item.id, { points: Number(event.target.value) })}
                  />
                  <button type="button" className="quiz-runtime-edit-remove" onClick={() => removeCriterion(item.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="quiz-runtime-edit-add mt-3" onClick={addCriterion}>
              Add criterion
            </button>
          </div>
        </div>
      </QuestionBodyWithImage>
    );
  }

  return (
    <QuestionBodyWithImage question={question}>
      <div className="quiz-answer-region grid gap-4">
        <textarea
          value={value.essayText ?? ""}
          disabled={submitted}
          onChange={(event) => onChange({ essayText: event.target.value })}
          className="min-h-52 w-full resize-y rounded-lg border bg-white p-5 text-[var(--quiz-readable-size-lg)] font-medium leading-8 outline-none transition focus:ring-2 disabled:cursor-default"
          style={{
            borderColor: reviewMode ? "#118D57" : "var(--quiz-canvas-border)",
            color: "var(--quiz-option-text)",
            ["--tw-ring-color" as string]: "rgba(0,0,139,0.14)",
          }}
          placeholder="Viết câu trả lời của em..."
        />
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
          <div className="text-sm font-semibold text-slate-500">
            Rubric gợi ý
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(question.essayRubric ?? []).map((item) => (
              <div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                {item.label}: {item.points}đ
              </div>
            ))}
          </div>
        </div>
      </div>
    </QuestionBodyWithImage>
  );
}

function TextBlankQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  result,
  variant,
  editable = false,
  onQuestionChange,
}: QuestionComponentProps & { variant: "short" | "blank" }) {
  const isMobile = useIsMobile();
  const blanks = question.textBlanks ?? [];
  const successColor = "#118D57";
  const dangerColor = "#e82828";

  function updateBlank(blankId: string, patch: Partial<TextBlank>) {
    onQuestionChange?.({
      ...question,
      textBlanks: blanks.map((blank) => (blank.id === blankId ? { ...blank, ...patch } : blank)),
    });
  }

  function addBlank() {
    onQuestionChange?.({
      ...question,
      textBlanks: [
        ...blanks,
        {
          id: createRuntimeId("blank"),
          label: variant === "blank" ? `Blank ${blanks.length + 1}` : `Answer ${blanks.length + 1}`,
          placeholder: "......",
          correctAnswers: [""],
        },
      ],
    });
  }

  function removeBlank(blankId: string) {
    onQuestionChange?.({
      ...question,
      textBlanks: blanks.filter((blank) => blank.id !== blankId),
    });
  }

  return (
    <QuestionBodyWithImage question={question}>
      <div className={`quiz-answer-region grid ${isMobile ? "gap-3" : "gap-4"}`}>
        {variant === "blank" && !isMobile ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-base font-medium leading-8 text-slate-600">
            Điền từng ô còn trống bên dưới. Hệ thống mock sẽ chấm theo đáp án mẫu đã khai báo.
          </div>
        ) : null}

        {blanks.map((blank, index) => {
          const currentValue = value.textResponses?.[blank.id] ?? "";
          const correctValue = result?.correctTextResponses?.[blank.id] ?? blank.correctAnswers[0] ?? "";
          const isCorrect = reviewMode && normalizeText(currentValue) === normalizeText(correctValue);
          const mobileWidth = `${Math.max((currentValue || ".....").length + 1, 5)}ch`;

          return (
            <label key={blank.id} className={`grid ${isMobile ? "gap-1.5" : "gap-2"}`}>
              <span className="text-sm font-semibold text-slate-500">
                {variant === "blank" ? `Ô trống ${index + 1}` : blank.label}
              </span>
              <div className={`flex flex-wrap ${isMobile ? "items-end gap-x-2 gap-y-1" : "items-center gap-3"}`}>
                {blank.prefix ? (
                  <span className={`${isMobile ? "text-[18px] font-semibold text-slate-700" : "inline-flex min-h-14 items-center text-[var(--quiz-readable-size)] font-medium text-slate-700"}`}>
                    {blank.prefix}
                  </span>
                ) : null}
                <input
                  value={editable ? (blank.correctAnswers[0] ?? "") : currentValue}
                  disabled={submitted && !editable}
                  onChange={(event) =>
                    editable && onQuestionChange
                      ? updateBlank(blank.id, { correctAnswers: [event.target.value] })
                      : onChange({
                          textResponses: {
                            ...(value.textResponses ?? {}),
                            [blank.id]: event.target.value,
                          },
                        })
                  }
                  className={
                    isMobile
                      ? "min-h-8 max-w-full border-0 border-b-2 bg-transparent px-1 pb-1 text-[18px] font-semibold outline-none disabled:cursor-default"
                      : "h-14 min-w-[220px] flex-1 rounded-lg border bg-white px-4 py-0 text-[var(--quiz-readable-size)] font-semibold leading-none outline-none transition focus:ring-2 disabled:cursor-default"
                  }
                  style={
                    isMobile
                      ? {
                          width: mobileWidth,
                          borderColor: isCorrect ? successColor : reviewMode ? dangerColor : "#cbd5e1",
                          color: "var(--quiz-option-text)",
                        }
                      : {
                          borderColor: isCorrect ? successColor : reviewMode ? dangerColor : "var(--quiz-canvas-border)",
                          color: "var(--quiz-option-text)",
                          ["--tw-ring-color" as string]: "rgba(0,0,139,0.14)",
                        }
                  }
                  placeholder={isMobile ? "....." : blank.placeholder ?? "Nhập câu trả lời"}
                />
                {blank.suffix ? (
                  <span className={`${isMobile ? "text-[18px] font-semibold text-slate-700" : "inline-flex min-h-14 items-center text-[var(--quiz-readable-size)] font-medium text-slate-700"}`}>
                    {blank.suffix}
                  </span>
                ) : null}
              </div>
              {reviewMode ? (
                <span className="text-sm font-semibold" style={{ color: successColor }}>Đáp án đúng: {correctValue}</span>
              ) : null}
              {editable && onQuestionChange && blanks.length > 1 ? (
                <button
                  type="button"
                  className="quiz-runtime-edit-remove w-fit"
                  onClick={(event) => {
                    event.preventDefault();
                    removeBlank(blank.id);
                  }}
                >
                  Remove blank
                </button>
              ) : null}
            </label>
          );
        })}
        {editable && onQuestionChange ? (
          <button type="button" className="quiz-runtime-edit-add" onClick={addBlank}>
            Add blank
          </button>
        ) : null}
      </div>
    </QuestionBodyWithImage>
  );
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function createRuntimeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}
