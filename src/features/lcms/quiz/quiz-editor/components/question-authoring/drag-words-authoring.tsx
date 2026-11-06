import Box from "@mui/material/Box";

import type { Question } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { readBlankSentence, writeBlankSentence } from "./blank-sentence-codec";
import { ChipInput, type ChipItem } from "./chip-input";
import { SentenceBuilder } from "./sentence-builder";
import { newRowId } from "./sortable-rows";

/** A sentence whose blanks become drop slots; the tray holds each slot's word plus the teacher's distractors. */
export function DragWordsAuthoring({ question, onChange }: { question: Question; onChange: (next: Question) => void }) {
  const sentence = readBlankSentence(question);
  // Written only to list the tray (slot words first, then distractors); onChange fires on an edit alone.
  const written = writeBlankSentence(question, sentence);
  const bank = written.wordBank ?? [];
  const slotWords = new Set(written.wordSlots?.map((slot) => slot.correctWordId));
  const setBank = (wordBank: typeof bank) => onChange({ ...written, wordBank });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <SentenceBuilder
        blankStyle="underline"
        hint="Gõ cả câu, bôi đen một từ → nó thành ô trống. Từ trong ô tự vào khay."
        onChange={(s) => onChange(writeBlankSentence(question, s))}
        sentence={sentence}
      />
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, borderTop: "1px dashed", borderColor: tokens.color.border, pt: 0.75 }}>
        <Box component="span" sx={{ typography: "caption", color: "text.secondary" }}>Khay từ:</Box>
        <ChipInput
          inputLabel="Thêm từ gây nhiễu"
          items={bank.map((word, index): ChipItem => {
            const correct = slotWords.has(word.id);
            return {
              // Old data may repeat an id, so the position is the key.
              key: String(index),
              label: word.label,
              tone: correct ? "correct" : "plain",
              shape: "word",
              onRemove: correct ? undefined : () => setBank(bank.filter((_, i) => i !== index)),
            };
          })}
          onAdd={(label) => setBank([...bank, { id: newRowId("word"), label }])}
          placeholder="+ từ gây nhiễu"
        />
      </Box>
    </Box>
  );
}
