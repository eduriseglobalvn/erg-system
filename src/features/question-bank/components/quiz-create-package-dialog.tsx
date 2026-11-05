import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgButton, ErgDialog, ErgTextField } from "@/components/erg-mui";
import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { ChoiceGroup } from "@/features/lcms/quiz/quiz-theme/quiz-theme-controls";
import { getQuestionBankPackageMaxPoints, type QuizPointsMode } from "@/features/question-bank/api/question-bank-to-quiz";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { QuestionBankCopy } from "./question-bank-copy";
import { QuizCreatePointsSection } from "./quiz-create-points-section";
import { QuizCreateThemeRow } from "./quiz-create-theme-row";

export type QuizCreateDraft = {
  title: string;
  kind: "train" | "test";
  timeLimitEnabled: boolean;
  timeLimitMinutes: number;
  passingRate: number;
  pointsMode: QuizPointsMode;
  /** questionId -> points, read only in "custom" mode. */
  questionPoints: Record<string, number>;
  acceptPartial: boolean;
  playerTemplate: QuizPlayerTemplate;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
};

const box = { border: `1px solid ${t.color.divider}`, borderRadius: `${t.radius.card}px`, px: 1.75, py: 1.25 } as const;

/** Same dialog for "create from selection" and "edit package"; only the title, submit label and time-limit defaults differ. */
export function QuizCreatePackageDialog({ copy, draft, mode = "create", questions, saving = false, onChange, onClose, onSubmit }: {
  copy: QuestionBankCopy;
  draft: QuizCreateDraft;
  mode?: "create" | "update";
  questions: QuestionBankQuestion[];
  saving?: boolean;
  onChange: (draft: QuizCreateDraft) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  // While creating, the time-limit switch follows the quiz type until the teacher flips it.
  const [timeLimitTouched, setTimeLimitTouched] = useState(mode === "update");
  const firstQuestion = questions[0];
  const maxPoints = getQuestionBankPackageMaxPoints(questions, draft);
  const pointsInvalid = draft.pointsMode === "custom" && Object.values(draft.questionPoints).some((points) => !(Number.isFinite(points) && points > 0));
  const timeLabel = draft.timeLimitEnabled ? copy.minutesValue(draft.timeLimitMinutes) : copy.noTimeLimitLabel;

  return (
    <ErgDialog
      open
      onClose={onClose}
      title={mode === "update" ? copy.updatePackageDialogTitle : copy.createQuizDialogTitle(questions.length)}
      description={firstQuestion ? [firstQuestion.subjectLabel, firstQuestion.levelLabel, firstQuestion.categoryLabel].filter(Boolean).join(" · ") : undefined}
      actions={
        <>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
            {[copy.questionCount(questions.length), copy.pointsValue(maxPoints), timeLabel].join(" · ")}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <ErgButton variant="text" onClick={onClose}>{copy.cancel}</ErgButton>
          <ErgButton onClick={onSubmit} loading={saving} disabled={!draft.title.trim() || (mode === "create" && questions.length === 0) || pointsInvalid}>
            {mode === "update" ? copy.updatePackageConfirm : copy.createQuizConfirm}
          </ErgButton>
        </>
      }
    >
      <Stack sx={{ gap: 2 }}>
        <ErgTextField autoFocus size="small" label={copy.quizTitleLabel} value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} />
        <Box sx={{ display: "grid", gap: 1.75, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" } }}>
          <ChoiceGroup
            label={copy.quizKindLabel}
            value={draft.kind}
            options={copy.quizKind}
            onChange={(kind) => onChange({ ...draft, kind, timeLimitEnabled: timeLimitTouched ? draft.timeLimitEnabled : kind === "test" })}
          />
          <Stack sx={{ gap: 0.75 }}>
            <SwitchRow
              label={copy.timeLimitLabel}
              caption
              checked={draft.timeLimitEnabled}
              onChange={(timeLimitEnabled) => { setTimeLimitTouched(true); onChange({ ...draft, timeLimitEnabled }); }}
            />
            {draft.timeLimitEnabled ? (
              <ErgTextField
                size="small"
                type="number"
                label={copy.timeLimitMinutesLabel}
                value={draft.timeLimitMinutes}
                onChange={(event) => onChange({ ...draft, timeLimitMinutes: Number(event.target.value) })}
                slotProps={{ htmlInput: { min: 1, max: 240 } }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">{copy.noTimeLimitLabel}</Typography>
            )}
          </Stack>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>{copy.timeLimitHint}</Typography>

        <QuizCreatePointsSection copy={copy} draft={draft} maxPoints={maxPoints} questions={questions} onChange={onChange} />

        <Stack sx={{ ...box, gap: 0.5 }}>
          <SwitchRow label={copy.shuffleQuestionsLabel} checked={draft.shuffleQuestions} onChange={(shuffleQuestions) => onChange({ ...draft, shuffleQuestions })} />
          <SwitchRow label={copy.shuffleAnswersLabel} checked={draft.shuffleAnswers} onChange={(shuffleAnswers) => onChange({ ...draft, shuffleAnswers })} />
          <SwitchRow label={copy.acceptPartialLabel} checked={draft.acceptPartial} onChange={(acceptPartial) => onChange({ ...draft, acceptPartial })} />
          <Typography variant="caption" color="text.secondary">{copy.acceptPartialHint}</Typography>
        </Stack>

        <QuizCreateThemeRow copy={copy} value={draft.playerTemplate} onChange={(playerTemplate) => onChange({ ...draft, playerTemplate })} />
      </Stack>
    </ErgDialog>
  );
}

function SwitchRow({ caption = false, checked, label, onChange }: { caption?: boolean; checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <FormControlLabel
      labelPlacement="start"
      label={<Typography variant={caption ? "caption" : "body2"} color={caption ? "text.secondary" : "text.primary"}>{label}</Typography>}
      control={<Switch size="small" checked={checked} onChange={(event) => onChange(event.target.checked)} />}
      sx={{ justifyContent: "space-between", mx: 0, gap: 1 }}
    />
  );
}
