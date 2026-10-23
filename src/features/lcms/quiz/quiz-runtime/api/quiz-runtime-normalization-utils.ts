import type { QuestionKind, Quiz, QuizResultDisplay, Theme } from "@/lib/types";
import type { QuizRuntimePortal } from "@/features/lcms/quiz/quiz-runtime/types/quiz-runtime-types";

export const DEFAULT_QUIZ_RUNTIME_PORTAL: QuizRuntimePortal = "elearning";

export function normalizeQuestionKind(value: unknown): QuestionKind | null {
  const kind = String(value ?? "").trim();
  const map: Record<string, QuestionKind> = {
    "multiple-choice": "single_choice",
    "multiple-response": "multiple_response",
    "true-false": "true_false",
    "short-answer": "short_answer",
    numeric: "numeric",
    sequence: "sequence",
    matching: "matching",
    "fill-in-the-blanks": "fill_blank",
    "select-from-lists": "select_from_lists",
    "drag-the-words": "drag_words",
    hotspot: "hotspot",
    "drag-and-drop": "drag_drop",
    "likert-scale": "likert_scale",
    essay: "essay",
  };
  const normalized = map[kind] ?? kind;
  return [
    "single_choice", "multiple_response", "true_false", "short_answer", "numeric", "sequence",
    "matching", "fill_blank", "inline_choice", "select_from_lists", "drag_words", "hotspot",
    "drag_drop", "likert_scale", "essay",
  ].includes(normalized) ? normalized as QuestionKind : null;
}

export function normalizeQuizMode(value: unknown): Quiz["settings"]["mode"] {
  const mode = String(value ?? "").toLowerCase();
  return mode === "test" || mode === "testing" ? "testing" : "training";
}

export function normalizeTheme(value: unknown): Theme {
  const record = isRecord(value) ? value : {};
  return {
    pageBackground: stringValue(record.pageBackground, "#f8fafc"),
    playerBackground: stringValue(record.playerBackground, "#ffffff"),
    canvasBorder: stringValue(record.canvasBorder, "#000088"),
    headerBackground: stringValue(record.headerBackground, "#000088"),
    headerText: stringValue(record.headerText, "#ffffff"),
    accentStart: stringValue(record.accentStart, "#000088"),
    accentEnd: stringValue(record.accentEnd, "#e82828"),
    optionText: stringValue(record.optionText, "#172033"),
    optionSelectedBackground: stringValue(record.optionSelectedBackground, "#eef2ff"),
    inputBackground: stringValue(record.inputBackground, "#ffffff"),
    sidebarActiveBackground: stringValue(record.sidebarActiveBackground, "#eef2ff"),
    sidebarActiveText: stringValue(record.sidebarActiveText, "#000088"),
  };
}

export function normalizeResult(value: unknown): QuizResultDisplay | undefined {
  if (!isRecord(value)) return undefined;
  return value as QuizResultDisplay;
}

export function keyBlanksById(key?: Record<string, unknown>) {
  const result = new Map<string, unknown>();
  const blanks = key?.blanks;
  if (Array.isArray(blanks)) {
    for (const item of blanks) {
      if (isRecord(item) && item.id) result.set(String(item.id), item.answers);
    }
  }
  return result;
}

export function pairMap(value: unknown) {
  const result = new Map<string, string>();
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!isRecord(item)) continue;
      const itemId = stringValue(item.itemId ?? item.promptId ?? item.id, "");
      const targetId = stringValue(item.targetId ?? item.responseId ?? item.value, "");
      if (itemId && targetId) result.set(itemId, targetId);
    }
  }
  return result;
}

export function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item) => item != null).map(String);
  if (value == null) return [];
  return [String(value)];
}

export function nestedValue(holder: unknown, key: string) {
  return isRecord(holder) ? holder[key] : undefined;
}

export function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : value == null ? fallback : String(value);
}

export function numberValue(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function booleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
