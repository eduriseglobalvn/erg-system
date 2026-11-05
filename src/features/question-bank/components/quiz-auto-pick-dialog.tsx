import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import type { QuestionBankCategory } from "@/features/question-bank/types/question-bank-types";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { QuestionBankCopy } from "./question-bank-copy";
import { LabeledNumberField } from "./question-form-dialog";

/** A6: pick N ready questions at random from the chosen topics; replaces the current selection. */
export function QuizAutoPickDialog({
  availableCount,
  copy,
  count,
  onClose,
  onCountChange,
  onPick,
  onTopicToggle,
  topicIds,
  topics,
}: {
  availableCount: number;
  copy: QuestionBankCopy;
  count: number;
  onClose: () => void;
  onCountChange: (value: number) => void;
  onPick: () => void;
  onTopicToggle: (topicId: string) => void;
  topicIds: string[];
  topics: QuestionBankCategory[];
}) {
  const canPick = topicIds.length > 0 && availableCount >= count;

  return (
    <ErgDialog
      open
      onClose={onClose}
      title={copy.autoBuilderTitle}
      description={copy.autoPickDialogDescription}
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            {copy.cancel}
          </Button>
          <ErgButton disabled={!canPick} onClick={onPick}>
            {copy.autoPickConfirm(count)}
          </ErgButton>
        </>
      }
    >
      <Stack spacing={2.5}>
        <LabeledNumberField label={copy.autoCountLabel} value={count} onChange={onCountChange} />
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" component="h3">
            {copy.autoTopicLabel}
          </Typography>
          <FormGroup>
            {topics.map((topic) => (
              <FormControlLabel
                key={topic.id}
                control={<Checkbox size="small" checked={topicIds.includes(topic.id)} onChange={() => onTopicToggle(topic.id)} />}
                label={topic.label}
              />
            ))}
          </FormGroup>
        </Stack>
        <Typography variant="body2" role="status" sx={{ color: canPick ? t.color.textMuted : t.color.danger }}>
          {copy.autoPickAvailable(availableCount)}
        </Typography>
      </Stack>
    </ErgDialog>
  );
}
