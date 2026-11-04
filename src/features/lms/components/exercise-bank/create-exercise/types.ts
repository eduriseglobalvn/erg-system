import type { QuestionBankApiData } from "@/features/lcms/quiz/question-bank/api/question-bank-api";

export type BankSubject = QuestionBankApiData["subjects"][number];
export type BankQuestion = QuestionBankApiData["questions"][number];
export type CreateExerciseStep = "pick" | "setup";
