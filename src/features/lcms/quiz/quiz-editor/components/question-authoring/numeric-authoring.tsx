import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { Question } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { formatDecimal, parseDecimal } from "./decimal-text";
import { NumberLine } from "./number-line";

const box = (width: number, correct = false) => ({
  width,
  height: 36,
  px: 1.5,
  border: 1.5,
  borderStyle: "solid",
  borderColor: correct ? (t: { palette: { success: { main: string } } }) => t.palette.success.main : tokens.color.border,
  borderRadius: `${tokens.radius.control}px`,
  bgcolor: correct ? tokens.statusTint.success.bg : "background.paper",
  fontFamily: tokens.font.mono,
});

const same = (a: number, b: number) => a === b || (Number.isNaN(a) && Number.isNaN(b));

/** The correct number, how far off still counts, and a unit; every keystroke is written back to the question. */
export function NumericAuthoring({ question, onChange }: { question: Question; onChange: (next: Question) => void }) {
  const answer = question.numericAnswer;
  const [valueText, setValueText] = useState(() => formatDecimal(answer?.correctValue as number));
  const [toleranceText, setToleranceText] = useState(() => formatDecimal(answer?.tolerance as number));
  const unit = answer?.unit ?? "";
  // An undo or sync that changes the answer underneath replaces what was typed.
  const propValue = typeof answer?.correctValue === "number" ? answer.correctValue : NaN;
  const propTolerance = answer?.tolerance ?? NaN;
  if (!same(parseDecimal(valueText), propValue)) setValueText(formatDecimal(propValue));
  if (!same(parseDecimal(toleranceText), propTolerance)) setToleranceText(formatDecimal(propTolerance));

  const emit = (nextValue: string, nextTolerance: string, nextUnit: string) => {
    setValueText(nextValue);
    setToleranceText(nextTolerance);
    onChange({
      ...question,
      numericAnswer: { ...answer, correctValue: parseDecimal(nextValue), tolerance: nextTolerance.trim() ? parseDecimal(nextTolerance) : undefined, unit: nextUnit },
    });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
        <Typography variant="body2">Đáp số</Typography>
        <InputBase inputProps={{ "aria-label": "Đáp số", inputMode: "decimal" }} onChange={(e) => emit(e.target.value, toleranceText, unit)} placeholder="Nhập số" sx={box(140, true)} value={valueText} />
        <Typography variant="body2">±</Typography>
        <InputBase inputProps={{ "aria-label": "Sai số", inputMode: "decimal" }} onChange={(e) => emit(valueText, e.target.value, unit)} placeholder="0" sx={box(96)} value={toleranceText} />
        <InputBase inputProps={{ "aria-label": "Đơn vị" }} onChange={(e) => emit(valueText, toleranceText, e.target.value)} placeholder="đơn vị" sx={box(120)} value={unit} />
      </Box>
      <NumberLine tolerance={parseDecimal(toleranceText)} unit={unit} value={parseDecimal(valueText)} />
    </Box>
  );
}
