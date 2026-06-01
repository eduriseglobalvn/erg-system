import { FormViewRibbon } from "@/features/lcms/quiz/quiz-editor/components/ribbon/form-view-ribbon";
import type { IntroSlideKind, QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

type RibbonProps = {
  onAddQuestionGroup: () => void;
  onAddQuestion: (type: QuestionType) => void;
  onAddIntroduction: (type: IntroSlideKind) => void;
  onOpenQuizProperties: () => void;
  onOpenResults: () => void;
  onOpenPlayerTemplate: () => void;
  onOpenPreview: () => void;
  onOpenPublish: () => void;
};

export function QuizEditorRibbon(props: RibbonProps) {
  return (
    <FormViewRibbon
      onAddQuestionGroup={props.onAddQuestionGroup}
      onAddQuestion={props.onAddQuestion}
      onAddIntroduction={props.onAddIntroduction}
      onOpenQuizProperties={props.onOpenQuizProperties}
      onOpenResults={props.onOpenResults}
      onOpenPlayerTemplate={props.onOpenPlayerTemplate}
      onOpenPreview={props.onOpenPreview}
      onOpenPublish={props.onOpenPublish}
    />
  );
}
