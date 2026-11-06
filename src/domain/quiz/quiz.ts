import type {
  AnswerPayload,
  AnswerResult,
  HotspotArea,
  HotspotPoint,
  MatchingPair,
  Question,
  Quiz,
} from "@/domain/quiz/types";
import { shuffleAway } from "@/domain/quiz/shuffle-away";

export function getAllQuestions(quiz: Quiz): Question[] {
  return quiz.sections.flatMap((section) => section.questions);
}

export function getQuestionById(quiz: Quiz, questionId: string): Question | undefined {
  return getAllQuestions(quiz).find((question) => question.id === questionId);
}

export function scoreQuestion(question: Question, answer: AnswerPayload): AnswerResult {
  const result: AnswerResult = {
    questionId: question.id,
    correct: false,
    partiallyRight: false,
    awardedPoints: 0,
    maxPoints: question.points,
    message: question.feedback.incorrect,
  };

  switch (question.kind) {
    case "single_choice": {
      const correctIds = question.choices?.filter((choice) => choice.correct).map((choice) => choice.id) ?? [];
      result.correctChoiceIds = correctIds;
      if (answer.choiceId && correctIds[0] === answer.choiceId) {
        result.correct = true;
        result.awardedPoints = question.points;
        result.message = question.feedback.correct;
      }
      return result;
    }
    case "true_false": {
      const correctIds = question.choices?.filter((choice) => choice.correct).map((choice) => choice.id) ?? [];
      result.correctChoiceIds = correctIds;
      if (answer.choiceId && correctIds[0] === answer.choiceId) {
        result.correct = true;
        result.awardedPoints = question.points;
        result.message = question.feedback.correct;
      }
      return result;
    }
    case "multiple_response": {
      const correctIds = question.choices?.filter((choice) => choice.correct).map((choice) => choice.id) ?? [];
      const chosenIds = [...new Set(answer.choiceIds ?? [])].sort();
      const expectedIds = [...correctIds].sort();
      result.correctChoiceIds = expectedIds;
      if (JSON.stringify(chosenIds) === JSON.stringify(expectedIds)) {
        result.correct = true;
        result.awardedPoints = question.points;
        result.message = question.feedback.correct;
        return result;
      }

      const matched = chosenIds.filter((choiceId) => expectedIds.includes(choiceId)).length;
      // Wrong picks cancel right ones, otherwise ticking every option scores full marks.
      const net = matched - (chosenIds.length - matched);
      if (net > 0 && expectedIds.length > 0) {
        result.partiallyRight = true;
        result.awardedPoints = Math.floor((question.points * net) / expectedIds.length);
        result.message = question.feedback.partial;
      }
      return result;
    }
    case "matching": {
      const matchingKey = getMatchingKey(question);
      // Unknown key (secured body, server-graded) => no local correctness: "" never counts as a hit.
      const correctOrder = (question.matching ?? []).map((pair) => matchingKey?.[pair.id] ?? "");
      result.correctMatchingOrder = correctOrder;
      const currentOrder = matchingRowOrder(question, answer);
      if (matchingKey && correctOrder.length > 0 && JSON.stringify(currentOrder) === JSON.stringify(correctOrder)) {
        result.correct = true;
        result.awardedPoints = question.points;
        result.message = question.feedback.correct;
        return result;
      }
      const matched = currentOrder.filter((item, index) => item !== "" && item === correctOrder[index]).length;
      if (matched > 0 && correctOrder.length > 0) {
        result.partiallyRight = true;
        result.awardedPoints = Math.floor((question.points * matched) / correctOrder.length);
        result.message = question.feedback.partial;
      }
      return result;
    }
    case "sequence": {
      const correctOrder = getSequenceCorrectOrder(question);
      const currentOrder = answer.sequenceOrder ?? [];
      result.correctSequenceOrder = correctOrder;
      if (correctOrder.length > 0 && JSON.stringify(currentOrder) === JSON.stringify(correctOrder)) {
        result.correct = true;
        result.awardedPoints = question.points;
        result.message = question.feedback.correct;
        return result;
      }
      const matched = currentOrder.filter((item, index) => item === correctOrder[index]).length;
      if (matched > 0 && correctOrder.length > 0) {
        result.partiallyRight = true;
        result.awardedPoints = Math.floor((question.points * matched) / correctOrder.length);
        result.message = question.feedback.partial;
      }
      return result;
    }
    case "inline_choice":
    case "select_from_lists": {
      const correctInlineSelections = Object.fromEntries(
        (question.inlineBlanks ?? []).map((blank) => [blank.id, blank.correctOptionId]),
      );
      result.correctInlineSelections = correctInlineSelections;
      const matched = (question.inlineBlanks ?? []).filter(
        (blank) => answer.inlineSelections?.[blank.id] === blank.correctOptionId,
      ).length;

      if (matched > 0 && matched === (question.inlineBlanks?.length ?? 0)) {
        result.correct = true;
        result.awardedPoints = question.points;
        result.message = question.feedback.correct;
        return result;
      }
      if (matched > 0 && (question.inlineBlanks?.length ?? 0) > 0) {
        result.partiallyRight = true;
        result.awardedPoints = Math.floor((question.points * matched) / (question.inlineBlanks?.length ?? 1));
        result.message = question.feedback.partial;
      }
      return result;
    }
    case "short_answer":
    case "fill_blank": {
      const correctTextResponses = Object.fromEntries(
        (question.textBlanks ?? []).map((blank) => [blank.id, blank.correctAnswers[0] ?? ""]),
      );
      result.correctTextResponses = correctTextResponses;

      const blanks = question.textBlanks ?? [];
      const matched = blanks.filter((blank) =>
        isTextAnswerCorrect(answer.textResponses?.[blank.id] ?? "", blank.correctAnswers),
      ).length;

      if (matched === blanks.length && blanks.length > 0) {
        result.correct = true;
        result.awardedPoints = question.points;
        result.message = question.feedback.correct;
        return result;
      }

      if (matched > 0 && blanks.length > 0) {
        result.partiallyRight = true;
        result.awardedPoints = Math.floor((question.points * matched) / blanks.length);
        result.message = question.feedback.partial;
      }
      return result;
    }
    case "numeric": {
      // Stored data may hold null or a non-finite value: nothing can be graded against it.
      const stored = question.numericAnswer?.correctValue;
      const expected = typeof stored === "number" && Number.isFinite(stored) ? stored : undefined;
      const tolerance = question.numericAnswer?.tolerance ?? 0;
      const rawValue = (answer.numericValue ?? "").trim().replace(",", ".");
      const actual = rawValue === "" ? Number.NaN : Number(rawValue);
      result.correctNumericValue =
        expected === undefined ? undefined : `${expected}${question.numericAnswer?.unit ? ` ${question.numericAnswer.unit}` : ""}`;

      if (expected !== undefined && Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance + 1e-9) {
        result.correct = true;
        result.awardedPoints = question.points;
        result.message = question.feedback.correct;
      }
      return result;
    }
    case "drag_words": {
      const correctDragWordPlacements = Object.fromEntries(
        (question.wordSlots ?? []).map((slot) => [slot.id, slot.correctWordId]),
      );
      result.correctDragWordPlacements = correctDragWordPlacements;
      const slots = question.wordSlots ?? [];
      const matched = slots.filter((slot) => answer.dragWordPlacements?.[slot.id] === slot.correctWordId).length;

      if (matched === slots.length && slots.length > 0) {
        result.correct = true;
        result.awardedPoints = question.points;
        result.message = question.feedback.correct;
        return result;
      }

      if (matched > 0 && slots.length > 0) {
        result.partiallyRight = true;
        result.awardedPoints = Math.floor((question.points * matched) / slots.length);
        result.message = question.feedback.partial;
      }
      return result;
    }
    case "drag_drop": {
      const correctDragDropPlacements = Object.fromEntries(
        (question.dragDropItems ?? []).map((item) => [item.id, item.correctTargetId]),
      );
      result.correctDragDropPlacements = correctDragDropPlacements;
      const items = question.dragDropItems ?? [];
      const matched = items.filter((item) => answer.dragDropPlacements?.[item.id] === item.correctTargetId).length;

      if (matched === items.length && items.length > 0) {
        result.correct = true;
        result.awardedPoints = question.points;
        result.message = question.feedback.correct;
        return result;
      }

      if (matched > 0 && items.length > 0) {
        result.partiallyRight = true;
        result.awardedPoints = Math.floor((question.points * matched) / items.length);
        result.message = question.feedback.partial;
      }
      return result;
    }
    case "likert_scale": {
      if ((question.likertRows ?? []).every((row) => Boolean(answer.likertResponses?.[row.id]))) {
        result.correct = true;
        result.awardedPoints = question.points;
        result.message = question.feedback.correct;
      }
      return result;
    }
    case "essay": {
      // Essays are graded by a teacher (server marks them for manual review); never award points locally.
      if ((answer.essayText ?? "").trim().length > 0) {
        result.pendingReview = true;
        result.message = "Bài tự luận sẽ được giáo viên chấm.";
      }
      return result;
    }
    case "hotspot": {
      const point = answer.hotspotPoint;
      if (point && question.hotspotAreas?.some((area) => area.correct && pointInArea(point, area))) {
        result.correct = true;
        result.awardedPoints = question.points;
        result.message = question.feedback.correct;
      }
      return result;
    }
    default:
      return result;
  }
}

export function isAnswerComplete(question: Question, answer?: AnswerPayload | null): boolean {
  if (!answer) {
    return false;
  }

  switch (question.kind) {
    case "single_choice":
    case "true_false":
      return Boolean(answer.choiceId);
    case "multiple_response":
      return (answer.choiceIds?.length ?? 0) > 0;
    case "matching":
      return (
        (question.matching ?? []).every((pair) => Boolean(answer.matchingAssignments?.[pair.id])) ||
        // Old answers carry no connection state: a non-empty order still counts as answered.
        (Array.isArray(answer.matchingConnectedRows)
          ? answer.matchingConnectedRows.length > 0
          : (answer.matchingOrder?.length ?? 0) > 0)
      );
    case "sequence":
      return (answer.sequenceOrder?.length ?? 0) > 0;
    case "inline_choice":
    case "select_from_lists":
      return (question.inlineBlanks ?? []).every((blank) => Boolean(answer.inlineSelections?.[blank.id]));
    case "short_answer":
    case "fill_blank":
      return (question.textBlanks ?? []).every((blank) => Boolean(answer.textResponses?.[blank.id]?.trim()));
    case "numeric":
      return Boolean(answer.numericValue?.trim());
    case "drag_words":
      return (question.wordSlots ?? []).every((slot) => Boolean(answer.dragWordPlacements?.[slot.id]));
    case "drag_drop":
      return (question.dragDropItems ?? []).every((item) => Boolean(answer.dragDropPlacements?.[item.id]));
    case "likert_scale":
      return (question.likertRows ?? []).every((row) => Boolean(answer.likertResponses?.[row.id]));
    case "essay":
      return Boolean(answer.essayText?.trim());
    case "hotspot":
      return Boolean(answer.hotspotPoint);
    default:
      return false;
  }
}

export function normalizeAnswerForSubmission(question: Question, answer?: AnswerPayload | null): AnswerPayload {
  const safeAnswer = answer ?? {};

  if (question.kind === "matching") {
    if (safeAnswer.matchingOrder?.length) {
      // Server prefers matchingAssignments {promptId: responseId}; matchingOrder kept for older servers.
      const order = matchingRowOrder(question, safeAnswer);
      return {
        ...safeAnswer,
        matchingAssignments: Object.fromEntries(
          (question.matching ?? []).flatMap((pair, index) => (order[index] ? [[pair.id, order[index]]] : [])),
        ),
      };
    }

    if (safeAnswer.matchingAssignments) {
      return {
        ...safeAnswer,
        matchingOrder: normalizeMatchingOrder(question.matching ?? [], safeAnswer),
      };
    }
  }

  return safeAnswer;
}

function pointInArea(point: HotspotPoint, area: HotspotArea): boolean {
  if (area.shape === "ellipse") {
    const radiusX = area.width / 2;
    const radiusY = area.height / 2;
    if (radiusX <= 0 || radiusY <= 0) return false;

    const centerX = area.x + radiusX;
    const centerY = area.y + radiusY;
    const normalizedX = (point.x - centerX) / radiusX;
    const normalizedY = (point.y - centerY) / radiusY;

    return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
  }

  return (
    point.x >= area.x &&
    point.x <= area.x + area.width &&
    point.y >= area.y &&
    point.y <= area.y + area.height
  );
}

export function createInitialAnswer(question: Question): AnswerPayload {
  switch (question.kind) {
    case "multiple_response":
      return { choiceIds: [] };
    case "matching": {
      // Deterministic per question id: this runs on every render until the first answer.
      const pairs = question.matching ?? [];
      const key = question.matchingKey;
      const responseIds = question.matchingResponses?.map((response) => response.id);
      const pairIds = pairs.map((pair) => pair.id);
      return {
        matchingOrder: !responseIds
          ? shuffleAway(pairIds, pairIds, question.id)
          : key
            ? shuffleAway(responseIds, pairs.map((pair) => key[pair.id] ?? ""), question.id)
            : responseIds, // keyless secured body: the server already shuffled it away from the key
        matchingConnectedRows: [],
      };
    }
    case "sequence": {
      const itemIds = (question.sequenceItems ?? []).map((item) => item.id);
      const correct = getSequenceCorrectOrder(question);
      return { sequenceOrder: correct.length > 0 ? shuffleAway(itemIds, correct, question.id) : itemIds };
    }
    case "inline_choice":
    case "select_from_lists":
      return { inlineSelections: {} };
    case "short_answer":
    case "fill_blank":
      return { textResponses: {} };
    case "numeric":
      return { numericValue: "" };
    case "drag_words":
      return { dragWordPlacements: {} };
    case "drag_drop":
      return { dragDropPlacements: {} };
    case "likert_scale":
      return { likertResponses: {} };
    case "essay":
      return { essayText: "" };
    default:
      return {};
  }
}

function isTextAnswerCorrect(answer: string, acceptedAnswers: string[]) {
  const normalizedAnswer = normalizeTextAnswer(answer);

  return acceptedAnswers.some((accepted) => normalizeTextAnswer(accepted) === normalizedAnswer);
}

function normalizeTextAnswer(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/** promptId -> correct responseId; undefined when unknown (new shape without a key). Old shape: id equality. */
/**
 * True when scoreQuestion can really grade this question here: the answer key is in the package.
 * Server-authoritative packages strip keys (no correct flags, sequenceCorrectOrder [], no matchingKey...).
 */
export function hasAnswerKey(question: Question): boolean {
  const every = <T>(items: T[] = [], keyed: (item: T) => boolean) => items.length > 0 && items.every(keyed);
  switch (question.kind) {
    case "single_choice":
    case "true_false":
    case "multiple_response":
      return Boolean(question.choices?.some((choice) => choice.correct));
    case "matching":
      return (question.matching?.length ?? 0) > 0 && getMatchingKey(question) !== undefined;
    case "sequence":
      return getSequenceCorrectOrder(question).length > 0;
    case "inline_choice":
    case "select_from_lists":
      return every(question.inlineBlanks, (blank) => Boolean(blank.correctOptionId));
    case "short_answer":
    case "fill_blank":
      return every(question.textBlanks, (blank) => blank.correctAnswers.length > 0);
    case "numeric":
      return Number.isFinite(question.numericAnswer?.correctValue);
    case "drag_words":
      return every(question.wordSlots, (slot) => Boolean(slot.correctWordId));
    case "drag_drop":
      return every(question.dragDropItems, (item) => Boolean(item.correctTargetId));
    case "hotspot":
      return Boolean(question.hotspotAreas?.some((area) => area.correct));
    default:
      // likert (any full answer counts) and essay (teacher-graded) need no key.
      return true;
  }
}

/** Per-question correctness (review, Luyện lại, Sai/Chưa làm counts) is only shown when this holds. */
export function canGradeLocally(questions: Question[]): boolean {
  return questions.length > 0 && questions.every(hasAnswerKey);
}

export function getMatchingKey(question: Question): Record<string, string> | undefined {
  if (question.matchingKey) return question.matchingKey;
  if (question.matchingResponses) return undefined;
  return Object.fromEntries((question.matching ?? []).map((pair) => [pair.id, pair.id]));
}

/** Correct item ids in order. [] = unknown (server-graded); the received item order is only trusted for old-shape quizzes. */
export function getSequenceCorrectOrder(question: Question): string[] {
  return question.sequenceCorrectOrder ?? question.sequenceItems?.map((item) => item.id) ?? [];
}

/** Response id per row; "" for a row the learner has not connected (only when the answer carries matchingConnectedRows). */
export function matchingRowOrder(question: Question, answer: AnswerPayload): string[] {
  const pairs = question.matching ?? [];
  const order = normalizeMatchingOrder(pairs, answer);
  const connected = answer.matchingConnectedRows;
  if (!Array.isArray(connected)) return order;
  return order.map((id, index) => (connected.includes(pairs[index]?.id ?? "") ? id : ""));
}

export function normalizeMatchingOrder(pairs: MatchingPair[], answer: AnswerPayload): string[] {
  if (answer.matchingOrder && answer.matchingOrder.length) {
    return answer.matchingOrder;
  }

  if (!answer.matchingAssignments) {
    return [];
  }

  return pairs.map((pair) => answer.matchingAssignments?.[pair.id] ?? "");
}
