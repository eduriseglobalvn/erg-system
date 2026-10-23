import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";

export type ContentDialogNodeKind = "group" | "lesson" | "folder";
export type ContentDialogCreateMode = "subject" | "root" | "child";
export type ContentDialogStructureKind = "category" | "section";
export type ContentDialogOptionId = ContentDialogStructureKind | "lecture" | "exercise" | "resource";

export type ExerciseLibraryItem = {
  id: string;
  title: string;
  subjectId: string;
  subjectLabel: string;
  topicKey?: string;
  topicLabel?: string;
  sectionKey?: string;
  sectionLabel?: string;
  difficulty: "Cơ bản" | "Vận dụng" | "Nâng cao";
  questionCount: number;
  durationMinutes: number;
  sourceQuizId?: string;
  sourceLabel?: string;
  quizKind?: "train" | "test";
  scopeLabel?: string;
};

export type ExerciseFilterContext = {
  query: string;
  subjectId?: string;
  subjectLabel?: string;
  topicLabel?: string;
  sectionLabel?: string;
};

export function getAvailableContentOptions(mode: ContentDialogCreateMode, selectedNodeKind?: ContentDialogNodeKind): ContentDialogOptionId[] {
  if (mode === "subject") return ["category"];
  if (mode === "root") return ["category"];
  if (selectedNodeKind === "group") return ["section"];
  if (selectedNodeKind === "lesson") return ["lecture", "exercise", "resource"];
  return ["category"];
}

export function shouldShowContentOption(mode: ContentDialogCreateMode, optionId: ContentDialogOptionId, selectedNodeKind?: ContentDialogNodeKind) {
  return getAvailableContentOptions(mode, selectedNodeKind).includes(optionId);
}

export function normalizeGoogleSlidesUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const isGoogleSlides = url.hostname.includes("docs.google.com") && url.pathname.includes("/presentation/");
    if (!isGoogleSlides) return trimmed;

    const presentationId = url.pathname.match(/\/presentation\/d\/([^/]+)/)?.[1];
    if (!presentationId) return trimmed;
    return `${url.origin}/presentation/d/${presentationId}/embed?start=false&loop=false&delayms=3000`;
  } catch {
    return trimmed;
  }
}

export function isGoogleSlidesUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return false;

  try {
    const url = new URL(trimmed);
    return url.hostname.toLowerCase().includes("docs.google.com") && url.pathname.includes("/presentation/");
  } catch {
    return false;
  }
}

export function normalizeGoogleViewerUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname.replace(/\/$/, "");

    if (host.includes("docs.google.com") && pathname.includes("/presentation/")) {
      return normalizeGoogleSlidesUrl(trimmed);
    }

    if (host.includes("drive.google.com") && pathname.includes("/file/d/")) {
      const previewPath = pathname.replace(/\/(view|edit|preview)$/i, "");
      return `${url.origin}${previewPath}/preview`;
    }

    if (host.includes("docs.google.com") && /\/(document|spreadsheets|forms)\/d\//.test(pathname)) {
      const previewPath = pathname.replace(/\/(edit|view|preview|pub)$/i, "");
      return `${url.origin}${previewPath}/preview`;
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

export function mapQuizBankItemsToExercises(items: QuizBankItem[]): ExerciseLibraryItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    subjectId: item.subjectId,
    subjectLabel: item.subjectLabel,
    topicLabel: item.topicLabels.join(", "),
    sectionLabel: item.levelLabel,
    difficulty: item.kind === "test" ? "Vận dụng" : "Cơ bản",
    questionCount: item.questionCount,
    durationMinutes: parseDurationMinutes(item.durationLabel),
    sourceQuizId: item.id,
    sourceLabel: "Quiz bank",
    quizKind: item.kind,
    scopeLabel: item.scopeLabel,
  }));
}

export function resolveExerciseLibraryItems(
  quizBankItems: QuizBankItem[],
  fallbackItems: ExerciseLibraryItem[],
  apiBacked: boolean,
): ExerciseLibraryItem[] {
  const mappedItems = mapQuizBankItemsToExercises(quizBankItems);
  if (mappedItems.length) return mappedItems;
  return apiBacked ? [] : fallbackItems;
}

export function filterExerciseLibraryItems(items: ExerciseLibraryItem[], context: ExerciseFilterContext) {
  const keyword = context.query.trim().toLowerCase();
  const subjectLabel = context.subjectLabel?.trim().toLowerCase();
  const topicKeyword = context.topicLabel?.trim().toLowerCase();
  const sectionKeyword = context.sectionLabel?.trim().toLowerCase();

  return items.filter((item) => {
    if (
      context.subjectId &&
      item.subjectId !== context.subjectId &&
      normalizeForExerciseMatch(subjectLabel ?? "") !== normalizeForExerciseMatch(item.subjectLabel)
    ) {
      return false;
    }
    if (topicKeyword && !matchesExerciseText(`${item.topicLabel ?? ""} ${item.title}`, topicKeyword)) return false;
    if (sectionKeyword && !matchesExerciseText(`${item.sectionLabel ?? ""} ${item.title}`, sectionKeyword)) return false;
    if (!keyword) return true;
    return `${item.title} ${item.topicLabel ?? ""} ${item.sectionLabel ?? ""} ${item.difficulty}`.toLowerCase().includes(keyword);
  });
}

export function filterMockExercises(items: ExerciseLibraryItem[], context: ExerciseFilterContext) {
  return filterExerciseLibraryItems(items, context);
}

function parseDurationMinutes(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 15;
}

function matchesExerciseText(haystack: string, rawNeedle: string) {
  const normalizedHaystack = normalizeForExerciseMatch(haystack);
  const normalizedNeedle = normalizeForExerciseMatch(rawNeedle);
  if (!normalizedNeedle) return true;
  return normalizedHaystack.includes(normalizedNeedle) || normalizedNeedle.includes(normalizedHaystack);
}

function normalizeForExerciseMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
