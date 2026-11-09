import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import OutlinedFlagRoundedIcon from "@mui/icons-material/OutlinedFlagRounded";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState, type CSSProperties, type ReactNode } from "react";

import { MobilePlayerFooter } from "@/components/quiz/mobile-player-footer";
import { MobilePlayerIntro } from "@/components/quiz/mobile-player-intro";
import { MobileQuestionSheet } from "@/components/quiz/mobile-player-question-sheet";
import type { QuizWelcomeMeta } from "@/components/quiz/quiz-welcome-screen";
import type { QuestionCell } from "@/components/quiz/question-navigator";
import type { Question, QuestionKind, Quiz } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

type MobilePlayerShellProps = {
  allQuestionsAnswered: boolean;
  answeredCount: number;
  attemptCompleted: boolean;
  cells: QuestionCell[];
  footerMessage: string;
  isBookmarked: boolean;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isTestingMode: boolean;
  isTrainingMode: boolean;
  currentAnswerComplete: boolean;
  currentQuestionSubmitted: boolean;
  playerCardStyle: CSSProperties;
  canvasStyle: CSSProperties;
  headerStyle: CSSProperties;
  accentButtonStyle: CSSProperties;
  question: Question;
  questions: Question[];
  quiz: Quiz;
  reviewingSubmittedAttempt: boolean;
  started: boolean;
  submitting: boolean;
  submitFailed: boolean;
  timer?: ReactNode;
  saveIndicator?: ReactNode;
  onJumpToQuestion: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onRequestSubmit: () => void;
  onReview?: () => void;
  onStart: () => void;
  onSubmitCurrentQuestion: () => void;
  onToggleBookmark: () => void;
  body: ReactNode;
  resultBody?: ReactNode;
  restoredDraft?: boolean;
  welcomeMeta?: QuizWelcomeMeta;
};

const KIND_LABEL: Record<QuestionKind, string> = {
  single_choice: "Một đáp án",
  multiple_response: "Nhiều đáp án",
  true_false: "Đúng / Sai",
  short_answer: "Trả lời ngắn",
  numeric: "Đáp số",
  matching: "Ghép nối",
  sequence: "Sắp xếp",
  fill_blank: "Điền chỗ trống",
  inline_choice: "Chọn trong câu",
  select_from_lists: "Chọn từ danh sách",
  drag_words: "Kéo thả từ",
  hotspot: "Điểm nóng",
  drag_drop: "Kéo thả nhóm",
  likert_scale: "Thang đo",
  essay: "Trả lời mở",
};

// The warning caption stays for screen readers; the pill has room for the clock only.
const visuallyHidden = { clip: "rect(0 0 0 0)", height: 1, overflow: "hidden", position: "absolute", whiteSpace: "nowrap", width: 1 } as const;

export function MobilePlayerShell(props: MobilePlayerShellProps) {
  const {
    answeredCount, attemptCompleted, cells, isBookmarked, isTestingMode, isTrainingMode, playerCardStyle, question, questions, quiz,
    reviewingSubmittedAttempt, started, timer, saveIndicator, onJumpToQuestion, onRequestSubmit, onToggleBookmark, body, resultBody,
  } = props;
  const [listOpen, setListOpen] = useState(false);
  if (!started) {
    return (
      <MobilePlayerIntro playerCardStyle={playerCardStyle} questions={questions} quiz={quiz} answeredCount={answeredCount} restoredDraft={props.restoredDraft} welcomeMeta={props.welcomeMeta} onStart={props.onStart} />
    );
  }

  const showResult = attemptCompleted && !reviewingSubmittedAttempt;
  const current = cells.find((cell) => cell.state === "current")?.index ?? 0;
  const showTimer = isTestingMode && !attemptCompleted && timer;
  return (
    <Box sx={{ display: { md: "none" } }}>
      <Box component="section" sx={{ ...playerCardStyle, borderColor: "transparent", minHeight: "100svh", pb: 14 }}>
        <Box sx={{ bgcolor: tk.color.surface, position: "sticky", top: 0, zIndex: 30 }}>
          <Box sx={{ alignItems: "center", display: "grid", gap: 1, gridTemplateColumns: "1fr auto 1fr", minHeight: 56, pb: 1, pt: 1.5, px: 1.5 }}>
            <span />
            <Box sx={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 0.25, minWidth: 0 }}>
              {showResult ? null : (
                <MobileQuestionSheet
                  cells={cells}
                  open={listOpen}
                  onOpenChange={setListOpen}
                  onJumpToQuestion={onJumpToQuestion}
                  onRequestSubmit={isTrainingMode || attemptCompleted ? undefined : onRequestSubmit}
                />
              )}
              <Typography noWrap sx={{ color: tk.color.textMuted, maxWidth: "100%" }} variant="caption">{quiz.title}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", minWidth: 0 }}>
              {showTimer ? (
                // The countdown renders nothing until the server clock is known; `:empty` then drops the pill and its icon.
                <Box sx={{ alignItems: "center", display: "inline-flex", flexShrink: 0, position: "relative", "& [role=status]": visuallyHidden, "& > div:empty, & > div:empty + svg": { display: "none" } }}>
                  <Box sx={{ alignItems: "center", bgcolor: tk.statusTint.neutral.bg, borderRadius: `${tk.radius.chip}px`, display: "inline-flex", height: 36, pl: 4.25, pr: 1.5 }}>{timer}</Box>
                  <TimerOutlinedIcon aria-hidden sx={{ color: tk.color.textSecondary, fontSize: tk.size.iconSm, left: 12, position: "absolute" }} />
                </Box>
              ) : null}
            </Box>
          </Box>
          {showResult ? null : (
            <Box aria-hidden sx={{ bgcolor: tk.color.divider, height: 4 }}>
              <Box sx={{ bgcolor: `var(--quiz-accent, ${tk.color.primary})`, borderRadius: "0 2px 2px 0", height: "100%", width: `${((current + 1) / Math.max(cells.length, 1)) * 100}%` }} />
            </Box>
          )}
        </Box>

        <Box sx={{ mx: "auto", maxWidth: 448, pt: 2, px: 2 }}>
          {showResult ? (
            <Box sx={{ bgcolor: tk.color.surface, border: `1px solid ${tk.color.border}`, borderRadius: `${tk.radius.card}px`, px: 2, py: 2.5 }}>{resultBody}</Box>
          ) : (
            <Box sx={{ display: "grid", gap: 1.75 }}>
              <Box sx={{ alignItems: "center", color: tk.color.textMuted, display: "flex", gap: 1, minHeight: 44 }}>
                <Box component="span" sx={{ bgcolor: tk.statusTint.info.bg, borderRadius: `${tk.radius.xs}px`, color: tk.statusTint.info.color, flexShrink: 0, fontWeight: "fontWeightBold", px: 0.875, py: 0.25, typography: "caption" }}>
                  {KIND_LABEL[question.kind] ?? question.kind}
                </Box>
                {question.points ? <Typography sx={{ flexShrink: 0, fontWeight: "fontWeightBold" }} variant="caption">{`${String(question.points).replace(".", ",")} điểm`}</Typography> : null}
                <Box sx={{ flex: 1 }} />
                {saveIndicator ? <Box sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{saveIndicator}</Box> : null}
                <Button
                  aria-label={isBookmarked ? "Bỏ đánh dấu câu hỏi" : "Đánh dấu câu hỏi"}
                  aria-pressed={isBookmarked}
                  size="small"
                  startIcon={isBookmarked ? <FlagRoundedIcon /> : <OutlinedFlagRoundedIcon />}
                  sx={{ color: isBookmarked ? tk.color.warning : `var(--quiz-accent, ${tk.color.primary})`, flexShrink: 0, minHeight: 44, px: 1.25 }}
                  type="button"
                  variant="text"
                  onClick={onToggleBookmark}
                >
                  {isBookmarked ? "Đã đánh dấu" : "Đánh dấu"}
                </Button>
              </Box>
              <Box>
                <Typography className="quiz-player-question-title" component="p" sx={{ color: tk.color.text, lineHeight: 1.5 }} variant="h3">{question.title}</Typography>
                {question.instructions ? <Typography sx={{ color: tk.color.textMuted, mt: 0.5 }} variant="body2">{question.instructions}</Typography> : null}
              </Box>
              <Box sx={{ display: "grid", gap: 1.5 }}>{body}</Box>
            </Box>
          )}
        </Box>

        <MobilePlayerFooter
          answeredCount={answeredCount} attemptCompleted={attemptCompleted} currentAnswerComplete={props.currentAnswerComplete}
          currentQuestionSubmitted={props.currentQuestionSubmitted} isFirstQuestion={props.isFirstQuestion}
          isLastQuestion={props.isLastQuestion} isTrainingMode={isTrainingMode} total={questions.length}
          reviewingSubmittedAttempt={reviewingSubmittedAttempt} submitFailed={props.submitFailed} submitting={props.submitting}
          onNext={props.onNext} onOpenList={() => setListOpen(true)} onPrev={props.onPrev} onRequestSubmit={onRequestSubmit} onReview={props.onReview}
          onSubmitCurrentQuestion={props.onSubmitCurrentQuestion}
        />
      </Box>
    </Box>
  );
}
