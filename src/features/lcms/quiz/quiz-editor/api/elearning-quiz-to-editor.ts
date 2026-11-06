import type {
  QuizEditorChoice,
  QuizEditorDragDropItem,
  QuizEditorHotspotArea,
  QuizEditorSlide,
  QuizEditorSlideMedia,
  QuestionType,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { isQuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { Question, QuestionImage, QuestionKind } from "@/domain/quiz/types";

// Earlier builds saved this SVG as the hotspot image before one was chosen. It is recognised so it is never kept:
// the server rejects SVG uploads, so a stored copy blocked every save of the quiz.
export const HOTSPOT_PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 675'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23eff6ff'/%3E%3Cstop offset='1' stop-color='%23dbeafe'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1200' height='675' fill='url(%23g)'/%3E%3Ccircle cx='880' cy='250' r='130' fill='%23bfdbfe'/%3E%3Crect x='210' y='200' width='520' height='270' rx='32' fill='%23ffffff' stroke='%2393c5fd' stroke-width='8'/%3E%3Cpath d='M300 410l120-120 98 90 92-72 90 102z' fill='%2393c5fd'/%3E%3Ccircle cx='360' cy='275' r='36' fill='%23f97316'/%3E%3C/svg%3E";

export const isHotspotPlaceholder = (url: string | undefined) => url === HOTSPOT_PLACEHOLDER_IMAGE;

/**
 * Writes the edited runtime question back onto the slide. Only what the question carries is rewritten: the slide
 * keeps its kind (type changes go through convertSlideType), settings, scores and every image the question did not
 * explicitly drop.
 */
export function syncQuizEditorSlideFromRuntimeQuestion(
  slide: QuizEditorSlide,
  input: Question,
): QuizEditorSlide {
  const question = isHotspotPlaceholder(input.hotspotImage?.url) ? { ...input, hotspotImage: undefined } : input;
  const kind = isQuestionType(slide.kind) ? slide.kind : mapRuntimeKindToEditorKind(question.kind);
  const slideMedia = isHotspotPlaceholder(slide.media?.src) ? undefined : slide.media;
  // An unchanged image keeps the stored slide media (name, position); only alt text follows the question.
  const runtimeMedia = question.contentImage
    ? slideMedia?.src === question.contentImage.url
      ? { ...slideMedia, alt: question.contentImage.alt ?? slideMedia.alt }
      : mapQuestionImage(question.contentImage, question.title)
    : mapHotspotImage(question, slideMedia);
  const choiceKind = kind === "multiple-choice" || kind === "multiple-response" || kind === "true-false";

  return {
    ...slide,
    title: question.title,
    kind,
    runtimeQuestion: question,
    description: question.instructions,
    media: runtimeMedia
      ? question.contentImage && slideMedia
        ? { ...runtimeMedia, x: slideMedia.x, y: slideMedia.y, width: slideMedia.width }
        : runtimeMedia
      : slideMedia,
    choices: mapRuntimeChoices(question, slide) ?? slide.choices,
    choiceControlType: choiceKind ? (kind === "multiple-response" ? "checkbox" : "radio") : slide.choiceControlType,
    dragDropItems: mapRuntimeDragDropItems(question, slide) ?? slide.dragDropItems,
    hotspotAreas: question.kind === "hotspot" ? mapRuntimeHotspotAreas(question, slide) : slide.hotspotAreas,
  };
}

function mapRuntimeKindToEditorKind(kind: QuestionKind): QuestionType {
  switch (kind) {
    case "single_choice":
      return "multiple-choice";
    case "multiple_response":
      return "multiple-response";
    case "true_false":
      return "true-false";
    case "short_answer":
      return "short-answer";
    case "numeric":
      return "numeric";
    case "matching":
      return "matching";
    case "sequence":
      return "sequence";
    case "fill_blank":
      return "fill-in-the-blanks";
    case "inline_choice":
    case "select_from_lists":
      return "select-from-lists";
    case "drag_words":
      return "drag-the-words";
    case "hotspot":
      return "hotspot";
    case "drag_drop":
      return "drag-and-drop";
    case "likert_scale":
      return "likert-scale";
    case "essay":
      return "essay";
  }
}

// The question's image wins. Without one, a stored image was removed by the teacher; an empty slot stays as stored.
function nextMedia(image: QuestionImage | undefined, existing: QuizEditorSlideMedia | null | undefined) {
  if (image) return imageToMedia(image, existing ?? undefined);
  return existing?.src ? null : existing;
}

/**
 * Only choice-shaped questions (and sequences) are written back to slide.choices. For the other kinds the runtime
 * question is the source of truth and slide.choices stays as stored, so a title edit cannot rewrite it.
 */
function mapRuntimeChoices(question: Question, slide: QuizEditorSlide): QuizEditorChoice[] | undefined {
  const existing = (id: string) => slide.choices?.find((choice) => choice.id === id);

  if (question.kind === "single_choice" || question.kind === "multiple_response" || question.kind === "true_false") {
    return question.choices?.map((choice) => ({
      ...existing(choice.id),
      id: choice.id,
      label: choice.label,
      correct: choice.correct,
      media: nextMedia(choice.image, existing(choice.id)?.media),
    }));
  }

  if (question.kind === "sequence") {
    return question.sequenceItems?.map((item) => ({
      ...existing(item.id),
      id: item.id,
      label: item.label,
      correct: existing(item.id)?.correct ?? true,
      media: nextMedia(item.image, existing(item.id)?.media),
    }));
  }

  return undefined;
}

function mapRuntimeDragDropItems(question: Question, slide: QuizEditorSlide): QuizEditorDragDropItem[] | undefined {
  const existing = (id: string) => slide.dragDropItems?.find((item) => item.id === id);

  if (question.kind === "matching") {
    return question.matching?.map((pair) => ({
      ...existing(pair.id),
      id: pair.id,
      label: pair.response ?? "",
      emoji: existing(pair.id)?.emoji ?? "",
      target: pair.prompt,
      media: nextMedia(pair.responseImage, existing(pair.id)?.media),
      targetMedia: nextMedia(pair.promptImage, existing(pair.id)?.targetMedia),
    }));
  }

  if (question.kind === "drag_drop") {
    const targetById = new Map((question.dropTargets ?? []).map((target) => [target.id, target.label]));
    return question.dragDropItems?.map((item) => ({
      ...existing(item.id),
      id: item.id,
      label: item.label,
      emoji: existing(item.id)?.emoji ?? "",
      target: targetById.get(item.correctTargetId) ?? item.correctTargetId,
      media: nextMedia(item.image, existing(item.id)?.media),
    }));
  }

  return undefined;
}

function mapRuntimeHotspotAreas(question: Question, slide: QuizEditorSlide): QuizEditorHotspotArea[] | undefined {
  if (!question.hotspotAreas?.length) return undefined;

  return question.hotspotAreas.map((area) => ({
    ...slide.hotspotAreas?.find((stored) => stored.id === area.id),
    id: area.id,
    shape: area.shape === "ellipse" ? "ellipse" : "rect",
    x: area.x,
    y: area.y,
    width: area.width,
    height: area.height,
    correct: area.correct,
  }));
}

function mapHotspotImage(question: Question, existing: QuizEditorSlide["media"]) {
  const url = question.hotspotImage?.url;
  if (!url) return undefined;
  if (existing?.src === url) return existing;
  return {
    type: "image" as const,
    src: url,
    alt: question.title,
    name: `${question.id}-hotspot`,
  };
}

// An unchanged image keeps its stored name and position; only the alt text follows the editor.
function imageToMedia(image: QuestionImage, existing?: QuizEditorSlideMedia) {
  if (existing && existing.src === image.url) return { ...existing, alt: image.alt ?? "" };
  return { type: "image" as const, src: image.url, alt: image.alt ?? "" };
}

function mapQuestionImage(image: QuestionImage, fallbackAlt: string) {
  return {
    type: "image" as const,
    src: image.url,
    alt: image.alt ?? fallbackAlt,
    name: image.alt ?? fallbackAlt,
  };
}
