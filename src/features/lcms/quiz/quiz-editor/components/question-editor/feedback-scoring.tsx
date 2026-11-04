import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/Error";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useI18n } from "@/platform/i18n";
import type { QuizEditorFeedbackBranching, QuizEditorFeedbackRow } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const branchingOptions: QuizEditorFeedbackBranching[] = ["By Result", "Next Question", "Finish Quiz"];

export function MuiFeedbackAndScoring({
  rows,
  onChange,
}: {
  rows: QuizEditorFeedbackRow[];
  onChange: (rows: QuizEditorFeedbackRow[]) => void;
}) {
  const { t } = useI18n();

  function updateRow(rowId: string, patch: Partial<QuizEditorFeedbackRow>) {
    onChange(rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {rows.map((row) => {
        const isCorrect = row.kind === "correct";
        const isIncorrect = row.kind === "incorrect";
        const label = isCorrect
          ? "Khi trả lời Đúng"
          : isIncorrect
            ? "Khi trả lời Sai"
            : t("common.answered");

        const icon = isCorrect ? (
          <CheckCircleOutlineIcon sx={{ fontSize: 16, color: "#16A34A" }} />
        ) : isIncorrect ? (
          <ErrorOutlineIcon sx={{ fontSize: 16, color: "#DC2626" }} />
        ) : (
          <RateReviewOutlinedIcon sx={{ fontSize: 16, color: "#0F6CBD" }} />
        );

        const borderCol = isCorrect
          ? "rgba(34, 197, 94, 0.35)"
          : isIncorrect
            ? "rgba(239, 68, 68, 0.3)"
            : "#E2E8F0";

        const bgCol = isCorrect
          ? "#F0FDF4"
          : isIncorrect
            ? "#FEF2F2"
            : "#FFFFFF";

        return (
          <Box
            key={row.id}
            sx={{
              p: 2,
              borderRadius: "12px",
              bgcolor: bgCol,
              border: `1px solid ${borderCol}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {icon}
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    fontSize: "13px",
                    color: isCorrect ? "#15803D" : isIncorrect ? "#B91C1C" : "#0F172A",
                  }}
                >
                  {label}
                </Typography>
              </Box>
            </Box>

            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              placeholder={
                isCorrect
                  ? "Nhập lời khen hoặc giải thích khi thí sinh làm đúng..."
                  : isIncorrect
                    ? "Nhập giải thích đáp án đúng hoặc gợi ý khi làm sai..."
                    : t("common.feedback")
              }
              value={row.feedback}
              onChange={(event) => updateRow(row.id, { feedback: event.target.value })}
              sx={{
                bgcolor: "#FFFFFF",
                borderRadius: "8px",
                "& .MuiOutlinedInput-root": {
                  fontSize: "13px",
                  borderRadius: "8px",
                },
              }}
            />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>
                Điều hướng:
              </Typography>
              <Box className="classic-editor__native-select-wrap" sx={{ flex: 1 }}>
                <select
                  className="classic-editor__native-select"
                  aria-label={t("common.feedbackAndBranching")}
                  value={row.branching ?? "By Result"}
                  onChange={(event) =>
                    updateRow(row.id, { branching: event.currentTarget.value as QuizEditorFeedbackBranching })
                  }
                >
                  {branchingOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatBranchingLabel(option, t)}
                    </option>
                  ))}
                </select>
                <ExpandMoreIcon fontSize="small" aria-hidden="true" />
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function formatBranchingLabel(option: QuizEditorFeedbackBranching, t: ReturnType<typeof useI18n>["t"]) {
  if (option === "By Result") return t("common.byResult");
  if (option === "Next Question") return t("quiz.nextQuestion");
  return t("player.finish");
}
