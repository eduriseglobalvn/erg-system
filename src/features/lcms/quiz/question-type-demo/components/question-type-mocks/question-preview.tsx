import { SingleChoiceMock, MultipleResponseMock, TrueFalseMock } from "@/features/lcms/quiz/question-type-demo/components/question-type-mocks/choice-mocks";
import { ShortAnswerMock, NumericMock, FillBlankMock, SelectFromListsMock, EssayMock } from "@/features/lcms/quiz/question-type-demo/components/question-type-mocks/text-mocks";
import { SequenceMock, MatchingMock, DragWordsMock, DragDropMock } from "@/features/lcms/quiz/question-type-demo/components/question-type-mocks/arrange-mocks";
import { HotspotMock, LikertMock } from "@/features/lcms/quiz/question-type-demo/components/question-type-mocks/survey-mocks";
import type { QuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function QuestionPreview({ kind }: { kind: QuestionType }) {
  switch (kind) {
    case "multiple-choice":
      return <SingleChoiceMock />;
    case "multiple-response":
      return <MultipleResponseMock />;
    case "true-false":
      return <TrueFalseMock />;
    case "short-answer":
      return <ShortAnswerMock />;
    case "numeric":
      return <NumericMock />;
    case "sequence":
      return <SequenceMock />;
    case "matching":
      return <MatchingMock />;
    case "fill-in-the-blanks":
      return <FillBlankMock />;
    case "select-from-lists":
      return <SelectFromListsMock />;
    case "drag-the-words":
      return <DragWordsMock />;
    case "hotspot":
      return <HotspotMock />;
    case "drag-and-drop":
      return <DragDropMock />;
    case "likert-scale":
      return <LikertMock />;
    case "essay":
      return <EssayMock />;
    default:
      return null;
  }
}
