import type { QuizEditorChoice, QuizEditorElementOffset, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export type QuizEditorSlideRenderMode = "question" | "correct" | "incorrect";

export type QuizEditorSlideAuthoring = {
  onUpdateTitle?: (value: string) => void;
  onUpdateInstructions?: (items: string[]) => void;
  onUpdateChoices?: (choices: QuizEditorChoice[]) => void;
};

export type SlideRenderProps = {
  slide: QuizEditorSlide;
  size?: "stage" | "thumbnail" | "mini";
  showResultTargets?: boolean;
  themeId?: string;
  renderMode?: QuizEditorSlideRenderMode;
  authoring?: QuizEditorSlideAuthoring;
  selectedImageId?: string | null;
  onSelectImage?: (elementId: string) => void;
  onClearSelection?: () => void;
  onMoveImage?: (elementId: string, offset: QuizEditorElementOffset) => void;
};

