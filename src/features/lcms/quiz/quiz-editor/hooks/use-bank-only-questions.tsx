import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { findBankOnlyQuestions, moveBankOnlyQuestions } from "@/features/lcms/quiz/quiz-editor/hooks/move-bank-only-questions";
import type { QuizEditorSlide, QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";

/**
 * "Tất cả": questions made in the old bank screen that no quiz of the Level holds yet, with a button that moves them
 * into the topic quizzes (topicless ones into "Tất cả"). Shown only while there are such questions.
 */
export function useBankOnlyQuestions({ subjectId, levelId, enabled, topics, liveSlides, createId, questionDefaults, importLoose }: {
  subjectId: string;
  levelId: string | null;
  /** "Tất cả" with the topicless quiz open and its draft loaded. */
  enabled: boolean;
  topics: readonly { id: string; label: string }[];
  liveSlides: readonly QuizEditorSlide[];
  createId: (prefix: string) => string;
  questionDefaults: QuizProjectSettings["questionDefaults"];
  importLoose: (questions: QuestionBankQuestion[]) => void;
}) {
  const queryClient = useQueryClient();
  const [moving, setMoving] = useState(false);
  // Read when the query runs, not part of its key: typing in the editor must not refetch the bank.
  const live = useRef(liveSlides);
  useEffect(() => {
    live.current = liveSlides;
  });
  const level = levelId ? { subjectId, levelId } : null;
  const found = useQuery({
    queryKey: ["quiz-editor", "bank-only-questions", subjectId, levelId],
    queryFn: () => findBankOnlyQuestions(queryClient, level!, live.current),
    enabled: enabled && Boolean(level),
    staleTime: Infinity,
  });
  const questions = found.data ?? [];

  async function move() {
    if (!level) return;
    setMoving(true);
    try {
      await moveBankOnlyQuestions(queryClient, { level, topics, questions, createId, questionDefaults, importLoose });
      toast.success(`Đã chuyển ${questions.length} câu từ ngân hàng vào bộ câu.`);
      queryClient.setQueryData(["quiz-editor", "bank-only-questions", subjectId, levelId], []);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Chưa chuyển hết câu hỏi. Bấm lại để chuyển phần còn lại.");
      void found.refetch();
    } finally {
      setMoving(false);
    }
  }

  const banner = enabled && questions.length ? (
    <Alert
      severity="info"
      sx={{ borderRadius: 0 }}
      action={<Button variant="outlined" color="inherit" size="small" disabled={moving} onClick={() => void move()}>Chuyển vào bộ câu</Button>}
    >
      {`Có ${questions.length} câu chỉ có trong ngân hàng, chưa nằm trong bộ câu nào của module này. Câu có chủ đề vào đúng chủ đề, câu chưa có chủ đề vào Tất cả.`}
    </Alert>
  ) : null;

  return { banner };
}
