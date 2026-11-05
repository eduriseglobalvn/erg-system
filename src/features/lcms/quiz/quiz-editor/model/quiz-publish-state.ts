import type { QuizEditorSlide, QuizProjectSettings } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { isQuestionType } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

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

/** cyrb53: a 53-bit string hash, so two different slides practically never share a fingerprint. */
function cyrb53Hex(text: string): string {
  let h1 = 3735928559;
  let h2 = 1103547991;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

// Slides are replaced, never mutated, on edit: one hash per slide object, so a re-render does not rehash data URLs.
const fingerprintCache = new WeakMap<QuizEditorSlide, string>();

/** Hash of what the teacher authored; status, sync and UI fields are left out so they never count as an edit. */
export function slideFingerprint(slide: QuizEditorSlide): string {
  const cached = fingerprintCache.get(slide);
  if (cached) return cached;
  const { title, kind, runtimeQuestion, media, choices, dragDropItems, feedbackRows } = slide;
  const fingerprint = cyrb53Hex(sortedKeysJson({ title, kind, runtimeQuestion, media, choices, dragDropItems, feedbackRows }));
  fingerprintCache.set(slide, fingerprint);
  return fingerprint;
}

/** Only questions carry a publish status; intro, instruction and result slides never count as added or changed. */
export function fingerprintedSlides(slides: readonly QuizEditorSlide[]): QuizEditorSlide[] {
  return slides.filter((slide) => isQuestionType(slide.kind));
}

export function recordPublished(settings: QuizProjectSettings, slides: QuizEditorSlide[]): QuizProjectSettings {
  const fingerprints = fingerprintedSlides(slides).map((slide) => [slide.id, slideFingerprint(slide)]);
  return { ...settings, publishedFingerprints: Object.fromEntries(fingerprints) };
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
    const questions = fingerprintedSlides(slides);
    const same = questions.length === Object.keys(fingerprints).length && questions.every((slide) => fingerprints[slide.id] === slideFingerprint(slide));
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
