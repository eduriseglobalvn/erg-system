import type { useI18n } from "@/platform/i18n";
import type { Question } from "@/domain/quiz/types";
import type { QuizEditorChoice, QuizEditorSlide } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

const hotspotPlaceholderImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 675'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23eff6ff'/%3E%3Cstop offset='1' stop-color='%23dbeafe'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='675' fill='url(%23g)'/%3E%3Ccircle cx='880' cy='250' r='130' fill='%23bfdbfe'/%3E%3Crect x='210' y='200' width='520' height='270' rx='32' fill='%23ffffff' stroke='%2393c5fd' stroke-width='8'/%3E%3Cpath d='M300 410l120-120 98 90 92-72 90 102z' fill='%2393c5fd'/%3E%3Ccircle cx='360' cy='275' r='36' fill='%23f97316'/%3E%3C/svg%3E";

export function buildPreviewQuestion(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
): Question | null {
  if (slide.runtimeQuestion) {
    return {
      ...slide.runtimeQuestion,
      title: slide.title,
      instructions: slide.description ?? slide.runtimeQuestion.instructions,
      contentImage: slide.media
        ? slideContentImage(slide)
        : slide.runtimeQuestion.contentImage,
    };
  }

  return buildLearnerQuestion(slide, t);
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
    case "true-false":
      return {
        ...base,
        kind: "single_choice",
        choices: normalizeChoices(slide.choices, t),
      };
    case "multiple-response":
      return {
        ...base,
        kind: "multiple_response",
        choices: normalizeChoices(slide.choices, t),
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
        dragDropItems: buildDragDropItems(slide, t),
      };
    case "sequence":
      return {
        ...base,
        kind: "sequence",
        sequenceItems: normalizeChoices(slide.choices, t).map((choice) => ({
          id: choice.id,
          label: choice.label,
        })),
      };
    case "fill-in-the-blanks":
      return {
        ...base,
        kind: "fill_blank",
        textBlanks: buildTextBlanks(slide, t),
      };
    case "select-from-lists":
      return {
        ...base,
        kind: "select_from_lists",
        inlineBlanks: buildInlineBlanks(slide, t),
      };
    case "drag-the-words":
      return {
        ...base,
        kind: "drag_words",
        wordBank: buildWordBank(slide, t),
        wordSlots: buildWordSlots(slide, t),
      };
    case "short-answer":
      return {
        ...base,
        kind: "short_answer",
        textBlanks: buildTextBlanks(slide, t),
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
        essayRubric: buildEssayRubric(slide, t),
      };
    case "likert-scale":
      return {
        ...base,
        kind: "likert_scale",
        likertRows: buildLikertRows(slide, t),
        likertScale: buildLikertScale(),
      };
    case "hotspot":
      return {
        ...base,
        kind: "hotspot",
        hotspotImage: {
          url: slide.media?.src ?? hotspotPlaceholderImage,
          width: 1200,
          height: 675,
        },
        hotspotAreas: slide.hotspotAreas?.length
          ? slide.hotspotAreas
          : [
              {
                id: `${slide.id}-hotspot-1`,
                shape: "rect",
                x: 0.36,
                y: 0.3,
                width: 0.28,
                height: 0.28,
                correct: true,
              },
            ],
      };
    default:
      return null;
  }
}

export function normalizeChoices(
  choices: QuizEditorChoice[] | undefined,
  t: ReturnType<typeof useI18n>["t"],
) {
  const source: QuizEditorChoice[] = choices?.length
    ? choices
    : [
        { id: "choice-a", label: `${t("common.option")} 1`, correct: true },
        { id: "choice-b", label: `${t("common.option")} 2`, correct: false },
      ];

  return source.map((choice, index) => ({
    id: choice.id || `choice-${index + 1}`,
    label: choices?.length ? choice.label : `${t("common.option")} ${index + 1}`,
    correct: choice.correct,
    image: mediaImage(choice.media),
  }));
}

function buildTextBlanks(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  return normalizeChoices(slide.choices, t)
    .filter((choice) => slide.kind !== "short-answer" || choice.correct)
    .map((choice, index) => ({
      id: choice.id || `${slide.id}-blank-${index + 1}`,
      label: slide.kind === "fill-in-the-blanks" ? `Blank ${index + 1}` : "Answer",
      placeholder: "......",
      correctAnswers: [choice.label || `${t("common.option")} ${index + 1}`],
    }));
}

function buildInlineBlanks(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  return normalizeChoices(slide.choices, t).map((choice, index) => ({
    id: choice.id,
    statement: choice.label || `${t("common.option")} ${index + 1}`,
    options: ["yes", "no"],
    correctOptionId: choice.correct ? "yes" : "no",
    selectPosition: "after" as const,
  }));
}

function buildWordBank(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  const choices = normalizeChoices(slide.choices, t);
  return choices.map((choice, index) => ({
    id: choice.id || `${slide.id}-word-${index + 1}`,
    label: choice.label || `${t("common.option")} ${index + 1}`,
  }));
}

function buildWordSlots(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  const bank = buildWordBank(slide, t);
  const source = bank.length ? bank : [{ id: `${slide.id}-word-1`, label: t("common.option") }];

  return source.slice(0, Math.max(1, Math.min(2, source.length))).map((word, index) => ({
    id: `${slide.id}-slot-${index + 1}`,
    label: index === 0 ? "Fill the blank with" : "then choose",
    correctWordId: word.id,
  }));
}

export function buildNumericAnswer(slide: QuizEditorSlide) {
  const rawValue = slide.choices?.find((choice) => choice.correct)?.label ?? slide.choices?.[0]?.label ?? "0";
  const parsedValue = Number.parseFloat(rawValue.replace(/[^\d.-]/g, ""));

  return {
    correctValue: Number.isFinite(parsedValue) ? parsedValue : 0,
    tolerance: 0,
    unit: "",
  };
}

function buildEssayRubric(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  const choices = normalizeChoices(slide.choices, t);
  return choices.map((choice, index) => ({
    id: choice.id || `${slide.id}-rubric-${index + 1}`,
    label: choice.label || `${t("common.option")} ${index + 1}`,
    points: index === 0 ? Math.max(1, extractCorrectScore(slide)) : 1,
  }));
}

function buildLikertRows(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  return normalizeChoices(slide.choices, t).map((choice, index) => ({
    id: choice.id || `${slide.id}-likert-row-${index + 1}`,
    label: choice.label || `${t("common.option")} ${index + 1}`,
  }));
}

function buildLikertScale() {
  return [
    { id: "scale-1", label: "Low", value: 1 },
    { id: "scale-2", label: "Medium", value: 2 },
    { id: "scale-3", label: "High", value: 3 },
  ];
}

export function buildMatchingPairs(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  if (slide.dragDropItems?.length) {
    return slide.dragDropItems.map((item, index) => ({
      id: item.id || `match-${index + 1}`,
      prompt: item.target || t("common.dropTarget"),
      response: item.label || t("common.dragItem"),
      promptImage: item.targetMedia?.src
        ? {
            url: item.targetMedia.src,
            alt: item.targetMedia.alt || item.target,
          }
        : undefined,
      responseImage: item.media?.src
        ? {
            url: item.media.src,
            alt: item.media.alt || item.label,
          }
        : undefined,
    }));
  }

  return normalizeChoices(slide.choices, t).map((choice, index) => ({
    id: choice.id || `match-${index + 1}`,
    prompt: choice.label,
    response: choice.correct ? t("common.correct") : t("common.incorrect"),
  }));
}

export function buildDragDropTargets(slide: QuizEditorSlide) {
  const targetLabels = Array.from(
    new Set((slide.dragDropItems ?? []).map((item) => normalizeTargetLabel(item.target))),
  );
  const source = targetLabels.length ? targetLabels : ["Vùng thả 1"];

  return source.map((label, index) => ({
    id: createDragDropTargetId(label, index),
    label,
  }));
}

export function buildDragDropItems(
  slide: QuizEditorSlide,
  t: ReturnType<typeof useI18n>["t"],
) {
  const targets = buildDragDropTargets(slide);
  const targetIdByLabel = new Map(targets.map((target) => [target.label, target.id]));
  const source = slide.dragDropItems?.length
    ? slide.dragDropItems
    : [{ id: "drag-item-1", label: t("common.dragItem"), emoji: "", target: targets[0]?.label ?? "Vùng thả 1" }];

  return source.map((item, index) => {
    const targetLabel = normalizeTargetLabel(item.target);
    return {
      id: item.id || `drag-item-${index + 1}`,
      label: item.label || `${t("common.dragItem")} ${index + 1}`,
      correctTargetId: targetIdByLabel.get(targetLabel) ?? targets[0]?.id ?? "drop-target-1",
      image: mediaImage("media" in item ? item.media : undefined),
    };
  });
}

function normalizeTargetLabel(target: string | undefined) {
  return target?.trim() || "Vùng thả 1";
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
