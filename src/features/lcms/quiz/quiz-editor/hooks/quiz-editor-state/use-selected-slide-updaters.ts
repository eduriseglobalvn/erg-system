import type { Dispatch, SetStateAction } from "react";

import { defaultQuizTextStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import {
  applySlideTextStyles,
  changeSlideQuestionType,
  patchSlideOptions,
  patchSlideTextStyle,
  updateGroupInGroups,
  updateSlideInGroups,
  withEditedStatus,
} from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-groups";
import { createFinalSlideOptions } from "@/features/lcms/quiz/quiz-editor/hooks/quiz-editor-state/quiz-editor-slide-factories";
import type {
  QuestionType,
  QuizEditorChoice,
  QuizEditorDragDropItem,
  QuizEditorElementOffset,
  QuizEditorFeedbackRow,
  QuizEditorFinalSlideOptions,
  QuizEditorGroup,
  QuizEditorSlide,
  QuizEditorSlideOptions,
  QuizEditorSlideUpdate,
  QuizEditorTextStyle,
  QuizEditorTextStyles,
  SelectedEditorNode,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { isQuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

type UseSelectedSlideUpdatersArgs = {
  selectedNode: SelectedEditorNode;
  selectedGroup: QuizEditorGroup | null;
  selectedSlide: QuizEditorSlide | null;
  setGroups: Dispatch<SetStateAction<QuizEditorGroup[]>>;
  setResultSlide: Dispatch<SetStateAction<QuizEditorSlide>>;
};

/** Updaters that act on the currently selected group/slide (or the result slide). */
export function useSelectedSlideUpdaters({
  selectedNode,
  selectedGroup,
  selectedSlide,
  setGroups,
  setResultSlide,
}: UseSelectedSlideUpdatersArgs) {
  function updateSelectedGroupTitle(value: string) {
    if (!selectedGroup || selectedNode.type === "result") return;

    setGroups((currentGroups) => updateGroupInGroups(currentGroups, selectedGroup.id, { title: value }));
  }

  function updateSelectedGroupRule(rule: QuizEditorGroup["rule"]) {
    if (!selectedGroup || selectedNode.type === "result") return;

    setGroups((currentGroups) => updateGroupInGroups(currentGroups, selectedGroup.id, { rule }));
  }

  /** Applies `update` to the selected (non-result) slide inside its group. */
  function updateSelectedGroupSlide(update: (slide: QuizEditorSlide) => QuizEditorSlide) {
    if (!selectedSlide || !selectedGroup) return;
    setGroups((currentGroups) =>
      updateSlideInGroups(currentGroups, selectedGroup.id, selectedSlide.id, update),
    );
  }

  function updateSelectedSlideTitle(value: string) {
    if (!selectedSlide) return;

    if (selectedNode.type === "result") {
      setResultSlide((current) => ({ ...current, title: value }));
      return;
    }

    updateSelectedGroupSlide((slide) => ({ ...slide, title: value }));
  }

  function updateSelectedSlideDescription(value: string) {
    if (!selectedSlide) return;

    if (selectedNode.type === "result") {
      return;
    }

    updateSelectedGroupSlide((slide) => ({ ...slide, description: value }));
  }

  function updateSelectedSlideInstructions(nextInstructions: string[]) {
    if (selectedNode.type === "result") return;
    updateSelectedGroupSlide((slide) => ({ ...slide, instructions: nextInstructions }));
  }

  function updateSelectedSlideChoices(nextChoices: QuizEditorChoice[]) {
    if (selectedNode.type === "result") return;
    updateSelectedGroupSlide((slide) => ({ ...slide, choices: nextChoices }));
  }

  function updateSelectedSlideDragDropItems(nextItems: QuizEditorDragDropItem[]) {
    if (selectedNode.type === "result") return;
    updateSelectedGroupSlide((slide) => ({ ...slide, dragDropItems: nextItems }));
  }

  function updateSelectedSlideFeedbackRows(nextRows: QuizEditorFeedbackRow[]) {
    if (selectedNode.type === "result") return;
    updateSelectedGroupSlide((slide) => ({ ...slide, feedbackRows: nextRows }));
  }

  function replaceSelectedSlide(update: QuizEditorSlideUpdate) {
    if (!selectedSlide) return;
    const apply = (current: QuizEditorSlide) => (typeof update === "function" ? update(current) : update);

    if (selectedNode.type === "result") {
      setResultSlide(apply);
      return;
    }

    updateSelectedGroupSlide((current) => withEditedStatus(apply(current)));
  }

  function updateSelectedSlideTextStyle(patch: Partial<QuizEditorTextStyle>) {
    if (!selectedSlide) return;

    if (selectedNode.type === "result") {
      setResultSlide((current) => patchSlideTextStyle(current, patch));
      return;
    }

    updateSelectedGroupSlide((slide) => patchSlideTextStyle(slide, patch));
  }

  function applySelectedSlideTextStyles(nextTextStyles: QuizEditorTextStyles) {
    if (!selectedSlide) return;

    const nextQuestionStyle = nextTextStyles.question
      ? { ...defaultQuizTextStyle, ...selectedSlide.textStyle, ...nextTextStyles.question }
      : selectedSlide.textStyle;

    if (selectedNode.type === "result") {
      setResultSlide((current) => applySlideTextStyles(current, nextTextStyles, nextQuestionStyle));
      return;
    }

    updateSelectedGroupSlide((slide) => applySlideTextStyles(slide, nextTextStyles, nextQuestionStyle));
  }

  function updateSelectedSlideOptions(patch: Partial<QuizEditorSlideOptions>) {
    if (!selectedSlide) return;

    if (selectedNode.type === "result") {
      setResultSlide((current) => patchSlideOptions(current, patch));
      return;
    }

    updateSelectedGroupSlide((slide) => patchSlideOptions(slide, patch));
  }

  function updateSelectedSlideElementOffset(elementId: string, offset: QuizEditorElementOffset) {
    if (!selectedSlide) return;

    const nextOptionsPatch: Partial<QuizEditorSlideOptions> = {
      elementOffsets: {
        ...(selectedSlide.options?.elementOffsets ?? {}),
        [elementId]: offset,
      },
    };

    if (selectedNode.type === "result") {
      setResultSlide((current) => patchSlideOptions(current, nextOptionsPatch));
      return;
    }

    updateSelectedGroupSlide((slide) => patchSlideOptions(slide, nextOptionsPatch));
  }

  function updateSelectedFinalSlideOptions(
    patch: Partial<QuizEditorFinalSlideOptions>,
  ) {
    if (selectedNode.type !== "result") return;

    setResultSlide((current) => ({
      ...current,
      options: {
        ...current.options,
        finalSlide: {
          ...createFinalSlideOptions(),
          ...current.options?.finalSlide,
          ...patch,
        },
      },
    }));
  }

  function updateSelectedResultTab(nextTab: "passed" | "failed") {
    setResultSlide((current) => ({ ...current, activeResultTab: nextTab }));
  }

  function changeSelectedQuestionType(nextType: QuestionType) {
    if (selectedNode.type === "result") return;
    if (!selectedSlide || !selectedGroup || !isQuestionType(selectedSlide.kind)) return;

    updateSelectedGroupSlide((slide) => changeSlideQuestionType(slide, nextType));
  }

  return {
    updateSelectedGroupTitle,
    updateSelectedGroupRule,
    updateSelectedSlideTitle,
    updateSelectedSlideDescription,
    updateSelectedSlideInstructions,
    updateSelectedSlideChoices,
    updateSelectedSlideDragDropItems,
    updateSelectedSlideFeedbackRows,
    replaceSelectedSlide,
    updateSelectedSlideTextStyle,
    applySelectedSlideTextStyles,
    updateSelectedSlideOptions,
    updateSelectedSlideElementOffset,
    updateSelectedFinalSlideOptions,
    updateSelectedResultTab,
    changeSelectedQuestionType,
  };
}
