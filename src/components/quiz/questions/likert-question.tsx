import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

import { QuestionBodyWithImage } from "@/components/quiz/questions/shared";
import type { QuestionComponentProps } from "@/components/quiz/questions/types";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

export function LikertQuestion({
  question,
  value,
  onChange,
  submitted = false,
  reviewMode = false,
}: QuestionComponentProps) {
  const rows = question.likertRows ?? [];
  const scale = question.likertScale ?? [];
  const responses = value.likertResponses ?? {};
  const first = scale[0];
  const last = scale.length > 1 ? scale[scale.length - 1] : undefined;

  return (
    <QuestionBodyWithImage question={question}>
      <Box className="quiz-answer-region-wide" sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {rows.map((row) => (
          <Box key={row.id} sx={{ bgcolor: "background.paper", border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius.card}px`, display: "flex", flexDirection: "column", gap: 1.5, p: 1.75 }}>
            <Box sx={{ typography: "subtitle2" }}>{row.label}</Box>
            <Box role="radiogroup" aria-label={row.label} sx={{ display: "flex", gap: 0.5 }}>
              {scale.map((point) => {
                const active = responses[row.id] === point.id;
                return (
                  <ButtonBase
                    key={point.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={submitted}
                    title={point.label}
                    aria-label={`${row.label}: ${point.label}`}
                    onClick={() =>
                      onChange({
                        likertResponses: {
                          ...responses,
                          [row.id]: point.id,
                        },
                      })
                    }
                    sx={(theme) => ({
                      typography: "subtitle2",
                      bgcolor: active ? `var(--quiz-accent, ${theme.palette.primary.main})` : "background.paper",
                      border: "1.5px solid",
                      borderColor: active ? `var(--quiz-accent, ${theme.palette.primary.main})` : tokens.color.border,
                      borderRadius: `${tokens.radius.control}px`,
                      color: active ? `var(--quiz-accent-contrast, ${theme.palette.primary.contrastText})` : "text.secondary",
                      flex: 1,
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: "fontWeightBold",
                      height: 44,
                      minWidth: 0,
                      transition: `background-color ${tokens.motion.duration.fast}ms ${tokens.motion.easing.standard}, border-color ${tokens.motion.duration.fast}ms ${tokens.motion.easing.standard}`,
                      ...(active ? {} : { "&:hover": { borderColor: tokens.color.borderStrong, bgcolor: tokens.color.surfaceMuted } }),
                      "&.Mui-focusVisible": { boxShadow: tokens.shadow.focus },
                      "&.Mui-disabled": { cursor: "default" },
                    })}
                  >
                    {point.value}
                  </ButtonBase>
                );
              })}
            </Box>
            {first ? (
              <Box aria-hidden sx={{ typography: "caption", color: "text.secondary", display: "flex", gap: 1, justifyContent: "space-between" }}>
                <span>{first.label}</span>
                {last ? <Box component="span" sx={{ textAlign: "right" }}>{last.label}</Box> : null}
              </Box>
            ) : null}
          </Box>
        ))}
      </Box>
      {reviewMode ? (
        <Box component="p" sx={{ typography: "caption", color: "text.secondary", m: 0 }}>
          Câu khảo sát đã được ghi nhận, không có đúng sai tuyệt đối.
        </Box>
      ) : null}
    </QuestionBodyWithImage>
  );
}
