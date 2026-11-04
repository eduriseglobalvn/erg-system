import type { AnswerPayload, AnswerResult, Question } from "@/domain/quiz/types";

export type QuestionComponentProps = {
  question: Question;
  value: AnswerPayload;
  onChange: (next: AnswerPayload) => void;
  submitted?: boolean;
  reviewMode?: boolean;
  result?: AnswerResult | null;
  editable?: boolean;
  onQuestionChange?: (next: Question) => void;
};
