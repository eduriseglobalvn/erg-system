import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { usePlayerKeyboard, type UsePlayerKeyboardArgs } from "./use-player-keyboard";

function mount(overrides: Partial<UsePlayerKeyboardArgs> = {}) {
  const setCurrentIndex = vi.fn();
  renderHook(() =>
    usePlayerKeyboard({
      allQuestionsAnswered: false,
      attemptExpired: false,
      attemptCompleted: false,
      beginAttempt: vi.fn(),
      finalizeAttempt: vi.fn(),
      isTestingMode: true,
      isTrainingMode: false,
      loadStatus: "ready",
      questionsLength: 5,
      requestSubmit: vi.fn(),
      reviewingSubmittedAttempt: false,
      started: true,
      submitCurrentTrainingQuestion: vi.fn(),
      submitDialogMode: null,
      submitFailed: false,
      submitting: false,
      setCurrentIndex,
      ...overrides,
    }),
  );
  return setCurrentIndex;
}

describe("usePlayerKeyboard arrows", () => {
  it("moves with ArrowLeft/ArrowRight and clamps to the question range", () => {
    const setCurrentIndex = mount();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    expect(setCurrentIndex).toHaveBeenCalledTimes(2);
    expect(setCurrentIndex.mock.calls[0][0](4)).toBe(4);
    expect(setCurrentIndex.mock.calls[0][0](1)).toBe(2);
    expect(setCurrentIndex.mock.calls[1][0](0)).toBe(0);
  });

  it("ignores arrows while typing in an input", () => {
    const setCurrentIndex = mount();
    const input = document.body.appendChild(document.createElement("input"));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    input.remove();
    expect(setCurrentIndex).not.toHaveBeenCalled();
  });
});
