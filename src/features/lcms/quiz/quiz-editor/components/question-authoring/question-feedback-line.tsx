import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  getFeedbackText,
  updateFeedbackText,
} from "@/features/lcms/quiz/quiz-editor/components/learner-question-authoring-preview/preview-answer-feedback";
import type { QuizEditorFeedbackRow, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const KINDS = [
  { kind: "correct", button: "+ Khi đúng", label: "Lời nhắn khi đúng" },
  { kind: "incorrect", button: "+ Khi sai", label: "Lời nhắn khi sai" },
] as const;

export function QuestionFeedbackLine({ slide, onChange }: { slide: QuizEditorSlide; onChange: (rows: QuizEditorFeedbackRow[]) => void }) {
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const shown = KINDS.filter(({ kind }) => opened[kind] || Boolean(getFeedbackText(slide, kind)));
  const hidden = KINDS.filter((entry) => !shown.includes(entry));

  return (
    <Box sx={{ borderColor: "divider", borderTop: 1, display: "flex", flexDirection: "column", gap: 1, pt: 2 }}>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
        <Typography color="text.secondary" variant="body2">Lời nhắn sau khi trả lời</Typography>
        {hidden.map(({ kind, button }) => (
          <Button key={kind} onClick={() => setOpened({ ...opened, [kind]: true })} size="small" variant="text">
            {button}
          </Button>
        ))}
      </Box>
      {shown.map(({ kind, label }) => (
        <TextField
          autoFocus={opened[kind]}
          key={kind}
          label={label}
          minRows={2}
          multiline
          onChange={(event) => onChange(updateFeedbackText(slide.feedbackRows, kind, event.target.value))}
          size="small"
          value={getFeedbackText(slide, kind) ?? ""}
        />
      ))}
    </Box>
  );
}
