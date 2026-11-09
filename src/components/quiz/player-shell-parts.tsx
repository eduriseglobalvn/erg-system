import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import FlagRounded from "@mui/icons-material/FlagRounded";
import RadioButtonUncheckedRounded from "@mui/icons-material/RadioButtonUncheckedRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgDialog } from "@/components/erg-mui/erg-overlays";
import { Kbd } from "@/components/quiz/player-web-frame";
import { submitLeadText, type SubmitSummary } from "@/components/quiz/submit-summary";
import { getMatchingKey, getSequenceCorrectOrder } from "@/domain/quiz/quiz";
import type { AnswerResult, Question } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

export function QuestionFeedbackPanel({ floating = false, result }: { floating?: boolean; result: AnswerResult }) {
  const title = result.pendingReview ? "Đã ghi nhận bài làm" : result.correct ? "Đáp án chính xác!" : "Đáp án chưa đúng!";
  const message = result.correct || result.pendingReview ? result.message : "Câu trả lời chưa đúng. Em hãy xem lại đáp án và thử ở lần sau.";
  const headerColor = result.pendingReview ? "info.main" : result.correct ? "#22C55E" : "#e82828";

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
      <Box sx={{ alignItems: "center", bgcolor: headerColor, color: "common.white", display: "flex", fontSize: 16, fontWeight: 600, justifyContent: "space-between", minHeight: 48, px: 2.5 }}>
        <span>{title}</span>
      </Box>
      {message ? (
        <Box data-testid="question-feedback-body" sx={{ color: "text.primary", fontSize: 16, lineHeight: "28px", px: 2.5, py: 2.5 }}>{message}</Box>
      ) : null}
    </Box>
  );
}

type SubmitConfirmDialogProps = {
  summary: SubmitSummary;
  remainingSeconds: number | null;
  attemptsLeft: number | null;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** 0-based question index; the dialog closes itself afterwards. */
  onJump: (index: number) => void;
};

/** WL4 / L07: lead text, one row per group (chưa làm · đánh dấu · đã làm), Làm tiếp + Nộp bài. */
export function SubmitConfirmDialog({ summary, remainingSeconds, attemptsLeft, submitting, onCancel, onConfirm, onJump }: SubmitConfirmDialogProps) {
  const pick = (number: number) => { onJump(number - 1); onCancel(); };
  return (
    <ErgDialog
      open
      title="Nộp bài?"
      description={submitLeadText(remainingSeconds, attemptsLeft)}
      onClose={submitting ? undefined : onCancel}
      maxWidth="xs"
      actions={
        <>
          <ErgButton disabled={submitting} endIcon={<Box aria-hidden component="span" sx={{ display: "inline-flex" }}><Kbd>Esc</Kbd></Box>} variant="outlined" onClick={onCancel}>Làm tiếp</ErgButton>
          <ErgButton loading={submitting} startIcon={<SendRounded />} variant="contained" onClick={onConfirm}>Nộp bài</ErgButton>
        </>
      }
    >
      <Box sx={{ border: "1px solid", borderColor: tk.color.border, borderRadius: `${tk.radius.card}px`, overflow: "hidden" }}>
        {summary.unanswered.length > 0 ? (
          <SubmitRow icon={<RadioButtonUncheckedRounded sx={{ color: tk.color.danger }} />} title={`${summary.unanswered.length} câu chưa làm`} note="Chưa làm tính 0 điểm" numbers={summary.unanswered} onPick={pick} />
        ) : null}
        {summary.flagged.length > 0 ? (
          <SubmitRow icon={<FlagRounded sx={{ color: tk.color.warning }} />} title={`${summary.flagged.length} câu đánh dấu xem lại`} numbers={summary.flagged} onPick={pick} />
        ) : null}
        <SubmitRow icon={<CheckCircleRounded sx={{ color: tk.color.success }} />} title={`${summary.answeredCount} câu đã làm`} />
      </Box>
    </ErgDialog>
  );
}

function SubmitRow({ icon, title, note, numbers = [], onPick }: { icon: ReactNode; title: string; note?: string; numbers?: number[]; onPick?: (number: number) => void }) {
  return (
    <Box sx={{ alignItems: "center", borderTop: "1px solid", borderColor: tk.color.divider, display: "flex", flexWrap: "wrap", gap: 1.5, minHeight: 60, px: 2, py: 1.5, "&:first-of-type": { borderTop: 0 } }}>
      <Box aria-hidden sx={{ display: "inline-flex" }}>{icon}</Box>
      <Box sx={{ flex: "1 1 120px", minWidth: 0 }}>
        <Typography sx={{ color: tk.color.text }} variant="subtitle2">{title}</Typography>
        {note ? <Typography component="div" sx={{ color: tk.color.textMuted }} variant="caption">{note}</Typography> : null}
      </Box>
      {numbers.length > 0 ? (
        <Box role="group" aria-label={title} sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {numbers.map((number) => (
            <ButtonBase
              key={number}
              aria-label={`Câu ${number}`}
              onClick={() => onPick?.(number)}
              sx={{ border: "1.5px solid", borderColor: tk.color.border, borderRadius: `${tk.radius.control}px`, color: tk.color.textSecondary, fontVariantNumeric: "tabular-nums", fontWeight: "fontWeightBold", height: 40, minWidth: 44, px: 1, typography: "body2", "&:hover": { borderColor: `var(--quiz-accent, ${tk.color.primary})` }, "&:focus-visible": { outline: `2px solid ${tk.color.primary}`, outlineOffset: 2 } }}
            >
              {number}
            </ButtonBase>
          ))}
        </Box>
      ) : null}
    </Box>
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
      return (question.matching ?? []).flatMap((pair, index) => {
        const responseId = getMatchingKey(question)?.[pair.id];
        const response = question.matchingResponses ? question.matchingResponses.find((item) => item.id === responseId)?.response : pair.response;
        return response === undefined ? [] : [`${index + 1}. ${pair.prompt} -> ${response}`];
      });
    case "sequence":
      return getSequenceCorrectOrder(question).flatMap((id, index) => {
        const item = question.sequenceItems?.find((candidate) => candidate.id === id);
        return item ? [`${index + 1}. ${item.label}`] : [];
      });
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
      return (question.essayRubric ?? []).map((item) => item.label).filter(Boolean);
    default:
      return [];
  }
}

function formatInlineOption(option: string) {
  if (option === "yes") return "Có";
  if (option === "no") return "Không";
  return option;
}
