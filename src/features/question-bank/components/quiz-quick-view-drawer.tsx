import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { ErgButton, ErgIconButton } from "@/components/erg-mui/erg-actions";
import { ErgConfirmDialog } from "@/components/erg-mui/erg-confirm-dialog";
import { ErgStatusChip } from "@/components/erg-mui/erg-feedback";
import { formatDateTimeVi } from "@/domain/formatters/format-date";
import { useQuizEditorDraftQuery } from "@/features/lcms/quiz/quiz-editor";
import { questionTypeLabelKeys } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuestionBankQuestion, QuizBankItem } from "@/features/question-bank/types/question-bank-types";
import { useI18n } from "@/platform/i18n";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { QuestionBankCopy } from "./question-bank-copy";
import { QuickViewDrawer, QuickViewSection } from "./question-bank-quick-view-drawer";
import { QUIZ_STATUS_TONE } from "./quiz-bank-panel";
import { quizPackageMaxPoints, readQuizPackageDraft } from "./quiz-package-draft";

/** B2: quick view of one quiz: properties, its questions, and the package actions. */
export function QuizQuickViewDrawer({
  copy,
  deleting,
  onClose,
  onDelete,
  onEdit,
  onExportPortable,
  onOpenSettings,
  openingSettings = false,
  questions,
  quiz,
}: {
  copy: QuestionBankCopy;
  deleting: boolean;
  onClose: () => void;
  onDelete: (quiz: QuizBankItem) => Promise<unknown>;
  /** Missing when the host has no quiz editor route. */
  onEdit?: (quiz: QuizBankItem) => void;
  onExportPortable: (quiz: QuizBankItem) => void;
  onOpenSettings: (quiz: QuizBankItem) => void;
  /** True while the package settings load the quiz draft. */
  openingSettings?: boolean;
  /** In quiz order; undefined where the question is not in the loaded bank data. */
  questions: (QuestionBankQuestion | undefined)[];
  quiz: QuizBankItem;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Time, scoring and shuffle live in the draft; the list row only carries a rough duration.
  const draftQuery = useQuizEditorDraftQuery(quiz.id);
  const pkg = draftQuery.data ? readQuizPackageDraft(draftQuery.data, quiz) : null;
  const maxPoints = draftQuery.data ? quizPackageMaxPoints(draftQuery.data.tree) : 0;
  const onOff = (value: boolean) => (value ? copy.onValue : copy.offValue);
  const properties: Array<[string, string]> = [
    [copy.quizTable.kind, copy.quizKind[quiz.kind]],
    [copy.quizTable.count, String(quiz.questionCount)],
    [copy.quizTable.duration, pkg ? (pkg.timeLimitEnabled ? copy.minutesValue(pkg.timeLimitMinutes) : copy.noTimeLimitLabel) : quiz.durationLabel],
    ...(pkg && draftQuery.data
      ? ([
          [copy.passingLabel, `${pkg.passingRate}%`],
          [copy.shuffleLabel, `${onOff(pkg.shuffleQuestions)} / ${onOff(pkg.shuffleAnswers)}`],
          [copy.acceptPartialLabel, onOff(pkg.acceptPartial)],
        ] satisfies Array<[string, string]>)
      : []),
    // A draft that was never filled has no question slides; a max of 0 would only mislead.
    ...(maxPoints > 0 ? ([[copy.maxPointsLabel, copy.pointsValue(maxPoints)]] satisfies Array<[string, string]>) : []),
    [copy.quizTable.source, copy.sourceMode[quiz.sourceMode]],
    [copy.quizTable.scope, copy.scopeLabel(quiz.scope)],
    [copy.quizTable.updated, formatDateTimeVi(quiz.updatedAt)],
  ];

  return (
    <QuickViewDrawer
      open
      onClose={onClose}
      closeLabel={copy.close}
      title={quiz.title}
      subtitle={[quiz.subjectLabel, quiz.levelLabel, ...quiz.topicLabels].filter(Boolean).join(" · ")}
      chips={
        <>
          <ErgStatusChip dot={false} label={copy.quizKind[quiz.kind]} tone={quiz.kind === "train" ? "info" : "neutral"} />
          <ErgStatusChip label={copy.quizStatus[quiz.status]} tone={QUIZ_STATUS_TONE[quiz.status]} />
        </>
      }
      footerStart={
        <Button variant="text" color="error" onClick={() => setConfirmOpen(true)}>
          {copy.deleteQuiz}
        </Button>
      }
      footerEnd={
        <>
          {quiz.status === "ready" ? (
            <ErgIconButton label={copy.exportPortableAction} tooltip={copy.exportPortableAction} onClick={() => onExportPortable(quiz)}>
              <DownloadRoundedIcon fontSize="small" />
            </ErgIconButton>
          ) : null}
          <ErgButton variant="text" loading={openingSettings} onClick={() => onOpenSettings(quiz)}>
            {copy.packageSettingsPreviewTitle}
          </ErgButton>
          {onEdit ? <ErgButton onClick={() => onEdit(quiz)}>{copy.editQuiz}</ErgButton> : null}
        </>
      }
    >
      <QuickViewSection title={copy.quizPropertiesTitle}>
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" } }}>
          {properties.map(([label, value]) => (
            <Box key={label} sx={{ bgcolor: t.color.surface, border: `1px solid ${t.color.divider}`, borderRadius: `${t.radius.control}px`, p: 1.5 }}>
              <Typography variant="caption" component="p" sx={{ color: t.color.textMuted }}>{label}</Typography>
              <Typography variant="subtitle1" component="p">{value || "—"}</Typography>
            </Box>
          ))}
        </Box>
      </QuickViewSection>
      <QuickViewSection title={copy.quizQuestionsTitle(quiz.questionCount)}>
        <QuizQuestionList copy={copy} questions={questions} />
      </QuickViewSection>
      {quiz.ownerLabel ? (
        <QuickViewSection title={copy.quizInfoTitle}>
          <Typography variant="body2" sx={{ color: t.color.textSecondary }}>{copy.ownerLabel}: {quiz.ownerLabel}</Typography>
        </QuickViewSection>
      ) : null}
      <ErgConfirmDialog
        open={confirmOpen}
        title={copy.confirmDeleteQuiz(quiz.title)}
        confirmLabel={copy.deleteQuiz}
        cancelLabel={copy.cancel}
        destructive
        loading={deleting}
        onCancel={() => setConfirmOpen(false)}
        // On success the controller closes the drawer; on failure the error toast explains why.
        onConfirm={() => void onDelete(quiz).finally(() => setConfirmOpen(false))}
      />
    </QuickViewDrawer>
  );
}

function QuizQuestionList({ copy, questions }: { copy: QuestionBankCopy; questions: (QuestionBankQuestion | undefined)[] }) {
  const { t: translate } = useI18n();
  if (!questions.length) {
    return <Typography variant="body2" sx={{ color: t.color.textMuted }}>{copy.noQuestionDetails}</Typography>;
  }
  return (
    <Box component="ol" sx={{ bgcolor: t.color.surface, border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px`, listStyle: "none", m: 0, overflow: "hidden", p: 0 }}>
      {questions.map((question, index) => (
        <Box
          component="li"
          key={question?.id ?? index}
          sx={{ alignItems: "center", borderTop: index ? `1px solid ${t.color.divider}` : 0, display: "grid", gap: 1.25, gridTemplateColumns: "24px minmax(0, 1fr) auto", px: 1.5, py: 1.25 }}
        >
          <Typography variant="caption" sx={{ color: t.color.textMuted }}>{index + 1}</Typography>
          <Typography variant="body2" noWrap title={question?.stem}>
            {question?.stem ?? copy.packageQuestionFallback(String(index + 1))}
          </Typography>
          <Typography variant="caption" sx={{ color: t.color.textMuted }}>
            {question ? translate(questionTypeLabelKeys[question.type]) : ""}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
