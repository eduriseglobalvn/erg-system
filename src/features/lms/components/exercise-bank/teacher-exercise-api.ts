import { createQuizDraftFromBankQuestions, createQuizDraftFromQuiz } from "@/features/question-bank/api/question-bank-to-quiz";
import type { QuestionBankQuestion } from "@/features/question-bank/types/question-bank-types";
import { apiRequest } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";

export type TeacherExerciseInput = {
  /** Set to change a quiz the teacher already owns; empty to create a new one. */
  quizId?: string;
  title: string;
  kind: "train" | "test";
  questions: QuestionBankQuestion[];
  timeLimitMinutes: number;
};

const key = (step: string) => `teacher-exercise-${step}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`}`;
// The teacher signs in to the LMS portal; these authoring routes live under /lcms, so the portal is named explicitly.
const lms = { portal: "lms" } as const;

/**
 * Saves a quiz the teacher built from bank questions and publishes it, so it can be assigned right away.
 * The server keeps it as the teacher's own: other teachers do not see it, the training office does.
 */
export async function saveTeacherExercise(input: TeacherExerciseInput): Promise<string> {
  const first = input.questions[0];
  if (!first) throw new Error("Chọn ít nhất một câu hỏi.");
  let quizId = input.quizId;
  if (quizId) {
    await apiRequest(API_ENDPOINTS.lcms.quiz(quizId), { ...lms, body: JSON.stringify({ title: input.title, kind: input.kind }), method: "PATCH" });
  } else {
    const created = await apiRequest<{ quizId: string }>(API_ENDPOINTS.lcms.quizzes, {
      ...lms,
      body: JSON.stringify({ title: input.title, kind: input.kind, subjectId: first.subjectId, levelId: first.levelId, questionIds: input.questions.map((question) => question.id) }),
      headers: { "X-Idempotency-Key": key("create") },
      method: "POST",
    });
    quizId = created.quizId;
  }
  const draft = createQuizDraftFromBankQuestions(input.questions, { kind: input.kind, timeLimitMinutes: input.timeLimitMinutes, title: input.title });
  await saveAndPublish(quizId, draft);
  return quizId;
}

export type TeacherExerciseCopyInput = { sourceQuizId: string; title: string; kind: "train" | "test"; subjectId: string; levelId: string };

/**
 * Makes the teacher's own copy of a quiz whose questions live in the quiz itself, not in the bank (the system
 * quizzes built in the editor): same slides and settings, new title. The source is left untouched.
 */
export async function copyQuizAsTeacherExercise(input: TeacherExerciseCopyInput): Promise<string> {
  // The server starts the new quiz from the source's published version; a teacher may not read someone else's draft.
  const created = await apiRequest<{ quizId: string }>(API_ENDPOINTS.lcms.quizzes, {
    ...lms,
    body: JSON.stringify({ title: input.title, kind: input.kind, subjectId: input.subjectId, levelId: input.levelId, questionIds: [], sourceQuizId: input.sourceQuizId }),
    headers: { "X-Idempotency-Key": key("create") },
    method: "POST",
  });
  await saveAndPublish(created.quizId, await createQuizDraftFromQuiz(created.quizId, input.title, "lms"));
  return created.quizId;
}

async function saveAndPublish(quizId: string, draft: { playerTemplate: unknown; settings: unknown; tree: unknown }) {
  const saved = await apiRequest<{ docVersion: number }>(API_ENDPOINTS.lcms.quizDraft(quizId), {
    ...lms,
    body: JSON.stringify({ playerTemplate: draft.playerTemplate, settings: draft.settings, tree: draft.tree }),
    headers: { "X-Idempotency-Key": key("draft") },
    method: "PUT",
  });
  await apiRequest(API_ENDPOINTS.lcms.quizPublish(quizId), {
    ...lms,
    body: JSON.stringify({ docVersion: saved.docVersion }),
    headers: { "X-Idempotency-Key": key("publish") },
    method: "POST",
  });
}

export async function deleteTeacherExercise(quizId: string) {
  await apiRequest(API_ENDPOINTS.lcms.quiz(quizId), { ...lms, method: "DELETE" });
}
