import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";

export function DragWordsQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  result,
}: QuestionComponentProps) {
  const wordBank = question.wordBank ?? [];
  const slots = question.wordSlots ?? [];
  const placements = value.dragWordPlacements ?? {};
  const usedWordIds = new Set(Object.values(placements).filter(Boolean));

  function placeWord(wordId: string) {
    if (submitted) return;

    const emptySlot = slots.find((slot) => !placements[slot.id]);
    if (!emptySlot) return;

    onChange({
      dragWordPlacements: {
        ...placements,
        [emptySlot.id]: wordId,
      },
    });
  }

  function clearSlot(slotId: string) {
    if (submitted) return;

    const nextPlacements = { ...placements };
    delete nextPlacements[slotId];
    onChange({ dragWordPlacements: nextPlacements });
  }

  return (
    <QuestionBodyWithImage question={question}>
      <div className="grid gap-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-5 text-lg font-medium leading-[2.4] text-slate-800">
          {slots.map((slot, index) => {
            const selectedWordId = placements[slot.id];
            const selectedWord = wordBank.find((word) => word.id === selectedWordId);
            const correctWordId = result?.correctDragWordPlacements?.[slot.id] ?? slot.correctWordId;
            const correctWord = wordBank.find((word) => word.id === correctWordId);
            const isCorrect = reviewMode && selectedWordId === correctWordId;

            return (
              <span key={slot.id}>
                {index > 0 ? " " : null}
                {slot.label}
                <button
                  type="button"
                  disabled={submitted && !reviewMode}
                  className="mx-2 inline-flex min-h-12 min-w-36 items-center justify-center rounded-lg border bg-white px-4 text-center text-lg font-semibold transition"
                  style={{
                    borderColor: isCorrect ? "#78b816" : reviewMode ? "#ef6b5f" : "var(--quiz-canvas-border)",
                    color: isCorrect ? "#66a80f" : reviewMode ? "#df4f43" : "var(--quiz-option-text)",
                  }}
                  onClick={() => clearSlot(slot.id)}
                >
                  {selectedWord?.label ?? "......"}
                </button>
                {reviewMode && !isCorrect ? (
                  <span className="text-sm font-medium text-emerald-700">({correctWord?.label})</span>
                ) : null}
              </span>
            );
          })}
        </div>

        <div>
          <div className="mb-3 text-sm font-semibold text-slate-500">
            Ngân hàng từ
          </div>
          <div className="flex flex-wrap gap-3">
            {wordBank.map((word) => {
              const used = usedWordIds.has(word.id);

              return (
                <button
                  key={word.id}
                  type="button"
                  disabled={submitted || used}
                  className="min-h-12 rounded-lg border bg-white px-4 text-base font-semibold shadow-sm transition  disabled:cursor-default disabled:opacity-40"
                  style={{
                    borderColor: used ? "#d1d5db" : "var(--quiz-canvas-border)",
                    color: "var(--quiz-option-text)",
                  }}
                  onClick={() => placeWord(word.id)}
                >
                  {word.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </QuestionBodyWithImage>
  );
}
