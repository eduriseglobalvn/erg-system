import type { QuizEditorSlide, QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

/** slideId -> fingerprint of the slide as last published. Kept in the draft settings: the server never resets quiz.status. */
export type PublishedFingerprints = NonNullable<QuizProjectSettings["publishedFingerprints"]>;
export type QuizLifecycle = "none" | "draft" | "published" | "changed";
export type SlidePublishState = "never" | "published" | "changed";

type FingerprintSettings = Pick<QuizProjectSettings, "publishedFingerprints">;

export const lifecycleLabel: Record<QuizLifecycle, string> = {
  none: "Chưa có bài",
  draft: "Nháp",
  published: "Đã xuất bản",
  changed: "Có sửa chưa xuất bản",
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sortedKeysJson(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    isPlainObject(item) ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item,
  );
}

function djb2Hex(text: string): string {
  let hash = 5381;
  for (let index = 0; index < text.length; index += 1) hash = (hash * 33 + text.charCodeAt(index)) | 0;
  return (hash >>> 0).toString(16);
}

/** Hash of what the teacher authored; status, sync and UI fields are left out so they never count as an edit. */
export function slideFingerprint(slide: QuizEditorSlide): string {
  const { title, kind, runtimeQuestion, media, choices, dragDropItems, feedbackRows } = slide;
  return djb2Hex(sortedKeysJson({ title, kind, runtimeQuestion, media, choices, dragDropItems, feedbackRows }));
}

export function recordPublished(settings: QuizProjectSettings, slides: QuizEditorSlide[]): QuizProjectSettings {
  return { ...settings, publishedFingerprints: Object.fromEntries(slides.map((slide) => [slide.id, slideFingerprint(slide)])) };
}

export function quizLifecycle({ quizId, serverStatus, settings, slides }: {
  quizId: string | null;
  serverStatus: string | null;
  settings: FingerprintSettings;
  slides: readonly QuizEditorSlide[];
}): QuizLifecycle {
  if (!quizId) return "none";
  const fingerprints = settings.publishedFingerprints;
  if (fingerprints) {
    const same = slides.length === Object.keys(fingerprints).length && slides.every((slide) => fingerprints[slide.id] === slideFingerprint(slide));
    return same ? "published" : "changed";
  }
  // Published before fingerprints existed: whether it changed since is unknown.
  return serverStatus === "published" ? "published" : "draft";
}

export function slidePublishState(slide: QuizEditorSlide, settings: FingerprintSettings): SlidePublishState {
  const fingerprints = settings.publishedFingerprints;
  if (!fingerprints) return "never";
  return fingerprints[slide.id] === slideFingerprint(slide) ? "published" : "changed";
}
