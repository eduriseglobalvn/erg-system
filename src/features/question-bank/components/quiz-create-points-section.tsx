import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgTextField } from "@/components/erg-mui";
import { ChoiceGroup } from "@/features/lcms/quiz/quiz-theme/quiz-theme-controls";
import {
  getQuestionBankAutoQuestionPoints,
  getQuestionBankQuestionPoints,
} from "@/features/question-bank/api/question-bank-to-quiz";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { QuestionBankCopy } from "./question-bank-copy";
import type { QuizCreateDraft } from "./quiz-create-package-dialog";

const row = { display: "grid", gridTemplateColumns: "24px minmax(0, 1fr) 88px", gap: 1.25, alignItems: "center", px: 1.25, py: 0.75 } as const;

export function QuizCreatePointsSection({ copy, draft, maxPoints, questions, onChange }: {
  copy: QuestionBankCopy;
  draft: QuizCreateDraft;
  maxPoints: number;
  questions: QuestionBankQuestion[];
  onChange: (draft: QuizCreateDraft) => void;
}) {
  const [passingUnit, setPassingUnit] = useState<"percent" | "points">("percent");
  const passingPoints = Math.round(maxPoints * draft.passingRate) / 100;
  // The draft always stores a percentage; the points unit is only a way to type it.
  const setPassing = (value: number) => {
    const percent = passingUnit === "percent" ? value : maxPoints > 0 ? (value / maxPoints) * 100 : 0;
    onChange({ ...draft, passingRate: Math.min(100, Math.max(0, Math.round(percent * 100) / 100)) });
  };

  return (
    <Stack
      component="section"
      aria-label={copy.pointsTitle}
      sx={{ gap: 1.5, p: 1.75, bgcolor: t.color.surfaceMuted, border: `1px solid ${t.color.divider}`, borderRadius: `${t.radius.card}px` }}
    >
      <ChoiceGroup label={copy.pointsTitle} value={draft.pointsMode} options={copy.pointsMode} onChange={(pointsMode) => onChange({ ...draft, pointsMode })} />
      {draft.pointsMode === "custom" ? (
        <Box sx={{ border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.control}px`, bgcolor: t.color.surface, overflow: "hidden" }}>
          <Box sx={{ maxHeight: 280, overflowY: "auto" }}>
            {questions.map((question, index) => (
              <Box key={question.id} sx={{ ...row, borderTop: index ? `1px solid ${t.color.divider}` : 0 }}>
                <Typography variant="caption" color="text.secondary">{index + 1}</Typography>
                <Typography variant="body2" noWrap title={question.stem}>{question.stem}</Typography>
                <PointsInput
                  label={copy.questionPointsLabel(index + 1)}
                  initial={getQuestionBankQuestionPoints(question.id, questions.length, draft)}
                  onChange={(points) => onChange({ ...draft, questionPoints: { ...draft.questionPoints, [question.id]: points } })}
                />
              </Box>
            ))}
          </Box>
          <Typography variant="subtitle2" sx={{ ...row, display: "block", textAlign: "right", bgcolor: t.color.surfaceMuted, borderTop: `1px solid ${t.color.divider}` }}>
            {copy.maxPointsValue(maxPoints)}
          </Typography>
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">
          {copy.equalPointsHint(getQuestionBankAutoQuestionPoints(questions.length), maxPoints)}
        </Typography>
      )}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <ErgTextField
          size="small"
          type="number"
          label={passingUnit === "percent" ? copy.passingRateLabel : copy.passingPointsLabel}
          value={passingUnit === "percent" ? draft.passingRate : passingPoints}
          onChange={(event) => setPassing(Number(event.target.value))}
          helperText={passingUnit === "percent" ? copy.passingPointsHint(passingPoints, maxPoints) : copy.passingPercentHint(draft.passingRate)}
          slotProps={{ htmlInput: { min: 0, max: passingUnit === "percent" ? 100 : maxPoints } }}
          sx={{ maxWidth: 220 }}
        />
        <ToggleButtonGroup exclusive size="small" value={passingUnit} aria-label={copy.passingUnitLabel} onChange={(_, value) => { if (value) setPassingUnit(value); }}>
          <ToggleButton value="percent">%</ToggleButton>
          <ToggleButton value="points">{copy.pointsUnit}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Stack>
  );
}

/** Keeps the typed text so "2," or "" stay editable; the draft gets the parsed number (comma accepted as decimal mark). */
function PointsInput({ initial, label, onChange }: { initial: number; label: string; onChange: (points: number) => void }) {
  const [text, setText] = useState(String(initial));
  const points = Number(text.replace(",", "."));

  return (
    <ErgTextField
      size="small"
      value={text}
      error={!(Number.isFinite(points) && points > 0)}
      onChange={(event) => {
        setText(event.target.value);
        onChange(Number(event.target.value.replace(",", ".")));
      }}
      slotProps={{ htmlInput: { inputMode: "decimal", "aria-label": label, style: { textAlign: "right" } } }}
    />
  );
}
