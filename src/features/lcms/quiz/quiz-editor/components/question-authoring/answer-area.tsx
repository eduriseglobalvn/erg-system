import { QuestionRenderer } from "@/components/quiz/question-renderer";
import { createInitialAnswer } from "@/domain/quiz/quiz";
import type { Question } from "@/domain/quiz/types";
import type { QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { ChoiceAuthoring } from "./choice-authoring";
import { DragWordsAuthoring } from "./drag-words-authoring";
import { FillBlankAuthoring } from "./fill-blank-authoring";
import { LikertAuthoring } from "./likert-authoring";
import { NumericAuthoring } from "./numeric-authoring";
import { SelectListsAuthoring } from "./select-lists-authoring";
import { SequenceAuthoring } from "./sequence-authoring";
import { ShortAnswerAuthoring } from "./short-answer-authoring";
import { TrueFalseAuthoring } from "./true-false-authoring";

type Props = {
  slide: QuizEditorSlide;
  question: Question;
  onChange: (next: Question) => void;
  /** Applies a change to the latest question; used once an async step (image processing) finishes. */
  onUpdate: (change: (latest: Question) => Question) => void;
};

/** One authoring surface per question kind; kinds without one yet use the learner renderer in edit mode. */
export function AnswerArea({ slide, question, onChange, onUpdate }: Props) {
  if (slide.kind === "multiple-choice" || slide.kind === "multiple-response") {
    return <ChoiceAuthoring mode={slide.kind === "multiple-choice" ? "single" : "multiple"} onChange={onChange} onUpdate={onUpdate} question={question} />;
  }
  if (slide.kind === "true-false") return <TrueFalseAuthoring onChange={onChange} question={question} />;
  if (slide.kind === "likert-scale") return <LikertAuthoring onChange={onChange} question={question} />;
  if (slide.kind === "sequence") return <SequenceAuthoring onChange={onChange} onUpdate={onUpdate} question={question} />;
  if (slide.kind === "fill-in-the-blanks") return <FillBlankAuthoring key={question.id} onChange={onChange} question={question} />;
  if (slide.kind === "select-from-lists") return <SelectListsAuthoring key={question.id} onChange={onChange} question={question} />;
  if (slide.kind === "drag-the-words") return <DragWordsAuthoring key={question.id} onChange={onChange} question={question} />;
  if (slide.kind === "numeric") return <NumericAuthoring key={question.id} onChange={onChange} question={question} />;
  if (slide.kind === "short-answer") return <ShortAnswerAuthoring key={question.id} onChange={onChange} question={question} />;
  return (
    <div data-testid="answer-fallback">
      {/* The image slot above owns the content image, so the renderer does not draw it a second time. */}
      <QuestionRenderer
        editable
        onChange={() => {}}
        onQuestionChange={(next) => onChange({ ...next, contentImage: question.contentImage })}
        question={{ ...question, contentImage: undefined }}
        value={createInitialAnswer(question)}
      />
    </div>
  );
}
