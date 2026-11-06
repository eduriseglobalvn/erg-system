import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { createInitialAnswer } from "@/domain/quiz/quiz";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import { useI18n } from "@/platform/i18n";
import { ergEnterpriseTokens as t } from "@/themes/erg-enterprise-tokens";
import type { QuestionBankCopy } from "./question-bank-copy";
import { buildQuestionQuickViewPreview } from "./question-quick-view-model";

const ignoreAnswer = () => undefined;

/**
 * Teacher view: the question with its correct answer marked. Learner view: the same question unanswered and
 * clickable, as a learner meets it. Types without a faithful renderer list their choices.
 */
export function QuestionQuickViewCard({ copy, learnerView = false, question }: { copy: QuestionBankCopy; learnerView?: boolean; question: QuestionBankQuestion }) {
  const { t: translate } = useI18n();
  const preview = useMemo(() => buildQuestionQuickViewPreview(question, translate), [question, translate]);
  const [learnerAnswer, setLearnerAnswer] = useState(() => (preview ? createInitialAnswer(preview.question) : undefined));

  return (
    <Stack component="article" spacing={2} sx={{ bgcolor: t.color.surface, border: `1px solid ${t.color.border}`, borderRadius: `${t.radius.card}px`, p: 3 }}>
      <Typography variant="h4" component="p">{question.stem}</Typography>
      {preview ? (
        learnerView && learnerAnswer ? (
          <QuestionRenderer question={preview.question} value={learnerAnswer} onChange={setLearnerAnswer} />
        ) : (
          <QuestionRenderer question={preview.question} value={preview.answer} onChange={ignoreAnswer} submitted reviewMode />
        )
      ) : (
        <FallbackAnswer copy={copy} markCorrect={!learnerView} question={question} />
      )}
      {question.rationale && !learnerView ? (
        <Box sx={{ bgcolor: t.statusTint.success.bg, borderRadius: `${t.radius.control}px`, px: 1.5, py: 1.25 }}>
          <Typography variant="caption" component="p" sx={{ color: t.statusTint.success.color }}>{copy.rationaleLabel}</Typography>
          <Typography variant="body2" sx={{ color: t.color.textSecondary }}>{question.rationale}</Typography>
        </Box>
      ) : null}
    </Stack>
  );
}

function FallbackAnswer({ copy, markCorrect, question }: { copy: QuestionBankCopy; markCorrect: boolean; question: QuestionBankQuestion }) {
  const choices = (question.choices ?? []).map((choice) => ({ ...choice, correct: markCorrect && choice.correct }));
  return (
    <Stack spacing={1}>
      {choices.map((choice, index) => (
        <Box
          key={choice.id}
          sx={{
            alignItems: "center",
            bgcolor: choice.correct ? t.statusTint.success.bg : t.color.surface,
            border: `1px solid ${choice.correct ? t.color.success : t.color.border}`,
            borderRadius: `${t.radius.control}px`,
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: "24px minmax(0, 1fr) auto",
            px: 1.5,
            py: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: t.color.textMuted }}>{String.fromCharCode(65 + index)}</Typography>
          <Typography variant="body2">{choice.label}</Typography>
          {choice.correct ? <CheckRoundedIcon aria-label={copy.questionAnswerLabel} sx={{ color: t.color.success, fontSize: t.size.iconSm }} /> : <span />}
        </Box>
      ))}
      {!choices.length && question.answer && markCorrect ? (
        <Typography variant="body2">{copy.questionAnswerLabel}: {question.answer}</Typography>
      ) : null}
      <Typography variant="caption" sx={{ color: t.color.textMuted }}>{copy.previewFallbackNote}</Typography>
    </Stack>
  );
}
