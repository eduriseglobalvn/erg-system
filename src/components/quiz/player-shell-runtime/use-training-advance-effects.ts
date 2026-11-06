import { useEffect, type RefObject } from "react";

export type UseTrainingAdvanceEffectsArgs = {
  currentIndex: number;
  questionBodyRef: RefObject<HTMLDivElement | null>;
  started: boolean;
};

// Practice mode never advances by itself: the learner moves on via swipe, the question list, arrows or "Câu tiếp".
export function useTrainingAdvanceEffects({ currentIndex, questionBodyRef, started }: UseTrainingAdvanceEffectsArgs) {
  useEffect(() => {
    if (!started) {
      return;
    }

    questionBodyRef.current?.scrollTo({ top: 0 });
  }, [currentIndex, started, questionBodyRef]);
}
