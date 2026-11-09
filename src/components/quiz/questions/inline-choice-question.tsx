import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import Box from "@mui/material/Box";
import { Fragment, useEffect, useState } from "react";

import { InlineChoiceSegment, InlineChoiceSelect, QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { AnswerPayload } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

export function InlineChoiceQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
  result,
}: QuestionComponentProps) {
  const [revealedBlankId, setRevealedBlankId] = useState<string | null>(null);
  const paceStateUpdate = usePacedStateBatch();
  const blanks = question.inlineBlanks ?? [];
  const revealedWrongBlank = reviewMode
    ? question.inlineBlanks?.find((blank) => {
        if (blank.id !== revealedBlankId) {
          return false;
        }

        const selected = value.inlineSelections?.[blank.id];
        const correct = result?.correctInlineSelections?.[blank.id] ?? blank.correctOptionId;
        return selected && selected !== correct;
      })
    : null;
  const revealedWrongCorrectValue = revealedWrongBlank
    ? result?.correctInlineSelections?.[revealedWrongBlank.id] ?? revealedWrongBlank.correctOptionId
    : null;

  useEffect(() => {
    if (!reviewMode || !revealedBlankId) {
      return;
    }

    const revealedBlank = question.inlineBlanks?.find((blank) => blank.id === revealedBlankId);
    const selected = revealedBlank ? value.inlineSelections?.[revealedBlank.id] : null;
    const correct = revealedBlank
      ? result?.correctInlineSelections?.[revealedBlank.id] ?? revealedBlank.correctOptionId
      : null;

    if (!revealedBlank || !selected || selected === correct) {
      paceStateUpdate(() => setRevealedBlankId(null));
    }
  }, [paceStateUpdate, question.inlineBlanks, result?.correctInlineSelections, revealedBlankId, reviewMode, value.inlineSelections]);

  function handleChange(nextValue: AnswerPayload) {
    setRevealedBlankId(null);
    onChange(nextValue);
  }

  const correctOf = (blankId: string, fallback?: string) => result?.correctInlineSelections?.[blankId] ?? fallback;
  // Two-option blanks (Có / Không, Đúng / Sai) read as a list of statements, each with a segmented control.
  const segmented = blanks.length > 0 && blanks.every((blank) => blank.options.length === 2);

  if (segmented) {
    return (
      <QuestionBodyWithImage question={question}>
        <Box className="quiz-answer-region" sx={{ bgcolor: "background.paper", border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.card}px`, overflow: "hidden" }}>
          {blanks.map((blank, index) => (
            <Box key={blank.id} sx={{ alignItems: "flex-start", borderTop: index ? `1px solid ${tokens.color.divider}` : 0, display: "flex", gap: 1.25, minHeight: 60, px: 2, py: 1.5 }}>
              <Box component="span" aria-hidden sx={{ color: "text.secondary", flex: "none", fontWeight: "fontWeightBold", pt: 0.75, width: 18 }}>{`${String.fromCharCode(97 + index)})`}</Box>
              <Box component="span" sx={{ typography: "h6", flex: 1, lineHeight: 1.45, minWidth: 0, pt: 0.5, fontWeight: "fontWeightRegular" }}>
                {blank.statement}
                {blank.suffix ? <> {blank.suffix}</> : null}
              </Box>
              <InlineChoiceSegment
                blank={blank}
                correctValue={correctOf(blank.id, blank.correctOptionId)}
                reviewMode={reviewMode}
                submitted={submitted}
                value={value}
                onChange={handleChange}
              />
            </Box>
          ))}
        </Box>
        {reviewMode ? null : (
          <Box component="p" sx={{ typography: "caption", color: "text.secondary", m: 0 }}>
            {`Đã trả lời ${blanks.filter((blank) => value.inlineSelections?.[blank.id]).length}/${blanks.length} ý.`}
          </Box>
        )}
      </QuestionBodyWithImage>
    );
  }

  return (
    <QuestionBodyWithImage question={question}>
      <Box className="quiz-answer-region" sx={{ display: "flex", flexDirection: "column", gap: 1.5, position: "relative" }}>
        <Box component="p" sx={{ typography: "h5", fontWeight: "fontWeightRegular", lineHeight: 2.1, m: 0 }}>
          {blanks.map((blank, index) => {
            const select = (
              <InlineChoiceSelect
                blank={blank}
                correctValue={correctOf(blank.id, blank.correctOptionId)}
                reviewMode={reviewMode}
                submitted={submitted}
                value={value}
                onChange={handleChange}
                onRevealCorrectAnswer={() => setRevealedBlankId(blank.id)}
              />
            );
            return (
              <Fragment key={blank.id}>
                {index > 0 ? " " : null}
                {blank.selectPosition !== "after" ? <>{select} </> : null}
                {blank.statement}
                {blank.selectPosition === "after" ? <> {select}</> : null}
                {blank.suffix ? <> {blank.suffix}</> : null}
              </Fragment>
            );
          })}
        </Box>
        {revealedWrongBlank && revealedWrongCorrectValue ? (
          <Box sx={{ bgcolor: "background.paper", border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.card}px`, maxWidth: 320, px: 2, py: 1.5 }}>
            <Box sx={{ typography: "subtitle2" }}>Đáp án đúng</Box>
            <Box sx={{ typography: "body2", alignItems: "center", display: "flex", gap: 1, mt: 1 }}>
              <Box component="span" sx={{ alignItems: "center", bgcolor: "success.main", borderRadius: `${tokens.radius.chip}px`, color: "common.white", display: "inline-flex", height: 22, justifyContent: "center", width: 22 }}>
                <CheckRoundedIcon aria-hidden sx={{ fontSize: tokens.size.iconSm }} />
              </Box>
              <span>{formatInlineValue(revealedWrongCorrectValue)}</span>
            </Box>
          </Box>
        ) : null}
      </Box>
    </QuestionBodyWithImage>
  );
}


function formatInlineValue(value: string) {
  if (value === "yes") {
    return "Có";
  }

  if (value === "no") {
    return "Không";
  }

  return value;
}
