import {
  FileCheck,
  Folder,
  GraduationCap,
  Link as LinkIcon,
  Presentation,
} from "@/components/mui-icon-shim";

import type {
  LearningResourceResourceCard,
  LearningResourceTaxonomyOption,
  LearningResourceTaxonomyResponse,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import type { ContentDialogOptionId } from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";
import type {
  AttachedResourceItem,
  LocalContentItem,
  StudioNode,
  StudioSubject,
  TaxonomyCreateKind,
  TaxonomyEditTarget,
} from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { buildLearningResourceSubjects } from "@/features/lms/learning-resources/domain/learning-resource-tree";

export const emptyModel: LearningResourceTaxonomyResponse = {
  grades: [],
  subjects: [],
  categories: [],
  sections: [],
  bookSeries: [],
  topics: [],
  fileTypes: [],
  designerPresets: [],
};

export function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function normalizeTaxonomyOption(option: LearningResourceTaxonomyOption | null | undefined): LearningResourceTaxonomyOption | null {
  if (!option || typeof option !== "object") return null;
  const id = String(option.id || option.slug || option.label || "").trim();
  const label = String(option.label || option.slug || option.id || "").trim();
  if (!id || !label) return null;
  return {
    ...option,
    id,
    label,
    slug: option.slug ? String(option.slug) : id,
    parentId: option.parentId ? String(option.parentId) : undefined,
    subjectId: option.subjectId ? String(option.subjectId) : undefined,
    gradeId: option.gradeId ? String(option.gradeId) : undefined,
    categoryId: option.categoryId ? String(option.categoryId) : undefined,
    bookSeriesId: option.bookSeriesId ? String(option.bookSeriesId) : undefined,
    topicId: option.topicId ? String(option.topicId) : undefined,
    description: option.description ? String(option.description) : undefined,
    status: option.status ? String(option.status) : "active",
    metadata: option.metadata && typeof option.metadata === "object" ? option.metadata : undefined,
  };
}

export function normalizeTaxonomyOptions(options: LearningResourceTaxonomyOption[] | null | undefined): LearningResourceTaxonomyOption[] {
  return safeArray(options).map(normalizeTaxonomyOption).filter(Boolean) as LearningResourceTaxonomyOption[];
}

export function normalizeContentModel(model: LearningResourceTaxonomyResponse | null | undefined): LearningResourceTaxonomyResponse {
  return {
    ...emptyModel,
    ...(model && typeof model === "object" ? model : {}),
    grades: normalizeTaxonomyOptions(model?.grades),
    subjects: normalizeTaxonomyOptions(model?.subjects),
    categories: normalizeTaxonomyOptions(model?.categories),
    sections: normalizeTaxonomyOptions(model?.sections),
    bookSeries: normalizeTaxonomyOptions(model?.bookSeries),
    topics: normalizeTaxonomyOptions(model?.topics),
    fileTypes: safeArray(model?.fileTypes),
    designerPresets: safeArray(model?.designerPresets),
  };
}

export function normalizeResources(resources: LearningResourceResourceCard[] | null | undefined): LearningResourceResourceCard[] {
  return safeArray(resources).filter((resource) => Boolean(resource?.id && resource?.subjectId));
}

export function findNode(nodes: StudioNode[], nodeId: string): StudioNode | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const child = findNode(node.children, nodeId);
    if (child) return child;
  }
  return undefined;
}

export function findPath(nodes: StudioNode[], nodeId: string, trail: StudioNode[] = []): StudioNode[] {
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    if (node.id === nodeId) return nextTrail;
    const childPath = findPath(node.children, nodeId, nextTrail);
    if (childPath.length) return childPath;
  }
  return [];
}

export function buildSubjects(model: LearningResourceTaxonomyResponse, resources: LearningResourceResourceCard[]): StudioSubject[] {
  return buildLearningResourceSubjects(model, resources) as StudioSubject[];
}

export function flattenNodes(nodes: StudioNode[]): StudioNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children)]);
}

export function screenKind(activeLeafId: string) {
  if (activeLeafId === "admin-learning-resources") return "structure";
  if (activeLeafId === "admin-learning-structure") return "structure";
  if (activeLeafId === "admin-learning-resource-list") return "resources";
  if (activeLeafId === "admin-learning-resource-upload") return "upload";
  if (activeLeafId === "admin-learning-resource-publish") return "publish";
  return "subjects";
}

export function apiKindForNodeKind(kind: TaxonomyCreateKind) {
  if (kind === "category") return "categories";
  return "sections";
}

export function nodeIdForCreated(kind: TaxonomyCreateKind, id: string) {
  if (kind === "category") return `group-category-${id}`;
  return `lesson-${id}`;
}

export function toEditTargetFromNode(node: StudioNode | null | undefined): TaxonomyEditTarget | null {
  if (!node?.optionId) return null;
  return {
    kind: node.kind,
    id: node.optionId,
    label: node.label,
    description: node.description,
    status: node.status,
    metadata: node.metadata,
  };
}

export function getAddContentOptionMeta(optionId: ContentDialogOptionId) {
  if (optionId === "category") {
    return {
      title: "Level",
      description: "Level nằm dưới môn học và dùng để gom các chủ đề theo cấp độ học.",
      icon: <Folder className="h-5 w-5" />,
    };
  }
  if (optionId === "section") {
    return {
      title: "Chủ đề",
      description: "Chủ đề nằm trong một level và là nơi gắn slide, bài tập hoặc tài liệu.",
      icon: <GraduationCap className="h-5 w-5" />,
    };
  }
  if (optionId === "lecture") {
    return {
      title: "Bài giảng",
      description: "Ưu tiên dán link Google Slides để mở trực tiếp từ LMS mà không cần upload file.",
      icon: <Presentation className="h-5 w-5" />,
    };
  }
  if (optionId === "resource") {
    return {
      title: "Tài liệu",
      description: "Dán link Google Drive/Google Slides để gắn tài liệu trực tiếp trong popup này.",
      icon: <LinkIcon className="h-5 w-5" />,
    };
  }
  return {
    title: "Bài tập",
    description: "Chọn từ danh sách bài tập mock theo môn, chủ đề và bài học để gắn nhanh vào lesson.",
    icon: <FileCheck className="h-5 w-5" />,
  };
}

export function getDisplayLink(resource: AttachedResourceItem | LocalContentItem) {
  if ("linkUrl" in resource) {
    return resource.linkUrl;
  }
  const localContent = resource as LocalContentItem;
  return localContent.slidesUrl || localContent.resourceUrl;
}

export function getPublishStatusLabel(status?: string) {
  if (status === "hidden") return "Đã ẩn";
  if (status === "draft") return "Bản nháp";
  if (status === "active" || status === "published") return "Đã xuất bản";
  return "Bản nháp";
}

export function getResourceDisplayBadge(resource: AttachedResourceItem) {
  const link = resource.linkUrl?.toLowerCase() || "";
  if (link.includes("docs.google.com/presentation")) return "Google Slides";
  if (link.includes("drive.google.com")) return "Google Drive";

  const rawType = (resource.fileTypeBadge || resource.selectedFileType || "").toUpperCase();
  if (rawType === "PPTX" || rawType === "LINK") return "Bài giảng";
  if (rawType === "PDF") return "PDF";
  if (rawType === "VIDEO") return "Video";
  if (rawType === "AUDIO") return "Audio";
  if (rawType === "HTML5") return "HTML5";
  if (rawType === "ZIP") return "Tệp nén";

  return "Tài liệu";
}

export function slugifyPathSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "muc";
}

export function buildExplorerPathUrl(subject?: StudioSubject, path: StudioNode[] = [], target?: StudioNode | LocalContentItem | AttachedResourceItem) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://lcms.erg.edu.local";
  const segments = ["resources"];
  if (subject?.label) segments.push(slugifyPathSegment(subject.label));
  path.forEach((item) => segments.push(slugifyPathSegment(item.label)));
  if (target && "label" in target) segments.push(slugifyPathSegment(target.label));
  if (target && "title" in target) segments.push(slugifyPathSegment(target.title));
  return `${origin}/${segments.join("/")}`;
}



export function copyTextToClipboard(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  void navigator.clipboard.writeText(value);
}

export function getStableDate(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 100_000;
  const month = (hash % 12) + 1;
  const day = (Math.floor(hash / 12) % 27) + 1;
  const hour = (Math.floor(hash / 500) % 12) + 1;
  const minute = Math.floor(hash / 17) % 60;
  return `${month}/${day}/2026 ${hour}:${String(minute).padStart(2, "0")} ${hash % 2 ? "AM" : "PM"}`;
}

export function getExplorerSize(value: StudioNode | LocalContentItem | AttachedResourceItem) {
  if ("children" in value) return "";
  if ("questionCount" in value && value.questionCount) return `${value.questionCount} câu`;
  const seed = "title" in value ? value.title : "item";
  let hash = 0;
  for (const char of seed) hash = (hash * 17 + char.charCodeAt(0)) % 800_000;
  return `${Math.max(24, hash).toLocaleString("en-US")} KB`;
}

export function getResourceCardMeta(id: string, _title: string, fileType: string) {
  const safeId = String(id || "");
  const safeFileType = String(fileType || "PDF");
  let hash = 0;
  for (const char of safeId) hash = (hash * 29 + char.charCodeAt(0)) % 997;
  const testNo = (hash % 7) + 1;
  const unitNo = (hash % 6) + 1;
  const isLecture = safeFileType === "PPTX" || safeFileType === "LECTURE";
  const isExercise = safeFileType === "QUIZ" || safeFileType === "EXERCISE";

  const minutes = isLecture ? 35 + (hash % 3) * 5 : 45 + (hash % 2) * 15;
  const questions = isLecture ? 18 + (hash % 8) : 40 + (hash % 3) * 5;

  return {
    actionLabel: isLecture ? "Mở bài" : isExercise ? "Làm bài" : "Mở file",
    heading: isLecture ? "Bài giảng" : isExercise ? "Luyện tập" : "Học liệu",
    tag: isLecture ? "BG" : isExercise ? `Đề ${testNo}` : fileType,
    unit: `Unit ${String(unitNo).padStart(2, "0")}`,
    minutes,
    questions,
  };
}

export function buildResourceLocation(path: StudioNode[]) {
  const location: { categoryId?: string; sectionId?: string; bookSeriesId?: string; topicId?: string } = {};
  for (const item of path) {
    if (item.location.categoryId) location.categoryId = item.location.categoryId;
    if (item.location.sectionId) location.sectionId = item.location.sectionId;
    if (item.location.bookSeriesId) location.bookSeriesId = item.location.bookSeriesId;
    if (item.location.topicId) location.topicId = item.location.topicId;
  }
  return location;
}

export function parsePositiveInteger(value: string) {
  const normalized = Number(value.trim());
  if (!Number.isInteger(normalized) || normalized <= 0) return undefined;
  return normalized;
}

export function pathLabel(subjectLabel: string, path: StudioNode[]) {
  return [subjectLabel, ...path.map((item) => item.label)].filter(Boolean).join(" / ");
}

export function defaultStatusForOption(option: ContentDialogOptionId | null, isSubject: boolean) {
  if (isSubject || option === "category" || option === "section" || option === null) {
    return "active";
  }
  return "published";
}
