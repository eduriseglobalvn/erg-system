import { sampleQuiz } from "@/lib/sample-quiz";

export function shouldUseLocalQuizRuntimeFallback(quizId: string, error: unknown) {
  return quizId === sampleQuiz.id && Boolean(error);
}
