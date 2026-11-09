import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";

import type { AnswerResult } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

const DEFAULT_MESSAGES = new Set(["Chính xác!", "Chưa đúng, hãy thử lại."]);
const LIST_MARKER =/^\s*(?:[-*•]|\d+[.)])\s+/;

/** Feedback is plain text; every non-empty line (list markers stripped) counts as one step. */
export function splitFeedbackSteps(text: string): string[] {
  return text.split(/\r?\n/).map((line) => line.replace(LIST_MARKER, "").trim()).filter(Boolean);
}

type Tint = { bg: string; color: string; dot: string };
type Tone = { tint: Tint; icon: ReactNode; title: string };

function toneFor(result: AnswerResult): Tone {
  if (result.pendingReview) return { tint: tk.statusTint.info, icon: <InfoRoundedIcon />, title: "Đã ghi nhận bài làm" };
  if (result.correct) return { tint: tk.statusTint.success, icon: <CheckCircleRoundedIcon />, title: "Chính xác!" };
  return { tint: tk.statusTint.error, icon: <LightbulbRoundedIcon />, title: "Chưa đúng, gần rồi!" };
}

/** L03: tinted card without a border, icon on the left, the first step and a link to the rest. */
export function PracticeFeedbackPanel({ result }: { result: AnswerResult }) {
  const [expanded, setExpanded] = useState(false);
  const tone = toneFor(result);
  // The stock "Chính xác!" / "Chưa đúng, hãy thử lại." messages only repeat the title, so show the body only when the teacher wrote something.
  const steps = splitFeedbackSteps(result.message ?? "").filter((step) => !DEFAULT_MESSAGES.has(step));
  const multiStep = steps.length > 1;

  return (
    <Box
      role="status"
      sx={{ alignItems: "flex-start", bgcolor: tone.tint.bg, borderRadius: `${tk.radius.card}px`, color: tone.tint.color, display: "flex", gap: 1.5, mt: 2, px: 2, py: 1.75 }}
    >
      <Box aria-hidden component="span" sx={{ color: tone.tint.dot, display: "flex", flexShrink: 0 }}>{tone.icon}</Box>
      <Box sx={{ display: "grid", gap: 0.5, minWidth: 0 }}>
        <Typography sx={{ color: "inherit", fontWeight: "fontWeightBold" }} variant="subtitle1">{tone.title}</Typography>
        {steps.length > 0 ? (
          <Box data-testid="practice-feedback-body" sx={{ color: "inherit", typography: "body2" }}>
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
          <Button
            endIcon={<ChevronRightRoundedIcon />}
            size="small"
            sx={{ color: "inherit", justifySelf: "start", minHeight: 0, p: 0, "& .MuiButton-endIcon": { ml: 0.25 }, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}
            variant="text"
            onClick={() => setExpanded(true)}
          >
            Xem lời giải từng bước
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
