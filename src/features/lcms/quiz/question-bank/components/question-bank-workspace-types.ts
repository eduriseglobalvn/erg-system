import type { QuizCreateDraft } from "./quiz-create-package-dialog";
import type {
  QuestionBankQuestion,
  QuizBankItem,
  QuizBankKind,
} from "@/features/lcms/quiz/question-bank/types/question-bank-types";

export type QuizKindFilter = "all" | QuizBankKind;

export type QuestionFormMode = "create" | "edit";

export type QuestionFormDraft = {
  stem: string;
  objective: string;
  type: QuestionBankQuestion["type"];
  difficulty: QuestionBankQuestion["difficulty"];
  status: QuestionBankQuestion["status"];
  tagsText: string;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  answer: string;
};

export type QuizPackageEditDraft = {
  draft: QuizCreateDraft;
  quiz: QuizBankItem;
};
