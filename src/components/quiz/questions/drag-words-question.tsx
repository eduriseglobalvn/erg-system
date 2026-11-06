import { CheckCircle2 } from "lucide-react";

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
      <div className="quiz-answer-region-wide grid gap-7 xl:gap-8">
        <div className="rounded-[20px] border border-[rgba(0,0,136,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,248,255,0.86))] p-6 shadow-[0_18px_38px_rgba(0,0,136,0.08)] sm:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold uppercase tracking-[0.02em] text-[#000088]">Câu điền từ</div>
            <div className="h-1.5 w-24 rounded-full bg-[#e82828]" />
          </div>
          <div className="rounded-2xl border border-[rgba(0,0,136,0.10)] bg-white px-6 py-7 text-[var(--quiz-readable-size-lg)] font-semibold leading-[2.6] text-[#1D1D1F] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_28px_rgba(23,32,51,0.05)] sm:px-8 sm:py-8">
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
                    className="mx-3 my-2 inline-flex min-h-[var(--quiz-control-height)] min-w-52 items-center justify-center rounded-xl border px-7 text-center text-[var(--quiz-control-text-size)] font-extrabold shadow-sm align-middle transition hover:-translate-y-0.5 disabled:cursor-default disabled:hover:translate-y-0"
                    style={{
                      backgroundColor: selectedWord ? "#ffffff" : "rgba(0,0,136,0.055)",
                      borderColor: isCorrect ? "#78b816" : reviewMode ? "#ef6b5f" : "var(--quiz-canvas-border)",
                      borderStyle: selectedWord ? "solid" : "dashed",
                      color: isCorrect ? "#66a80f" : reviewMode ? "#df4f43" : selectedWord ? "#000088" : "#637381",
                    }}
                    onClick={() => clearSlot(slot.id)}
                  >
                    {selectedWord?.label ?? "......"}
                  </button>
                  {slot.suffix ? <> {slot.suffix}</> : null}
                  {reviewMode && !isCorrect ? (
                    <span className="text-sm font-medium text-emerald-700">({correctWord?.label})</span>
                  ) : null}
                </span>
              );
            })}
          </div>
        </div>

        <div className="rounded-[20px] border border-[rgba(0,0,136,0.12)] bg-[linear-gradient(135deg,rgba(0,0,136,0.06),rgba(255,255,255,0.94)_46%,rgba(232,40,40,0.05))] p-6 shadow-[0_18px_40px_rgba(0,0,136,0.08)] sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-extrabold uppercase tracking-[0.02em] text-[#000088]">Ngân hàng từ</div>
              <div className="text-[13px] font-semibold text-[#637381]">Chọn từ phù hợp để đưa vào chỗ trống.</div>
            </div>
            <span className="rounded-full border border-[rgba(34,197,94,0.18)] bg-white px-4 py-2 text-sm font-extrabold text-[#118D57] shadow-sm">
              {usedWordIds.size}/{wordBank.length} đã dùng
            </span>
          </div>
          <div className="flex flex-wrap gap-4 rounded-2xl border border-white/80 bg-white/78 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] sm:p-6">
            {wordBank.map((word) => {
              const used = usedWordIds.has(word.id);

              return (
                <button
                  key={word.id}
                  type="button"
                  disabled={submitted || used}
                  className="inline-flex min-h-[calc(var(--quiz-control-height)+6px)] min-w-32 items-center justify-center gap-2 rounded-xl border px-8 text-center text-[var(--quiz-control-text-size)] font-extrabold shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,0,136,0.10)] disabled:cursor-default disabled:hover:translate-y-0 sm:min-w-40 sm:px-10"
                  style={{
                    background: used ? "rgba(34,197,94,0.10)" : "linear-gradient(180deg, #ffffff, #f8f9ff)",
                    borderColor: used ? "rgba(34,197,94,0.28)" : "rgba(0,0,136,0.22)",
                    color: used ? "#118D57" : "#000088",
                    opacity: used ? 0.82 : 1,
                  }}
                  onClick={() => placeWord(word.id)}
                >
                  {used ? <CheckCircle2 className="h-5 w-5" /> : null}
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
