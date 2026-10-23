export function normalizeStudioFileType(fileType: string) {
  const normalized = fileType.toUpperCase();
  if (normalized === "LECTURE") return "PPTX";
  if (normalized === "EXERCISE") return "QUIZ";
  return normalized;
}

export function launchModeFor(fileType: string) {
  const normalized = normalizeStudioFileType(fileType);
  if (normalized === "PPTX") return "google_slide_embed";
  if (normalized === "QUIZ") return "quiz_runtime";
  if (normalized === "PDF") return "pdf_reader";
  if (normalized === "VIDEO") return "video_player";
  if (normalized === "AUDIO") return "audio_player";
  if (normalized === "LINK") return "external";
  return "download_only";
}

export function curriculumTaxonomyPath(kind: string) {
  const normalized = kind.toLowerCase();
  if (normalized === "subjects" || normalized === "subject") return "subjects";
  if (["levels", "level", "categories", "category", "groups", "group"].includes(normalized)) return "levels";
  if (["topics", "topic", "sections", "section", "lessons", "lesson"].includes(normalized)) return "topics";
  return null;
}

export function positiveInteger(value?: number) {
  if (!Number.isFinite(value)) return undefined;
  const normalized = Math.floor(Number(value));
  return normalized > 0 ? normalized : undefined;
}

export function extensionFromFileName(fileName: string) {
  const segments = fileName.split(".");
  return segments.length > 1 ? segments.pop()?.toLowerCase() : undefined;
}

export function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== "")) as Partial<T>;
}

export function slugify(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
