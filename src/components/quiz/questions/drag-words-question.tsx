import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

import { blankSx, QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

/** A word card in a bank (design `.wchip`): raised white tile; a used one fades to a dashed outline. */
export function wordChipSx(used = false) {
  return {
    typography: "subtitle2",
    alignItems: "center",
    bgcolor: "background.paper",
    border: `1px ${used ? "dashed" : "solid"} ${tokens.color.borderStrong}`,
    borderRadius: `${tokens.radius.control}px`,
    boxShadow: used ? "none" : `0 1px 0 ${tokens.color.border}`,
    color: "text.primary",
    display: "inline-flex",
    gap: 0.75,
    minHeight: 40,
    opacity: used ? 0.4 : 1,
    px: 1.75,
    whiteSpace: "nowrap",
    "&.Mui-focusVisible": { borderColor: "primary.main", boxShadow: `0 0 0 3px ${tokens.color.primarySoft}` },
    "&.Mui-disabled": { cursor: "default" },
  } as const;
}

export const overlineSx = { typography: "caption", color: "text.secondary", fontWeight: "fontWeightBold", letterSpacing: "0.06em", textTransform: "uppercase" } as const;

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
      <Box className="quiz-answer-region-wide" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box component="p" sx={{ typography: "h5", fontWeight: "fontWeightRegular", lineHeight: 2.1, m: 0 }}>
          {slots.map((slot, index) => {
            const selectedWordId = placements[slot.id];
            const selectedWord = wordBank.find((word) => word.id === selectedWordId);
            const correctWordId = result?.correctDragWordPlacements?.[slot.id] ?? slot.correctWordId;
            const correctWord = wordBank.find((word) => word.id === correctWordId);
            const isCorrect = reviewMode && selectedWordId === correctWordId;
            const state = reviewMode ? (isCorrect ? "correct" : "wrong") : selectedWord ? "filled" : "empty";

            return (
              <span key={slot.id}>
                {index > 0 ? " " : null}
                {slot.label}{" "}
                <ButtonBase
                  type="button"
                  disabled={submitted && !reviewMode}
                  aria-label={selectedWord ? `Chỗ trống ${index + 1}: ${selectedWord.label}, bấm để bỏ` : `Chỗ trống ${index + 1}`}
                  sx={{ ...blankSx(state), justifyContent: "center", ...(state === "wrong" && selectedWord ? { textDecoration: "line-through" } : null), "&.Mui-disabled": { cursor: "default" } }}
                  onClick={() => clearSlot(slot.id)}
                >
                  {selectedWord?.label ?? " "}
                </ButtonBase>
                {slot.suffix ? <> {slot.suffix}</> : null}
                {reviewMode && !isCorrect ? (
                  <Box component="span" sx={{ typography: "subtitle2", color: "success.dark", fontWeight: "fontWeightBold", ml: 0.5 }}>({correctWord?.label})</Box>
                ) : null}
              </span>
            );
          })}
        </Box>

        <Box sx={{ bgcolor: tokens.color.surfaceSubtle, border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.card}px`, display: "flex", flexDirection: "column", gap: 1, p: 1.5 }}>
          <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
            <Box component="span" sx={overlineSx}>Ngân hàng từ · chạm để điền</Box>
            <Box component="span" sx={{ typography: "caption", color: "text.secondary", flex: "none", fontVariantNumeric: "tabular-nums" }}>
              {usedWordIds.size}/{wordBank.length} đã dùng
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {wordBank.map((word) => {
              const used = usedWordIds.has(word.id);

              return (
                <ButtonBase
                  key={word.id}
                  type="button"
                  disabled={submitted || used}
                  sx={wordChipSx(used)}
                  onClick={() => placeWord(word.id)}
                >
                  {word.label}
                </ButtonBase>
              );
            })}
          </Box>
        </Box>
      </Box>
    </QuestionBodyWithImage>
  );
}
