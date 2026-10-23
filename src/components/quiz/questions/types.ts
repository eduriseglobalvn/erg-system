import type { AnswerPayload, AnswerResult, Question } from "@/lib/types";

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
