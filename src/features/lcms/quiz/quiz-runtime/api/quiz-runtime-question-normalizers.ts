import {
  booleanValue,
  isRecord,
  keyBlanksById,
  nestedValue,
  normalizeQuestionKind,
  numberValue,
  pairMap,
  stringArray,
  stringValue,
} from "@/features/lcms/quiz/quiz-runtime/api/quiz-runtime-normalization-utils";
import type { Choice, Feedback, HotspotArea, InlineBlank, Question, QuizPackage } from "@/lib/types";

export function normalizeBackendQuestion(
  value: unknown,
  questionIndex: number,
  answerKey: Record<string, Record<string, unknown>>,
  gradingMode: QuizPackage["gradingMode"],
): Question | null {
  if (!isRecord(value)) return null;

  const id = stringValue(value.id ?? value.questionId ?? value.slideId, `question-${questionIndex + 1}`);
  const kind = normalizeQuestionKind(value.kind ?? value.type);
  if (!kind) return null;

  const key = gradingMode === "server-authoritative" ? undefined : answerKey[id];
  const feedback: Feedback = {
    correct: stringValue(nestedValue(value.feedback, "correct"), "Chính xác."),
    incorrect: stringValue(nestedValue(value.feedback, "incorrect"), "Chưa chính xác."),
    partial: stringValue(nestedValue(value.feedback, "partial"), "Đúng một phần."),
  };

  return {
    id,
    kind,
    title: stringValue(value.title ?? value.question, `Câu ${questionIndex + 1}`),
    instructions: Array.isArray(value.instructions)
      ? value.instructions.filter((item): item is string => typeof item === "string").join("\n")
      : stringValue(value.description ?? value.instructions, ""),
    points: numberValue(value.points, 1),
    feedback,
    contentImage: normalizeQuestionImage(value.contentImage ?? value.image),
    choices: normalizeChoices(value.choices ?? value.options, key),
    matching: normalizeList(value.matching),
    sequenceItems: normalizeList(value.sequenceItems),
    inlineBlanks: normalizeInlineBlanks(value.inlineBlanks, key),
    textBlanks: normalizeTextBlanks(value.textBlanks ?? value.blanks, key),
    numericAnswer: normalizeNumericAnswer(value.numericAnswer, key),
    wordBank: normalizeList(value.wordBank),
    wordSlots: normalizeWordSlots(value.wordSlots, key),
    dropTargets: normalizeList(value.dropTargets),
    dragDropItems: normalizeDragDropItems(value.dragDropItems, key),
    likertRows: normalizeList(value.likertRows),
    likertScale: normalizeList(value.likertScale),
    essayRubric: normalizeList(value.essayRubric),
    hotspotImage: isRecord(value.hotspotImage) ? value.hotspotImage as Question["hotspotImage"] : undefined,
    hotspotAreas: normalizeHotspotAreas(value.hotspotAreas ?? value.regions, key),
  };
}

function normalizeChoices(value: unknown, key?: Record<string, unknown>): Choice[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const correctIds = new Set([
    ...stringArray(key?.correctChoiceIds),
    ...stringArray(key?.correctChoiceId),
  ]);
  return value.map((item, index) => {
    const record = isRecord(item) ? item : {};
    const id = stringValue(record.id, `choice-${index + 1}`);
    return {
      id,
      label: stringValue(record.label ?? record.text, `Đáp án ${index + 1}`),
      correct: booleanValue(record.correct ?? record.isCorrect, correctIds.has(id)),
    };
  });
}

function normalizeTextBlanks(value: unknown, key?: Record<string, unknown>): Question["textBlanks"] {
  const keyBlanks = keyBlanksById(key);
  if (!Array.isArray(value) && keyBlanks.size === 0) return undefined;
  const blanks = Array.isArray(value) ? value : Array.from(keyBlanks.keys()).map((id) => ({ id }));
  return blanks.map((item, index) => {
    const record = isRecord(item) ? item : {};
    const id = stringValue(record.id, `blank-${index + 1}`);
    return {
      id,
      label: stringValue(record.label ?? record.statement, ""),
      correctAnswers: stringArray(record.correctAnswers ?? keyBlanks.get(id)),
      placeholder: stringValue(record.placeholder, ""),
      prefix: stringValue(record.prefix, ""),
      suffix: stringValue(record.suffix, ""),
    };
  });
}

function normalizeInlineBlanks(value: unknown, key?: Record<string, unknown>): InlineBlank[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const keyBlanks = keyBlanksById(key);
  return value.map((item, index) => {
    const record = isRecord(item) ? item : {};
    const id = stringValue(record.id, `inline-${index + 1}`);
    return {
      id,
      statement: stringValue(record.statement, ""),
      options: stringArray(record.options),
      correctOptionId: stringArray(record.correctOptionId ?? keyBlanks.get(id))[0] ?? "",
      selectPosition: record.selectPosition === "before" ? "before" : "after",
    };
  });
}

function normalizeNumericAnswer(value: unknown, key?: Record<string, unknown>): Question["numericAnswer"] {
  const record = isRecord(value) ? value : {};
  const expected = numberValue(record.correctValue ?? key?.value, Number.NaN);
  if (!Number.isFinite(expected)) return undefined;
  return {
    correctValue: expected,
    tolerance: numberValue(record.tolerance ?? key?.tolerance),
    unit: typeof record.unit === "string" ? record.unit : undefined,
  };
}

function normalizeWordSlots(value: unknown, key?: Record<string, unknown>): Question["wordSlots"] {
  const keyBlanks = keyBlanksById(key);
  if (!Array.isArray(value)) return undefined;
  return value.map((item, index) => {
    const record = isRecord(item) ? item : {};
    const id = stringValue(record.id, `slot-${index + 1}`);
    return {
      id,
      label: stringValue(record.label, ""),
      correctWordId: stringArray(record.correctWordId ?? keyBlanks.get(id))[0] ?? "",
    };
  });
}

function normalizeDragDropItems(value: unknown, key?: Record<string, unknown>): Question["dragDropItems"] {
  const targetMap = pairMap(key?.targets);
  if (!Array.isArray(value)) return undefined;
  return value.map((item, index) => {
    const record = isRecord(item) ? item : {};
    const id = stringValue(record.id, `drag-${index + 1}`);
    return {
      id,
      label: stringValue(record.label, ""),
      correctTargetId: stringValue(record.correctTargetId ?? targetMap.get(id), ""),
    };
  });
}

function normalizeHotspotAreas(value: unknown, key?: Record<string, unknown>): HotspotArea[] | undefined {
  const regions = Array.isArray(key?.regions) ? key?.regions : value;
  if (!Array.isArray(regions)) return undefined;
  return regions.map((item, index) => {
    const record = isRecord(item) ? item : {};
    return {
      id: stringValue(record.id, `area-${index + 1}`),
      shape: record.shape === "ellipse" || record.shape === "polygon" ? record.shape : "rect",
      x: numberValue(record.x),
      y: numberValue(record.y),
      width: numberValue(record.width),
      height: numberValue(record.height),
      correct: booleanValue(record.correct, true),
      visible: typeof record.visible === "boolean" ? record.visible : undefined,
    };
  });
}

function normalizeQuestionImage(value: unknown): Question["contentImage"] {
  if (!isRecord(value)) return undefined;
  const url = stringValue(value.url ?? value.src, "");
  if (!url) return undefined;
  return {
    url,
    ...(typeof value.alt === "string" ? { alt: value.alt } : {}),
    ...(Number.isFinite(Number(value.width)) ? { width: Number(value.width) } : {}),
  };
}

function normalizeList<T = never>(value: unknown): T[] | undefined {
  return Array.isArray(value) ? value as T[] : undefined;
}
