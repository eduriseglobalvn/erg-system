import { useEffect, type Dispatch, type RefObject, type SetStateAction } from "react";

import type { AnswerRecord, Question } from "@/domain/quiz/types";

export type UseTrainingAdvanceEffectsArgs = {
  activeQuestion: Question | null;
  attemptCompleted: boolean;
  currentIndex: number;
  isLastQuestion: boolean;
  isTrainingMode: boolean;
  lastResult: AnswerRecord["result"] | null;
  paceStateUpdate: (update: () => void) => void;
  questionBodyRef: RefObject<HTMLDivElement | null>;
  questionsLength: number;
  recentTrainingSubmitQuestionId: string | null;
  started: boolean;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  setRecentTrainingSubmitQuestionId: Dispatch<SetStateAction<string | null>>;
};

export function useTrainingAdvanceEffects({
  activeQuestion,
  attemptCompleted,
  currentIndex,
  isLastQuestion,
  isTrainingMode,
  lastResult,
  paceStateUpdate,
  questionBodyRef,
  questionsLength,
  recentTrainingSubmitQuestionId,
  started,
  setCurrentIndex,
  setRecentTrainingSubmitQuestionId,
}: UseTrainingAdvanceEffectsArgs) {
  useEffect(() => {
    if (!started) {
      return;
    }

    questionBodyRef.current?.scrollTo({ top: 0 });
  }, [currentIndex, started, questionBodyRef]);

  useEffect(() => {
    if (recentTrainingSubmitQuestionId && activeQuestion && recentTrainingSubmitQuestionId !== activeQuestion.id) {
      paceStateUpdate(() => setRecentTrainingSubmitQuestionId(null));
    }
  }, [activeQuestion, paceStateUpdate, recentTrainingSubmitQuestionId, setRecentTrainingSubmitQuestionId]);

  useEffect(() => {
    if (
      !started ||
      !isTrainingMode ||
      !activeQuestion ||
      !lastResult ||
      recentTrainingSubmitQuestionId !== activeQuestion.id ||
      attemptCompleted
    ) {
      return;
    }

    const nextQuestionTimerId = window.setTimeout(() => {
      if (!isLastQuestion) {
        questionBodyRef.current?.scrollTo({ top: 0, behavior: "auto" });
        setCurrentIndex((value) => Math.min(questionsLength - 1, value + 1));
        window.requestAnimationFrame(() => {
          questionBodyRef.current?.scrollTo({ top: 0, behavior: "auto" });
        });
      }
      setRecentTrainingSubmitQuestionId(null);
    }, 1000);

    return () => {
      window.clearTimeout(nextQuestionTimerId);
    };
  }, [
    questionBodyRef,
    setCurrentIndex,
    setRecentTrainingSubmitQuestionId,
    activeQuestion,
    attemptCompleted,
    isLastQuestion,
    isTrainingMode,
    lastResult,
    questionsLength,
    recentTrainingSubmitQuestionId,
    started,
  ]);
}
