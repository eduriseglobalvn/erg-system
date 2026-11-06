import type { AnswerRecord, Attempt, Question } from "@/domain/quiz/types";

/** 1-based, as on canvas WL5. */
export const REVIEW_WRONG = [7, 12, 15, 23, 31, 37, 48, 66, 81];
export const REVIEW_SKIPPED = [54, 77, 88];
export const REVIEW_TOTAL = 90;

export function reviewQuestion(n: number): Question {
  return {
    id: `q${n}`,
    kind: "single_choice",
    title: `Nội dung câu ${n}`,
    points: 0.5,
    feedback: { correct: "", incorrect: n === 37 ? "Bước 1: đổi đơn vị.\nBước 2: thay số." : "", partial: "" },
    choices: [
      { id: `q${n}a`, label: "Phương án đúng", correct: true },
      { id: `q${n}b`, label: "Phương án sai", correct: false },
    ],
  } as unknown as Question;
}

/** 90 single-choice questions: wrong ones pick B, skipped ones are blank, the rest pick A (0,5 điểm). */
export function buildReviewFixture(): { questions: Question[]; attempt: Attempt } {
  const questions = Array.from({ length: REVIEW_TOTAL }, (_, i) => reviewQuestion(i + 1));
  const answers: Record<string, AnswerRecord> = {};
  questions.forEach((question, i) => {
    const n = i + 1;
    const wrong = REVIEW_WRONG.includes(n);
    const skipped = REVIEW_SKIPPED.includes(n);
    const correct = !wrong && !skipped;
    answers[question.id] = {
      questionId: question.id,
      input: skipped ? {} : { choiceId: wrong ? `q${n}b` : `q${n}a` },
      result: {
        questionId: question.id,
        correct,
        partiallyRight: false,
        awardedPoints: correct ? 0.5 : 0,
        maxPoints: 0.5,
        message: question.feedback[correct ? "correct" : "incorrect"],
      },
    };
  });
  const correctCount = REVIEW_TOTAL - REVIEW_WRONG.length - REVIEW_SKIPPED.length;
  return {
    questions,
    attempt: {
      id: "attempt-1",
      quizId: "quiz-1",
      submittedCount: REVIEW_TOTAL,
      totalQuestions: REVIEW_TOTAL,
      totalScore: correctCount * 0.5,
      maxScore: REVIEW_TOTAL * 0.5,
      percent: Math.round((correctCount / REVIEW_TOTAL) * 100),
      passed: true,
      answers,
    },
  };
}
