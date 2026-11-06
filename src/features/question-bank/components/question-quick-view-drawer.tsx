import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { QuestionViewToggle } from "@/features/lcms/quiz/quiz-editor/components/question-authoring/question-view-toggle";
import { questionTypeLabelKeys } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuestionBankQuestion, QuizBankItem } from "@/features/question-bank/types/question-bank-types";
import { useI18n } from "@/platform/i18n";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
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
  onNavigate,
  question,
  quizzes,
  siblings,
}: {
  copy: QuestionBankCopy;
  deleting: boolean;
  duplicating: boolean;
  onClose: () => void;
  onDelete: (question: QuestionBankQuestion) => Promise<unknown>;
  onDuplicate: (question: QuestionBankQuestion) => void;
  onEdit: (question: QuestionBankQuestion) => void;
  onNavigate: (question: QuestionBankQuestion) => void;
  question: QuestionBankQuestion;
  /** Quizzes in the loaded bank data, to list the ones using this question. */
  quizzes: QuizBankItem[];
  /** The table rows, for previous/next. */
  siblings: QuestionBankQuestion[];
}) {
  const { t: translate } = useI18n();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [learnerView, setLearnerView] = useState(false);
  const index = siblings.findIndex((item) => item.id === question.id);
  const previous = index > 0 ? siblings[index - 1] : undefined;
  const next = index >= 0 ? siblings[index + 1] : undefined;
  const usedIn = quizzes.filter((quiz) => quiz.questionIds.includes(question.id));

  return (
    <QuickViewDrawer
      open
      onClose={onClose}
      closeLabel={copy.close}
      title={copy.questionQuickViewTitle}
      subtitle={[index >= 0 ? copy.questionPosition(index + 1, siblings.length) : null, question.subjectLabel, question.levelLabel].filter(Boolean).join(" · ")}
      headerActions={
        index >= 0 ? (
          <>
            <ErgIconButton label={copy.previousQuestion} size="small" disabled={!previous} onClick={() => previous && onNavigate(previous)}>
              <ChevronLeftRoundedIcon fontSize="small" />
            </ErgIconButton>
            <ErgIconButton label={copy.nextQuestion} size="small" disabled={!next} onClick={() => next && onNavigate(next)}>
              <ChevronRightRoundedIcon fontSize="small" />
            </ErgIconButton>
          </>
        ) : null
      }
      chips={
        <>
          <ErgStatusChip dot={false} label={question.categoryLabel || copy.otherTopic} tone="info" />
          <ErgStatusChip dot={false} label={translate(questionTypeLabelKeys[question.type])} />
          <ErgStatusChip dot={false} label={copy.difficulty[question.difficulty]} tone={DIFFICULTY_TONE[question.difficulty]} />
          <Box sx={{ ml: "auto" }}>
            <QuestionViewToggle value={learnerView ? "learner" : "author"} onChange={(next) => setLearnerView(next === "learner")} />
          </Box>
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
      <QuestionQuickViewCard key={`${question.id}-${learnerView}`} copy={copy} learnerView={learnerView} question={question} />
      <QuickViewSection title={copy.usedInQuizzes(usedIn.length || question.usageCount)}>
        {usedIn.length ? (
          <Stack component="ul" spacing={0.75} sx={{ listStyle: "none", m: 0, p: 0 }}>
            {usedIn.map((quiz) => (
              <Box component="li" key={quiz.id} sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
                <Typography variant="body2" noWrap>{quiz.title}</Typography>
                <ErgStatusChip dot={false} label={copy.quizKind[quiz.kind]} tone={quiz.kind === "train" ? "info" : "neutral"} />
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: t.color.textMuted }}>{copy.usedCount(question.usageCount)}</Typography>
        )}
      </QuickViewSection>
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
