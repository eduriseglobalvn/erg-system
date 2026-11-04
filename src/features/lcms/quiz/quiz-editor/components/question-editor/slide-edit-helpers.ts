import { defaultQuizTextStyle, resolveSlideTextStyle } from "@/features/lcms/quiz/quiz-editor/components/quiz-editor-text-style";
import type {
  QuizEditorSlide,
  QuizEditorSlideMedia,
  QuizEditorTextStyle,
  QuizEditorTextStyleTarget,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export type InlineMediaTarget =
  | { kind: "choice"; id: string }
  | { kind: "drag-item"; id: string; field: "label" | "target" }
  | { kind: "slide" };

export function updateSlideTextStyleTarget(
  slide: QuizEditorSlide,
  target: QuizEditorTextStyleTarget,
  patch: Partial<QuizEditorTextStyle>,
): QuizEditorSlide {
  const currentStyle = resolveSlideTextStyle(slide, target);
  const nextStyle = { ...defaultQuizTextStyle, ...currentStyle, ...patch };

  return {
    ...slide,
    textStyle: target === "question" ? nextStyle : slide.textStyle,
    textStyles: {
      ...slide.textStyles,
      [target]: nextStyle,
    },
  };
}

export function getActiveInlineMediaTarget(): InlineMediaTarget {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) {
    return { kind: "slide" };
  }

  const targetElement = activeElement.closest<HTMLElement>("[data-media-target-kind]");
  const kind = targetElement?.dataset.mediaTargetKind;
  const id = targetElement?.dataset.mediaTargetId;
  const field = targetElement?.dataset.mediaTargetField;

  if (kind === "choice" && id) {
    return { kind, id };
  }

  if (kind === "drag-item" && id) {
    return { kind, id, field: field === "target" ? "target" : "label" };
  }

  return { kind: "slide" };
}

export function applyInlineMedia(
  slide: QuizEditorSlide,
  target: InlineMediaTarget,
  media: QuizEditorSlideMedia,
): QuizEditorSlide {
  if (target.kind === "choice") {
    return {
      ...slide,
      choices: slide.choices?.map((choice) =>
        choice.id === target.id ? { ...choice, media } : choice,
      ),
    };
  }

  if (target.kind === "drag-item") {
    return {
      ...slide,
      dragDropItems: slide.dragDropItems?.map((item) =>
        item.id === target.id
          ? target.field === "target"
            ? { ...item, targetMedia: media }
            : { ...item, media }
          : item,
      ),
    };
  }

  return { ...slide, media };
}

export function cloneSlide(slide: QuizEditorSlide) {
  return JSON.parse(JSON.stringify(slide)) as QuizEditorSlide;
}
