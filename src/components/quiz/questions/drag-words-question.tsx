import { CheckCircle2 } from "lucide-react";

import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { AppSelect } from "@/components/ui/app-select";
import type { DragWord, DragWordSlot } from "@/lib/types";

export function DragWordsQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  result,
  editable = false,
  onQuestionChange,
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

  function emitWordBank(nextWordBank: DragWord[], nextSlots: DragWordSlot[] = slots) {
    onQuestionChange?.({ ...question, wordBank: nextWordBank, wordSlots: nextSlots });
  }

  function emitSlots(nextSlots: DragWordSlot[]) {
    onQuestionChange?.({ ...question, wordSlots: nextSlots });
  }

  function updateWord(wordId: string, patch: Partial<DragWord>) {
    emitWordBank(wordBank.map((word) => (word.id === wordId ? { ...word, ...patch } : word)));
  }

  function addWord() {
    const nextWord = {
      id: createRuntimeId("word"),
      label: createUniqueWordLabel(wordBank),
    };

    emitWordBank([...wordBank, nextWord], slots.length ? slots : [{ id: createRuntimeId("slot"), label: "Blank", correctWordId: nextWord.id }]);
  }

  function removeWord(wordId: string) {
    if (wordBank.length <= 1) return;

    const nextWordBank = wordBank.filter((word) => word.id !== wordId);
    const fallbackWordId = nextWordBank[0]?.id ?? "";
    const nextSlots = slots.map((slot) =>
      slot.correctWordId === wordId ? { ...slot, correctWordId: fallbackWordId } : slot,
    );

    emitWordBank(nextWordBank, nextSlots);
  }

  function updateSlot(slotId: string, patch: Partial<DragWordSlot>) {
    emitSlots(slots.map((slot) => (slot.id === slotId ? { ...slot, ...patch } : slot)));
  }

  function addSlot() {
    emitSlots([
      ...slots,
      {
        id: createRuntimeId("slot"),
        label: `Blank ${slots.length + 1}`,
        correctWordId: wordBank[0]?.id ?? "",
      },
    ]);
  }

  function removeSlot(slotId: string) {
    emitSlots(slots.filter((slot) => slot.id !== slotId));
  }

  if (editable && onQuestionChange) {
    return (
      <QuestionBodyWithImage question={question}>
        <div className="quiz-answer-region-wide grid gap-7 xl:gap-8">
          <div className="rounded-[20px] border border-[rgba(0,0,136,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,248,255,0.86))] p-6 shadow-[0_18px_38px_rgba(0,0,136,0.08)] sm:p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-sm font-extrabold uppercase tracking-[0.02em] text-[#000088]">Fill statement</div>
              <div className="h-1.5 w-24 rounded-full bg-[#e82828]" />
            </div>
            <div className="rounded-2xl border border-[rgba(0,0,136,0.10)] bg-white px-6 py-7 text-[var(--quiz-readable-size-lg)] font-semibold leading-[2.6] text-[#172033] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_28px_rgba(23,32,51,0.05)] sm:px-8 sm:py-8">
              {slots.map((slot, index) => {
                const selectableWords = normalizeEditableWordBank(wordBank, slot.correctWordId);
                const correctWord = selectableWords.find((word) => word.id === slot.correctWordId);

                return (
                  <span key={slot.id} className="inline-flex flex-wrap items-center gap-2 align-middle">
                    {index > 0 ? <span aria-hidden="true">&nbsp;</span> : null}
                    <input
                      className="quiz-runtime-edit-input inline-block min-w-64 max-w-[min(520px,100%)] text-[var(--quiz-readable-size-lg)] font-semibold"
                      value={slot.label}
                      onChange={(event) => updateSlot(slot.id, { label: event.target.value })}
                      aria-label={`Slot ${index + 1}`}
                    />
                    <AppSelect
                      aria-label={`Correct word ${index + 1}`}
                      className="mx-1 my-2 min-w-52"
                      value={slot.correctWordId || selectableWords[0]?.id || ""}
                      onChange={(event) => updateSlot(slot.id, { correctWordId: event.target.value })}
                    >
                      {selectableWords.map((word) => (
                        <option key={word.id} value={word.id}>
                          {word.label}
                        </option>
                      ))}
                    </AppSelect>
                    <span className="text-sm font-semibold text-slate-400">({correctWord?.label ?? "empty"})</span>
                    {slots.length > 1 ? (
                      <button type="button" className="quiz-runtime-edit-remove" onClick={() => removeSlot(slot.id)}>
                        Remove blank
                      </button>
                    ) : null}
                  </span>
                );
              })}
            </div>
            <button type="button" className="quiz-runtime-edit-add mt-5" onClick={addSlot}>
              Add blank
            </button>
          </div>

          <div className="rounded-[20px] border border-[rgba(0,0,136,0.12)] bg-[linear-gradient(135deg,rgba(0,0,136,0.06),rgba(255,255,255,0.94)_46%,rgba(232,40,40,0.05))] p-6 shadow-[0_18px_40px_rgba(0,0,136,0.08)] sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-extrabold uppercase tracking-[0.02em] text-[#000088]">Word bank</div>
                <div className="text-[13px] font-semibold text-[#637381]">Words students can place into blanks.</div>
              </div>
              <span className="rounded-full border border-[rgba(34,197,94,0.18)] bg-white px-4 py-2 text-sm font-extrabold text-[#118D57] shadow-sm">
                {wordBank.length} words
              </span>
            </div>
            <div className="relative z-[2] flex flex-wrap gap-4 rounded-2xl border border-white/80 bg-white/78 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] sm:p-6">
              {wordBank.map((word) => (
                <div
                  key={word.id}
                  className="inline-flex min-h-[calc(var(--quiz-control-height)+6px)] min-w-40 items-center justify-center gap-2 rounded-xl border border-[rgba(0,0,136,0.22)] bg-[linear-gradient(180deg,#ffffff,#f8f9ff)] px-5 text-center text-[var(--quiz-control-text-size)] font-extrabold text-[#000088] shadow-sm"
                >
                  <input
                    className="quiz-runtime-edit-input min-w-0 text-center"
                    value={word.label}
                    onChange={(event) => updateWord(word.id, { label: event.target.value })}
                    aria-label={`Word ${wordBank.findIndex((item) => item.id === word.id) + 1}`}
                  />
                  {wordBank.length > 1 ? (
                    <button type="button" className="quiz-runtime-edit-remove" onClick={() => removeWord(word.id)}>
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
              <button type="button" className="quiz-runtime-edit-add" onClick={addWord}>
                Add word
              </button>
            </div>
          </div>
        </div>
      </QuestionBodyWithImage>
    );
  }

  return (
    <QuestionBodyWithImage question={question}>
      <div className="quiz-answer-region-wide grid gap-7 xl:gap-8">
        <div className="rounded-[20px] border border-[rgba(0,0,136,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,248,255,0.86))] p-6 shadow-[0_18px_38px_rgba(0,0,136,0.08)] sm:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold uppercase tracking-[0.02em] text-[#000088]">Câu điền từ</div>
            <div className="h-1.5 w-24 rounded-full bg-[#e82828]" />
          </div>
          <div className="rounded-2xl border border-[rgba(0,0,136,0.10)] bg-white px-6 py-7 text-[var(--quiz-readable-size-lg)] font-semibold leading-[2.6] text-[#172033] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_28px_rgba(23,32,51,0.05)] sm:px-8 sm:py-8">
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

function createRuntimeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function normalizeEditableWordBank(wordBank: DragWord[], correctWordId: string) {
  if (!correctWordId || wordBank.some((word) => word.id === correctWordId)) {
    return wordBank;
  }

  return [
    ...wordBank,
    {
      id: correctWordId,
      label: correctWordId,
    },
  ];
}

function createUniqueWordLabel(wordBank: DragWord[]) {
  let index = wordBank.length + 1;
  let nextLabel = `Word ${index}`;
  const labels = new Set(wordBank.map((word) => word.label));

  while (labels.has(nextLabel)) {
    index += 1;
    nextLabel = `Word ${index}`;
  }

  return nextLabel;
}
