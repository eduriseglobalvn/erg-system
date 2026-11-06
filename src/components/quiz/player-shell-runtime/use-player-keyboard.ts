import { useEffect, type Dispatch, type SetStateAction } from "react";

import { isEditableKeyboardTarget, type PlayerLoadState, type SubmitDialogMode } from "@/components/quiz/player-shell-runtime-model";

export type UsePlayerKeyboardArgs = {
  allQuestionsAnswered: boolean;
  attemptExpired: boolean;
  attemptCompleted: boolean;
  beginAttempt: (nextIndex?: number) => Promise<void>;
  finalizeAttempt: () => Promise<void>;
  isTestingMode: boolean;
  isTrainingMode: boolean;
  loadStatus: PlayerLoadState["status"];
  /** Web shortcuts: `1`-`9` (0-based index), `F` and `N`. Each is optional; the caller decides what a key may do right now. */
  onPickOption?: (index: number) => void;
  onToggleFlag?: () => void;
  focusGoTo?: () => void;
  questionsLength: number;
  requestSubmit: () => void;
  reviewingSubmittedAttempt: boolean;
  started: boolean;
  submitCurrentTrainingQuestion: () => Promise<void>;
  submitDialogMode: SubmitDialogMode | null;
  submitFailed: boolean;
  submitting: boolean;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
};

export function usePlayerKeyboard({
  allQuestionsAnswered,
  attemptExpired,
  attemptCompleted,
  beginAttempt,
  finalizeAttempt,
  isTestingMode,
  isTrainingMode,
  loadStatus,
  onPickOption,
  onToggleFlag,
  focusGoTo,
  questionsLength,
  requestSubmit,
  reviewingSubmittedAttempt,
  started,
  submitCurrentTrainingQuestion,
  submitDialogMode,
  submitFailed,
  submitting,
  setCurrentIndex,
}: UsePlayerKeyboardArgs) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      // Shift only matters for non-letters: Shift+F / Shift+N still count; Enter, arrows and digits ignore Shift.
      const letter = event.key.toLowerCase();
      if (event.shiftKey && letter !== "f" && letter !== "n") {
        return;
      }

      if (isEditableKeyboardTarget(event.target, event.key)) {
        return;
      }

      if (submitDialogMode) {
        // Enter on a focused dialog control (Làm tiếp, close, a question chip) activates that control, not the submit.
        const onControl = event.target instanceof Element && event.target.closest("button, a, [role=button]") !== null;
        if (event.key === "Enter" && !onControl) {
          event.preventDefault();
          void finalizeAttempt();
        }
        return;
      }

      if (!started) {
        if (event.key === "Enter" && loadStatus === "ready") {
          event.preventDefault();
          void beginAttempt();
        }
        return;
      }

      if (submitting || (attemptCompleted && !reviewingSubmittedAttempt)) {
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setCurrentIndex((value) => (event.key === "ArrowLeft" ? Math.max(0, value - 1) : Math.min(questionsLength - 1, value + 1)));
        return;
      }

      // The review screen has no flag control, so F is off there (it would silently rewrite the finished session);
      // N is swallowed on review too: the panel shows a go-to field but gets no ref, so focusGoTo is a no-op there. Held keys must not re-fire.
      if (letter === "f" && onToggleFlag && !reviewingSubmittedAttempt) {
        event.preventDefault();
        if (!event.repeat) onToggleFlag();
        return;
      }
      if (letter === "n" && focusGoTo) {
        event.preventDefault();
        if (!event.repeat) focusGoTo();
        return;
      }

      if (attemptCompleted || reviewingSubmittedAttempt) {
        return;
      }

      if (onPickOption && /^[1-9]$/.test(event.key)) {
        if (!event.repeat) onPickOption(Number(event.key) - 1);
        return;
      }

      if (isTestingMode) {
        if (event.key === "Enter" && (allQuestionsAnswered || submitFailed)) {
          event.preventDefault();
          requestSubmit();
        }
        return;
      }

      if (isTrainingMode && event.key === "Enter") {
        event.preventDefault();
        void submitCurrentTrainingQuestion();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    setCurrentIndex,
    allQuestionsAnswered,
    attemptExpired,
    attemptCompleted,
    beginAttempt,
    finalizeAttempt,
    isTestingMode,
    isTrainingMode,
    loadStatus,
    onPickOption,
    onToggleFlag,
    focusGoTo,
    questionsLength,
    requestSubmit,
    reviewingSubmittedAttempt,
    started,
    submitCurrentTrainingQuestion,
    submitDialogMode,
    submitFailed,
    submitting,
  ]);
}
