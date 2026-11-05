import Box from "@mui/material/Box";

import type { Question } from "@/domain/quiz/types";
import { blankWord, type BlankSentence } from "./blank-sentence";
import { patchBlank, readBlankSentence, writeBlankSentence } from "./blank-sentence-codec";
import { ChipInput } from "./chip-input";
import { SentenceBuilder } from "./sentence-builder";

/** A sentence whose blanks the learner types into; each blank may accept several spellings. */
export function FillBlankAuthoring({ question, onChange }: { question: Question; onChange: (next: Question) => void }) {
  const sentence = readBlankSentence(question);
  const answersOf = (id: string) => question.textBlanks?.find((b) => b.id === id)?.correctAnswers ?? [];

  // Index 0 is the word in the sentence; only the alternates after it change here.
  const setAlternates = (blank: BlankSentence["blanks"][number], alternates: string[]) =>
    onChange(patchBlank(question, sentence, blank.id, { correctAnswers: [blankWord(sentence, blank), ...alternates] }));

  const renderPopover = (id: string) => {
    const blank = sentence.blanks.find((b) => b.id === id)!;
    const alternates = answersOf(id).slice(1);
    return (
      <>
        <Box component="span" sx={{ typography: "caption", color: "text.secondary" }}>Chấp nhận cả các cách viết:</Box>
        <ChipInput
          inputLabel="Thêm cách viết khác"
          items={[
            { key: "word", label: blankWord(sentence, blank), tone: "correct" },
            ...alternates.map((alt, i) => ({
              key: `alt-${i}`,
              label: alt,
              tone: "correct" as const,
              onRemove: () => setAlternates(blank, alternates.filter((_, j) => j !== i)),
            })),
          ]}
          onAdd={(text) => setAlternates(blank, [...alternates, text])}
          placeholder="+ thêm"
        />
      </>
    );
  };

  return (
    <SentenceBuilder
      badge={(id) => (answersOf(id).length > 1 ? `+${answersOf(id).length - 1}` : undefined)}
      blankStyle="chip"
      hint="Gõ cả câu, bôi đen một từ → nó thành ô trống. Bấm ô xanh để thêm cách viết khác."
      onChange={(s) => onChange(writeBlankSentence(question, s))}
      renderPopover={renderPopover}
      sentence={sentence}
    />
  );
}
