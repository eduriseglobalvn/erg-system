import {
  createRuntimeKey,
  localQuizAttemptStore,
  startAttempt,
} from "@/features/lcms/quiz/quiz-runtime";
import { normalizeAnswerForSubmission } from "@/lib/quiz";
import type { AnswerPayload, Question, QuizPackage } from "@/lib/types";

export async function createFreshLocalSession(assignmentId: string, quizPackage: QuizPackage) {
  const localAttemptId = createRuntimeKey("attempt");
  const startKey = createRuntimeKey("start");
  const submitKey = createRuntimeKey("submit");
  const startedAttempt = await startAttempt({
    assignmentId,
    idempotencyKey: startKey,
    localAttemptId,
    packageHash: quizPackage.contentHash,
    packageId: quizPackage.id,
    quizId: quizPackage.quizId,
  });

  return localQuizAttemptStore.createSession({
    assignmentId,
    attemptId: startedAttempt.attemptId,
    packageHash: quizPackage.contentHash,
    quizId: quizPackage.quizId,
    quizVersion: quizPackage.quizVersion,
    submitIdempotencyKey: submitKey,
  });
}

export function buildNormalizedAnswers(questions: Question[], drafts: Record<string, AnswerPayload>) {
  return Object.fromEntries(
    questions.map((question) => [
      question.id,
      normalizeAnswerForSubmission(question, drafts[question.id] ?? {}),
    ]),
  );
}

export function areAnswerPayloadsEqual(left?: AnswerPayload, right?: AnswerPayload) {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.choiceId === right.choiceId &&
    stringArraysEqual(left.choiceIds, right.choiceIds) &&
    stringArraysEqual(left.matchingOrder, right.matchingOrder) &&
    stringArraysEqual(left.matchingConnectedRows, right.matchingConnectedRows) &&
    stringArraysEqual(left.sequenceOrder, right.sequenceOrder) &&
    recordsEqual(left.matchingAssignments, right.matchingAssignments) &&
    recordsEqual(left.inlineSelections, right.inlineSelections) &&
    recordsEqual(left.textResponses, right.textResponses) &&
    recordsEqual(left.dragWordPlacements, right.dragWordPlacements) &&
    recordsEqual(left.dragDropPlacements, right.dragDropPlacements) &&
    recordsEqual(left.likertResponses, right.likertResponses) &&
    left.numericValue === right.numericValue &&
    left.essayText === right.essayText &&
    left.hotspotPoint?.x === right.hotspotPoint?.x &&
    left.hotspotPoint?.y === right.hotspotPoint?.y
  );
}

function stringArraysEqual(left?: string[], right?: string[]) {
  if (left === right) {
    return true;
  }

  if (!left || !right || left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => item === right[index]);
}

function recordsEqual(left?: Record<string, string>, right?: Record<string, string>) {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => left[key] === right[key]);
}

export function formatTimer(totalSeconds: number) {
  const safeSeconds = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function questionLabel(question: Question) {
  switch (question.kind) {
    case "single_choice":
      return "Chọn 1 đáp án";
    case "multiple_response":
      return "Chọn nhiều đáp án";
    case "true_false":
      return "Đúng / Sai";
    case "short_answer":
      return "Trả lời ngắn";
    case "numeric":
      return "Số học";
    case "matching":
      return "Nối cặp";
    case "sequence":
      return "Sắp xếp thứ tự";
    case "fill_blank":
      return "Điền chỗ trống";
    case "inline_choice":
      return "Chọn trong dòng";
    case "select_from_lists":
      return "Chọn từ danh sách";
    case "drag_words":
      return "Kéo từ";
    case "hotspot":
      return "Điểm nóng";
    case "drag_drop":
      return "Kéo và thả";
    case "likert_scale":
      return "Thang Likert";
    case "essay":
      return "Tự luận";
    default:
      return "Câu hỏi";
  }
}
