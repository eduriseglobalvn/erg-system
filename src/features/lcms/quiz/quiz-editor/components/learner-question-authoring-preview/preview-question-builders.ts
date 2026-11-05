import type { useI18n } from "@/platform/i18n";
import type { Question, QuestionImage } from "@/domain/quiz/types";
import { isHotspotPlaceholder } from "@/features/lcms/quiz/quiz-editor/api/elearning-quiz-to-editor";
import type { QuizEditorChoice, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

export function buildPreviewQuestion(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
): Question | null {
  if (slide.runtimeQuestion) {
    return {
      ...withSlideImages(slide, slide.runtimeQuestion),
      title: slide.title,
      instructions: slide.description ?? slide.runtimeQuestion.instructions,
      contentImage: slide.media
        ? slideContentImage(slide)
        : slide.runtimeQuestion.contentImage,
    };
  }

  return buildLearnerQuestion(slide, t);
}

// Answer images written before runtime questions carried them live only on the slide; show them instead of dropping them.
function withSlideImages(slide: QuizEditorSlide, question: Question): Question {
  const choice = (id: string) => mediaImage(slide.choices?.find((entry) => entry.id === id)?.media);
  const item = (id: string) => slide.dragDropItems?.find((entry) => entry.id === id);
  return {
    ...question,
    ...(question.choices && { choices: question.choices.map((c) => fill(c, "image", choice(c.id))) }),
    ...(question.sequenceItems && { sequenceItems: question.sequenceItems.map((s) => fill(s, "image", choice(s.id))) }),
    ...(question.dragDropItems && { dragDropItems: question.dragDropItems.map((d) => fill(d, "image", mediaImage(item(d.id)?.media))) }),
    ...(question.matching && {
      matching: question.matching.map((pair) =>
        fill(fill(pair, "promptImage", mediaImage(item(pair.id)?.targetMedia)), "responseImage", mediaImage(item(pair.id)?.media)),
      ),
    }),
    ...(isHotspotPlaceholder(question.hotspotImage?.url) && { hotspotImage: undefined }),
  };
}

function fill<T extends object>(value: T, key: keyof T & string, image: QuestionImage | undefined): T {
  return value[key] || !image ? value : { ...value, [key]: image };
}

function slideContentImage(slide: QuizEditorSlide) {
  return slide.media?.src && slide.kind !== "hotspot"
    ? { url: slide.media.src, alt: slide.media.alt }
    : undefined;
}

function mediaImage(media: QuizEditorSlide["media"]) {
  return media?.src ? { url: media.src, alt: media.alt } : undefined;
}

function buildLearnerQuestion(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
): Question | null {
  const feedback = buildFeedback(slide, t);
  const points = extractCorrectScore(slide);
  const contentImage = slideContentImage(slide);
  const base = {
    id: slide.id,
    title: slide.title,
    instructions: slide.description,
    points,
    feedback,
    contentImage,
  };

  switch (slide.kind) {
    case "multiple-choice":
      return {
        ...base,
        kind: "single_choice",
        choices: normalizeChoices(slide.choices),
      };
    case "true-false":
      return {
        ...base,
        kind: "true_false",
        choices: normalizeChoices(slide.choices),
      };
    case "multiple-response":
      return {
        ...base,
        kind: "multiple_response",
        choices: normalizeChoices(slide.choices),
      };
    case "matching":
      return {
        ...base,
        kind: "matching",
        matching: buildMatchingPairs(slide, t),
      };
    case "drag-and-drop":
      return {
        ...base,
        kind: "drag_drop",
        dropTargets: buildDragDropTargets(slide),
        dragDropItems: buildDragDropItems(slide),
      };
    case "sequence":
      return {
        ...base,
        kind: "sequence",
        sequenceItems: normalizeChoices(slide.choices).map((choice) => ({
          id: choice.id,
          label: choice.label,
          ...(choice.image && { image: choice.image }),
        })),
      };
    case "fill-in-the-blanks":
      return {
        ...base,
        kind: "fill_blank",
        textBlanks: buildTextBlanks(slide),
      };
    case "select-from-lists":
      return {
        ...base,
        kind: "select_from_lists",
        inlineBlanks: buildInlineBlanks(slide),
      };
    case "drag-the-words":
      return {
        ...base,
        kind: "drag_words",
        wordBank: buildWordBank(slide),
        wordSlots: buildWordSlots(slide),
      };
    case "short-answer":
      return {
        ...base,
        kind: "short_answer",
        textBlanks: buildTextBlanks(slide),
      };
    case "numeric":
      return {
        ...base,
        kind: "numeric",
        numericAnswer: buildNumericAnswer(slide),
      };
    case "essay":
      return {
        ...base,
        kind: "essay",
        essayRubric: buildEssayRubric(slide),
      };
    case "likert-scale":
      return {
        ...base,
        kind: "likert_scale",
        likertRows: buildLikertRows(slide),
        likertScale: [],
      };
    case "hotspot":
      return {
        ...base,
        kind: "hotspot",
        // No image yet means no hotspot image: a placeholder must never be saved.
        ...(slide.media?.src && !isHotspotPlaceholder(slide.media.src) && {
          hotspotImage: { url: slide.media.src, width: 1200, height: 675 },
        }),
        hotspotAreas: slide.hotspotAreas ?? [],
      };
    default:
      return null;
  }
}

// Builders read only what the teacher wrote: an empty slide gives empty answers, never sample content.
export function normalizeChoices(choices: QuizEditorChoice[] | undefined) {
  return (choices ?? []).map((choice, index) => ({
    id: choice.id || `choice-${index + 1}`,
    label: choice.label,
    correct: choice.correct,
    image: mediaImage(choice.media),
  }));
}

const written = (slide: QuizEditorSlide) => normalizeChoices(slide.choices).filter((choice) => choice.label.trim());

function buildTextBlanks(slide: QuizEditorSlide) {
  return written(slide)
    .filter((choice) => slide.kind !== "short-answer" || choice.correct)
    .map((choice, index) => ({
      id: choice.id || `${slide.id}-blank-${index + 1}`,
      label: slide.kind === "fill-in-the-blanks" ? `Blank ${index + 1}` : "Answer",
      placeholder: "......",
      correctAnswers: [choice.label],
    }));
}

function buildInlineBlanks(slide: QuizEditorSlide) {
  return written(slide).map((choice) => ({
    id: choice.id,
    statement: choice.label,
    options: ["yes", "no"],
    correctOptionId: choice.correct ? "yes" : "no",
    selectPosition: "after" as const,
  }));
}

function buildWordBank(slide: QuizEditorSlide) {
  return written(slide).map((choice, index) => ({
    id: choice.id || `${slide.id}-word-${index + 1}`,
    label: choice.label,
  }));
}

function buildWordSlots(slide: QuizEditorSlide) {
  return buildWordBank(slide).slice(0, 2).map((word, index) => ({
    id: `${slide.id}-slot-${index + 1}`,
    label: index === 0 ? "Fill the blank with" : "then choose",
    correctWordId: word.id,
  }));
}

export function buildNumericAnswer(slide: QuizEditorSlide) {
  const rawValue = slide.choices?.find((choice) => choice.correct)?.label ?? slide.choices?.[0]?.label ?? "";
  const parsedValue = Number.parseFloat(rawValue.replace(/[^\d.-]/g, ""));

  return Number.isFinite(parsedValue) ? { correctValue: parsedValue, tolerance: 0, unit: "" } : undefined;
}

function buildEssayRubric(slide: QuizEditorSlide) {
  return written(slide).map((choice, index) => ({
    id: choice.id || `${slide.id}-rubric-${index + 1}`,
    label: choice.label,
    points: index === 0 ? Math.max(1, extractCorrectScore(slide)) : 1,
  }));
}

function buildLikertRows(slide: QuizEditorSlide) {
  return written(slide).map((choice, index) => ({
    id: choice.id || `${slide.id}-likert-row-${index + 1}`,
    label: choice.label,
  }));
}

export function buildMatchingPairs(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  if (slide.dragDropItems?.length) {
    return slide.dragDropItems.map((item, index) => ({
      id: item.id || `match-${index + 1}`,
      prompt: item.target ?? "",
      response: item.label ?? "",
      promptImage: mediaImage(item.targetMedia),
      responseImage: mediaImage(item.media),
    }));
  }

  return normalizeChoices(slide.choices).map((choice, index) => ({
    id: choice.id || `match-${index + 1}`,
    prompt: choice.label,
    response: choice.correct ? t("common.correct") : t("common.incorrect"),
  }));
}

export function buildDragDropTargets(slide: QuizEditorSlide) {
  const targetLabels = Array.from(
    new Set((slide.dragDropItems ?? []).map((item) => item.target?.trim() ?? "").filter(Boolean)),
  );

  return targetLabels.map((label, index) => ({
    id: createDragDropTargetId(label, index),
    label,
  }));
}

export function buildDragDropItems(slide: QuizEditorSlide) {
  const targetIdByLabel = new Map(buildDragDropTargets(slide).map((target) => [target.label, target.id]));

  return (slide.dragDropItems ?? []).map((item, index) => ({
    id: item.id || `drag-item-${index + 1}`,
    label: item.label ?? "",
    // An item without a group stays unassigned rather than joining an invented one.
    correctTargetId: targetIdByLabel.get(item.target?.trim() ?? "") ?? "",
    image: mediaImage(item.media),
  }));
}

export function createDragDropTargetId(label: string, index: number) {
  const slug = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `drop-target-${slug || index + 1}`;
}

export function buildFeedback(slide: QuizEditorSlide, t: ReturnType<typeof useI18n>["t"]) {
  const correct =
    slide.feedbackRows?.find((row) => row.kind === "correct")?.feedback ||
    t("quiz.defaultCorrectFeedback");
  const incorrect =
    slide.feedbackRows?.find((row) => row.kind === "incorrect")?.feedback ||
    t("quiz.defaultIncorrectFeedback");

  return {
    correct,
    incorrect,
    partial: incorrect,
  };
}

export function extractCorrectScore(slide: QuizEditorSlide) {
  return (
    slide.feedbackRows?.find((row) => row.kind === "correct")?.score ??
    slide.feedbackRows?.find((row) => row.kind === "answered")?.score ??
    0
  );
}
