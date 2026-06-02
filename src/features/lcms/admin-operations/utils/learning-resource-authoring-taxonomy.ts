import type { StudioNodeKind, TaxonomyEditTarget } from "@/features/lcms/admin-operations/types/learning-resource-authoring";

export function apiKindForEditTarget(kind: TaxonomyEditTarget["kind"]) {
  if (kind === "subject") return "subjects";
  if (kind === "section" || kind === "lesson") return "sections";
  if (kind === "topic" || kind === "bookSeries") return "topics";
  if (kind === "group") return "categories";
  if (kind === "category") return "categories";
  return "categories";
}

export function getNodeKindLabel(kind: StudioNodeKind) {
  const labels: Record<StudioNodeKind, string> = {
    group: "Nhóm học liệu",
    lesson: "Bài học",
    bookSeries: "Bộ sách / Chương trình",
    category: "Nhóm học liệu",
    folder: "Nhóm hệ thống",
    section: "Bài học",
    topic: "Chủ đề / Bài học",
  };
  return labels[kind] ?? kind;
}
