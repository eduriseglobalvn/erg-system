import FlagRounded from "@mui/icons-material/FlagRounded";
import OutlinedFlagRounded from "@mui/icons-material/OutlinedFlagRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { ComponentProps, CSSProperties, ReactNode, Ref, RefObject } from "react";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { PlayerCountdown } from "@/components/quiz/player-countdown";
import { FinalResultScreen } from "@/components/quiz/final-result-screen";
import { QuestionFeedbackPanel } from "@/components/quiz/player-shell-parts";
import { PlayerTimerText } from "@/components/quiz/player-status";
import { Kbd, MetaTag, PlayerWebPage, pointsLabel, questionKindLabel, webCardSx, webColumnSx } from "@/components/quiz/player-web-frame";
import { PlayerQuestionAside } from "@/components/quiz/player-shell-runtime/player-question-aside";
import type { QuestionCell } from "@/components/quiz/question-navigator";
import { buildKeyHint } from "@/components/quiz/player-shell-runtime/player-shell-runtime-helpers";
import { PlayerDesktopFooter } from "@/components/quiz/player-shell-runtime/player-desktop-footer";
import type { AnswerRecord, Attempt, Question, QuizResultDisplay } from "@/domain/quiz/types";
import { ergEnterpriseTokens as tk } from "@/themes/erg-enterprise-tokens";

export type PlayerDesktopLayoutProps = {
  attemptCompleted: boolean;
  canvasStyle: CSSProperties;
  cells: QuestionCell[];
  countdownProps: Omit<ComponentProps<typeof PlayerCountdown>, "children">;
  currentAnswerComplete: boolean;
  currentIndex: number;
  footerMessage: string;
  goToInputRef?: Ref<HTMLInputElement>;
  isCurrentQuestionBookmarked: boolean;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isTestingMode: boolean;
  isTrainingMode: boolean;
  lastResult: AnswerRecord["result"] | null;
  questionBody: ReactNode;
  questionBodyRef: RefObject<HTMLDivElement | null>;
  questions: Question[];
  quizTitle?: string;
  quizMeta?: string;
  readyAttempt: Attempt;
  readyQuestion: Question;
  resultDisplay: QuizResultDisplay;
  reviewingSubmittedAttempt: boolean;
  saveIndicator: ReactNode;
  submitFailed: boolean;
  submitted: boolean;
  submitting: boolean;
  handleRequestSubmit: () => void;
  handleReviewQuiz: () => void;
  onBackToList: () => void;
  onExit?: () => void;
  onJumpToQuestion: (index: number) => void;
  onRetry?: () => void;
  handleToggleBookmark: () => Promise<void>;
  setCurrentIndex: (update: (value: number) => number) => void;
  submitCurrentTrainingQuestion: () => Promise<void>;
};

/** WL2: top bar (Thoát · title · autosave · timer), position line, question card left, question list right. */
export function PlayerDesktopLayout(props: PlayerDesktopLayoutProps) {
  const {
    attemptCompleted, canvasStyle, cells, countdownProps, currentIndex, footerMessage, goToInputRef, isCurrentQuestionBookmarked,
    isTestingMode, isTrainingMode, lastResult, questionBody, questionBodyRef, questions, quizTitle, quizMeta, readyAttempt, readyQuestion,
    resultDisplay, reviewingSubmittedAttempt, saveIndicator, submitFailed, submitting, handleRequestSubmit, handleReviewQuiz,
    onBackToList, onExit, onJumpToQuestion, onRetry, handleToggleBookmark, setCurrentIndex,
  } = props;
  const showResult = attemptCompleted && !reviewingSubmittedAttempt;
  const timer = isTestingMode && !attemptCompleted ? (
    <PlayerCountdown {...countdownProps}>{(seconds) => <PlayerTimerText seconds={seconds} />}</PlayerCountdown>
  ) : null;

  return (
    <PlayerWebPage
      backLabel="Thoát" onBack={onExit ?? onBackToList} title={quizTitle ?? ""} meta={quizMeta}
      actions={<>{saveIndicator}{timer}</>}
      progress={showResult ? undefined : (currentIndex + 1) / Math.max(questions.length, 1)}
    >
      <Box component="section" sx={webColumnSx}>
        <Box component="article" sx={{ ...webCardSx, ...canvasStyle, display: "flex", flex: 1, flexDirection: "column", gap: 2, minHeight: 0, p: 3.5, position: "relative" }}>
          {showResult ? null : (
            <>
              <Box sx={{ alignItems: "center", color: tk.color.textMuted, display: "flex", flexWrap: "wrap", gap: 1, typography: "caption" }}>
                <Typography component="span" sx={{ color: tk.color.text, fontVariantNumeric: "tabular-nums", fontWeight: "fontWeightBold" }} variant="body2">
                  {`Câu ${currentIndex + 1}/${questions.length}`}
                </Typography>
                <MetaTag>{questionKindLabel(readyQuestion.kind)}</MetaTag>
                {readyQuestion.points > 0 ? <span>{pointsLabel(readyQuestion.points)}</span> : null}
                <Box sx={{ flex: 1 }} />
                <Button
                  aria-label={isCurrentQuestionBookmarked ? "Bỏ đánh dấu câu hỏi" : "Đánh dấu câu hỏi"}
                  aria-pressed={isCurrentQuestionBookmarked}
                  size="small"
                  startIcon={isCurrentQuestionBookmarked ? <FlagRounded /> : <OutlinedFlagRounded />}
                  sx={{ color: isCurrentQuestionBookmarked ? tk.color.warning : `var(--quiz-accent, ${tk.color.primary})`, gap: 0.25 }}
                  type="button"
                  variant="text"
                  onClick={() => void handleToggleBookmark()}
                >
                  {isCurrentQuestionBookmarked ? "Đã đánh dấu" : "Đánh dấu"}
                  <Box component="span" sx={{ ml: 0.75 }}><Kbd>F</Kbd></Box>
                </Button>
              </Box>
              <Typography component="h2" sx={{ color: tk.color.text }} variant="h2">
                {readyQuestion.title}
              </Typography>
            </>
          )}

          <Box ref={questionBodyRef} className="quiz-player-question-body" sx={{ display: "flex", flex: 1, flexDirection: "column", gap: 2, minHeight: 0, overflowY: "auto", pb: lastResult && !isTrainingMode ? 16 : 0 }}>
            {showResult ? (
              <FinalResultScreen
                attempt={readyAttempt} questions={questions} resultDisplay={resultDisplay}
                onReview={handleReviewQuiz}
                onReviewQuestion={(index) => { handleReviewQuiz(); setCurrentIndex(() => index); }}
                onRetry={onRetry} onBackToList={onBackToList}
              />
            ) : questionBody}
          </Box>

          {lastResult && !isTrainingMode && !showResult ? (
            <Box sx={{ bottom: 96, display: "flex", justifyContent: "center", left: 28, pointerEvents: "none", position: "absolute", right: 28, zIndex: 3 }}>
              <QuestionFeedbackPanel result={lastResult} floating />
            </Box>
          ) : null}

          {submitFailed ? <Typography role="alert" sx={{ color: tk.statusTint.error.color }} variant="caption">{footerMessage}</Typography> : null}

          {/* The result screen carries its own actions (one contained "Xem lại bài làm"). */}
          {showResult ? null : (
            <PlayerDesktopFooter
              {...props}
              keyHint={buildKeyHint(readyQuestion, questions.length)}
              handleRequestSubmit={isTestingMode ? handleRequestSubmit : undefined}
            />
          )}
        </Box>
      </Box>

      <PlayerQuestionAside cells={cells} goToInputRef={goToInputRef} onSelect={onJumpToQuestion}>
        {isTrainingMode || attemptCompleted ? null : (
          <ErgButton fullWidth disabled={submitting} startIcon={<SendRounded />} variant="outlined" onClick={handleRequestSubmit}>
            {submitting ? "Đang nộp…" : submitFailed ? "Thử nộp lại" : "Nộp bài"}
          </ErgButton>
        )}
      </PlayerQuestionAside>
    </PlayerWebPage>
  );
}
