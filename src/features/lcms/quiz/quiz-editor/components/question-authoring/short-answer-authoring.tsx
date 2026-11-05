import Box from "@mui/material/Box";

import type { Question } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { ChipInput } from "./chip-input";

/** Every accepted spelling lives in one blank; blanks from older data are shown merged and only rewritten on an edit. */
export function ShortAnswerAuthoring({ question, onChange }: { question: Question; onChange: (next: Question) => void }) {
  const blanks = question.textBlanks ?? [];
  const answers = blanks
    .flatMap((blank) => blank.correctAnswers.map((answer) => answer.trim()))
    .filter((answer, index, all) => answer && all.indexOf(answer) === index);

  const write = (next: string[]) => {
    const first = blanks[0];
    onChange({ ...question, textBlanks: [{ placeholder: "......", ...first, id: first?.id ?? `${question.id}-answer`, label: first?.label ?? "", correctAnswers: next }] });
  };

  return (
    <Box
      sx={{
        px: "12px",
        py: "7px",
        border: 1.5,
        borderStyle: "solid",
        borderColor: (t) => t.palette.success.main,
        bgcolor: tokens.statusTint.success.bg,
        borderRadius: `${tokens.radius.control}px`,
      }}
    >
      <ChipInput
        inputLabel="Thêm cách viết đúng"
        items={answers.map((answer) => ({ key: answer, label: answer, tone: "correct", onRemove: () => write(answers.filter((a) => a !== answer)) }))}
        onAdd={(text) => write([...answers, text])}
        placeholder="gõ thêm rồi Enter…"
      />
    </Box>
  );
}
