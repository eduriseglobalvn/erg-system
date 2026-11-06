import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { AnswerResult } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

const LIST_MARKER = /^\s*(?:[-*•]|\d+[.)])\s+/;

/** Feedback is plain text; every non-empty line (list markers stripped) counts as one step. */
export function splitFeedbackSteps(text: string): string[] {
  return text.split(/\r?\n/).map((line) => line.replace(LIST_MARKER, "").trim()).filter(Boolean);
}

type Tone = { accent: "success.dark" | "error.dark" | "info.dark"; bg: string; border: string; title: string };

function toneFor(result: AnswerResult): Tone {
  if (result.pendingReview) return { accent: "info.dark", bg: tk.color.infoSoft, border: tk.color.info, title: "Đã ghi nhận bài làm" };
  if (result.correct) return { accent: "success.dark", bg: tk.color.successSoft, border: tk.color.success, title: "Chính xác!" };
  return { accent: "error.dark", bg: tk.color.dangerSoft, border: tk.color.danger, title: "Chưa đúng, gần rồi!" };
}

export function PracticeFeedbackPanel({ result }: { result: AnswerResult }) {
  const [expanded, setExpanded] = useState(false);
  const tone = toneFor(result);
  const steps = splitFeedbackSteps(result.message ?? "");
  const multiStep = steps.length > 1;

  return (
    <Box
      role="status"
      sx={{ bgcolor: tone.bg, border: "1px solid", borderColor: tone.border, borderRadius: `${tk.radius.card}px`, display: "grid", gap: 1, mt: 3, p: 2 }}
    >
      <Typography sx={{ color: tone.accent }} variant="subtitle1">{tone.title}</Typography>
      {steps.length > 0 ? (
        <Box data-testid="practice-feedback-body" sx={{ color: "text.primary", typography: "body2" }}>
          {multiStep && expanded ? (
            <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
              {steps.map((step, index) => <li key={index}>{step}</li>)}
            </Box>
          ) : (
            <Typography variant="body2">{steps[0]}</Typography>
          )}
        </Box>
      ) : null}
      {multiStep && !expanded ? (
        <Button size="small" sx={{ justifySelf: "start" }} variant="text" onClick={() => setExpanded(true)}>
          Xem lời giải từng bước
        </Button>
      ) : null}
    </Box>
  );
}
