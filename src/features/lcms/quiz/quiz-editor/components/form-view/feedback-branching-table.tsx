import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";

import { useI18n } from "@/platform/i18n";
import { AppSelect } from "@/components/ui/app-select";
import type {
  QuizEditorFeedbackBranching,
  QuizEditorFeedbackRow,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const branchingOptions: QuizEditorFeedbackBranching[] = [
  "By Result",
  "Next Question",
  "Finish Quiz",
];

export function FeedbackBranchingTable({
  rows,
  onChange,
}: {
  rows: QuizEditorFeedbackRow[];
  onChange: (rows: QuizEditorFeedbackRow[]) => void;
}) {
  function updateRow(rowId: string, patch: Partial<QuizEditorFeedbackRow>) {
    onChange(rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  }

  return (
    <div className="classic-editor__feedback-editor">
      {rows.map((row) => (
        <FeedbackRow key={row.id} row={row} onChange={updateRow} />
      ))}
    </div>
  );
}

function FeedbackRow({
  row,
  onChange,
}: {
  row: QuizEditorFeedbackRow;
  onChange: (rowId: string, patch: Partial<QuizEditorFeedbackRow>) => void;
}) {
  const { t } = useI18n();
  const label =
    row.kind === "correct"
      ? t("common.correct")
      : row.kind === "incorrect"
        ? t("common.incorrect")
        : t("common.answered");
  const branching = row.branching ?? "By Result";

  return (
    <section className="classic-editor__feedback-card" data-state={row.kind}>
      <div className="classic-editor__feedback-card-head">
        <span className="classic-editor__feedback-status-icon">
          {row.kind === "correct" ? (
            <CheckCircleOutlineIcon className="h-4 w-4" fontSize="inherit" />
          ) : row.kind === "incorrect" ? (
            <HighlightOffIcon className="h-4 w-4" fontSize="inherit" />
          ) : (
            <RateReviewOutlinedIcon className="h-4 w-4" fontSize="inherit" />
          )}
        </span>
        <div>
          <strong>{label}</strong>
          <small>{t("common.feedbackAndBranching")}</small>
        </div>
      </div>

      <label className="classic-editor__feedback-field">
        <span>{t("common.feedback")}</span>
        <textarea
          value={row.feedback}
          onChange={(event) => onChange(row.id, { feedback: event.target.value })}
          className="classic-editor__feedback-textarea"
          rows={4}
        />
      </label>

      <div className="classic-editor__feedback-meta">
        <label className="classic-editor__feedback-field is-branching">
          <span>{t("common.branching")}</span>
          <div className="classic-editor__feedback-select-wrap">
            <ArrowForwardIcon className="h-3.5 w-3.5" fontSize="inherit" />
            <AppSelect
              value={branching}
              onChange={(event) =>
                onChange(row.id, { branching: event.target.value as QuizEditorFeedbackBranching })
              }
            >
              {branchingOptions.map((option) => (
                <option key={option} value={option}>
                  {formatBranchingLabel(option, t)}
                </option>
              ))}
            </AppSelect>
          </div>
        </label>

        <label className="classic-editor__feedback-field is-score">
          <span>{t("common.score")}</span>
          <input
            type="number"
            min={0}
            value={row.score}
            onChange={(event) => onChange(row.id, { score: Number(event.target.value) })}
          />
        </label>
      </div>
    </section>
  );
}

function formatBranchingLabel(
  option: QuizEditorFeedbackBranching,
  t: ReturnType<typeof useI18n>["t"],
) {
  if (option === "By Result") {
    return t("common.byResult");
  }

  if (option === "Next Question") {
    return t("quiz.nextQuestion");
  }

  return t("player.finish");
}
