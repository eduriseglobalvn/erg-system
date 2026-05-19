import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { useIsMobile } from "@/hooks/use-mobile";

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
}: QuestionComponentProps) {
  const isMobile = useIsMobile();
  const isCorrect = reviewMode && result?.correct;

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
            className="min-h-9 max-w-full border-0 border-b-2 border-slate-300 bg-transparent px-1 pb-1 text-[18px] font-semibold outline-none disabled:cursor-default"
            style={{
              width: inputWidth,
              borderColor: isCorrect ? "#78b816" : reviewMode ? "#ef6b5f" : "#cbd5e1",
              color: "var(--quiz-option-text)",
            }}
            placeholder="....."
          />
          <span className="pb-1 text-[18px] font-semibold text-slate-700">
            {question.numericAnswer?.unit ?? ""}
          </span>
        </div>
        {reviewMode && result?.correctNumericValue ? (
          <div className="text-sm font-semibold text-emerald-700">Đáp án đúng: {result.correctNumericValue}</div>
        ) : null}
      </QuestionBodyWithImage>
    );
  }

  return (
    <QuestionBodyWithImage question={question}>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
        <input
          type="number"
          value={value.numericValue ?? ""}
          disabled={submitted}
          onChange={(event) => onChange({ numericValue: event.target.value })}
          className="min-h-16 rounded-xl border-2 bg-white px-5 text-2xl font-black outline-none transition focus:ring-4 disabled:cursor-default"
          style={{
            borderColor: isCorrect ? "#78b816" : reviewMode ? "#ef6b5f" : "var(--quiz-canvas-border)",
            color: "var(--quiz-option-text)",
            ["--tw-ring-color" as string]: "rgba(0,0,139,0.14)",
          }}
          placeholder="Nhập số"
        />
        <div className="grid min-h-16 place-items-center rounded-xl border-2 border-slate-200 bg-slate-50 px-5 text-lg font-black text-slate-600">
          {question.numericAnswer?.unit ?? "đơn vị"}
        </div>
        {reviewMode && result?.correctNumericValue ? (
          <div className="sm:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
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
}: QuestionComponentProps) {
  return (
    <QuestionBodyWithImage question={question}>
      <div className="grid gap-4">
        <textarea
          value={value.essayText ?? ""}
          disabled={submitted}
          onChange={(event) => onChange({ essayText: event.target.value })}
          className="min-h-52 w-full resize-y rounded-xl border-2 bg-white p-5 text-xl font-medium leading-8 outline-none transition focus:ring-4 disabled:cursor-default"
          style={{
            borderColor: reviewMode ? "#78b816" : "var(--quiz-canvas-border)",
            color: "var(--quiz-option-text)",
            ["--tw-ring-color" as string]: "rgba(0,0,139,0.14)",
          }}
          placeholder="Viết câu trả lời của em..."
        />
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <div className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">
            Rubric gợi ý
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(question.essayRubric ?? []).map((item) => (
              <div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
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
}: QuestionComponentProps & { variant: "short" | "blank" }) {
  const isMobile = useIsMobile();
  const blanks = question.textBlanks ?? [];

  return (
    <QuestionBodyWithImage question={question}>
      <div className={`grid ${isMobile ? "gap-3" : "gap-4"}`}>
        {variant === "blank" && !isMobile ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-base font-bold leading-8 text-slate-600">
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
              <span className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">
                {variant === "blank" ? `Ô trống ${index + 1}` : blank.label}
              </span>
              <div className={`flex flex-wrap items-end ${isMobile ? "gap-x-2 gap-y-1" : "items-center gap-3"}`}>
                {blank.prefix ? (
                  <span className={`${isMobile ? "text-[18px] font-semibold text-slate-700" : "text-xl font-bold text-slate-700"}`}>
                    {blank.prefix}
                  </span>
                ) : null}
                <input
                  value={currentValue}
                  disabled={submitted}
                  onChange={(event) =>
                    onChange({
                      textResponses: {
                        ...(value.textResponses ?? {}),
                        [blank.id]: event.target.value,
                      },
                    })
                  }
                  className={
                    isMobile
                      ? "min-h-8 max-w-full border-0 border-b-2 bg-transparent px-1 pb-1 text-[18px] font-semibold outline-none disabled:cursor-default"
                      : "min-h-14 min-w-[220px] flex-1 rounded-xl border-2 bg-white px-4 text-xl font-black outline-none transition focus:ring-4 disabled:cursor-default"
                  }
                  style={
                    isMobile
                      ? {
                          width: mobileWidth,
                          borderColor: isCorrect ? "#78b816" : reviewMode ? "#ef6b5f" : "#cbd5e1",
                          color: "var(--quiz-option-text)",
                        }
                      : {
                          borderColor: isCorrect ? "#78b816" : reviewMode ? "#ef6b5f" : "var(--quiz-canvas-border)",
                          color: "var(--quiz-option-text)",
                          ["--tw-ring-color" as string]: "rgba(0,0,139,0.14)",
                        }
                  }
                  placeholder={isMobile ? "....." : blank.placeholder ?? "Nhập câu trả lời"}
                />
                {blank.suffix ? (
                  <span className={`${isMobile ? "text-[18px] font-semibold text-slate-700" : "text-xl font-bold text-slate-700"}`}>
                    {blank.suffix}
                  </span>
                ) : null}
              </div>
              {reviewMode ? (
                <span className="text-sm font-semibold text-emerald-700">Đáp án đúng: {correctValue}</span>
              ) : null}
            </label>
          );
        })}
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
