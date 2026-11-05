import Box from "@mui/material/Box";

import type { Question } from "@/domain/quiz/types";
import { readBlankSentence, selectBlankOption, writeBlankSentence } from "./blank-sentence-codec";
import { ChipInput, type ChipItem } from "./chip-input";
import { SentenceBuilder } from "./sentence-builder";

/** A sentence whose blanks are drop-down lists; the word in the sentence is the correct option. */
export function SelectListsAuthoring({ question, onChange }: { question: Question; onChange: (next: Question) => void }) {
  const sentence = readBlankSentence(question);

  const setOptions = (id: string, options: string[]) => {
    const next = writeBlankSentence(question, sentence);
    onChange({ ...next, inlineBlanks: next.inlineBlanks?.map((b) => (b.id === id ? { ...b, options } : b)) });
  };

  const renderPopover = (id: string) => {
    const stored = question.inlineBlanks?.find((b) => b.id === id);
    const options = stored?.options ?? [];
    return (
      <>
        <Box component="span" sx={{ typography: "caption", color: "text.secondary" }}>Các lựa chọn trong ô (bấm để chọn đáp án đúng):</Box>
        <ChipInput
          inputLabel="Thêm lựa chọn"
          items={options.map((option, index): ChipItem => {
            // Old data may repeat the correct option; only its first copy is the answer, the rest are removable.
            const correct = index === options.indexOf(stored?.correctOptionId ?? "");
            return {
              // Old data may repeat an option, so the position is the key.
              key: String(index),
              label: option,
              tone: correct ? "correct" : "plain",
              pressed: correct,
              onToggle: correct ? undefined : () => onChange(selectBlankOption(question, id, option)),
              onRemove: correct ? undefined : () => setOptions(id, options.filter((_, i) => i !== index)),
            };
          })}
          onAdd={(text) => setOptions(id, [...options, text])}
          placeholder="+ thêm"
        />
      </>
    );
  };

  return (
    <SentenceBuilder
      badge={() => "▾"}
      blankStyle="chip"
      hint="Gõ cả câu, bôi đen một từ → nó thành ô trống. Bấm ô xanh để sửa danh sách lựa chọn."
      onChange={(s) => onChange(writeBlankSentence(question, s))}
      renderPopover={renderPopover}
      sentence={sentence}
    />
  );
}
