import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTrainingAdvanceEffects } from "@/components/quiz/player-shell-runtime/use-training-advance-effects";

describe("useTrainingAdvanceEffects", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("never moves to the next question on its own after a practice answer is checked", () => {
    const scrollTo = vi.fn();
    const questionBodyRef = { current: { scrollTo } as unknown as HTMLDivElement };
    const { result } = renderHook(() => {
      const [currentIndex, setCurrentIndex] = useState(2);
      useTrainingAdvanceEffects({ currentIndex, questionBodyRef, started: true });
      return { currentIndex, setCurrentIndex };
    });
    scrollTo.mockClear();

    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.currentIndex).toBe(2);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("scrolls the question body to the top when the user moves to another question", () => {
    const scrollTo = vi.fn();
    const questionBodyRef = { current: { scrollTo } as unknown as HTMLDivElement };
    const { result } = renderHook(() => {
      const [currentIndex, setCurrentIndex] = useState(0);
      useTrainingAdvanceEffects({ currentIndex, questionBodyRef, started: true });
      return { setCurrentIndex };
    });
    scrollTo.mockClear();
    act(() => result.current.setCurrentIndex(1));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });
});
