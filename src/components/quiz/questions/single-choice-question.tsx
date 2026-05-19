import { QuestionContentImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { useIsMobile } from "@/hooks/use-mobile";

export function SingleChoiceQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
}: QuestionComponentProps) {
  const isMobile = useIsMobile();
  const selectedId = value.choiceId;

  if (isMobile) {
    return (
      <div className="grid gap-3">
        {question.contentImage ? <QuestionContentImage question={question} /> : null}
        <div className="grid gap-2.5">
          {question.choices?.map((choice) => {
            const selected = selectedId === choice.id;
            const showCorrect = reviewMode && choice.correct;
            const showWrong = reviewMode && selected && !choice.correct;

            return (
              <button
                key={choice.id}
                type="button"
                disabled={submitted}
                className="grid min-h-[52px] w-full grid-cols-[28px_minmax(0,1fr)] items-center gap-3 rounded-md border bg-white px-4 py-3 text-left shadow-sm transition disabled:cursor-default"
                style={{
                  borderColor: showCorrect ? "#78b816" : showWrong ? "#ef6b5f" : selected ? "#76bff1" : "#e2e8f0",
                  backgroundColor: showCorrect ? "#f7fff1" : showWrong ? "#fff7f6" : "#ffffff",
                }}
                onClick={() => {
                  if (submitted) return;
                  onChange({ choiceId: choice.id });
                }}
              >
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border bg-white"
                  style={{
                    borderColor: showCorrect ? "#78b816" : showWrong ? "#ef6b5f" : selected ? "#76bff1" : "#b8c4d0",
                  }}
                >
                  {selected || showCorrect ? (
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: showCorrect ? "#78b816" : showWrong ? "#ef6b5f" : "#3da2eb",
                      }}
                    />
                  ) : null}
                </span>
                <span className="text-[15px] leading-6 text-slate-600">{choice.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`grid gap-5 ${question.contentImage ? "lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1fr)] lg:items-start" : ""}`}>
      <div className="flex flex-col gap-3 sm:gap-4">
        {question.choices?.map((choice) => {
          const selected = selectedId === choice.id;
          const showCorrect = reviewMode && choice.correct;
          const showWrong = reviewMode && selected && !choice.correct;
          const showStatus = reviewMode && (showCorrect || showWrong);
          const containerStyle = showCorrect
            ? { backgroundColor: "rgba(255,255,255,0.9)", borderColor: "transparent" }
            : showWrong
              ? { backgroundColor: "rgba(255,255,255,0.9)", borderColor: "transparent" }
              : selected
                ? { backgroundColor: "var(--quiz-option-selected-bg)" }
                : undefined;
          return (
            <button
              key={choice.id}
              type="button"
              disabled={submitted}
              className="grid w-full grid-cols-[40px_36px_minmax(0,1fr)] items-start gap-3 rounded-xl border border-transparent px-2 py-3 text-left transition hover:bg-slate-200/20"
              style={containerStyle}
              onClick={() => {
                if (submitted) return;
                onChange({ choiceId: choice.id });
              }}
            >
              <ReviewStatusIcon correct={showCorrect} visible={showStatus} />
              <span
                className="mt-1 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 bg-white"
                style={{
                  borderColor: showCorrect ? "#78b816" : showWrong ? "#ff8b3d" : selected ? "var(--quiz-accent-start)" : "#cfd8df",
                }}
              >
                {selected || showCorrect ? (
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: showCorrect ? "#78b816" : showWrong ? "#ff8b3d" : "var(--quiz-accent-start)" }}
                  />
                ) : null}
              </span>
              <span
                className="text-xl leading-[1.5] sm:text-2xl"
                style={{ color: showCorrect ? "#006d93" : showWrong ? "#ff8b3d" : reviewMode ? "#8fbfd3" : "var(--quiz-option-text)" }}
              >
                {choice.label}
              </span>
            </button>
          );
        })}
      </div>
      {question.contentImage ? <QuestionContentImage question={question} className="lg:sticky lg:top-0" /> : null}
    </div>
  );
}

function ReviewStatusIcon({ correct, visible }: { correct: boolean; visible: boolean }) {
  if (!visible) {
    return <span className="mt-0.5 h-8 w-8" />;
  }

  return (
    <span
      className="mt-0.5 grid h-8 w-8 place-items-center rounded-full text-lg font-black text-white"
      style={{ backgroundColor: correct ? "#78b816" : "#e65a4d" }}
    >
      {correct ? "✓" : "×"}
    </span>
  );
}
