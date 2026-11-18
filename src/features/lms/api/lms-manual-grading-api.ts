import type { LmsAssignmentProgressWorkspace } from "@/features/lms/api/lms-assignment-progress-api";
import { apiRequest } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";

/** One answer the teacher grades by hand (an essay), as the server returns it. */
export type ManualReviewItem = {
  questionId: string;
  kind?: string | null;
  prompt: string;
  answer: unknown;
  maxPoints: number;
  awardedPoints: number;
  needsManualGrade: boolean;
};

export type ManualReview = {
  attemptId: string;
  status?: string | null;
  version: number;
  items: ManualReviewItem[];
};

export function loadManualReview(attemptId: string, signal?: AbortSignal) {
  return apiRequest<ManualReview>(API_ENDPOINTS.lms.attemptManualAnswers(attemptId), { signal });
}

export function gradeManualAnswer(attemptId: string, questionId: string, points: number) {
  return apiRequest(API_ENDPOINTS.lms.attemptAnswerGrade(attemptId, questionId), {
    body: JSON.stringify({ points }),
    method: "POST",
  });
}

/** The text a learner typed for an essay; other answer shapes fall back to their JSON. */
export function manualAnswerText(answer: unknown): string {
  if (typeof answer === "string") return answer;
  if (answer && typeof answer === "object") {
    const essay = (answer as { essayText?: unknown }).essayText;
    if (typeof essay === "string") return essay;
    return JSON.stringify(answer);
  }
  return "";
}

const REVIEW_STATES = new Set(["needs_review", "review_required"]);

/**
 * Attempts waiting for a teacher, keyed by every id a progress row may carry for the learner
 * (student id and account id), so rows built from either source find their attempt.
 */
export function reviewAttemptsByStudent(workspace: LmsAssignmentProgressWorkspace | undefined): Map<string, string> {
  const result = new Map<string, string>();
  for (const recipient of workspace?.recipients.items ?? []) {
    // Only the latest hand-in counts (owner decision 17/11), so an older one still waiting is not offered.
    const attempt = recipient.latestAttempt;
    if (!attempt || !REVIEW_STATES.has((attempt.status ?? "").toLowerCase())) continue;
    for (const key of [recipient.id, recipient.authUserId, attempt.studentId]) {
      if (key) result.set(key, attempt.id);
    }
  }
  return result;
}
