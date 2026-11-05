import EditRoundedIcon from "@mui/icons-material/EditRounded";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { questionTypeLabelKeys } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import { useI18n } from "@/platform/i18n";
import type { QuestionBankCopy } from "./question-bank-copy";
import { QuickViewDrawer, QuickViewSection } from "./question-bank-quick-view-drawer";
import { DIFFICULTY_TONE } from "./question-library";
import { QuestionQuickViewCard } from "./question-quick-view-card";

/** A2: read-only quick view of one bank question with delete, duplicate and edit. */
export function QuestionQuickViewDrawer({
  copy,
  deleting,
  duplicating,
  onClose,
  onDelete,
  onDuplicate,
  onEdit,
  question,
}: {
  copy: QuestionBankCopy;
  deleting: boolean;
  duplicating: boolean;
  onClose: () => void;
  onDelete: (question: QuestionBankQuestion) => Promise<unknown>;
  onDuplicate: (question: QuestionBankQuestion) => void;
  onEdit: (question: QuestionBankQuestion) => void;
  question: QuestionBankQuestion;
}) {
  const { t: translate } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <QuickViewDrawer
      open
      onClose={onClose}
      closeLabel={copy.close}
      title={copy.questionQuickViewTitle}
      subtitle={`${question.subjectLabel} · ${question.levelLabel}`}
      chips={
        <>
          <ErgStatusChip dot={false} label={question.categoryLabel || copy.otherTopic} tone="info" />
          <ErgStatusChip dot={false} label={translate(questionTypeLabelKeys[question.type])} />
          <ErgStatusChip dot={false} label={copy.difficulty[question.difficulty]} tone={DIFFICULTY_TONE[question.difficulty]} />
        </>
      }
      footerStart={
        <Button variant="text" color="error" onClick={() => setConfirmOpen(true)}>
          {copy.deleteQuestion}
        </Button>
      }
      footerEnd={
        <>
          <ErgButton variant="outlined" loading={duplicating} onClick={() => onDuplicate(question)}>
            {copy.duplicateQuestion}
          </ErgButton>
          <ErgButton startIcon={<EditRoundedIcon />} onClick={() => onEdit(question)}>
            {copy.editInEditor}
          </ErgButton>
        </>
      }
    >
      {question.objective ? (
        <QuickViewSection title={copy.questionObjectiveLabel}>
          <Typography variant="body2">{question.objective}</Typography>
        </QuickViewSection>
      ) : null}
      <QuestionQuickViewCard copy={copy} question={question} />
      <ErgConfirmDialog
        open={confirmOpen}
        title={copy.confirmDeleteQuestion(question.stem)}
        confirmLabel={copy.deleteQuestion}
        cancelLabel={copy.cancel}
        destructive
        loading={deleting}
        onCancel={() => setConfirmOpen(false)}
        // On success the controller closes the drawer; on failure the global mutation toast explains why.
        onConfirm={() => void onDelete(question).finally(() => setConfirmOpen(false))}
      />
    </QuickViewDrawer>
  );
}
