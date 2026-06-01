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

    const pathname = url.pathname.replace(/\/$/, "");
    if (pathname.endsWith("/embed")) {
      return `${url.origin}${pathname}`;
    }

    if (pathname.endsWith("/pub")) {
      return `${url.origin}${pathname}?start=false&loop=false&delayms=3000`;
    }

    return `${url.origin}${pathname}/embed?start=false&loop=false&delayms=3000`;
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

export function filterMockExercises(items: ExerciseLibraryItem[], context: ExerciseFilterContext) {
  const keyword = context.query.trim().toLowerCase();
  const subjectLabel = context.subjectLabel?.trim().toLowerCase();
  const topicKeyword = context.topicLabel?.trim().toLowerCase();
  const sectionKeyword = context.sectionLabel?.trim().toLowerCase();

  return items.filter((item) => {
    if (context.subjectId && item.subjectId !== context.subjectId && subjectLabel !== item.subjectLabel.toLowerCase()) return false;
    if (topicKeyword && !`${item.topicLabel ?? ""} ${item.title}`.toLowerCase().includes(topicKeyword)) return false;
    if (sectionKeyword && !`${item.sectionLabel ?? ""} ${item.title}`.toLowerCase().includes(sectionKeyword)) return false;
    if (!keyword) return true;
    return `${item.title} ${item.topicLabel ?? ""} ${item.sectionLabel ?? ""} ${item.difficulty}`.toLowerCase().includes(keyword);
  });
}
