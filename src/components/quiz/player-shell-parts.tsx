import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";

import type { AnswerResult, Attempt, Question, QuizResultDisplay } from "@/lib/types";

type SubmitDialogMode = "all-answered" | "confirm";

export function FinalResultScreen({
  attempt,
  resultDisplay,
  onReview,
}: {
  attempt: Attempt;
  resultDisplay: QuizResultDisplay;
  onReview: () => void;
}) {
  const resultMessage = attempt.passed ? resultDisplay.passMessage : resultDisplay.failMessage;

  return (
    <Box sx={{ alignItems: "center", bgcolor: "common.white", display: "grid", justifyItems: "center", minHeight: 420, overflow: "hidden", px: 3, py: 4 }}>
      <Box sx={{ display: "grid", gap: 2, justifyItems: "center", textAlign: "center" }}>
        <Box sx={{ alignItems: "center", bgcolor: attempt.passed ? "success.main" : "error.main", borderRadius: 1, color: "common.white", display: "grid", fontSize: 20, fontWeight: 600, height: 64, placeItems: "center", width: 64 }}>
          {attempt.passed ? "✓" : "×"}
        </Box>
        <Typography component="h2" sx={{ color: "var(--erg-blue)", fontSize: 20, fontWeight: 600 }}>
          {resultMessage}
        </Typography>
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography component="span" sx={{ color: "text.secondary", fontSize: 14, fontWeight: 600 }}>Điểm</Typography>
          <Typography component="strong" sx={{ color: "var(--erg-blue)", fontSize: 20, fontWeight: 600 }}>
            {attempt.totalScore}/{attempt.maxScore}
          </Typography>
          <Typography component="span" sx={{ color: "text.disabled", fontSize: 14, fontWeight: 600 }}>{attempt.percent}%</Typography>
        </Box>
        {resultDisplay.showReviewButton ? (
          <Button variant="contained" onClick={onReview} sx={{ minHeight: 40, px: 2 }}>
            {resultDisplay.reviewButtonLabel}
          </Button>
        ) : null}
        <Typography sx={{ color: "text.secondary", fontSize: 16, fontWeight: 500 }}>{resultDisplay.thankYouMessage}</Typography>
      </Box>
    </Box>
  );
}

export function QuestionFeedbackPanel({ floating = false, result }: { floating?: boolean; result: AnswerResult }) {
  const title = result.correct ? "Đáp án chính xác!" : "Đáp án chưa đúng!";
  const message = result.correct ? result.message : "Câu trả lời chưa đúng. Em hãy xem lại đáp án và thử ở lần sau.";

  return (
    <Box
      sx={{
        bgcolor: "common.white",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        boxShadow: floating ? "0 18px 44px rgba(15,23,42,0.16)" : 1,
        mx: floating ? 0 : "auto",
        mt: floating ? 0 : 4,
        maxWidth: 884,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <Box sx={{ alignItems: "center", bgcolor: result.correct ? "#22C55E" : "#e82828", color: "common.white", display: "flex", fontSize: 16, fontWeight: 600, justifyContent: "space-between", minHeight: 48, px: 2.5 }}>
        <span>{title}</span>
      </Box>
      <Box sx={{ color: "text.primary", fontSize: 16, lineHeight: "28px", px: 2.5, py: 2.5 }}>{message}</Box>
    </Box>
  );
}

export function SubmitConfirmDialog({
  mode,
  resultDisplay,
  submitting,
  onCancel,
  onConfirm,
}: {
  mode: SubmitDialogMode;
  resultDisplay: QuizResultDisplay;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isAllAnswered = mode === "all-answered";

  return (
    <Dialog
      open
      onClose={submitting ? undefined : onCancel}
      slotProps={{
        paper: { "aria-label": "Xác nhận nộp bài", sx: {
          alignItems: "center",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 0,
          boxShadow: 1,
          display: "flex",
          maxWidth: 590,
          width: "calc(100vw - 56px)",
        } },
      }}
    >
      <DialogContent sx={{ alignItems: "center", display: "flex", gap: 2, px: 3.5, py: 4, width: "100%" }}>
        <Box aria-hidden sx={{ alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 0.75, color: "text.secondary", display: "grid", flex: "none", fontSize: 16, fontWeight: 600, height: 32, placeItems: "center", width: 32 }}>?</Box>
        <Box sx={{ display: "grid", flex: 1, gap: 3 }}>
          <Typography id="quiz-submit-confirm-title" sx={{ color: "text.primary", fontSize: 14, fontWeight: 500 }}>
            {isAllAnswered ? resultDisplay.submitAllPrompt : resultDisplay.confirmSubmitPrompt}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "center" }}>
            <Button disabled={submitting} variant="contained" onClick={onConfirm} sx={{ minHeight: 36, minWidth: 136, px: 2.5 }}>
              {submitting ? "ĐANG NỘP..." : isAllAnswered ? resultDisplay.submitAllLabel : resultDisplay.confirmYesLabel}
            </Button>
            <Button disabled={submitting} variant="outlined" onClick={onCancel} sx={{ bgcolor: "grey.100", color: "text.secondary", minHeight: 36, minWidth: 136, px: 2.5 }}>
              {isAllAnswered ? resultDisplay.returnToQuizLabel : resultDisplay.confirmNoLabel}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export function AnswerKeyCard({ question }: { question: Question }) {
  const lines = getAnswerKeyLines(question);

  if (lines.length === 0) {
    return null;
  }

  return (
    <Box sx={{ bgcolor: "rgba(255,255,255,0.95)", border: "1px solid", borderColor: "divider", borderRadius: 1, boxShadow: 1, mt: 2, overflow: "hidden" }}>
      <Box sx={{ bgcolor: "var(--erg-blue)", color: "common.white", fontSize: 14, fontWeight: 600, px: 2, py: 1.5 }}>Đáp án</Box>
      <Box sx={{ color: "text.secondary", display: "grid", fontSize: 14, gap: 1, lineHeight: "24px", px: 2, py: 2 }}>
        {lines.map((line) => <div key={line}>{line}</div>)}
      </Box>
    </Box>
  );
}

function getAnswerKeyLines(question: Question): string[] {
  switch (question.kind) {
    case "single_choice":
    case "true_false":
    case "multiple_response":
      return (question.choices ?? []).filter((choice) => choice.correct).map((choice) => `Đáp án đúng: ${choice.label}`);
    case "short_answer":
    case "fill_blank":
      return (question.textBlanks ?? []).map((blank, index) => `${index + 1}. ${blank.label}: ${blank.correctAnswers[0] ?? ""}`);
    case "numeric":
      return question.numericAnswer
        ? [`Đáp án đúng: ${question.numericAnswer.correctValue}${question.numericAnswer.unit ? ` ${question.numericAnswer.unit}` : ""}`]
        : [];
    case "matching":
      return (question.matching ?? []).map((pair, index) => `${index + 1}. ${pair.prompt} -> ${pair.response}`);
    case "sequence":
      return (question.sequenceItems ?? []).map((item, index) => `${index + 1}. ${item.label}`);
    case "inline_choice":
    case "select_from_lists":
      return (question.inlineBlanks ?? []).map((blank, index) => `${index + 1}. ${blank.statement}: ${formatInlineOption(blank.correctOptionId)}`);
    case "drag_words":
      return (question.wordSlots ?? []).map((slot, index) => {
        const word = question.wordBank?.find((item) => item.id === slot.correctWordId);
        return `${index + 1}. ${slot.label}: ${word?.label ?? ""}`;
      });
    case "hotspot":
      return ["Vùng đáp án đúng đã được hiển thị trên hình."];
    case "drag_drop":
      return (question.dragDropItems ?? []).map((item, index) => {
        const target = question.dropTargets?.find((candidate) => candidate.id === item.correctTargetId);
        return `${index + 1}. ${item.label} -> ${target?.label ?? ""}`;
      });
    case "likert_scale":
      return ["Câu khảo sát ghi nhận mức độ lựa chọn, không có đáp án đúng sai tuyệt đối."];
    case "essay":
      return (question.essayRubric ?? []).map((item) => `${item.label}: ${item.points}đ`);
    default:
      return [];
  }
}

function formatInlineOption(option: string) {
  if (option === "yes") return "Có";
  if (option === "no") return "Không";
  return option;
}
