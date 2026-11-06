import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { createInitialAnswer, isAnswerComplete, scoreQuestion } from "@/domain/quiz/quiz";
import type { AnswerPayload, Question } from "@/domain/quiz/types";
import { type CellState, TryRunQuestionGrid } from "./try-run-question-grid";
import {
  describeCorrectAnswer,
  isAutoGraded,
  submitPrompt,
  summarizeTryRun,
  type TryRunMode,
  unansweredNumbers,
} from "./try-run-model";
import { TryRunSummaryView } from "./try-run-summary";

type Props = {
  questions: Question[];
  startIndex: number;
  initialMode: TryRunMode;
  /** Slide feedback text by question id; `Question.feedback` is the fallback. */
  feedback?: Record<string, { correct?: string; incorrect?: string }>;
};

export function QuizTryRunner({ questions, startIndex, initialMode, feedback }: Props) {
  const [mode, setMode] = useState<TryRunMode>(initialMode);
  const [index, setIndex] = useState(startIndex);
  const [answers, setAnswers] = useState<Record<string, AnswerPayload>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const reset = (nextMode: TryRunMode, at = startIndex) => {
    setMode(nextMode);
    setIndex(at);
    setAnswers({});
    setChecked({});
    setConfirming(false);
    setDone(false);
  };

  if (!questions.length) return <Typography color="text.secondary">Bài chưa có câu hỏi để chạy thử.</Typography>;
  if (done) return <TryRunSummaryView onRestart={() => reset(mode, 0)} summary={summarizeTryRun(questions, answers)} />;

  const last = questions.length - 1;
  const q = questions[Math.min(index, last)];
  const value = answers[q.id] ?? createInitialAnswer(q);
  const practice = mode === "practice";
  const isChecked = practice && !!checked[q.id];
  const graded = isAutoGraded(q);
  const result = isChecked && graded ? scoreQuestion(q, value) : null;
  const text = feedback?.[q.id];
  const feedbackText = result ? (result.correct ? (text?.correct ?? q.feedback.correct) : (text?.incorrect ?? q.feedback.incorrect)) : "";
  const correctAnswer = describeCorrectAnswer(q);

  const cellState = (x: Question): CellState => {
    if (!practice) return isAnswerComplete(x, answers[x.id]) ? "đã làm" : "chưa làm";
    if (!checked[x.id]) return "chưa làm";
    if (!isAutoGraded(x)) return "đã làm";
    return scoreQuestion(x, answers[x.id] ?? createInitialAnswer(x)).correct ? "đúng" : "sai";
  };
  const states = questions.map(cellState);

  const primary = () => {
    if (practice && !isChecked) return setChecked({ ...checked, [q.id]: true });
    if (index === last) return practice ? setDone(true) : setConfirming(true);
    setIndex(index + 1);
  };
  const primaryLabel = practice
    ? !isChecked ? "Xem kết quả" : index === last ? "Xem tổng kết" : "Câu tiếp theo"
    : index === last ? "Nộp bài" : "Tiếp theo";
  const missing = unansweredNumbers(questions, answers).length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <Typography color="text.secondary" sx={{ flex: 1 }} variant="caption">
          Chạy thử bằng nội dung đang soạn · không ghi kết quả
        </Typography>
        <ToggleButtonGroup aria-label="Chế độ làm bài" exclusive onChange={(_, v: TryRunMode | null) => v && reset(v)} size="small" value={mode}>
          <ToggleButton value="practice">Luyện tập</ToggleButton>
          <ToggleButton value="test">Kiểm tra</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ alignItems: "flex-start", display: "flex", flexWrap: "wrap", gap: 2.5 }}>
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: "20px", flex: "1 1 420px", maxWidth: 880, minWidth: 0, p: 3.5 }}>
          {/* The learner player shells print the title themselves; the renderer only draws the answers. */}
          {q.title ? <Typography component="h2" sx={{ mb: q.instructions ? 0.5 : 2.5 }} variant="h6">{q.title}</Typography> : null}
          {q.instructions ? <Typography color="text.secondary" sx={{ mb: 2.5 }} variant="body2">{q.instructions}</Typography> : null}
          <QuestionRenderer
            onChange={(next) => setAnswers({ ...answers, [q.id]: next })}
            question={q}
            result={result}
            reviewMode={isChecked}
            submitted={isChecked}
            value={value}
          />
          {isChecked ? (
            <Box role="status" sx={{ bgcolor: "background.default", border: 1, borderColor: "divider", borderRadius: 3, mt: 2, p: 2 }}>
              <Typography color={!result ? "text.secondary" : result.correct ? "success.main" : "error.main"} sx={{ fontWeight: "fontWeightBold" }}>
                {!result ? "Câu này không chấm tự động." : result.correct ? "Chính xác!" : `Chưa đúng${correctAnswer ? ` · Đáp án đúng: ${correctAnswer}` : ""}`}
              </Typography>
              {feedbackText ? <Typography variant="body2">{feedbackText}</Typography> : null}
            </Box>
          ) : null}
          {!practice ? (
            <Typography color="text.secondary" sx={{ mt: 2 }} variant="caption">
              Đổi đáp án thoải mái cho tới khi nộp bài. Kết quả chỉ hiện sau khi nộp.
            </Typography>
          ) : null}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
            <Button disabled={index === 0} onClick={() => setIndex(index - 1)} variant="outlined">
              Quay lại
            </Button>
            <ErgButton disabled={practice && !isChecked && !isAnswerComplete(q, value)} onClick={primary} variant="contained">
              {primaryLabel}
            </ErgButton>
          </Box>
        </Box>
        <TryRunQuestionGrid current={index} practice={practice} onSelect={setIndex} states={states} />
      </Box>
      <Dialog aria-describedby={missing ? "try-run-submit-detail" : undefined} aria-labelledby="try-run-submit-title" fullWidth maxWidth="xs" onClose={() => setConfirming(false)} open={confirming} role="alertdialog">
        <DialogContent>
          <Typography id="try-run-submit-title" sx={{ fontWeight: "fontWeightBold" }}>{submitPrompt(questions, answers)}</Typography>
          {missing ? (
            <Typography id="try-run-submit-detail" color="text.secondary" variant="caption">
              Sau khi nộp sẽ không sửa được đáp án.
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(false)} variant="text">
            Làm tiếp
          </Button>
          <Button color="error" onClick={() => setDone(true)} variant="outlined">
            Vẫn nộp
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
