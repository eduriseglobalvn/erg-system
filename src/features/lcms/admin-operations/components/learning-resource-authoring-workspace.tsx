import { useEffect, useMemo, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { memo, useCallback, useDeferredValue } from "react";
import {
  ArrowUpRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  ClipboardList,
  Copy,
  FileCheck,
  FileText,
  Folder,
  FolderPlus,
  FolderOpen,
  GraduationCap,
  Headphones,
  HelpCircle,
  Image as ImageIcon,
  LibraryBig,
  Link as LinkIcon,
  ListTree,
  Monitor,
  MoreHorizontal,
  Pencil,
  Plus,
  Presentation,
  RefreshCw,
  Search,
  Settings2,
  Scissors,
  Trash2,
  Video,
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  inputClassName,
} from "@/components/ui/dashboard-kit";
import {
  ChecklistItem,
  ContentLinkField,
  ContentTextFields,
  Field,
  InfoRow,
  PublishCard,
  PublishStep,
  SearchInput,
  StatusSelectField,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-fields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createLearningResourceResource,
  createLearningResourceTaxonomy,
  deleteLearningResourceTaxonomy,
  deleteLearningResourceResource,
  loadLearningResourceResourceDetail,
  loadLearningResourceStudioWorkspaceData,
  updateLearningResourceTaxonomy,
  updateLearningResourceAsset,
  updateLearningResourceResource,
  uploadLearningResourceResource,
  type CreateTaxonomyPayload,
  type LearningResourceAssetDetail,
  type LearningResourceResourceCard,
  type LearningResourceResourceDetail,
  type LearningResourceTaxonomyOption,
  type LearningResourceTaxonomyResponse,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import { mockExerciseLibrary } from "@/features/lcms/admin-operations/api/mock-exercise-library";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import {
  filterMockExercises,
  getAvailableContentOptions,
  isGoogleSlidesUrl,
  normalizeGoogleSlidesUrl,
  normalizeGoogleViewerUrl,
  type ContentDialogOptionId,
} from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";
import { cn } from "@/lib/utils";
import {
  buildLearningResourceSubjects,
  matchesResourceToLearningNode,
  type LearningResourceNode,
  type LearningResourceNodeKind,
  type LearningResourceSubject,
  type LearningResourceSourceKind,
} from "@/features/lms/learning-resources/domain/learning-resource-tree";

type StudioNodeKind = LearningResourceNodeKind | "category" | "topic" | "section" | "bookSeries";
type StudioNodeSourceKind = LearningResourceSourceKind;
type StudioNode = {
  id: string;
  label: string;
  kind: StudioNodeKind;
  sourceKind: StudioNodeSourceKind;
  optionId?: string;
  description?: string;
  status?: string;
  metadata?: Record<string, string>;
  location: LearningResourceNode["location"];
  children: StudioNode[];
};
type StudioSubject = LearningResourceSubject;

type TaxonomyCreateMode = "subject" | "root" | "child";
type TaxonomyCreateKind = "category" | "section";
type TaxonomyDialogState = { mode: TaxonomyCreateMode } | null;
type LocalContentKind = "lecture" | "exercise";
type LocalContentItem = {
  id: string;
  kind: LocalContentKind;
  subjectId: string;
  parentNodeId: string;
  parentOptionId: string;
  title: string;
  description?: string;
  slidesUrl?: string;
  resourceUrl?: string;
  topicLabel?: string;
  sectionLabel?: string;
  questionCount?: number;
  durationMinutes?: number;
  status?: string;
};
type AttachedResourceItem = LearningResourceResourceCard & {
  detail?: LearningResourceResourceDetail;
  asset?: LearningResourceAssetDetail;
  linkUrl?: string;
};
type TaxonomyEditTarget =
  | { kind: "subject"; id: string; label: string; description?: string; status?: string; metadata?: Record<string, string> }
  | { kind: StudioNodeKind; id: string; label: string; description?: string; status?: string; metadata?: Record<string, string> };
type TaxonomyDeleteTarget = TaxonomyEditTarget;
type LocalContentEditTarget = LocalContentItem | null;
type StructureSelection =
  | { type: "node"; id: string }
  | { type: "local-content"; id: string }
  | { type: "resource"; id: string }
  | null;

const emptyModel: LearningResourceTaxonomyResponse = {
  grades: [],
  subjects: [],
  categories: [],
  sections: [],
  bookSeries: [],
  topics: [],
  fileTypes: [],
  designerPresets: [],
};

const mockExplorerModel: LearningResourceTaxonomyResponse = {
  ...emptyModel,
  subjects: [
    {
      id: "mock-ic3-gs6",
      label: "IC3 GS6",
      slug: "ic3-gs6",
      description: "Mock môn học IC3 GS6 với các level học liệu.",
      status: "active",
    },
    {
      id: "mock-ai-iig-subject",
      label: "AI - IIG",
      slug: "ai-iig",
      description: "Mock môn học AI và chứng chỉ IIG.",
      status: "active",
    },
  ],
  categories: [
    {
      id: "mock-ic3-level-1",
      label: "Level 1",
      slug: "level-1",
      subjectId: "mock-ic3-gs6",
      description: "Nền tảng máy tính và thao tác cơ bản.",
      sortOrder: 1,
      status: "active",
    },
    {
      id: "mock-ic3-level-2",
      label: "Level 2",
      slug: "level-2",
      subjectId: "mock-ic3-gs6",
      description: "Ứng dụng văn phòng và Internet.",
      sortOrder: 2,
      status: "active",
    },
    {
      id: "mock-ic3-level-3",
      label: "Level 3",
      slug: "level-3",
      subjectId: "mock-ic3-gs6",
      description: "Ôn tập, kiểm tra và luyện chứng chỉ.",
      sortOrder: 3,
      status: "active",
    },
    {
      id: "mock-ai-foundation",
      label: "AI Foundation",
      slug: "ai-foundation",
      subjectId: "mock-ai-iig-subject",
      description: "Nhóm học liệu AI cơ bản.",
      sortOrder: 1,
      status: "active",
    },
  ],
  sections: [
    {
      id: "mock-ic3-lv1-intro",
      label: "01. Làm quen với máy tính",
      slug: "lam-quen-voi-may-tinh",
      subjectId: "mock-ic3-gs6",
      categoryId: "mock-ic3-level-1",
      description: "Khái niệm thiết bị, hệ điều hành và quản lý tệp.",
      sortOrder: 1,
      status: "active",
    },
    {
      id: "mock-ic3-lv1-files",
      label: "02. Quản lý thư mục và tệp",
      slug: "quan-ly-thu-muc-va-tep",
      subjectId: "mock-ic3-gs6",
      categoryId: "mock-ic3-level-1",
      description: "Tổ chức file, folder và tài nguyên học tập.",
      sortOrder: 2,
      status: "active",
    },
    {
      id: "mock-ic3-lv2-office",
      label: "01. Word, Excel, PowerPoint",
      slug: "word-excel-powerpoint",
      subjectId: "mock-ic3-gs6",
      categoryId: "mock-ic3-level-2",
      description: "Thực hành bộ ứng dụng văn phòng.",
      sortOrder: 1,
      status: "active",
    },
    {
      id: "mock-ic3-lv2-internet",
      label: "02. Internet và an toàn số",
      slug: "internet-va-an-toan-so",
      subjectId: "mock-ic3-gs6",
      categoryId: "mock-ic3-level-2",
      description: "Tìm kiếm, email và an toàn trực tuyến.",
      sortOrder: 2,
      status: "active",
    },
    {
      id: "mock-ic3-lv3-practice",
      label: "01. Ôn tập chứng chỉ",
      slug: "on-tap-chung-chi",
      subjectId: "mock-ic3-gs6",
      categoryId: "mock-ic3-level-3",
      description: "Đề luyện tập tổng hợp.",
      sortOrder: 1,
      status: "active",
    },
    {
      id: "mock-ai-overview",
      label: "01. Tổng quan AI trong học tập",
      slug: "ai-overview",
      subjectId: "mock-ai-iig-subject",
      categoryId: "mock-ai-foundation",
      description: "Bài mở đầu về AI cho học sinh.",
      sortOrder: 1,
      status: "active",
    },
  ],
};

const mockExplorerResources: LearningResourceResourceCard[] = [
  {
    id: "mock-resource-ai-slides",
    slug: "slide-ai-overview",
    title: "Slide - Tổng quan AI trong học tập",
    programSlug: "ai-iig",
    subjectId: "mock-ai-iig-subject",
    categoryId: "mock-ai-foundation",
    sectionId: "mock-ai-overview",
    selectedFileType: "PPTX",
    fileTypeBadge: "PPTX",
    launchMode: "external",
    priceType: "free",
    accessState: "open",
    visibility: "public",
    status: "published",
    canDownload: false,
  },
  {
    id: "mock-resource-ic3-pdf",
    slug: "ic3-gs6-final-guide",
    title: "Level 1 - tài liệu hướng dẫn",
    programSlug: "ic3-gs6",
    subjectId: "mock-ic3-gs6",
    categoryId: "mock-ic3-level-1",
    sectionId: "mock-ic3-lv1-intro",
    selectedFileType: "PDF",
    fileTypeBadge: "PDF",
    launchMode: "external",
    priceType: "free",
    accessState: "open",
    visibility: "public",
    status: "published",
    canDownload: true,
  },
  {
    id: "mock-resource-practice",
    slug: "on-tap-lv1",
    title: "Bộ câu hỏi ôn tập Level 3",
    programSlug: "ic3-gs6",
    subjectId: "mock-ic3-gs6",
    categoryId: "mock-ic3-level-3",
    sectionId: "mock-ic3-lv3-practice",
    selectedFileType: "HTML5",
    fileTypeBadge: "Quiz",
    launchMode: "internal",
    priceType: "free",
    accessState: "open",
    visibility: "public",
    status: "published",
    canDownload: false,
  },
];

const mockExplorerLocalContent: LocalContentItem[] = [
  {
    id: "mock-local-ai-slides",
    kind: "lecture",
    subjectId: "mock-ai-iig-subject",
    parentNodeId: "lesson-mock-ai-overview",
    parentOptionId: "mock-ai-overview",
    title: "Bài giảng Google Slides - Tổng quan AI",
    description: "Mock link mở trực tiếp trong tab mới.",
    slidesUrl: "https://docs.google.com/presentation/d/mock-ai-overview/preview",
    status: "published",
  },
  {
    id: "mock-local-ai-exercise",
    kind: "exercise",
    subjectId: "mock-ic3-gs6",
    parentNodeId: "lesson-mock-ic3-lv1-files",
    parentOptionId: "mock-ic3-lv1-files",
    title: "Bài tập: Sắp xếp thư mục đúng chuẩn",
    description: "Mock bài tập nội bộ.",
    questionCount: 12,
    durationMinutes: 20,
    status: "published",
  },
  {
    id: "mock-local-ic3-slides",
    kind: "lecture",
    subjectId: "mock-ic3-gs6",
    parentNodeId: "lesson-mock-ic3-lv2-office",
    parentOptionId: "mock-ic3-lv2-office",
    title: "Level 2 - Slide Word Excel PowerPoint",
    slidesUrl: "https://docs.google.com/presentation/d/mock-ic3-final/preview",
    status: "published",
  },
];

const screenMeta: Record<string, { title: string; description: string; icon: ReactNode }> = {
  "admin-learning-resources": {
    title: "Chủ đề học liệu",
    description: "Tạo môn học, xây cây chủ đề và gắn tài liệu theo một luồng duy nhất.",
    icon: <ListTree className="h-5 w-5" />,
  },
  "admin-learning-structure": {
    title: "Cấu trúc",
    description: "Tổ chức môn học thành nhóm học liệu, chủ đề và unit/lesson để LMS hiển thị.",
    icon: <ListTree className="h-5 w-5" />,
  },
  "admin-learning-resource-list": {
    title: "Tài liệu",
    description: "Tra cứu và cập nhật học liệu đã gắn vào từng vị trí trong cấu trúc môn học.",
    icon: <LibraryBig className="h-5 w-5" />,
  },
  "admin-learning-resource-upload": {
    title: "Gắn link",
    description: "Dán link Google Drive/Google Slides và chọn nơi gắn trong cây học liệu.",
    icon: <LinkIcon className="h-5 w-5" />,
  },
  "admin-learning-resource-publish": {
    title: "Xuất bản",
    description: "Kiểm tra trạng thái sẵn sàng trước khi hiển thị trên LMS.",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
};

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeTaxonomyOption(option: LearningResourceTaxonomyOption | null | undefined): LearningResourceTaxonomyOption | null {
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

function normalizeTaxonomyOptions(options: LearningResourceTaxonomyOption[] | null | undefined): LearningResourceTaxonomyOption[] {
  return safeArray(options).map(normalizeTaxonomyOption).filter(Boolean) as LearningResourceTaxonomyOption[];
}

function normalizeContentModel(model: LearningResourceTaxonomyResponse | null | undefined): LearningResourceTaxonomyResponse {
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

function normalizeResources(resources: LearningResourceResourceCard[] | null | undefined): LearningResourceResourceCard[] {
  return safeArray(resources).filter((resource) => Boolean(resource?.id && resource?.subjectId));
}

function findNode(nodes: StudioNode[], nodeId: string): StudioNode | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const child = findNode(node.children, nodeId);
    if (child) return child;
  }
  return undefined;
}

function findPath(nodes: StudioNode[], nodeId: string, trail: StudioNode[] = []): StudioNode[] {
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    if (node.id === nodeId) return nextTrail;
    const childPath = findPath(node.children, nodeId, nextTrail);
    if (childPath.length) return childPath;
  }
  return [];
}

function buildSubjects(model: LearningResourceTaxonomyResponse, resources: LearningResourceResourceCard[]): StudioSubject[] {
  return buildLearningResourceSubjects(model, resources) as StudioSubject[];
}

function flattenNodes(nodes: StudioNode[]): StudioNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children)]);
}

function screenKind(activeLeafId: string) {
  if (activeLeafId === "admin-learning-resources") return "structure";
  if (activeLeafId === "admin-learning-structure") return "structure";
  if (activeLeafId === "admin-learning-resource-list") return "resources";
  if (activeLeafId === "admin-learning-resource-upload") return "upload";
  if (activeLeafId === "admin-learning-resource-publish") return "publish";
  return "subjects";
}

function apiKindForNodeKind(kind: TaxonomyCreateKind) {
  if (kind === "category") return "categories";
  return "sections";
}

function apiKindForEditTarget(kind: TaxonomyEditTarget["kind"]) {
  if (kind === "subject") return "subjects";
  if (kind === "section" || kind === "lesson") return "sections";
  if (kind === "topic" || kind === "bookSeries") return "topics";
  if (kind === "group") return "categories";
  if (kind === "category") return "categories";
  return "categories";
}

function nodeIdForCreated(kind: TaxonomyCreateKind, id: string) {
  if (kind === "category") return `group-category-${id}`;
  return `lesson-${id}`;
}

function toEditTargetFromNode(node: StudioNode | null | undefined): TaxonomyEditTarget | null {
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

function getAddContentOptionMeta(optionId: ContentDialogOptionId) {
  if (optionId === "category") {
    return {
      title: "Nhóm học liệu",
      description: "Mỗi nhóm học liệu chỉ chứa danh sách bài học bên trong.",
      icon: <Folder className="h-5 w-5" />,
    };
  }
  if (optionId === "section") {
    return {
      title: "Bài học",
      description: "Bài học là nơi gắn slide thuyết trình, bài tập và tài liệu trong cùng một chỗ.",
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

function getDisplayLink(resource: AttachedResourceItem | LocalContentItem) {
  if ("linkUrl" in resource) {
    return resource.linkUrl;
  }
  const localContent = resource as LocalContentItem;
  return localContent.slidesUrl || localContent.resourceUrl;
}

function getPublishStatusLabel(status?: string) {
  if (status === "hidden") return "Đã ẩn";
  if (status === "draft") return "Bản nháp";
  if (status === "active" || status === "published") return "Đã xuất bản";
  return "Bản nháp";
}

function getResourceDisplayBadge(resource: AttachedResourceItem) {
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

function slugifyPathSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "muc";
}

function buildExplorerPathUrl(subject?: StudioSubject, path: StudioNode[] = [], target?: StudioNode | LocalContentItem | AttachedResourceItem) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://lcms.erg.edu.vn";
  const segments = ["resources"];
  if (subject?.label) segments.push(slugifyPathSegment(subject.label));
  path.forEach((item) => segments.push(slugifyPathSegment(item.label)));
  if (target && "label" in target) segments.push(slugifyPathSegment(target.label));
  if (target && "title" in target) segments.push(slugifyPathSegment(target.title));
  return `${origin}/${segments.join("/")}`;
}

function buildExplorerBreadcrumb(subject?: StudioSubject, path: StudioNode[] = []) {
  if (!subject) return [];
  return [subject.label, ...path.map((item) => item.label)].filter(Boolean);
}

function copyTextToClipboard(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  void navigator.clipboard.writeText(value);
}

function getStableDate(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 100_000;
  const month = (hash % 12) + 1;
  const day = (Math.floor(hash / 12) % 27) + 1;
  const hour = (Math.floor(hash / 500) % 12) + 1;
  const minute = Math.floor(hash / 17) % 60;
  return `${month}/${day}/2026 ${hour}:${String(minute).padStart(2, "0")} ${hash % 2 ? "AM" : "PM"}`;
}

function getExplorerSize(value: StudioNode | LocalContentItem | AttachedResourceItem) {
  if ("children" in value) return "";
  if ("questionCount" in value && value.questionCount) return `${value.questionCount} câu`;
  const seed = "title" in value ? value.title : "item";
  let hash = 0;
  for (const char of seed) hash = (hash * 17 + char.charCodeAt(0)) % 800_000;
  return `${Math.max(24, hash).toLocaleString("en-US")} KB`;
}

export function LearningResourceAuthoringWorkspace({ activeLeaf }: { activeLeaf: DashboardLeaf; onOpenLeaf?: (leafId: string) => void }) {
  const queryClient = useQueryClient();
  const [model, setModel] = useState<LearningResourceTaxonomyResponse>(emptyModel);
  const [resources, setResources] = useState<LearningResourceResourceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [dialogState, setDialogState] = useState<TaxonomyDialogState>(null);
  const [editTarget, setEditTarget] = useState<TaxonomyEditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaxonomyDeleteTarget | null>(null);
  const [localContentItems, setLocalContentItems] = useState<LocalContentItem[]>(mockExplorerLocalContent);
  const [editingLocalContent, setEditingLocalContent] = useState<LocalContentEditTarget>(null);

  const refreshData = useCallback(async (options: { force?: boolean } = {}) => {
    setLoading(true);
    try {
      if (options.force) {
        await queryClient.invalidateQueries({ queryKey: ["admin-operations", "learning-resources-v2"] });
        await queryClient.invalidateQueries({ queryKey: ["admin-operations", "learning-resources-v2"] });
      }

      const staleTime = options.force ? 0 : 60_000;
      const workspaceData = await queryClient.fetchQuery({
        queryKey: ["admin-operations", "learning-resources-v2", "workspace", 120],
        queryFn: () => loadLearningResourceStudioWorkspaceData(120),
        staleTime,
      });

      const normalizedSubjects = normalizeTaxonomyOptions(workspaceData.subjects);
      const nextModel = normalizedSubjects.length
        ? { ...normalizeContentModel(workspaceData.taxonomy), subjects: normalizedSubjects }
        : mockExplorerModel;
      const nextResources = normalizeResources(workspaceData.resources.data);
      setModel(nextModel);
      setResources(nextResources.length ? nextResources : mockExplorerResources);
      return nextModel;
    } catch {
      setModel(mockExplorerModel);
      setResources(mockExplorerResources);
      return mockExplorerModel;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  useEffect(() => {
    let mounted = true;
    const frameId = window.requestAnimationFrame(() => {
      void refreshData().finally(() => {
        if (!mounted) return;
      });
    });
    return () => {
      mounted = false;
      window.cancelAnimationFrame(frameId);
    };
  }, [refreshData]);

  const subjects = useMemo(() => buildSubjects(model, resources), [model, resources]);
  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) ?? subjects[0];
  const allNodes = selectedSubject ? flattenNodes(selectedSubject.tree) : [];
  const selectedNode = selectedSubject ? findNode(selectedSubject.tree, selectedNodeId) ?? allNodes[0] : undefined;
  const selectedPath = selectedSubject && selectedNode ? findPath(selectedSubject.tree, selectedNode.id) : [];

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
    if (!selectedSubject && subjects[0]) {
      setSelectedSubjectId(subjects[0].id);
      setSelectedNodeId(subjects[0].tree[0]?.id ?? "");
      return;
    }
    if (selectedSubject && !subjects.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId(selectedSubject.id);
    }
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [selectedSubject, selectedSubjectId, subjects]);

  const filteredSubjects = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return subjects;
    return subjects.filter((subject) => `${subject.label} ${subject.description ?? ""}`.toLowerCase().includes(keyword));
  }, [query, subjects]);

  const currentScreen = screenKind(activeLeaf.id);
  const meta = screenMeta[activeLeaf.id] ?? screenMeta["admin-learning-resources"];
  void meta;
  void loading;
  const selectedSubjectTarget = useMemo(
    () =>
      selectedSubject
        ? {
            kind: "subject" as const,
            id: selectedSubject.id,
            label: selectedSubject.label,
            description: selectedSubject.description,
            status: selectedSubject.status,
            metadata: selectedSubject.metadata,
          }
        : undefined,
    [selectedSubject],
  );
  const selectedNodeTarget = useMemo(() => toEditTargetFromNode(selectedNode), [selectedNode]);
  const openCreateSubjectDialog = useCallback(() => setDialogState({ mode: "subject" }), []);
  const openCreateRootDialog = useCallback(() => setDialogState({ mode: "root" }), []);
  const openCreateChildDialog = useCallback(() => setDialogState({ mode: "child" }), []);
  const selectStructureSubject = useCallback((subjectId: string) => {
    const nextSubject = subjects.find((subject) => subject.id === subjectId);
    setSelectedSubjectId(subjectId);
    setSelectedNodeId(nextSubject?.tree[0]?.id ?? "");
  }, [subjects]);
  const editSelectedSubject = useCallback(() => {
    if (selectedSubjectTarget) setEditTarget(selectedSubjectTarget);
  }, [selectedSubjectTarget]);
  const deleteSelectedSubject = useCallback(() => {
    if (selectedSubjectTarget) setDeleteTarget(selectedSubjectTarget);
  }, [selectedSubjectTarget]);
  const editSelectedNode = useCallback(() => {
    if (selectedNodeTarget) {
      setEditTarget(selectedNodeTarget);
      return;
    }
    if (selectedSubjectTarget) setEditTarget(selectedSubjectTarget);
  }, [selectedNodeTarget, selectedSubjectTarget]);
  const deleteSelectedNode = useCallback(() => {
    if (selectedNodeTarget) {
      setDeleteTarget(selectedNodeTarget);
      return;
    }
    if (selectedSubjectTarget) setDeleteTarget(selectedSubjectTarget);
  }, [selectedNodeTarget, selectedSubjectTarget]);
  const updateLocalContentItem = useCallback((itemId: string, patch: Partial<LocalContentItem>) => {
    setLocalContentItems((current) => current.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
  }, []);
  const deleteLocalContentItem = useCallback((itemId: string) => {
    setLocalContentItems((current) => current.filter((item) => item.id !== itemId));
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {currentScreen === "subjects" ? (
        <SubjectsScreen
          subjects={filteredSubjects}
          query={query}
          onQueryChange={setQuery}
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubjectId}
          onCreateSubject={openCreateSubjectDialog}
          onEditSubject={(subject) => setEditTarget({ kind: "subject", id: subject.id, label: subject.label, description: subject.description, status: subject.status, metadata: subject.metadata })}
          onDeleteSubject={(subject) => setDeleteTarget({ kind: "subject", id: subject.id, label: subject.label, description: subject.description, status: subject.status, metadata: subject.metadata })}
        />
      ) : null}
      {currentScreen === "structure" ? (
        <StructureScreen
          subjects={subjects}
          selectedSubject={selectedSubject}
          selectedNode={selectedNode}
          selectedPath={selectedPath}
          onSelectSubject={selectStructureSubject}
          onSelectNode={setSelectedNodeId}
          onCreateSubject={openCreateSubjectDialog}
          onCreateRoot={openCreateRootDialog}
          onCreateChild={openCreateChildDialog}
          onEditSubject={editSelectedSubject}
          onDeleteSubject={deleteSelectedSubject}
          onEditSelection={editSelectedNode}
          onDeleteSelection={deleteSelectedNode}
          onEditNodeSelection={(node) => {
            const target = toEditTargetFromNode(node);
            if (target) setEditTarget(target);
          }}
          onDeleteNodeSelection={(node) => {
            const target = toEditTargetFromNode(node);
            if (target) setDeleteTarget(target);
          }}
          localContentItems={localContentItems}
          onEditLocalContent={(item) => setEditingLocalContent(item)}
          onDeleteLocalContent={deleteLocalContentItem}
          onRefreshData={() => refreshData({ force: true }).then(() => undefined)}
          resources={resources}
        />
      ) : null}
      {currentScreen === "resources" ? <ResourcesScreen subjects={subjects} resources={resources} /> : null}
      {currentScreen === "upload" ? <UploadScreen subjects={subjects} selectedSubject={selectedSubject} allNodes={allNodes} /> : null}
      {currentScreen === "publish" ? <PublishScreen subjects={subjects} resources={resources} /> : null}
      <TaxonomyCreateDialog
        state={dialogState}
        selectedSubject={selectedSubject}
        selectedNode={selectedNode}
        selectedPath={selectedPath}
        onClose={() => setDialogState(null)}
        onCreateLocalContent={async (items) => {
          setLocalContentItems((current) => [...items, ...current]);
          setDialogState(null);
        }}
        onCreateLecture={async (payload) => {
          await createLearningResourceResource(payload);
          await refreshData({ force: true });
          setDialogState(null);
        }}
        onUploadResource={async () => {
          await refreshData({ force: true });
          setDialogState(null);
        }}
        onCreated={async ({ mode, kind, id }) => {
          const nextModel = await refreshData({ force: true });
          if (mode === "subject") {
            setSelectedSubjectId(id);
            setSelectedNodeId("");
            return;
          }
          const subjectStillExists = nextModel.subjects.some((subject) => subject.id === selectedSubject?.id);
          if (selectedSubject?.id && subjectStillExists) setSelectedSubjectId(selectedSubject.id);
          setSelectedNodeId(nodeIdForCreated(kind, id));
        }}
      />
      <TaxonomyEditDialog
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={async () => {
          await refreshData({ force: true });
          setEditTarget(null);
        }}
      />
      <TaxonomyDeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={async () => {
          await refreshData({ force: true });
          setDeleteTarget(null);
          if (deleteTarget?.kind === "subject") {
            setSelectedSubjectId("");
            setSelectedNodeId("");
          } else if (deleteTarget?.id === selectedNode?.optionId) {
            setSelectedNodeId("");
          }
        }}
      />
      <LocalContentEditDialog
        target={editingLocalContent}
        onClose={() => setEditingLocalContent(null)}
        onSaved={(patch) => {
          if (!editingLocalContent) return;
          updateLocalContentItem(editingLocalContent.id, patch);
          setEditingLocalContent(null);
        }}
      />
    </div>
  );
}

function SubjectsScreen({
  subjects,
  query,
  onQueryChange,
  selectedSubject,
  onSelectSubject,
  onCreateSubject,
  onEditSubject,
  onDeleteSubject,
}: {
  subjects: StudioSubject[];
  query: string;
  onQueryChange: (value: string) => void;
  selectedSubject?: StudioSubject;
  onSelectSubject: (id: string) => void;
  onCreateSubject: () => void;
  onEditSubject: (subject: StudioSubject) => void;
  onDeleteSubject: (subject: StudioSubject) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Danh sách môn học</CardTitle>
              <CardDescription>Mỗi môn có thể có nhiều nhóm học liệu, chủ đề và unit khác nhau.</CardDescription>
            </div>
            <Button onClick={onCreateSubject} className="bg-[var(--erg-blue)] hover:bg-blue-800">
              <Plus className="h-4 w-4" />
              Tạo môn học
            </Button>
          </div>
          <SearchInput value={query} onChange={onQueryChange} placeholder="Tìm môn học, chương trình, bộ sách" />
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_120px_120px] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <span>Môn học</span>
              <span>Category</span>
              <span>Tài liệu</span>
              <span>Trạng thái</span>
              <span className="text-right">Thao tác</span>
            </div>
            {subjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => onSelectSubject(subject.id)}
                className={cn(
                  "grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_120px_120px_120px_120px] items-center gap-3 border-t border-slate-200 px-4 py-4 text-left hover:bg-blue-50/50",
                  selectedSubject?.id === subject.id ? "bg-blue-50" : "bg-white",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-950">{subject.label}</span>
                  <span className="mt-1 block truncate text-sm text-slate-500">{subject.description || "Chưa có mô tả."}</span>
                </span>
                <span className="text-sm font-semibold text-slate-700">{subject.groupCount}</span>
                <span className="text-sm font-semibold text-slate-700">{subject.resourceCount}</span>
                <span>
                  <Badge tone={subject.status === "ACTIVE" || subject.status === "active" ? "success" : "outline"}>{getPublishStatusLabel(subject.status)}</Badge>
                </span>
                <span className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditSubject(subject);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteSubject(subject);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Môn đang chọn</CardTitle>
          <CardDescription>Thông tin tổng quát trước khi vào cấu trúc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedSubject ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xl font-bold text-slate-950">{selectedSubject.label}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{selectedSubject.description || "Môn này chưa có mô tả."}</p>
              </div>
              <InfoRow label="Nhóm học liệu" value={`${selectedSubject.groupCount} nhóm`} />
              <InfoRow label="Bài học" value={`${selectedSubject.lessonCount} bài`} />
              <InfoRow label="Tài liệu" value={`${selectedSubject.resourceCount} tài liệu`} />
              <InfoRow label="Trạng thái" value={getPublishStatusLabel(selectedSubject.status)} />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => onEditSubject(selectedSubject)}>
                  <Pencil className="h-4 w-4" />
                  Sửa môn
                </Button>
                <Button variant="danger" onClick={() => onDeleteSubject(selectedSubject)}>
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </Button>
              </div>
            </>
          ) : (
            <EmptyState title="Chưa chọn môn" description="Chọn một môn ở danh sách để xem chi tiết." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StructureScreen({
  subjects,
  selectedSubject,
  selectedNode,
  selectedPath,
  onSelectSubject,
  onSelectNode,
  onCreateSubject,
  onCreateRoot,
  onCreateChild,
  onEditSubject,
  onDeleteSubject,
  onEditSelection,
  onDeleteSelection,
  onEditNodeSelection,
  onDeleteNodeSelection,
  localContentItems,
  onEditLocalContent,
  onDeleteLocalContent,
  onRefreshData,
  resources,
}: {
  subjects: StudioSubject[];
  selectedSubject?: StudioSubject;
  selectedNode?: StudioNode;
  selectedPath: StudioNode[];
  onSelectSubject: (id: string) => void;
  onSelectNode: (id: string) => void;
  onCreateSubject: () => void;
  onCreateRoot: () => void;
  onCreateChild: () => void;
  onEditSubject: () => void;
  onDeleteSubject: () => void;
  onEditSelection: () => void;
  onDeleteSelection: () => void;
  onEditNodeSelection: (node: StudioNode) => void;
  onDeleteNodeSelection: (node: StudioNode) => void;
  localContentItems: LocalContentItem[];
  onEditLocalContent: (item: LocalContentItem) => void;
  onDeleteLocalContent: (itemId: string) => void;
  onRefreshData: () => Promise<void>;
  resources: LearningResourceResourceCard[];
}) {
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [treeQuery, setTreeQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node?: StudioNode; localContent?: LocalContentItem; resource?: AttachedResourceItem; subject?: StudioSubject } | null>(null);
  const [editingResource, setEditingResource] = useState<AttachedResourceItem | null>(null);
  const [attachedResources, setAttachedResources] = useState<Record<string, AttachedResourceItem>>({});
  const [selection, setSelection] = useState<StructureSelection>(null);
  const deferredTreeQuery = useDeferredValue(treeQuery);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setExpandedNodeIds(new Set(selectedSubject?.tree.map((node) => node.id) ?? []));
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [selectedSubject?.id, selectedSubject?.tree]);

  const currentChildren = useMemo(() => selectedNode?.children ?? selectedSubject?.tree ?? [], [selectedNode?.children, selectedSubject?.tree]);
  const selectedNodeOptionId = selectedNode?.optionId;
  const currentResources = useMemo(() => {
    if (!selectedSubject) return [];
    if (!selectedNode?.optionId) return resources.filter((resource) => resource.subjectId === selectedSubject.id);
    return resources.filter((resource) => {
      if (resource.subjectId !== selectedSubject.id) return false;
      return matchesResourceToLearningNode(resource, selectedNode as LearningResourceNode);
    });
  }, [resources, selectedNode, selectedSubject]);
  const currentAttachedResources = useMemo(
    () => currentResources.map((resource) => attachedResources[resource.id] ?? resource),
    [attachedResources, currentResources],
  );
  const currentLocalContentItems = useMemo(
    () => (selectedNodeOptionId ? localContentItems.filter((item) => item.parentOptionId === selectedNodeOptionId) : []),
    [localContentItems, selectedNodeOptionId],
  );
  const totalAttachedItems = currentResources.length + currentLocalContentItems.length;
  const showChildrenPanel = currentChildren.length > 0 || selectedNode?.kind !== "lesson";
  const filteredTree = useMemo(() => {
    if (!selectedSubject) {
      return [];
    }
    return filterTree(selectedSubject.tree, deferredTreeQuery);
  }, [deferredTreeQuery, selectedSubject]);
  const visibleRows = useMemo(() => flattenVisibleNodes(filteredTree, expandedNodeIds), [filteredTree, expandedNodeIds]);
  const selectedChildRow = useMemo(
    () => (selection?.type === "node" ? currentChildren.find((child) => child.id === selection.id) : undefined),
    [currentChildren, selection],
  );
  const selectedLocalContent = useMemo(
    () => (selection?.type === "local-content" ? currentLocalContentItems.find((item) => item.id === selection.id) : undefined),
    [currentLocalContentItems, selection],
  );
  const selectedAttachedResource = useMemo(
    () => (selection?.type === "resource" ? currentAttachedResources.find((item) => item.id === selection.id) : undefined),
    [currentAttachedResources, selection],
  );
  const canEditSelection = Boolean(selectedChildRow || selectedLocalContent || selectedAttachedResource);
  const canDeleteSelection = canEditSelection;

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!selection) return;
    if (selection.type === "node" && currentChildren.some((child) => child.id === selection.id)) return;
    if (selection.type === "local-content" && selectedLocalContent) return;
    if (selection.type === "resource" && selectedAttachedResource) return;
    const frameId = window.requestAnimationFrame(() => setSelection(null));
    return () => window.cancelAnimationFrame(frameId);
  }, [currentChildren, selectedAttachedResource, selectedLocalContent, selection]);

  useEffect(() => {
    let cancelled = false;
    const missingDetails = currentResources.filter((resource) => !attachedResources[resource.id]);
    if (!missingDetails.length) return;

    void Promise.all(
      missingDetails.map(async (resource) => {
        try {
          const detail = await loadLearningResourceResourceDetail(resource.id);
          const asset = detail.assets[0];
          return [
            resource.id,
            {
              ...resource,
              detail,
              asset,
              linkUrl: asset?.storageUrl || asset?.upstreamUrl,
            } satisfies AttachedResourceItem,
          ] as const;
        } catch {
          return [resource.id, { ...resource, linkUrl: undefined } satisfies AttachedResourceItem] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setAttachedResources((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [attachedResources, currentResources]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodeIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleCreateChild = useCallback((node?: StudioNode) => {
    if (node) {
      onSelectNode(node.id);
    }
    onCreateChild();
  }, [onCreateChild, onSelectNode]);
  const handleDeleteResource = useCallback(async (resource: AttachedResourceItem) => {
    await deleteLearningResourceResource(resource.id);
    setAttachedResources((current) => {
      const next = { ...current };
      delete next[resource.id];
      return next;
    });
    await onRefreshData();
  }, [onRefreshData]);

  const handleOpenResourceLink = useCallback((resource: AttachedResourceItem) => {
    const nextUrl = getDisplayLink(resource);
    if (!nextUrl || typeof window === "undefined") return;
    window.open(nextUrl, "_blank", "noopener,noreferrer");
  }, []);

  const handleEditSelection = useCallback(() => {
    if (selectedAttachedResource) {
      setEditingResource(selectedAttachedResource);
      return;
    }
    if (selectedLocalContent) {
      onEditLocalContent(selectedLocalContent);
      return;
    }
    if (selectedChildRow) {
      onEditNodeSelection(selectedChildRow);
      return;
    }
    onEditSelection();
  }, [onEditLocalContent, onEditNodeSelection, onEditSelection, selectedAttachedResource, selectedChildRow, selectedLocalContent]);

  const handleDeleteSelection = useCallback(async () => {
    if (selectedAttachedResource) {
      await handleDeleteResource(selectedAttachedResource);
      setSelection(null);
      return;
    }
    if (selectedLocalContent) {
      onDeleteLocalContent(selectedLocalContent.id);
      setSelection(null);
      return;
    }
    if (selectedChildRow) {
      onDeleteNodeSelection(selectedChildRow);
      return;
    }
    onDeleteSelection();
  }, [handleDeleteResource, onDeleteLocalContent, onDeleteNodeSelection, onDeleteSelection, selectedAttachedResource, selectedChildRow, selectedLocalContent]);

  const openContextMenu = useCallback((event: MouseEvent, node?: StudioNode, localContent?: LocalContentItem, resource?: AttachedResourceItem, subject?: StudioSubject) => {
    event.preventDefault();
    event.stopPropagation();
    if (subject) {
      onSelectSubject(subject.id);
    }
    if (node) {
      onSelectNode(node.id);
      setSelection({ type: "node", id: node.id });
    }
    if (localContent) {
      setSelection({ type: "local-content", id: localContent.id });
    }
    if (resource) {
      setSelection({ type: "resource", id: resource.id });
    }
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 240),
      y: Math.min(event.clientY, window.innerHeight - 260),
      node,
      localContent,
      resource,
      subject,
    });
  }, [onSelectNode, onSelectSubject]);

  const selectRootNode = useCallback(() => {
    const rootNodeId = selectedSubject?.tree[0]?.id;
    if (rootNodeId) onSelectNode(rootNodeId);
  }, [onSelectNode, selectedSubject?.tree]);
  const selectedExplorerUrl = buildExplorerPathUrl(selectedSubject, selectedPath);
  const explorerBreadcrumb = buildExplorerBreadcrumb(selectedSubject, selectedPath);

  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white text-[13px] text-slate-900 shadow-sm">
      <div className="flex h-12 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-[#374151]" onClick={selectRootNode} disabled={!selectedSubject}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-[#9aa5b1]" disabled>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-[#374151]" onClick={() => void onRefreshData()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <div className="flex h-8 min-w-0 flex-1 items-center overflow-hidden rounded-md bg-white px-2 shadow-[inset_0_0_0_1px_#e5e7eb]" title={explorerBreadcrumb.length ? selectedExplorerUrl : ""}>
          {explorerBreadcrumb.length ? <Monitor className="mx-2 h-4 w-4 shrink-0 text-[#52616f]" /> : null}
          {explorerBreadcrumb.map((label, index) => (
            <span key={`${label}-${index}`} className="flex min-w-0 items-center">
              {index > 0 ? <ChevronRight className="mx-1 h-3.5 w-3.5 shrink-0 text-[#6b7280]" /> : null}
              <span className={cn("truncate px-1.5 py-1 text-[13px]", index === explorerBreadcrumb.length - 1 ? "font-medium text-[#111827]" : "text-[#1f2937]")}>{label}</span>
            </span>
          ))}
        </div>
        <div className="flex h-8 w-[280px] max-w-[28vw] items-center rounded-md bg-white px-3 shadow-[inset_0_0_0_1px_#e5e7eb]">
          <Search className="mr-2 h-4 w-4 text-[#52616f]" />
          <input
            value={treeQuery}
            onChange={(event) => setTreeQuery(event.target.value)}
            placeholder={`Search ${selectedSubject?.label || "Resources"}`}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#64748b]"
          />
        </div>
      </div>

      <div className="flex h-12 items-center gap-1 border-b border-slate-200 bg-white px-3">
        <Button variant="ghost" size="sm" className="h-9 rounded px-2 text-[#1f2937]" onClick={onCreateSubject}>
          <Plus className="h-4 w-4" />
          New
        </Button>
        <div className="mx-2 h-7 w-px bg-[#e5e7eb]" />
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded text-[#8aa6c1]" disabled title="Cut">
          <Scissors className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded text-[#8aa6c1]" onClick={() => copyTextToClipboard(selectedExplorerUrl)} title="Copy URL">
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded text-[#8aa6c1]" disabled title="Paste">
          <Clipboard className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded text-[#8aa6c1]" onClick={handleEditSelection} disabled={!canEditSelection} title="Rename">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded text-[#8aa6c1]" onClick={() => void handleDeleteSelection()} disabled={!canDeleteSelection} title="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
        <div className="mx-2 h-7 w-px bg-[#e5e7eb]" />
        <Button variant="ghost" size="sm" className="h-9 rounded px-2 text-[#1f2937]" onClick={onCreateRoot} disabled={!selectedSubject}>
          <FolderPlus className="h-4 w-4" />
          New folder
        </Button>
        <Button variant="ghost" size="sm" className="h-9 rounded px-2 text-[#1f2937]" disabled>
          <ListTree className="h-4 w-4" />
          View
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded text-[#1f2937]" title="More">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
        <div className="ml-auto flex items-center gap-2 text-xs font-semibold text-slate-500">
          <ListTree className="h-4 w-4 text-[#2563eb]" />
          <span>Details</span>
        </div>
      </div>

      <div className="grid h-[calc(100vh-178px)] min-h-[560px] min-w-0 grid-cols-[242px_minmax(0,1fr)] overflow-hidden">
        <aside
          className="min-h-0 overflow-y-auto border-r border-[#e5e7eb] bg-[#fbfbfb] px-1.5 py-1 [scrollbar-gutter:stable]"
          onContextMenu={(event) => openContextMenu(event)}
        >
          <div className="space-y-0.5">
            {subjects.length ? subjects.map((subject) => (
              <div key={subject.id}>
                <button
                  type="button"
                  onClick={() => onSelectSubject(subject.id)}
                  onContextMenu={(event) => openContextMenu(event, undefined, undefined, undefined, subject)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px]",
                    selectedSubject?.id === subject.id ? "bg-[#dceeff] text-[#111827]" : "text-[#111827] hover:bg-[#eef6ff]",
                  )}
                >
                  <ChevronRight className={cn("h-3.5 w-3.5 text-[#6b7280]", selectedSubject?.id === subject.id ? "rotate-90" : undefined)} />
                  <Folder className="h-4 w-4 shrink-0 fill-[#f9c642] text-[#d99800]" />
                  <span className="min-w-0 flex-1 truncate">{subject.label}</span>
                </button>
                {selectedSubject?.id === subject.id ? (
                  <div className="ml-3 mt-0.5 space-y-0.5 pl-1">
                    {visibleRows.length ? visibleRows.map(({ node, depth }) => (
                      <ExplorerTreeRow
                        key={node.id}
                        node={node}
                        depth={depth}
                        selected={node.id === selectedNode?.id}
                        expanded={expandedNodeIds.has(node.id)}
                        onSelectNode={onSelectNode}
                        onToggleNode={toggleNode}
                        onCreateChild={handleCreateChild}
                        onOpenContextMenu={openContextMenu}
                      />
                    )) : (
                      <div className="px-2 py-3 text-xs text-slate-500">Không tìm thấy nội dung phù hợp.</div>
                    )}
                  </div>
                ) : null}
              </div>
            )) : (
              <div
                className="m-2 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs leading-5 text-slate-500"
                onContextMenu={(event) => openContextMenu(event)}
              >
                Chưa có môn học. Bấm New để bắt đầu.
              </div>
            )}
          </div>
        </aside>

        <section
          className="min-h-0 min-w-0 overflow-hidden bg-white"
          onContextMenu={(event) => openContextMenu(event)}
        >
          <div className="grid grid-cols-[minmax(260px,1fr)_145px_120px_90px] border-b border-[#d1d5db] bg-white text-[13px] text-[#27364a]">
            <span className="border-r border-[#e5e7eb] px-4 py-1.5">Name</span>
            <span className="border-r border-[#e5e7eb] px-3 py-1.5">Date modified</span>
            <span className="border-r border-[#e5e7eb] px-3 py-1.5">Type</span>
            <span className="px-3 py-1.5">Size</span>
          </div>
          <div className="h-[calc(100%-31px)] overflow-y-auto [scrollbar-gutter:stable]">
            {showChildrenPanel && currentChildren.map((child) => {
              const childUrl = buildExplorerPathUrl(selectedSubject, selectedPath, child);
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelection({ type: "node", id: child.id })}
                  onDoubleClick={() => onSelectNode(child.id)}
                  onContextMenu={(event) => openContextMenu(event, child)}
                  className={cn(
                    "grid w-full grid-cols-[minmax(260px,1fr)_145px_120px_90px] items-center text-left text-[13px] hover:bg-[#eef6ff]",
                    selection?.type === "node" && selection.id === child.id ? "bg-[#dceeff] ring-1 ring-inset ring-[#99c8ff]" : "bg-white",
                  )}
                  title={childUrl}
                >
                  <span className="flex min-w-0 items-center gap-2 px-4 py-1.5">
                    <span className="shrink-0 text-[#d99800]">{getNodeIcon(child, expandedNodeIds.has(child.id))}</span>
                    <span className="truncate text-[#111827]">{child.label}</span>
                  </span>
                  <span className="truncate px-3 text-[#4b5563]">{getStableDate(child.id)}</span>
                  <span className="truncate px-3 text-[#4b5563]">File folder</span>
                  <span className="truncate px-3 text-[#4b5563]">{getExplorerSize(child)}</span>
                </button>
              );
            })}
            {currentLocalContentItems.map((item) => {
              const link = getDisplayLink(item);
              const itemUrl = link || buildExplorerPathUrl(selectedSubject, selectedPath, item);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelection({ type: "local-content", id: item.id })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelection({ type: "local-content", id: item.id });
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onContextMenu={(event) => openContextMenu(event, undefined, item)}
                  className={cn(
                    "grid grid-cols-[minmax(260px,1fr)_145px_120px_90px] items-center text-left text-[13px] hover:bg-[#eef6ff]",
                    selection?.type === "local-content" && selection.id === item.id ? "bg-[#dceeff] ring-1 ring-inset ring-[#99c8ff]" : "bg-white",
                  )}
                  title={itemUrl}
                >
                  <span className="flex min-w-0 items-center gap-2 px-4 py-1.5">
                    <span className="shrink-0 text-[#2563eb]">{item.kind === "lecture" ? <Presentation className="h-4 w-4" /> : <FileCheck className="h-4 w-4" />}</span>
                    <span className="truncate text-[#111827]">{item.title}</span>
                  </span>
                  <span className="truncate px-3 text-[#4b5563]">{getStableDate(item.id)}</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (link && typeof window !== "undefined") window.open(link, "_blank", "noopener,noreferrer");
                    }}
                    className="truncate px-3 text-left text-[#4b5563] hover:underline"
                    title={itemUrl}
                  >
                    {item.kind === "lecture" ? "Microsoft PowerP..." : "Learning activity"}
                  </button>
                  <span className="truncate px-3 text-[#4b5563]">{getExplorerSize(item)}</span>
                </div>
              );
            })}
            {currentAttachedResources.map((resource) => {
              const resourceUrl = resource.linkUrl || buildExplorerPathUrl(selectedSubject, selectedPath, resource);
              return (
                <div
                  key={resource.id}
                  onClick={() => setSelection({ type: "resource", id: resource.id })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelection({ type: "resource", id: resource.id });
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onContextMenu={(event) => openContextMenu(event, undefined, undefined, resource)}
                  className={cn(
                    "grid grid-cols-[minmax(260px,1fr)_145px_120px_90px] items-center text-left text-[13px] hover:bg-[#eef6ff]",
                    selection?.type === "resource" && selection.id === resource.id ? "bg-[#dceeff] ring-1 ring-inset ring-[#99c8ff]" : "bg-white",
                  )}
                  title={resourceUrl}
                >
                  <span className="flex min-w-0 items-center gap-2 px-4 py-1.5">
                    <FileText className="h-4 w-4 shrink-0 text-[#2563eb]" />
                    <span className="truncate text-[#111827]">{resource.title}</span>
                  </span>
                  <span className="truncate px-3 text-[#4b5563]">{getStableDate(resource.id)}</span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenResourceLink(resource);
                    }}
                    className="truncate px-3 text-left text-[#4b5563] hover:underline"
                    title={resourceUrl}
                  >
                    {getResourceDisplayBadge(resource)}
                  </button>
                  <span className="truncate px-3 text-[#4b5563]">{getExplorerSize(resource)}</span>
                </div>
              );
            })}
            {!currentChildren.length && !totalAttachedItems ? (
              <div className="flex h-full min-h-[340px] flex-col items-center justify-center text-center text-[13px]">
                <Folder className="h-12 w-12 text-[#cbd5e1]" />
                <div className="mt-3 font-semibold text-[#111827]">This folder is empty</div>
                <p className="mt-1 max-w-sm text-[#64748b]">Dùng chuột phải hoặc nút New để tạo thư mục, bài học hoặc gắn tài liệu.</p>
              </div>
            ) : null}
          </div>
        </section>

            {contextMenu ? (
              <StructureContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                node={contextMenu.node}
                localContent={contextMenu.localContent}
                resource={contextMenu.resource}
                subject={contextMenu.subject}
                canCopyUrl={Boolean(contextMenu.node || contextMenu.localContent || contextMenu.resource || contextMenu.subject || selectedSubject)}
                canCreateRoot={Boolean(contextMenu.subject || selectedSubject)}
                canCreateChild={Boolean((contextMenu.node ?? selectedNode)?.optionId)}
                onCreateSubject={() => {
                  setContextMenu(null);
                  onCreateSubject();
                }}
                onCreateRoot={() => {
                  setContextMenu(null);
                  onCreateRoot();
                }}
                onCreateChild={() => {
                  setContextMenu(null);
                  handleCreateChild(contextMenu.node ?? selectedNode);
                }}
                onRefresh={() => {
                  setContextMenu(null);
                  void onRefreshData();
                }}
                onEdit={() => {
                  setContextMenu(null);
                  if (contextMenu.subject) {
                    onEditSubject();
                    return;
                  }
                  handleEditSelection();
                }}
                onDelete={() => {
                  setContextMenu(null);
                  if (contextMenu.subject) {
                    onDeleteSubject();
                    return;
                  }
                  void handleDeleteSelection();
                }}
                onOpen={() => {
                  const targetResource = contextMenu.resource;
                  const targetLocal = contextMenu.localContent;
                  const targetNode = contextMenu.node;
                  const targetSubject = contextMenu.subject;
                  setContextMenu(null);
                  if (targetSubject) {
                    onSelectSubject(targetSubject.id);
                    return;
                  }
                  if (targetResource) {
                    handleOpenResourceLink(targetResource);
                    return;
                  }
                  const localLink = targetLocal ? getDisplayLink(targetLocal) : undefined;
                  if (localLink && typeof window !== "undefined") {
                    window.open(localLink, "_blank", "noopener,noreferrer");
                    return;
                  }
                  if (targetNode) onSelectNode(targetNode.id);
                }}
                onCopyUrl={() => {
                  const target = contextMenu.node || contextMenu.localContent || contextMenu.resource;
                  const link = contextMenu.resource ? getDisplayLink(contextMenu.resource) : contextMenu.localContent ? getDisplayLink(contextMenu.localContent) : undefined;
                  const subjectPath = contextMenu.subject ? buildExplorerPathUrl(contextMenu.subject, []) : buildExplorerPathUrl(selectedSubject, selectedPath, target);
                  copyTextToClipboard(link || subjectPath);
                  setContextMenu(null);
                }}
              />
            ) : null}
            <ResourceEditDialog
              target={editingResource}
              onClose={() => setEditingResource(null)}
              onSaved={async () => {
                setEditingResource(null);
                await onRefreshData();
              }}
            />
      </div>
      <div className="flex h-6 items-center justify-between border-t border-[#e5e7eb] bg-white px-3 text-[12px] text-[#334155]">
        <span>{currentChildren.length + totalAttachedItems} items</span>
        <span className="max-w-[60%] truncate" title={selectedExplorerUrl}>{selectedExplorerUrl}</span>
      </div>
    </div>
  );
}

function StructureContextMenu({
  x,
  y,
  node,
  localContent,
  resource,
  subject,
  canCopyUrl,
  canCreateRoot,
  canCreateChild,
  onCreateSubject,
  onCreateRoot,
  onCreateChild,
  onRefresh,
  onEdit,
  onDelete,
  onOpen,
  onCopyUrl,
}: {
  x: number;
  y: number;
  node?: StudioNode;
  localContent?: LocalContentItem;
  resource?: AttachedResourceItem;
  subject?: StudioSubject;
  canCopyUrl: boolean;
  canCreateRoot: boolean;
  canCreateChild: boolean;
  onCreateSubject: () => void;
  onCreateRoot: () => void;
  onCreateChild: () => void;
  onRefresh: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpen: () => void;
  onCopyUrl: () => void;
}) {
  const hasTarget = Boolean(node || localContent || resource || subject);
  const canOpen = Boolean(subject || node || resource?.linkUrl || (localContent && getDisplayLink(localContent)));
  const targetTitle = node?.label || localContent?.title || resource?.title || subject?.label || "Vị trí hiện tại";
  const targetType = node ? getNodeKindLabel(node.kind) : localContent ? (localContent.kind === "lecture" ? "Bài giảng" : "Bài tập") : resource ? getResourceDisplayBadge(resource) : subject ? "Môn học" : "Thư mục hiện tại";
  return (
    <div
      className="fixed z-50 w-[294px] overflow-hidden rounded-md border border-[#d8d8d8] bg-white py-1 text-[13px] text-[#1f1f1f] shadow-[0_8px_24px_rgba(15,23,42,0.18)]"
      style={{ left: x, top: y }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="border-b border-[#eeeeee] px-3 py-2">
        <div className="truncate font-medium">{targetTitle}</div>
        <div className="truncate text-[12px] text-[#6b7280]">{targetType}</div>
      </div>
      <button type="button" onClick={onOpen} disabled={!canOpen} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]">
        <ArrowUpRight className="h-4 w-4 text-[#374151]" />
        Mở
      </button>
      <button type="button" onClick={onRefresh} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6]">
        <RefreshCw className="h-4 w-4 text-[#374151]" />
        Làm mới dữ liệu
      </button>
      <div className="my-1 h-px bg-[#eeeeee]" />
      <button type="button" onClick={onEdit} disabled={!hasTarget} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]">
        <Pencil className="h-4 w-4 text-[#374151]" />
        Sửa tên / thông tin
      </button>
      <button type="button" onClick={onCopyUrl} disabled={!canCopyUrl} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]">
        <Copy className="h-4 w-4 text-[#374151]" />
        Copy đường dẫn
      </button>
      <button type="button" onClick={onDelete} disabled={!hasTarget} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]">
        <Trash2 className="h-4 w-4 text-[#dc2626]" />
        Xóa
      </button>
      <div className="my-1 h-px bg-[#eeeeee]" />
      <button type="button" onClick={onCreateSubject} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6]">
        <BookOpen className="h-4 w-4 text-[#374151]" />
        Tạo môn học
      </button>
      <button type="button" onClick={onCreateRoot} disabled={!canCreateRoot} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]">
        <FolderPlus className="h-4 w-4 text-[#374151]" />
        Tạo nhóm học liệu
      </button>
      <button
        type="button"
        onClick={onCreateChild}
        disabled={!canCreateChild}
        className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]"
      >
        <Plus className="h-4 w-4 text-[#374151]" />
        Thêm bên trong
      </button>
    </div>
  );
}

function ResourcesScreen({ subjects, resources }: { subjects: StudioSubject[]; resources: LearningResourceResourceCard[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Kho tài liệu</CardTitle>
            <CardDescription>Cập nhật thông tin, trạng thái và nơi gắn tài liệu.</CardDescription>
          </div>
          <Button className="bg-[var(--erg-blue)] hover:bg-blue-800">
            <LinkIcon className="h-4 w-4" />
            Gắn link tài liệu
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <SearchInput value="" onChange={() => undefined} placeholder="Tìm tài liệu" />
          <select className={inputClassName}>
            <option>Tất cả môn học</option>
            {subjects.map((subject) => (
              <option key={subject.id}>{subject.label}</option>
            ))}
          </select>
          <select className={inputClassName}>
            <option>Tất cả định dạng</option>
            <option>PDF</option>
            <option>PPTX</option>
            <option>Video</option>
            <option>Audio</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {resources.length ? (
          <div className="grid gap-3">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[var(--erg-blue)]">
                  <LibraryBig className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-950">{resource.title}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {resource.fileTypeBadge || resource.selectedFileType} · {getPublishStatusLabel(resource.status)}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Cập nhật
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có tài liệu" description="Khi BE trả resources, danh sách sẽ hiển thị ở đây để cập nhật riêng." />
        )}
      </CardContent>
    </Card>
  );
}

function UploadScreen({
  subjects,
  selectedSubject,
  allNodes,
}: {
  subjects: StudioSubject[];
  selectedSubject?: StudioSubject;
  allNodes: StudioNode[];
}) {
  const [subjectId, setSubjectId] = useState(selectedSubject?.id ?? "");
  const subject = subjects.find((item) => item.id === subjectId) ?? selectedSubject ?? subjects[0];
  const subjectNodes = useMemo(() => (subject ? flattenNodes(subject.tree) : allNodes), [allNodes, subject]);
  const [nodeId, setNodeId] = useState(subjectNodes[0]?.id ?? "");
  const node = subjectNodes.find((item) => item.id === nodeId) ?? subjectNodes[0];
  const path = subject && node ? findPath(subject.tree, node.id) : [];
  const location = buildResourceLocation(path);
  const [title, setTitle] = useState("");
  const [fileType, setFileType] = useState("PDF");
  const [resourceUrl, setResourceUrl] = useState("");
  const [totalSlides, setTotalSlides] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!subjectId && selectedSubject?.id) {
      const frameId = window.requestAnimationFrame(() => setSubjectId(selectedSubject.id));
      return () => window.cancelAnimationFrame(frameId);
    }
  }, [selectedSubject?.id, subjectId]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setNodeId(subjectNodes[0]?.id ?? ""));
    return () => window.cancelAnimationFrame(frameId);
  }, [subject?.id, subjectNodes]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUrl = normalizeGoogleViewerUrl(resourceUrl);
    if (!normalizedUrl || !subject || !location.categoryId) {
      setMessage("Vui lòng chọn môn, vị trí có nhóm học liệu và dán link Google Drive/Google Slides.");
      return;
    }
    const parsedTotalSlides = parsePositiveInteger(totalSlides);
    if (fileType === "PPTX" && totalSlides.trim() && !parsedTotalSlides) {
      setMessage("Tổng số slide phải là số nguyên lớn hơn 0.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await uploadLearningResourceResource({
        title: title.trim() || "Tài liệu Google Drive",
        selectedFileType: fileType,
        subjectId: subject.id,
        programSlug: subject.id,
        categoryId: location.categoryId,
        sectionId: location.sectionId,
        bookSeriesId: location.bookSeriesId,
        topicId: location.topicId,
        documentTypeId: location.categoryId,
        status: "published",
        visibility: "public",
        upstreamUrl: normalizedUrl,
        totalSlides: parsedTotalSlides,
        canDownload: fileType !== "PPTX",
      });
      setMessage("Đã lưu link và gắn tài liệu vào đúng vị trí trong cây học liệu.");
      setTitle("");
      setResourceUrl("");
      setTotalSlides("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không lưu được link tài liệu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Gắn tài liệu bằng link</CardTitle>
          <CardDescription>Chọn môn, vị trí trong cấu trúc và dán link Google Drive/Google Slides để giáo viên mở trực tiếp.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpload}>
            <Field label="Môn học">
              <select className={inputClassName} value={subject?.id ?? ""} onChange={(event) => setSubjectId(event.target.value)}>
                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Gắn vào vị trí">
              <select className={inputClassName} value={node?.id ?? ""} onChange={(event) => setNodeId(event.target.value)}>
                {subjectNodes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {pathLabel(subject?.label ?? "", findPath(subject?.tree ?? [], item.id))}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tên hiển thị">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Bài giảng Unit 1" />
            </Field>
            <Field label="Loại tài liệu">
              <select className={inputClassName} value={fileType} onChange={(event) => setFileType(event.target.value)}>
                <option value="PPTX">Bài giảng điện tử</option>
                <option value="PDF">PDF / Giáo trình</option>
                <option value="AUDIO">Audio</option>
                <option value="VIDEO">Video</option>
                <option value="ZIP">Gói học liệu ZIP</option>
                <option value="HTML5">HTML5</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Link Google Drive / Google Slides">
                <Input
                  value={resourceUrl}
                  onChange={(event) => setResourceUrl(event.target.value)}
                  placeholder="Dán link share, preview hoặc embed từ Google Drive"
                />
                <p className="text-xs leading-5 text-slate-500">
                  FE sẽ lưu link vào asset, không upload file thật. Link Google Drive dạng `/file/d/.../view` sẽ được chuẩn hóa về `/preview`.
                </p>
              </Field>
            </div>
            {fileType === "PPTX" ? (
              <div className="md:col-span-2">
                <Field label="Tổng số slide">
                  <Input
                    value={totalSlides}
                    onChange={(event) => setTotalSlides(event.target.value.replace(/[^\d]/g, ""))}
                    inputMode="numeric"
                    placeholder="Ví dụ: 20"
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    Dùng cho popup xác nhận khi giáo viên back hoặc tắt bài trình chiếu.
                  </p>
                </Field>
              </div>
            ) : null}
            {message ? <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{message}</div> : null}
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving || !resourceUrl.trim() || !subject || !location.categoryId} className="bg-[var(--erg-blue)] hover:bg-blue-800">
                {saving ? "Đang lưu..." : "Lưu link và gắn tài liệu"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin vị trí</CardTitle>
          <CardDescription>Giúp giáo viên kiểm tra link sẽ được gắn vào đâu trước khi lưu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Môn" value={subject?.label ?? "Chưa chọn"} />
          <InfoRow label="Vị trí" value={pathLabel(subject?.label ?? "", path) || "Chưa chọn"} />
          <InfoRow label="Loại" value={node ? getNodeKindLabel(node.kind) : "Chưa chọn"} />
          <ChecklistItem label={location.categoryId ? "Đã xác định nhóm học liệu" : "Cần chọn một nhóm học liệu"} />
          <ChecklistItem label={resourceUrl.trim() ? "Đã nhập link tài liệu" : "Chưa nhập link tài liệu"} />
        </CardContent>
      </Card>
    </div>
  );
}

function buildResourceLocation(path: StudioNode[]) {
  const location: { categoryId?: string; sectionId?: string; bookSeriesId?: string; topicId?: string } = {};
  for (const item of path) {
    if (item.location.categoryId) location.categoryId = item.location.categoryId;
    if (item.location.sectionId) location.sectionId = item.location.sectionId;
    if (item.location.bookSeriesId) location.bookSeriesId = item.location.bookSeriesId;
    if (item.location.topicId) location.topicId = item.location.topicId;
  }
  return location;
}

function parsePositiveInteger(value: string) {
  const normalized = Number(value.trim());
  if (!Number.isInteger(normalized) || normalized <= 0) return undefined;
  return normalized;
}

function pathLabel(subjectLabel: string, path: StudioNode[]) {
  return [subjectLabel, ...path.map((item) => item.label)].filter(Boolean).join(" / ");
}

function PublishScreen({ subjects, resources }: { subjects: StudioSubject[]; resources: LearningResourceResourceCard[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <PublishCard title="Môn học" value={subjects.length} description="Sẵn sàng đưa vào catalog." />
      <PublishCard title="Tài liệu" value={resources.length} description="Đang có trong kho học liệu." />
      <PublishCard title="Cần kiểm tra" value={resources.filter((item) => item.status !== "published").length} description="Chưa ở trạng thái đã xuất bản." />
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Luồng xuất bản đề xuất</CardTitle>
          <CardDescription>Tách khỏi màn hình tạo cấu trúc để admin kiểm tra trước khi public.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <PublishStep icon={<BookOpen className="h-5 w-5" />} title="Môn học" description="Có tên, mô tả và trạng thái." />
          <PublishStep icon={<ListTree className="h-5 w-5" />} title="Cấu trúc" description="Có nhóm học liệu, chủ đề và unit/lesson." />
          <PublishStep icon={<LinkIcon className="h-5 w-5" />} title="Tài liệu" description="Link tài liệu đã được gắn đúng vị trí." />
          <PublishStep icon={<Settings2 className="h-5 w-5" />} title="Public" description="Kiểm tra visibility trước khi lên web." />
        </CardContent>
      </Card>
    </div>
  );
}

const ExplorerTreeRow = memo(function ExplorerTreeRow({
  node,
  depth = 0,
  selected,
  expanded,
  onSelectNode,
  onToggleNode,
  onCreateChild,
  onOpenContextMenu,
}: {
  node: StudioNode;
  depth?: number;
  selected: boolean;
  expanded: boolean;
  onSelectNode: (id: string) => void;
  onToggleNode: (id: string) => void;
  onCreateChild: (node: StudioNode) => void;
  onOpenContextMenu: (event: MouseEvent, node: StudioNode) => void;
}) {
  const hasChildren = node.children.length > 0;
  return (
    <div
      className={cn(
        "group grid grid-cols-[18px_minmax(0,1fr)_24px] items-center gap-1 rounded-sm py-0.5 text-[13px]",
        selected ? "bg-[#dceeff] text-[#111827]" : "text-[#111827] hover:bg-[#eef6ff]",
      )}
      style={{ paddingLeft: `${4 + Math.min(depth, 8) * 18}px` }}
      onContextMenu={(event) => onOpenContextMenu(event, node)}
    >
      <button
        type="button"
        onClick={() => (hasChildren ? onToggleNode(node.id) : onSelectNode(node.id))}
        className="grid h-6 w-5 place-items-center rounded text-[#6b7280]"
        aria-label={expanded ? "Thu gọn" : "Mở rộng"}
      >
        {hasChildren ? (expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />) : <span />}
      </button>
      <button type="button" onClick={() => onSelectNode(node.id)} className="flex min-w-0 items-center gap-2 rounded px-1 py-1 text-left">
        <span className={cn("shrink-0 text-[#d99800]", selected ? "text-[#d99800]" : undefined)}>{getNodeIcon(node, expanded)}</span>
        <span
          className="truncate text-[13px] leading-5 text-[#111827]"
          title={node.label}
        >
          {node.label}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onCreateChild(node)}
        disabled={!node.optionId}
        className="grid h-6 w-6 place-items-center rounded text-[#9ca3af] opacity-0 hover:bg-[#dceeff] hover:text-[#2563eb] group-hover:opacity-100 disabled:cursor-not-allowed disabled:text-[#cbd5e1]"
        aria-label="Thêm nội dung bên trong"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});

function getNodeIcon(node: StudioNode, expanded?: boolean) {
  const text = `${node.label} ${node.description ?? ""}`.toLowerCase();
  if (text.includes("audio") || text.includes("âm thanh") || text.includes("phát âm")) {
    return <Headphones className="h-4 w-4" />;
  }
  if (text.includes("ppt") || text.includes("slide") || text.includes("bài giảng điện tử") || text.includes("presentation")) {
    return <Presentation className="h-4 w-4" />;
  }
  if (text.includes("giáo án") || text.includes("kế hoạch")) {
    return <ClipboardList className="h-4 w-4" />;
  }
  if (text.includes("kiểm tra") || text.includes("quiz") || text.includes("question") || text.includes("bài tập")) {
    return <FileCheck className="h-4 w-4" />;
  }
  if (text.includes("video") || text.includes("hoạt hình")) {
    return <Video className="h-4 w-4" />;
  }
  if (text.includes("tranh") || text.includes("ảnh") || text.includes("image")) {
    return <ImageIcon className="h-4 w-4" />;
  }
  if (text.includes("link") || text.includes("liên kết")) {
    return <LinkIcon className="h-4 w-4" />;
  }
  if (text.includes("sách") || text.includes("giáo trình")) {
    return <BookMarked className="h-4 w-4" />;
  }
  if (text.includes("unit") || text.includes("lesson") || text.includes("bài ")) {
    return <GraduationCap className="h-4 w-4" />;
  }
  if (node.kind === "group" || node.kind === "folder") {
    return expanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />;
  }
  if (node.kind === "lesson") {
    return <FileText className="h-4 w-4" />;
  }
  return <HelpCircle className="h-4 w-4" />;
}

function getNodeKindLabel(kind: StudioNodeKind) {
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

function flattenVisibleNodes(nodes: StudioNode[], expandedNodeIds: Set<string>, depth = 0): Array<{ node: StudioNode; depth: number }> {
  return nodes.flatMap((node) => [
    { node, depth },
    ...(expandedNodeIds.has(node.id) ? flattenVisibleNodes(node.children, expandedNodeIds, depth + 1) : []),
  ]);
}

function filterTree(nodes: StudioNode[], query: string): StudioNode[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return nodes;
  }

  return nodes
    .map((node) => {
      const children = filterTree(node.children, normalizedQuery);
      const matched = node.label.toLowerCase().includes(normalizedQuery) || node.kind.toLowerCase().includes(normalizedQuery);
      return matched || children.length ? { ...node, children } : null;
    })
    .filter(Boolean) as StudioNode[];
}

function defaultStatusForOption(option: ContentDialogOptionId | null, isSubject: boolean) {
  if (isSubject || option === "category" || option === "section" || option === null) {
    return "active";
  }
  return "published";
}

function TaxonomyCreateDialog({
  state,
  selectedSubject,
  selectedNode,
  selectedPath,
  onClose,
  onCreateLocalContent,
  onCreateLecture,
  onUploadResource,
  onCreated,
}: {
  state: TaxonomyDialogState;
  selectedSubject?: StudioSubject;
  selectedNode?: StudioNode;
  selectedPath: StudioNode[];
  onClose: () => void;
  onCreateLocalContent: (items: LocalContentItem[]) => Promise<void>;
  onCreateLecture: (payload: {
    title: string;
    subtitle?: string;
    description?: string;
    thumbnailUrl?: string;
    upstreamUrl?: string;
    programSlug: string;
    subjectId: string;
    categoryId: string;
    sectionId?: string;
    bookSeriesId?: string;
    topicId?: string;
    documentTypeId?: string;
    selectedFileType: "PPTX";
    totalSlides?: number;
    status: string;
    visibility: string;
    canDownload: boolean;
  }) => Promise<void>;
  onUploadResource: () => Promise<void>;
  onCreated: (result: { mode: TaxonomyCreateMode; kind: TaxonomyCreateKind; id: string }) => Promise<void>;
}) {
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [selectedOption, setSelectedOption] = useState<ContentDialogOptionId | null>(null);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<TaxonomyCreateKind>("category");
  const [slidesUrl, setSlidesUrl] = useState("");
  const [slidesTotal, setSlidesTotal] = useState("");
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [resourceFileType, setResourceFileType] = useState("PDF");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceTotalSlides, setResourceTotalSlides] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const open = Boolean(state);
  const isSubject = state?.mode === "subject";
  const title = isSubject
    ? "Tạo môn học"
    : state?.mode === "root"
      ? "Tạo nhóm học liệu"
      : selectedNode?.kind === "group"
        ? "Tạo bài học"
        : selectedNode?.kind === "lesson"
          ? "Thêm tài liệu vào bài học"
          : "Thêm nội dung bên trong";
  const descriptionText = isSubject
    ? "Môn học là cấp đầu tiên. Sau khi tạo, bạn sẽ xây dựng các nhóm học liệu, chủ đề và unit bên trong."
    : state?.mode === "root"
      ? "Tạo một nhóm học liệu ở cấp đầu tiên dưới môn học, ví dụ Level 1, Level 2 hoặc Học phần bổ trợ."
      : selectedNode?.kind === "group"
        ? "Tạo bài học nằm bên trong nhóm học liệu đang chọn."
        : selectedNode?.kind === "lesson"
          ? "Chọn loại nội dung cần gắn vào bài học: bài giảng, bài tập hoặc tài liệu."
          : "Nội dung mới sẽ nằm bên trong vị trí đang chọn.";
  const selectedContentNodeKind =
    selectedNode?.kind === "group" || selectedNode?.kind === "lesson" || selectedNode?.kind === "folder" ? selectedNode.kind : undefined;
  const availableOptions = useMemo(
    () => getAvailableContentOptions(state?.mode ?? "subject", selectedContentNodeKind),
    [selectedContentNodeKind, state?.mode],
  );
  const selectedOptionMeta = selectedOption ? getAddContentOptionMeta(selectedOption) : null;
  const resourceLocation = buildResourceLocation(selectedPath);
  const filteredExercises = filterMockExercises(mockExerciseLibrary, {
    query: exerciseQuery,
    subjectId: selectedSubject?.id,
    subjectLabel: selectedSubject?.label,
    topicLabel: selectedNode?.kind === "group" ? selectedNode.label : undefined,
    sectionLabel: selectedNode?.kind === "lesson" ? selectedNode.label : undefined,
  });

  useEffect(() => {
    if (!open) return;
    const frameId = window.requestAnimationFrame(() => {
      const autoOption = isSubject ? "category" : availableOptions.length === 1 ? availableOptions[0] : null;
      setStep(autoOption ? "details" : "pick");
      setSelectedOption(autoOption);
      setLabel("");
      setDescription("");
      setKind(autoOption === "section" ? "section" : "category");
      setSlidesUrl("");
      setSlidesTotal("");
      setExerciseQuery("");
      setSelectedExerciseIds([]);
      setResourceFileType("PDF");
      setResourceUrl("");
      setResourceTotalSlides("");
      setStatus(defaultStatusForOption(autoOption, isSubject));
      setError("");
      setSaving(false);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [availableOptions, isSubject, open, selectedNode?.kind, state?.mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (selectedOption === "lecture") {
        const trimmedLabel = label.trim();
        const normalizedSlidesUrl = normalizeGoogleSlidesUrl(slidesUrl);
        if (!trimmedLabel) throw new Error("Vui lòng nhập tên bài giảng.");
        if (!selectedSubject || !selectedNode?.optionId) throw new Error("Vui lòng chọn lesson hoặc bài học trước.");
        if (!normalizedSlidesUrl) throw new Error("Vui lòng dán link Google Slides.");
        const parsedTotalSlides = parsePositiveInteger(slidesTotal);
        if (slidesTotal.trim() && !parsedTotalSlides) throw new Error("Tổng số slide phải là số nguyên lớn hơn 0.");
        const resourceLocation = buildResourceLocation(selectedPath);
        if (!resourceLocation.categoryId) throw new Error("Vị trí hiện tại chưa xác định được nhóm học liệu để gắn bài giảng.");
        await onCreateLecture({
          title: trimmedLabel,
          subtitle: "Google Slides",
          description: description.trim(),
          upstreamUrl: normalizedSlidesUrl,
          programSlug: selectedSubject.id,
          subjectId: selectedSubject.id,
          categoryId: resourceLocation.categoryId,
          sectionId: resourceLocation.sectionId,
          bookSeriesId: resourceLocation.bookSeriesId,
          topicId: resourceLocation.topicId,
          documentTypeId: "lecture",
          selectedFileType: "PPTX",
          totalSlides: parsedTotalSlides,
          status,
          visibility: status === "hidden" ? "private" : "public",
          canDownload: false,
        });
        return;
      }

      if (selectedOption === "exercise") {
        const parentOptionId = selectedNode?.optionId;
        if (!selectedSubject || !parentOptionId) throw new Error("Vui lòng chọn lesson hoặc bài học trước.");
        if (!selectedExerciseIds.length) throw new Error("Vui lòng chọn ít nhất một bài tập.");
        const selectedExercises = filteredExercises.filter((item) => selectedExerciseIds.includes(item.id));
        await onCreateLocalContent(
          selectedExercises.map((item) => ({
            id: `exercise-${item.id}-${Date.now()}`,
            kind: "exercise",
            subjectId: selectedSubject.id,
            parentNodeId: selectedNode.id,
            parentOptionId,
            title: item.title,
            description: description.trim() || `${item.topicLabel ?? ""} · ${item.sectionLabel ?? ""}`.replace(/^ · | · $/g, ""),
            topicLabel: item.topicLabel,
            sectionLabel: item.sectionLabel,
            questionCount: item.questionCount,
            durationMinutes: item.durationMinutes,
            status,
          })),
        );
        return;
      }

      if (selectedOption === "resource") {
        const normalizedResourceUrl = normalizeGoogleViewerUrl(resourceUrl);
        if (!selectedSubject || !selectedNode) throw new Error("Vui lòng chọn vị trí cần gắn tài liệu.");
        if (!resourceLocation.categoryId) throw new Error("Vị trí hiện tại chưa xác định được nhóm học liệu để gắn tài liệu.");
        if (!normalizedResourceUrl) throw new Error("Vui lòng dán link Google Drive/Google Slides.");
        const parsedTotalSlides = parsePositiveInteger(resourceTotalSlides);
        if (resourceFileType === "PPTX" && resourceTotalSlides.trim() && !parsedTotalSlides) throw new Error("Tổng số slide phải là số nguyên lớn hơn 0.");
        await uploadLearningResourceResource({
          title: label.trim() || "Tài liệu Google Drive",
          description: description.trim(),
          selectedFileType: resourceFileType,
          subjectId: selectedSubject.id,
          programSlug: selectedSubject.id,
          categoryId: resourceLocation.categoryId,
          sectionId: resourceLocation.sectionId,
          bookSeriesId: resourceLocation.bookSeriesId,
          topicId: resourceLocation.topicId,
          documentTypeId: resourceFileType,
          status,
          visibility: status === "hidden" ? "private" : "public",
          upstreamUrl: normalizedResourceUrl,
          totalSlides: parsedTotalSlides,
          canDownload: resourceFileType !== "PPTX",
        });
        await onUploadResource();
        return;
      }

      const resolvedKind = isSubject ? "category" : kind;
      const trimmedLabel = label.trim();
      if (!trimmedLabel) {
        throw new Error(isSubject ? "Vui lòng nhập tên môn học." : "Vui lòng nhập tên.");
      }
      if (!isSubject && !selectedSubject) {
        throw new Error("Vui lòng chọn môn học trước.");
      }
      if (state?.mode === "child" && !selectedNode) {
        throw new Error("Vui lòng chọn mục cha trước.");
      }

      const payload: CreateTaxonomyPayload = {
        label: trimmedLabel,
        description: description.trim(),
        status,
      };

      if (!isSubject && selectedSubject) {
        payload.subjectId = selectedSubject.id;
      }

      if (state?.mode === "child" && selectedNode?.optionId) {
        if (resolvedKind === "category") {
          payload.parentId = selectedNode.optionId;
        }
        if (resolvedKind === "section") {
          const currentLocation = buildResourceLocation(selectedPath);
          if (!currentLocation.categoryId) {
            throw new Error("Nhóm học liệu hiện tại chưa xác định được category gốc để tạo bài học.");
          }
          payload.categoryId = currentLocation.categoryId;
          if (selectedNode.sourceKind === "topic" && selectedNode.optionId) payload.topicId = selectedNode.optionId;
          if (selectedNode.sourceKind === "bookSeries" && selectedNode.optionId) payload.bookSeriesId = selectedNode.optionId;
        }
      }

      const created = normalizeTaxonomyOption(
        await createLearningResourceTaxonomy(isSubject ? "subjects" : apiKindForNodeKind(resolvedKind), payload),
      );
      if (!created?.id) {
        throw new Error("BE đã tạo dữ liệu nhưng không trả về id hợp lệ.");
      }
      await onCreated({ mode: state?.mode ?? "subject", kind: resolvedKind, id: created.id });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể tạo mục. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  function toggleExercise(exerciseId: string) {
    setSelectedExerciseIds((current) => (current.includes(exerciseId) ? current.filter((item) => item !== exerciseId) : [...current, exerciseId]));
  }

  function handleLectureTitleChange(value: string) {
    if (isGoogleSlidesUrl(value)) {
      setSlidesUrl(value);
      setLabel("");
      return;
    }
    setLabel(value);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-[calc(100vw-2rem)] lg:w-[60vw] lg:max-w-[60vw]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isSubject ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Vị trí trong cấu trúc</div>
              <div className="mt-2 font-semibold text-slate-950">{selectedSubject?.label || "Chưa chọn môn"}</div>
              {state?.mode === "child" ? (
                <div className="mt-1 text-sm text-slate-600">
                  Bên trong: <span className="font-semibold text-[var(--erg-blue)]">{selectedNode?.label || "Chưa chọn"}</span>
                </div>
              ) : (
                <div className="mt-1 text-sm text-slate-600">Nằm ở cấp đầu tiên của môn học.</div>
              )}
            </div>
          ) : null}

          {step === "pick" ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {availableOptions.map((optionId) => {
                  const option = getAddContentOptionMeta(optionId);
                  return (
                    <button
                      key={optionId}
                      type="button"
                      onClick={() => {
                        setSelectedOption(optionId);
                        if (optionId === "category" || optionId === "section") {
                          setKind(optionId);
                        }
                        setStep("details");
                      }}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-[var(--erg-blue)] hover:bg-blue-50/40"
                    >
                      <span className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[var(--erg-blue)]">{option.icon}</span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-950">{option.title}</span>
                          <span className="mt-1 block text-sm leading-6 text-slate-500">{option.description}</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
                Với `bài giảng`, popup sẽ ưu tiên link Google Slides. Với `bài tập`, giao diện hiện đang dùng danh sách mock để chờ nối DB thật.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!isSubject && selectedOptionMeta ? (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[var(--erg-blue)]">{selectedOptionMeta.icon}</span>
                    <div>
                      <div className="font-semibold text-slate-950">{selectedOptionMeta.title}</div>
                      <div className="text-sm text-slate-500">{selectedOptionMeta.description}</div>
                    </div>
                  </div>
                  {availableOptions.length > 1 ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => setStep("pick")}>
                      <ChevronLeft className="h-4 w-4" />
                      Chọn lại
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {selectedOption === "lecture" ? (
                <>
                  <ContentTextFields
                    titleLabel="Tên bài giảng"
                    titlePlaceholder="Ví dụ: Bài giảng Bài 01"
                    titleValue={label}
                    onTitleChange={handleLectureTitleChange}
                    descriptionLabel="Mô tả ngắn"
                    descriptionPlaceholder="Ví dụ: Slide dùng cho tiết mở đầu, có note cho giáo viên"
                    descriptionValue={description}
                    onDescriptionChange={setDescription}
                    autoFocus
                  />
                  <ContentLinkField
                    label="Link Google Slides"
                    value={slidesUrl}
                    onChange={setSlidesUrl}
                    placeholder="Dán link edit, publish hoặc embed của Google Slides"
                    hint="Popup này lưu link Google Slides vào asset, không upload file thật lên server."
                  />
                  <Field label="Tổng số slide">
                    <Input
                      value={slidesTotal}
                      onChange={(event) => setSlidesTotal(event.target.value.replace(/[^\d]/g, ""))}
                      inputMode="numeric"
                      placeholder="Ví dụ: 20"
                    />
                    <p className="text-xs leading-5 text-slate-500">
                      Dùng cho popup xác nhận khi giáo viên back hoặc tắt bài trình chiếu.
                    </p>
                  </Field>
                  <StatusSelectField value={status} onChange={setStatus} />
                </>
              ) : null}

              {selectedOption === "exercise" ? (
                <>
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
                    <Field label="Tìm bài tập">
                      <Input value={exerciseQuery} onChange={(event) => setExerciseQuery(event.target.value)} placeholder="Tìm theo tên, chủ đề hoặc độ khó" autoFocus />
                    </Field>
                    <Field label="Môn học">
                      <Input value={selectedSubject?.label ?? "Chưa chọn"} readOnly />
                    </Field>
                    <Field label="Ngữ cảnh">
                      <Input value={selectedNode?.label ?? "Chưa chọn"} readOnly />
                    </Field>
                  </div>
                  <ContentTextFields
                    titleLabel="Tên hiển thị"
                    titlePlaceholder="Ví dụ: Bài tập luyện cuối tiết"
                    titleValue={label}
                    onTitleChange={setLabel}
                    descriptionLabel="Ghi chú cho lần gắn này"
                    descriptionPlaceholder="Ví dụ: Giao cuối tiết hoặc dùng để luyện tập về nhà"
                    descriptionValue={description}
                    onDescriptionChange={setDescription}
                    autoFocus
                  />
                  <StatusSelectField value={status} onChange={setStatus} />
                  <div className="rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div className="font-semibold text-slate-950">Danh sách bài tập mock</div>
                      <Badge tone="outline">{filteredExercises.length} bài</Badge>
                    </div>
                    <div className="grid max-h-[320px] gap-2 overflow-y-auto p-3">
                      {filteredExercises.length ? (
                        filteredExercises.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleExercise(item.id)}
                            className={cn(
                              "rounded-2xl border p-3 text-left",
                              selectedExerciseIds.includes(item.id) ? "border-[var(--erg-blue)] bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-950">{item.title}</div>
                                <div className="mt-1 text-xs leading-5 text-slate-500">
                                  {item.topicLabel} {item.sectionLabel ? `· ${item.sectionLabel}` : ""}
                                </div>
                              </div>
                              <input type="checkbox" readOnly checked={selectedExerciseIds.includes(item.id)} className="mt-1 h-4 w-4 accent-[var(--erg-blue)]" />
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <Badge tone="secondary">{item.difficulty}</Badge>
                              <span>{item.questionCount} câu hỏi</span>
                              <span>{item.durationMinutes} phút</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                          Không có bài tập mock khớp với bộ lọc hiện tại.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}

              {selectedOption === "resource" ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Loại tài liệu">
                      <select className={inputClassName} value={resourceFileType} onChange={(event) => setResourceFileType(event.target.value)}>
                        <option value="PDF">PDF / Giáo trình</option>
                        <option value="PPTX">Bài giảng điện tử</option>
                        <option value="VIDEO">Video</option>
                        <option value="AUDIO">Audio</option>
                        <option value="IMAGE">Ảnh / thumbnail</option>
                        <option value="ZIP">Gói học liệu ZIP</option>
                        <option value="HTML5">HTML5</option>
                      </select>
                    </Field>
                    <div className="md:col-span-2">
                      <ContentTextFields
                        titleLabel="Tên hiển thị"
                        titlePlaceholder="Ví dụ: Unit 1 - Lesson 1"
                        titleValue={label}
                        onTitleChange={setLabel}
                        descriptionLabel="Mô tả ngắn"
                        descriptionPlaceholder="Ví dụ: Tài liệu dùng cho tiết mở đầu hoặc bài luyện tập"
                        descriptionValue={description}
                        onDescriptionChange={setDescription}
                        autoFocus
                      />
                    </div>
                    <div className="md:col-span-2">
                      <ContentLinkField
                        label="Link Google Drive / Google Slides"
                        value={resourceUrl}
                        onChange={setResourceUrl}
                        placeholder="Dán link share, preview hoặc embed từ Google Drive"
                        hint={`Link sẽ được lưu vào asset của tài liệu tại ${pathLabel(selectedSubject?.label ?? "", selectedPath)}. Không upload file thật lên server.`}
                      />
                    </div>
                    {resourceFileType === "PPTX" ? (
                      <div className="md:col-span-2">
                        <Field label="Tổng số slide">
                          <Input
                            value={resourceTotalSlides}
                            onChange={(event) => setResourceTotalSlides(event.target.value.replace(/[^\d]/g, ""))}
                            inputMode="numeric"
                            placeholder="Ví dụ: 20"
                          />
                          <p className="text-xs leading-5 text-slate-500">
                            Dùng cho popup đánh dấu khi giáo viên back/tắt trình chiếu.
                          </p>
                        </Field>
                      </div>
                    ) : null}
                    <div className="md:col-span-2">
                      <StatusSelectField value={status} onChange={setStatus} />
                    </div>
                  </div>
                </>
              ) : null}

              {(!selectedOption || selectedOption === "category" || selectedOption === "section" || isSubject) ? (
                <>
                  <ContentTextFields
                    titleLabel={isSubject ? "Tên môn học" : "Tên hiển thị"}
                    titlePlaceholder={isSubject ? "Ví dụ: IC3 GS6" : kind === "category" ? "Ví dụ: Chủ đề 1, Học phần bổ trợ" : "Ví dụ: Bài 01. Làm quen với máy tính"}
                    titleValue={label}
                    onTitleChange={setLabel}
                    descriptionLabel="Mô tả ngắn"
                    descriptionPlaceholder="Giúp giáo viên hiểu mục này dùng để làm gì"
                    descriptionValue={description}
                    onDescriptionChange={setDescription}
                    autoFocus
                  />

                  {!isSubject ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Đang tạo: <b>{kind === "category" ? "Nhóm học liệu" : "Bài học"}</b>. Loại này được quyết định theo vị trí đang chọn trong cây.
                    </div>
                  ) : null}
                  <StatusSelectField value={status} onChange={setStatus} taxonomy />
                </>
              ) : null}
            </div>
          )}

          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Hủy
            </Button>
            {step === "details" ? (
              <Button
                type="submit"
                disabled={
                  saving ||
                  (selectedOption === "exercise"
                    ? !selectedExerciseIds.length
                    : selectedOption === "resource"
                      ? !resourceUrl.trim()
                    : selectedOption === "lecture"
                      ? !label.trim() || !slidesUrl.trim()
                      : !label.trim())
                }
                className="bg-[var(--erg-blue)] hover:bg-blue-800"
              >
                {saving
                  ? "Đang lưu..."
                  : selectedOption === "lecture"
                    ? "Thêm bài giảng"
                    : selectedOption === "exercise"
                      ? "Gắn bài tập"
                      : selectedOption === "resource"
                        ? "Gắn link tài liệu"
                        : selectedOption === "category"
                          ? "Tạo nhóm học liệu"
                          : selectedOption === "section"
                            ? "Tạo bài học"
                            : "Tạo mới"}
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TaxonomyEditDialog({
  target,
  onClose,
  onSaved,
}: {
  target: TaxonomyEditTarget | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [presentationUrl, setPresentationUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const showPresentationField = Boolean(target && target.kind === "section");

  useEffect(() => {
    if (!target) return;
    const frameId = window.requestAnimationFrame(() => {
      setLabel(target.label);
      setDescription(target.description || "");
      setStatus(target.status || "active");
      setCoverImageUrl(target.metadata?.coverImageUrl || "");
      setPresentationUrl(target.metadata?.presentationUrl || "");
      setPdfUrl(target.metadata?.pdfUrl || "");
      setExternalUrl(target.metadata?.externalUrl || "");
      setError("");
      setSaving(false);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [target]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setError("Vui lòng nhập tên.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateLearningResourceTaxonomy(apiKindForEditTarget(target.kind), target.id, {
        label: trimmedLabel,
        description: description.trim(),
        status,
        metadata: {
          ...(target.metadata ?? {}),
          coverImageUrl,
          ...(showPresentationField ? { presentationUrl } : { presentationUrl: "" }),
          pdfUrl,
          externalUrl,
        },
      });
      await onSaved();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể cập nhật. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Sửa {target?.kind === "subject" ? "môn học" : "nội dung học liệu"}</DialogTitle>
          <DialogDescription>Cập nhật tên, mô tả và trạng thái để LMS hiển thị rõ ràng hơn.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ContentTextFields
            titleLabel="Tên hiển thị"
            titleValue={label}
            onTitleChange={setLabel}
            descriptionLabel="Mô tả cho giáo viên/học sinh"
            descriptionValue={description}
            onDescriptionChange={setDescription}
            autoFocus
          />
          <StatusSelectField value={status} onChange={setStatus} taxonomy />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="font-semibold text-slate-950">Thông tin hiển thị trên LMS</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Cấu trúc lưu phần mô tả và ảnh đại diện. Tài liệu thật sẽ được gắn bằng link Google Drive/Google Slides ở phần Nội dung hoặc màn Gắn link.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Ảnh bìa / thumbnail URL">
                <Input value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} placeholder="https://.../cover.webp" />
              </Field>
              {showPresentationField ? (
                <Field label="Link bài giảng PPT/Slides">
                  <Input value={presentationUrl} onChange={(event) => setPresentationUrl(event.target.value)} placeholder="https://docs.google.com/presentation/..." />
                </Field>
              ) : null}
              <Field label="Link PDF">
                <Input value={pdfUrl} onChange={(event) => setPdfUrl(event.target.value)} placeholder="https://.../file.pdf" />
              </Field>
              <Field label="Link ngoài">
                <Input value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="https://..." />
              </Field>
            </div>
          </div>
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
            <Button type="submit" disabled={saving || !label.trim()} className="bg-[var(--erg-blue)] hover:bg-blue-800">
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResourceEditDialog({
  target,
  onClose,
  onSaved,
}: {
  target: AttachedResourceItem | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [status, setStatus] = useState("published");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!target) return;
    const frameId = window.requestAnimationFrame(() => {
      setTitle(target.title);
      setDescription(target.detail?.description || "");
      setLinkUrl(target.linkUrl || "");
      setStatus(target.asset?.status || target.status || "published");
      setSaving(false);
      setError("");
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [target]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;
    setSaving(true);
    setError("");
    try {
      const normalizedUrl = linkUrl.trim() ? normalizeGoogleViewerUrl(linkUrl) || linkUrl.trim() : undefined;
      await updateLearningResourceResource(target.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        visibility: status === "hidden" ? "private" : "public",
      });
      if (target.asset?.id) {
        await updateLearningResourceAsset(target.asset.id, {
          title: title.trim(),
          storageUrl: normalizedUrl,
          upstreamUrl: normalizedUrl,
          status,
        });
      }
      await onSaved();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể cập nhật tài liệu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Sửa tài liệu</DialogTitle>
          <DialogDescription>Cập nhật tên, link và trạng thái hiển thị của tài liệu.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ContentTextFields
            titleLabel="Tên hiển thị"
            titleValue={title}
            onTitleChange={setTitle}
            descriptionLabel="Mô tả"
            descriptionValue={description}
            onDescriptionChange={setDescription}
            autoFocus
          />
          <ContentLinkField
            label="Link tài liệu"
            value={linkUrl}
            onChange={setLinkUrl}
            placeholder="https://docs.google.com/... hoặc link PDF"
          />
          <StatusSelectField value={status} onChange={setStatus} />
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
            <Button type="submit" disabled={saving || !title.trim()} className="bg-[var(--erg-blue)] hover:bg-blue-800">
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LocalContentEditDialog({
  target,
  onClose,
  onSaved,
}: {
  target: LocalContentEditTarget;
  onClose: () => void;
  onSaved: (patch: Partial<LocalContentItem>) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [status, setStatus] = useState("published");

  useEffect(() => {
    if (!target) return;
    const frameId = window.requestAnimationFrame(() => {
      setTitle(target.title);
      setDescription(target.description || "");
      setResourceUrl(target.slidesUrl || target.resourceUrl || "");
      setStatus(target.status || "published");
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [target]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSaved({
      title: title.trim(),
      description: description.trim(),
      slidesUrl: target?.kind === "lecture" ? resourceUrl.trim() : undefined,
      resourceUrl: target?.kind === "exercise" ? resourceUrl.trim() : undefined,
      status,
    });
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sửa {target?.kind === "exercise" ? "bài tập" : "bài giảng"}</DialogTitle>
          <DialogDescription>Cập nhật nội dung hiển thị và trạng thái trong màn biên soạn.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ContentTextFields
            titleLabel="Tên hiển thị"
            titleValue={title}
            onTitleChange={setTitle}
            descriptionLabel="Mô tả"
            descriptionValue={description}
            onDescriptionChange={setDescription}
            autoFocus
          />
          <ContentLinkField
            label={target?.kind === "exercise" ? "Link tham chiếu" : "Link bài giảng"}
            value={resourceUrl}
            onChange={setResourceUrl}
            placeholder="https://..."
          />
          <StatusSelectField value={status} onChange={setStatus} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" className="bg-[var(--erg-blue)] hover:bg-blue-800">Lưu thay đổi</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TaxonomyDeleteDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: TaxonomyDeleteTarget | null;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!target) return;
    const frameId = window.requestAnimationFrame(() => {
      setDeleting(false);
      setError("");
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [target]);

  async function handleDelete() {
    if (!target) return;
    setDeleting(true);
    setError("");
    try {
      await deleteLearningResourceTaxonomy(apiKindForEditTarget(target.kind), target.id);
      await onDeleted();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không thể xóa. Vui lòng thử lại.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Xóa {target?.label}</DialogTitle>
          <DialogDescription>Thao tác này xóa nội dung khỏi DB. Nếu mục có cấp dưới hoặc tài liệu liên quan, bạn nên chuyển dữ liệu trước khi xóa.</DialogDescription>
        </DialogHeader>
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>Hủy</Button>
          <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
