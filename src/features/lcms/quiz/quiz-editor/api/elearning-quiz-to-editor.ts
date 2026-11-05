import type {
  QuizEditorChoice,
  QuizEditorDragDropItem,
  QuizEditorHotspotArea,
  QuizEditorSlide,
  QuestionType,
} from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import type { Question, QuestionImage, QuestionKind } from "@/domain/quiz/types";

export function syncQuizEditorSlideFromRuntimeQuestion(
  slide: QuizEditorSlide,
  question: Question,
): QuizEditorSlide {
  const kind = mapRuntimeKindToEditorKind(question.kind);
  const runtimeMedia = question.contentImage
    ? mapQuestionImage(question.contentImage, question.title)
    : mapHotspotImage(question);

  return {
    ...slide,
    title: question.title,
    kind,
    runtimeQuestion: question,
    description: question.instructions,
    media: runtimeMedia
      ? question.contentImage && slide.media
        ? { ...runtimeMedia, x: slide.media.x, y: slide.media.y, width: slide.media.width }
        : runtimeMedia
      : slide.media,
    choices: mapRuntimeChoices(question),
    choiceControlType: kind === "multiple-response" ? "checkbox" : "radio",
    dragDropItems: mapRuntimeDragDropItems(question),
    hotspotAreas: mapRuntimeHotspotAreas(question),
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

function mapRuntimeChoices(question: Question): QuizEditorChoice[] | undefined {
  if (question.choices?.length) {
    return question.choices.map((choice) => ({
      id: choice.id,
      label: choice.label,
      correct: choice.correct,
      ...(choice.image ? { media: imageToMedia(choice.image) } : {}),
    }));
  }

  if (question.sequenceItems?.length) {
    return question.sequenceItems.map((item) => ({
      id: item.id,
      label: item.label,
      correct: true,
    }));
  }

  if (question.textBlanks?.length) {
    return question.textBlanks.map((blank) => ({
      id: blank.id,
      label: blank.correctAnswers[0] ?? blank.label,
      correct: true,
    }));
  }

  if (question.inlineBlanks?.length) {
    return question.inlineBlanks.map((blank) => ({
      id: blank.id,
      label: blank.statement,
      correct: true,
    }));
  }

  if (question.numericAnswer) {
    return [
      {
        id: `${question.id}-numeric-answer`,
        label: String(question.numericAnswer.correctValue),
        correct: true,
      },
    ];
  }

  if (question.wordBank?.length) {
    return question.wordBank.map((word) => ({
      id: word.id,
      label: word.label,
      correct: question.wordSlots?.some((slot) => slot.correctWordId === word.id) ?? false,
    }));
  }

  if (question.likertRows?.length) {
    return question.likertRows.map((row) => ({
      id: row.id,
      label: row.label,
      correct: true,
    }));
  }

  if (question.essayRubric?.length) {
    return question.essayRubric.map((item) => ({
      id: item.id,
      label: item.label,
      correct: true,
    }));
  }

  return undefined;
}

function mapRuntimeDragDropItems(question: Question): QuizEditorDragDropItem[] | undefined {
  if (question.matching?.length) {
    return question.matching.map((pair) => ({
      id: pair.id,
      label: pair.response ?? "",
      emoji: "",
      target: pair.prompt,
      media: pair.responseImage ? mapQuestionImage(pair.responseImage, pair.response ?? "") : null,
      targetMedia: pair.promptImage ? mapQuestionImage(pair.promptImage, pair.prompt) : null,
    }));
  }

  if (question.dragDropItems?.length) {
    const targetById = new Map((question.dropTargets ?? []).map((target) => [target.id, target.label]));
    return question.dragDropItems.map((item) => ({
      id: item.id,
      label: item.label,
      emoji: "",
      target: targetById.get(item.correctTargetId) ?? item.correctTargetId,
      ...(item.image ? { media: imageToMedia(item.image) } : {}),
    }));
  }

  return undefined;
}

function mapRuntimeHotspotAreas(question: Question): QuizEditorHotspotArea[] | undefined {
  if (!question.hotspotAreas?.length) return undefined;

  return question.hotspotAreas.map((area) => ({
    id: area.id,
    shape: area.shape === "ellipse" ? "ellipse" : "rect",
    x: area.x,
    y: area.y,
    width: area.width,
    height: area.height,
    correct: area.correct,
  }));
}

function mapHotspotImage(question: Question) {
  if (!question.hotspotImage?.url) return undefined;
  return {
    type: "image" as const,
    src: question.hotspotImage.url,
    alt: question.title,
    name: `${question.id}-hotspot`,
  };
}

function imageToMedia(image: QuestionImage) {
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
