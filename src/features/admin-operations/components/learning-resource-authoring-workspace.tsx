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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createHocLieuResource,
  createHocLieuTaxonomy,
  deleteHocLieuTaxonomy,
  deleteHocLieuResource,
  loadHocLieuResourceDetail,
  loadHocLieuStudioWorkspaceData,
  updateHocLieuTaxonomy,
  updateHocLieuAsset,
  updateHocLieuResource,
  uploadHocLieuResource,
  type CreateTaxonomyPayload,
  type HocLieuAssetDetail,
  type HocLieuResourceCard,
  type HocLieuResourceDetail,
  type HocLieuTaxonomyOption,
  type HocLieuTaxonomyResponse,
} from "@/features/admin-operations/api/learning-resource-authoring-api";
import { mockExerciseLibrary } from "@/features/admin-operations/api/mock-exercise-library";
import type { DashboardLeaf } from "@/features/dashboard/types/dashboard-types";
import {
  filterMockExercises,
  getAvailableContentOptions,
  isGoogleSlidesUrl,
  normalizeGoogleSlidesUrl,
  normalizeGoogleViewerUrl,
  type ContentDialogOptionId,
} from "@/features/admin-operations/utils/learning-resource-content-dialog";
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
type AttachedResourceItem = HocLieuResourceCard & {
  detail?: HocLieuResourceDetail;
  asset?: HocLieuAssetDetail;
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

const emptyModel: HocLieuTaxonomyResponse = {
  grades: [],
  subjects: [],
  categories: [],
  sections: [],
  bookSeries: [],
  topics: [],
  fileTypes: [],
  designerPresets: [],
};

const mockExplorerModel: HocLieuTaxonomyResponse = {
  ...emptyModel,
  subjects: [
    {
      id: "mock-ic3-gs6",
      label: "IC3 GS6",
      slug: "ic3-gs6",
      description: "Mock môn h?c IC3 GS6 v?i các level h?c li?u.",
      status: "active",
    },
    {
      id: "mock-ai-iig-subject",
      label: "AI - IIG",
      slug: "ai-iig",
      description: "Mock môn h?c AI và ch?ng ch? IIG.",
      status: "active",
    },
  ],
  categories: [
    {
      id: "mock-ic3-level-1",
      label: "Level 1",
      slug: "level-1",
      subjectId: "mock-ic3-gs6",
      description: "N?n t?ng máy tính và thao tác co b?n.",
      sortOrder: 1,
      status: "active",
    },
    {
      id: "mock-ic3-level-2",
      label: "Level 2",
      slug: "level-2",
      subjectId: "mock-ic3-gs6",
      description: "?ng d?ng van phòng và Internet.",
      sortOrder: 2,
      status: "active",
    },
    {
      id: "mock-ic3-level-3",
      label: "Level 3",
      slug: "level-3",
      subjectId: "mock-ic3-gs6",
      description: "Ôn t?p, ki?m tra và luy?n ch?ng ch?.",
      sortOrder: 3,
      status: "active",
    },
    {
      id: "mock-ai-foundation",
      label: "AI Foundation",
      slug: "ai-foundation",
      subjectId: "mock-ai-iig-subject",
      description: "Nhóm h?c li?u AI co b?n.",
      sortOrder: 1,
      status: "active",
    },
  ],
  sections: [
    {
      id: "mock-ic3-lv1-intro",
      label: "01. Làm quen v?i máy tính",
      slug: "lam-quen-voi-may-tinh",
      subjectId: "mock-ic3-gs6",
      categoryId: "mock-ic3-level-1",
      description: "Khái ni?m thi?t b?, h? di?u hành và qu?n lý t?p.",
      sortOrder: 1,
      status: "active",
    },
    {
      id: "mock-ic3-lv1-files",
      label: "02. Qu?n lý thu m?c và t?p",
      slug: "quan-ly-thu-muc-va-tep",
      subjectId: "mock-ic3-gs6",
      categoryId: "mock-ic3-level-1",
      description: "T? ch?c file, folder và tài nguyên h?c t?p.",
      sortOrder: 2,
      status: "active",
    },
    {
      id: "mock-ic3-lv2-office",
      label: "01. Word, Excel, PowerPoint",
      slug: "word-excel-powerpoint",
      subjectId: "mock-ic3-gs6",
      categoryId: "mock-ic3-level-2",
      description: "Th?c hành b? ?ng d?ng van phòng.",
      sortOrder: 1,
      status: "active",
    },
    {
      id: "mock-ic3-lv2-internet",
      label: "02. Internet và an toàn s?",
      slug: "internet-va-an-toan-so",
      subjectId: "mock-ic3-gs6",
      categoryId: "mock-ic3-level-2",
      description: "Tìm ki?m, email và an toàn tr?c tuy?n.",
      sortOrder: 2,
      status: "active",
    },
    {
      id: "mock-ic3-lv3-practice",
      label: "01. Ôn t?p ch?ng ch?",
      slug: "on-tap-chung-chi",
      subjectId: "mock-ic3-gs6",
      categoryId: "mock-ic3-level-3",
      description: "Ð? luy?n t?p t?ng h?p.",
      sortOrder: 1,
      status: "active",
    },
    {
      id: "mock-ai-overview",
      label: "01. T?ng quan AI trong h?c t?p",
      slug: "ai-overview",
      subjectId: "mock-ai-iig-subject",
      categoryId: "mock-ai-foundation",
      description: "Bài m? d?u v? AI cho h?c sinh.",
      sortOrder: 1,
      status: "active",
    },
  ],
};

const mockExplorerResources: HocLieuResourceCard[] = [
  {
    id: "mock-resource-ai-slides",
    slug: "slide-ai-overview",
    title: "Slide - T?ng quan AI trong h?c t?p",
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
    title: "Level 1 - tài li?u hu?ng d?n",
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
    title: "B? câu h?i ôn t?p Level 3",
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
    title: "Bài gi?ng Google Slides - T?ng quan AI",
    description: "Mock link m? tr?c ti?p trong tab m?i.",
    slidesUrl: "https://docs.google.com/presentation/d/mock-ai-overview/preview",
    status: "published",
  },
  {
    id: "mock-local-ai-exercise",
    kind: "exercise",
    subjectId: "mock-ic3-gs6",
    parentNodeId: "lesson-mock-ic3-lv1-files",
    parentOptionId: "mock-ic3-lv1-files",
    title: "Bài t?p: S?p x?p thu m?c dúng chu?n",
    description: "Mock bài t?p n?i b?.",
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
    title: "Ch? d? h?c li?u",
    description: "T?o môn h?c, xây cây ch? d? và g?n tài li?u theo m?t lu?ng duy nh?t.",
    icon: <ListTree className="h-5 w-5" />,
  },
  "admin-learning-structure": {
    title: "C?u trúc",
    description: "T? ch?c môn h?c thành nhóm h?c li?u, ch? d? và unit/lesson d? Hoclieu hi?n th?.",
    icon: <ListTree className="h-5 w-5" />,
  },
  "admin-learning-resource-list": {
    title: "Tài li?u",
    description: "Tra c?u và c?p nh?t h?c li?u dã g?n vào t?ng v? trí trong c?u trúc môn h?c.",
    icon: <LibraryBig className="h-5 w-5" />,
  },
  "admin-learning-resource-upload": {
    title: "G?n link",
    description: "Dán link Google Drive/Google Slides và ch?n noi g?n trong cây h?c li?u.",
    icon: <LinkIcon className="h-5 w-5" />,
  },
  "admin-learning-resource-publish": {
    title: "Xu?t b?n",
    description: "Ki?m tra tr?ng thái s?n sàng tru?c khi hi?n th? trên Hoclieu.",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
};

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizeTaxonomyOption(option: HocLieuTaxonomyOption | null | undefined): HocLieuTaxonomyOption | null {
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

function normalizeTaxonomyOptions(options: HocLieuTaxonomyOption[] | null | undefined): HocLieuTaxonomyOption[] {
  return safeArray(options).map(normalizeTaxonomyOption).filter(Boolean) as HocLieuTaxonomyOption[];
}

function normalizeContentModel(model: HocLieuTaxonomyResponse | null | undefined): HocLieuTaxonomyResponse {
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

function normalizeResources(resources: HocLieuResourceCard[] | null | undefined): HocLieuResourceCard[] {
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

function buildSubjects(model: HocLieuTaxonomyResponse, resources: HocLieuResourceCard[]): StudioSubject[] {
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
      title: "Nhóm h?c li?u",
      description: "M?i nhóm h?c li?u ch? ch?a danh sách bài h?c bên trong.",
      icon: <Folder className="h-5 w-5" />,
    };
  }
  if (optionId === "section") {
    return {
      title: "Bài h?c",
      description: "Bài h?c là noi g?n slide thuy?t trình, bài t?p và tài li?u trong cùng m?t ch?.",
      icon: <GraduationCap className="h-5 w-5" />,
    };
  }
  if (optionId === "lecture") {
    return {
      title: "Bài gi?ng",
      description: "Uu tiên dán link Google Slides d? m? tr?c ti?p t? LMS mà không c?n upload file.",
      icon: <Presentation className="h-5 w-5" />,
    };
  }
  if (optionId === "resource") {
    return {
      title: "Tài li?u",
      description: "Dán link Google Drive/Google Slides d? g?n tài li?u tr?c ti?p trong popup này.",
      icon: <LinkIcon className="h-5 w-5" />,
    };
  }
  return {
    title: "Bài t?p",
    description: "Ch?n t? danh sách bài t?p mock theo môn, ch? d? và bài h?c d? g?n nhanh vào lesson.",
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
  if (status === "hidden") return "Ðã ?n";
  if (status === "draft") return "B?n nháp";
  if (status === "active" || status === "published") return "Ðã xu?t b?n";
  return "B?n nháp";
}

function getResourceDisplayBadge(resource: AttachedResourceItem) {
  const link = resource.linkUrl?.toLowerCase() || "";
  if (link.includes("docs.google.com/presentation")) return "Google Slides";
  if (link.includes("drive.google.com")) return "Google Drive";

  const rawType = (resource.fileTypeBadge || resource.selectedFileType || "").toUpperCase();
  if (rawType === "PPTX" || rawType === "LINK") return "Bài gi?ng";
  if (rawType === "PDF") return "PDF";
  if (rawType === "VIDEO") return "Video";
  if (rawType === "AUDIO") return "Audio";
  if (rawType === "HTML5") return "HTML5";
  if (rawType === "ZIP") return "T?p nén";

  return "Tài li?u";
}

function slugifyPathSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/d/g, "d")
    .replace(/Ð/g, "D")
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
  const [model, setModel] = useState<HocLieuTaxonomyResponse>(emptyModel);
  const [resources, setResources] = useState<HocLieuResourceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [dialogState, setDialogState] = useState<TaxonomyDialogState>(null);
  const [editTarget, setEditTarget] = useState<TaxonomyEditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaxonomyDeleteTarget | null>(null);
  const [localContentItems, setLocalContentItems] = useState<LocalContentItem[]>(mockExplorerLocalContent);
  const [editingLocalContent, setEditingLocalContent] = useState<LocalContentEditTarget>(null);

  async function refreshData(options: { force?: boolean } = {}) {
    setLoading(true);
    try {
      if (options.force) {
        await queryClient.invalidateQueries({ queryKey: ["admin-operations", "learning-resources-v2"] });
        await queryClient.invalidateQueries({ queryKey: ["hoclieu"] });
      }

      const staleTime = options.force ? 0 : 60_000;
      const workspaceData = await queryClient.fetchQuery({
        queryKey: ["admin-operations", "learning-resources-v2", "workspace", 120],
        queryFn: () => loadHocLieuStudioWorkspaceData(120),
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
  }

  useEffect(() => {
    let mounted = true;
    void refreshData().finally(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, []);

  const subjects = useMemo(() => buildSubjects(model, resources), [model, resources]);
  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) ?? subjects[0];
  const allNodes = selectedSubject ? flattenNodes(selectedSubject.tree) : [];
  const selectedNode = selectedSubject ? findNode(selectedSubject.tree, selectedNodeId) ?? allNodes[0] : undefined;
  const selectedPath = selectedSubject && selectedNode ? findPath(selectedSubject.tree, selectedNode.id) : [];

  useEffect(() => {
    if (!selectedSubject && subjects[0]) {
      setSelectedSubjectId(subjects[0].id);
      setSelectedNodeId(subjects[0].tree[0]?.id ?? "");
      return;
    }
    if (selectedSubject && !subjects.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId(selectedSubject.id);
    }
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
          await createHocLieuResource(payload);
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
              <CardTitle>Danh sách môn h?c</CardTitle>
              <CardDescription>M?i môn có th? có nhi?u nhóm h?c li?u, ch? d? và unit khác nhau.</CardDescription>
            </div>
            <Button onClick={onCreateSubject} className="bg-[var(--erg-blue)] hover:bg-blue-800">
              <Plus className="h-4 w-4" />
              T?o môn h?c
            </Button>
          </div>
          <SearchInput value={query} onChange={onQueryChange} placeholder="Tìm môn h?c, chuong trình, b? sách" />
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_120px_120px] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <span>Môn h?c</span>
              <span>Category</span>
              <span>Tài li?u</span>
              <span>Tr?ng thái</span>
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
                  <span className="mt-1 block truncate text-sm text-slate-500">{subject.description || "Chua có mô t?."}</span>
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
          <CardTitle>Môn dang ch?n</CardTitle>
          <CardDescription>Thông tin t?ng quát tru?c khi vào c?u trúc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedSubject ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xl font-bold text-slate-950">{selectedSubject.label}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{selectedSubject.description || "Môn này chua có mô t?."}</p>
              </div>
              <InfoRow label="Nhóm h?c li?u" value={`${selectedSubject.groupCount} nhóm`} />
              <InfoRow label="Bài h?c" value={`${selectedSubject.lessonCount} bài`} />
              <InfoRow label="Tài li?u" value={`${selectedSubject.resourceCount} tài li?u`} />
              <InfoRow label="Tr?ng thái" value={getPublishStatusLabel(selectedSubject.status)} />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => onEditSubject(selectedSubject)}>
                  <Pencil className="h-4 w-4" />
                  S?a môn
                </Button>
                <Button variant="danger" onClick={() => onDeleteSubject(selectedSubject)}>
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </Button>
              </div>
            </>
          ) : (
            <EmptyState title="Chua ch?n môn" description="Ch?n m?t môn ? danh sách d? xem chi ti?t." />
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
  resources: HocLieuResourceCard[];
}) {
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [treeQuery, setTreeQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node?: StudioNode; localContent?: LocalContentItem; resource?: AttachedResourceItem; subject?: StudioSubject } | null>(null);
  const [editingResource, setEditingResource] = useState<AttachedResourceItem | null>(null);
  const [attachedResources, setAttachedResources] = useState<Record<string, AttachedResourceItem>>({});
  const [selection, setSelection] = useState<StructureSelection>(null);
  const deferredTreeQuery = useDeferredValue(treeQuery);

  useEffect(() => {
    setExpandedNodeIds(new Set(selectedSubject?.tree.map((node) => node.id) ?? []));
  }, [selectedSubject?.id, selectedSubject?.tree]);

  const currentChildren = selectedNode?.children ?? selectedSubject?.tree ?? [];
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
    () => (selectedNode?.optionId ? localContentItems.filter((item) => item.parentOptionId === selectedNode.optionId) : []),
    [localContentItems, selectedNode?.optionId],
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
    setSelection(null);
  }, [currentChildren, selectedAttachedResource, selectedLocalContent, selection]);

  useEffect(() => {
    let cancelled = false;
    const missingDetails = currentResources.filter((resource) => !attachedResources[resource.id]);
    if (!missingDetails.length) return;

    void Promise.all(
      missingDetails.map(async (resource) => {
        try {
          const detail = await loadHocLieuResourceDetail(resource.id);
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
    await deleteHocLieuResource(resource.id);
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
                      <div className="px-2 py-3 text-xs text-slate-500">Không tìm th?y n?i dung phù h?p.</div>
                    )}
                  </div>
                ) : null}
              </div>
            )) : (
              <div
                className="m-2 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs leading-5 text-slate-500"
                onContextMenu={(event) => openContextMenu(event)}
              >
                Chua có môn h?c. B?m New d? b?t d?u.
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
                <p className="mt-1 max-w-sm text-[#64748b]">Dùng chu?t ph?i ho?c nút New d? t?o thu m?c, bài h?c ho?c g?n tài li?u.</p>
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
  const targetTitle = node?.label || localContent?.title || resource?.title || subject?.label || "V? trí hi?n t?i";
  const targetType = node ? getNodeKindLabel(node.kind) : localContent ? (localContent.kind === "lecture" ? "Bài gi?ng" : "Bài t?p") : resource ? getResourceDisplayBadge(resource) : subject ? "Môn h?c" : "Thu m?c hi?n t?i";
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
        M?
      </button>
      <button type="button" onClick={onRefresh} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6]">
        <RefreshCw className="h-4 w-4 text-[#374151]" />
        Làm m?i d? li?u
      </button>
      <div className="my-1 h-px bg-[#eeeeee]" />
      <button type="button" onClick={onEdit} disabled={!hasTarget} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]">
        <Pencil className="h-4 w-4 text-[#374151]" />
        S?a tên / thông tin
      </button>
      <button type="button" onClick={onCopyUrl} disabled={!canCopyUrl} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]">
        <Copy className="h-4 w-4 text-[#374151]" />
        Copy du?ng d?n
      </button>
      <button type="button" onClick={onDelete} disabled={!hasTarget} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]">
        <Trash2 className="h-4 w-4 text-[#dc2626]" />
        Xóa
      </button>
      <div className="my-1 h-px bg-[#eeeeee]" />
      <button type="button" onClick={onCreateSubject} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6]">
        <BookOpen className="h-4 w-4 text-[#374151]" />
        T?o môn h?c
      </button>
      <button type="button" onClick={onCreateRoot} disabled={!canCreateRoot} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]">
        <FolderPlus className="h-4 w-4 text-[#374151]" />
        T?o nhóm h?c li?u
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

function ResourcesScreen({ subjects, resources }: { subjects: StudioSubject[]; resources: HocLieuResourceCard[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Kho tài li?u</CardTitle>
            <CardDescription>C?p nh?t thông tin, tr?ng thái và noi g?n tài li?u.</CardDescription>
          </div>
          <Button className="bg-[var(--erg-blue)] hover:bg-blue-800">
            <LinkIcon className="h-4 w-4" />
            G?n link tài li?u
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <SearchInput value="" onChange={() => undefined} placeholder="Tìm tài li?u" />
          <select className={inputClassName}>
            <option>T?t c? môn h?c</option>
            {subjects.map((subject) => (
              <option key={subject.id}>{subject.label}</option>
            ))}
          </select>
          <select className={inputClassName}>
            <option>T?t c? d?nh d?ng</option>
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
                  C?p nh?t
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Chua có tài li?u" description="Khi BE tr? resources, danh sách s? hi?n th? ? dây d? c?p nh?t riêng." />
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
  const subjectNodes = subject ? flattenNodes(subject.tree) : allNodes;
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
    if (!subjectId && selectedSubject?.id) setSubjectId(selectedSubject.id);
  }, [selectedSubject?.id, subjectId]);

  useEffect(() => {
    setNodeId(subjectNodes[0]?.id ?? "");
  }, [subject?.id]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUrl = normalizeGoogleViewerUrl(resourceUrl);
    if (!normalizedUrl || !subject || !location.categoryId) {
      setMessage("Vui lòng ch?n môn, v? trí có nhóm h?c li?u và dán link Google Drive/Google Slides.");
      return;
    }
    const parsedTotalSlides = parsePositiveInteger(totalSlides);
    if (fileType === "PPTX" && totalSlides.trim() && !parsedTotalSlides) {
      setMessage("T?ng s? slide ph?i là s? nguyên l?n hon 0.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await uploadHocLieuResource({
        title: title.trim() || "Tài li?u Google Drive",
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
      setMessage("Ðã luu link và g?n tài li?u vào dúng v? trí trong cây h?c li?u.");
      setTitle("");
      setResourceUrl("");
      setTotalSlides("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không luu du?c link tài li?u.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>G?n tài li?u b?ng link</CardTitle>
          <CardDescription>Ch?n môn, v? trí trong c?u trúc và dán link Google Drive/Google Slides d? giáo viên m? tr?c ti?p.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpload}>
            <Field label="Môn h?c">
              <select className={inputClassName} value={subject?.id ?? ""} onChange={(event) => setSubjectId(event.target.value)}>
                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="G?n vào v? trí">
              <select className={inputClassName} value={node?.id ?? ""} onChange={(event) => setNodeId(event.target.value)}>
                {subjectNodes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {pathLabel(subject?.label ?? "", findPath(subject?.tree ?? [], item.id))}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tên hi?n th?">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví d?: Bài gi?ng Unit 1" />
            </Field>
            <Field label="Lo?i tài li?u">
              <select className={inputClassName} value={fileType} onChange={(event) => setFileType(event.target.value)}>
                <option value="PPTX">Bài gi?ng di?n t?</option>
                <option value="PDF">PDF / Giáo trình</option>
                <option value="AUDIO">Audio</option>
                <option value="VIDEO">Video</option>
                <option value="ZIP">Gói h?c li?u ZIP</option>
                <option value="HTML5">HTML5</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="Link Google Drive / Google Slides">
                <Input
                  value={resourceUrl}
                  onChange={(event) => setResourceUrl(event.target.value)}
                  placeholder="Dán link share, preview ho?c embed t? Google Drive"
                />
                <p className="text-xs leading-5 text-slate-500">
                  FE s? luu link vào asset, không upload file th?t. Link Google Drive d?ng `/file/d/.../view` s? du?c chu?n hóa v? `/preview`.
                </p>
              </Field>
            </div>
            {fileType === "PPTX" ? (
              <div className="md:col-span-2">
                <Field label="T?ng s? slide">
                  <Input
                    value={totalSlides}
                    onChange={(event) => setTotalSlides(event.target.value.replace(/[^\d]/g, ""))}
                    inputMode="numeric"
                    placeholder="Ví d?: 20"
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    Dùng cho popup xác nh?n khi giáo viên back ho?c t?t bài trình chi?u.
                  </p>
                </Field>
              </div>
            ) : null}
            {message ? <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{message}</div> : null}
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving || !resourceUrl.trim() || !subject || !location.categoryId} className="bg-[var(--erg-blue)] hover:bg-blue-800">
                {saving ? "Ðang luu..." : "Luu link và g?n tài li?u"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin v? trí</CardTitle>
          <CardDescription>Giúp giáo viên ki?m tra link s? du?c g?n vào dâu tru?c khi luu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Môn" value={subject?.label ?? "Chua ch?n"} />
          <InfoRow label="V? trí" value={pathLabel(subject?.label ?? "", path) || "Chua ch?n"} />
          <InfoRow label="Lo?i" value={node ? getNodeKindLabel(node.kind) : "Chua ch?n"} />
          <ChecklistItem label={location.categoryId ? "Ðã xác d?nh nhóm h?c li?u" : "C?n ch?n m?t nhóm h?c li?u"} />
          <ChecklistItem label={resourceUrl.trim() ? "Ðã nh?p link tài li?u" : "Chua nh?p link tài li?u"} />
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

function PublishScreen({ subjects, resources }: { subjects: StudioSubject[]; resources: HocLieuResourceCard[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <PublishCard title="Môn h?c" value={subjects.length} description="S?n sàng dua vào catalog." />
      <PublishCard title="Tài li?u" value={resources.length} description="Ðang có trong kho h?c li?u." />
      <PublishCard title="C?n ki?m tra" value={resources.filter((item) => item.status !== "published").length} description="Chua ? tr?ng thái dã xu?t b?n." />
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Lu?ng xu?t b?n d? xu?t</CardTitle>
          <CardDescription>Tách kh?i màn hình t?o c?u trúc d? admin ki?m tra tru?c khi public.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <PublishStep icon={<BookOpen className="h-5 w-5" />} title="Môn h?c" description="Có tên, mô t? và tr?ng thái." />
          <PublishStep icon={<ListTree className="h-5 w-5" />} title="C?u trúc" description="Có nhóm h?c li?u, ch? d? và unit/lesson." />
          <PublishStep icon={<LinkIcon className="h-5 w-5" />} title="Tài li?u" description="Link tài li?u dã du?c g?n dúng v? trí." />
          <PublishStep icon={<Settings2 className="h-5 w-5" />} title="Public" description="Ki?m tra visibility tru?c khi lên web." />
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
        aria-label={expanded ? "Thu g?n" : "M? r?ng"}
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
        aria-label="Thêm n?i dung bên trong"
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
  if (text.includes("ppt") || text.includes("slide") || text.includes("bài gi?ng di?n t?") || text.includes("presentation")) {
    return <Presentation className="h-4 w-4" />;
  }
  if (text.includes("giáo án") || text.includes("k? ho?ch")) {
    return <ClipboardList className="h-4 w-4" />;
  }
  if (text.includes("ki?m tra") || text.includes("quiz") || text.includes("question") || text.includes("bài t?p")) {
    return <FileCheck className="h-4 w-4" />;
  }
  if (text.includes("video") || text.includes("ho?t hình")) {
    return <Video className="h-4 w-4" />;
  }
  if (text.includes("tranh") || text.includes("?nh") || text.includes("image")) {
    return <ImageIcon className="h-4 w-4" />;
  }
  if (text.includes("link") || text.includes("liên k?t")) {
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
    group: "Nhóm h?c li?u",
    lesson: "Bài h?c",
    bookSeries: "B? sách / Chuong trình",
    category: "Nhóm h?c li?u",
    folder: "Nhóm h? th?ng",
    section: "Bài h?c",
    topic: "Ch? d? / Bài h?c",
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

function StatusSelectField({
  value,
  onChange,
  taxonomy = false,
}: {
  value: string;
  onChange: (value: string) => void;
  taxonomy?: boolean;
}) {
  return (
    <Field label="Tr?ng thái">
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName}>
        <option value={taxonomy ? "active" : "published"}>Ðã xu?t b?n</option>
        <option value="draft">B?n nháp</option>
        <option value="hidden">Ðã ?n</option>
      </select>
    </Field>
  );
}

function ContentTextFields({
  titleLabel = "Tên hi?n th?",
  titlePlaceholder,
  titleValue,
  onTitleChange,
  descriptionLabel = "Mô t?",
  descriptionPlaceholder,
  descriptionValue,
  onDescriptionChange,
  autoFocus = false,
}: {
  titleLabel?: string;
  titlePlaceholder?: string;
  titleValue: string;
  onTitleChange: (value: string) => void;
  descriptionLabel?: string;
  descriptionPlaceholder?: string;
  descriptionValue: string;
  onDescriptionChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <>
      <Field label={titleLabel}>
        <Input value={titleValue} onChange={(event) => onTitleChange(event.target.value)} placeholder={titlePlaceholder} autoFocus={autoFocus} />
      </Field>
      <Field label={descriptionLabel}>
        <textarea
          value={descriptionValue}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder={descriptionPlaceholder}
          className={cn(inputClassName, "min-h-24 py-3")}
        />
      </Field>
    </>
  );
}

function ContentLinkField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hint?: string;
}) {
  return (
    <Field label={label}>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {hint ? <p className="text-xs leading-5 text-slate-500">{hint}</p> : null}
    </Field>
  );
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
    ? "T?o môn h?c"
    : state?.mode === "root"
      ? "T?o nhóm h?c li?u"
      : selectedNode?.kind === "group"
        ? "T?o bài h?c"
        : selectedNode?.kind === "lesson"
          ? "Thêm tài li?u vào bài h?c"
          : "Thêm n?i dung bên trong";
  const descriptionText = isSubject
    ? "Môn h?c là c?p d?u tiên. Sau khi t?o, b?n s? xây d?ng các nhóm h?c li?u, ch? d? và unit bên trong."
    : state?.mode === "root"
      ? "T?o m?t nhóm h?c li?u ? c?p d?u tiên du?i môn h?c, ví d? Level 1, Level 2 ho?c H?c ph?n b? tr?."
      : selectedNode?.kind === "group"
        ? "T?o bài h?c n?m bên trong nhóm h?c li?u dang ch?n."
        : selectedNode?.kind === "lesson"
          ? "Ch?n lo?i n?i dung c?n g?n vào bài h?c: bài gi?ng, bài t?p ho?c tài li?u."
          : "N?i dung m?i s? n?m bên trong v? trí dang ch?n.";
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
  }, [availableOptions, isSubject, open, selectedNode?.kind, state?.mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (selectedOption === "lecture") {
        const trimmedLabel = label.trim();
        const normalizedSlidesUrl = normalizeGoogleSlidesUrl(slidesUrl);
        if (!trimmedLabel) throw new Error("Vui lòng nh?p tên bài gi?ng.");
        if (!selectedSubject || !selectedNode?.optionId) throw new Error("Vui lòng ch?n lesson ho?c bài h?c tru?c.");
        if (!normalizedSlidesUrl) throw new Error("Vui lòng dán link Google Slides.");
        const parsedTotalSlides = parsePositiveInteger(slidesTotal);
        if (slidesTotal.trim() && !parsedTotalSlides) throw new Error("T?ng s? slide ph?i là s? nguyên l?n hon 0.");
        const resourceLocation = buildResourceLocation(selectedPath);
        if (!resourceLocation.categoryId) throw new Error("V? trí hi?n t?i chua xác d?nh du?c nhóm h?c li?u d? g?n bài gi?ng.");
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
        if (!selectedSubject || !parentOptionId) throw new Error("Vui lòng ch?n lesson ho?c bài h?c tru?c.");
        if (!selectedExerciseIds.length) throw new Error("Vui lòng ch?n ít nh?t m?t bài t?p.");
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
        if (!selectedSubject || !selectedNode) throw new Error("Vui lòng ch?n v? trí c?n g?n tài li?u.");
        if (!resourceLocation.categoryId) throw new Error("V? trí hi?n t?i chua xác d?nh du?c nhóm h?c li?u d? g?n tài li?u.");
        if (!normalizedResourceUrl) throw new Error("Vui lòng dán link Google Drive/Google Slides.");
        const parsedTotalSlides = parsePositiveInteger(resourceTotalSlides);
        if (resourceFileType === "PPTX" && resourceTotalSlides.trim() && !parsedTotalSlides) throw new Error("T?ng s? slide ph?i là s? nguyên l?n hon 0.");
        await uploadHocLieuResource({
          title: label.trim() || "Tài li?u Google Drive",
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
        throw new Error(isSubject ? "Vui lòng nh?p tên môn h?c." : "Vui lòng nh?p tên.");
      }
      if (!isSubject && !selectedSubject) {
        throw new Error("Vui lòng ch?n môn h?c tru?c.");
      }
      if (state?.mode === "child" && !selectedNode) {
        throw new Error("Vui lòng ch?n m?c cha tru?c.");
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
            throw new Error("Nhóm h?c li?u hi?n t?i chua xác d?nh du?c category g?c d? t?o bài h?c.");
          }
          payload.categoryId = currentLocation.categoryId;
          if (selectedNode.sourceKind === "topic" && selectedNode.optionId) payload.topicId = selectedNode.optionId;
          if (selectedNode.sourceKind === "bookSeries" && selectedNode.optionId) payload.bookSeriesId = selectedNode.optionId;
        }
      }

      const created = normalizeTaxonomyOption(
        await createHocLieuTaxonomy(isSubject ? "subjects" : apiKindForNodeKind(resolvedKind), payload),
      );
      if (!created?.id) {
        throw new Error("BE dã t?o d? li?u nhung không tr? v? id h?p l?.");
      }
      await onCreated({ mode: state?.mode ?? "subject", kind: resolvedKind, id: created.id });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không th? t?o m?c. Vui lòng th? l?i.");
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
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">V? trí trong c?u trúc</div>
              <div className="mt-2 font-semibold text-slate-950">{selectedSubject?.label || "Chua ch?n môn"}</div>
              {state?.mode === "child" ? (
                <div className="mt-1 text-sm text-slate-600">
                  Bên trong: <span className="font-semibold text-[var(--erg-blue)]">{selectedNode?.label || "Chua ch?n"}</span>
                </div>
              ) : (
                <div className="mt-1 text-sm text-slate-600">N?m ? c?p d?u tiên c?a môn h?c.</div>
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
                V?i `bài gi?ng`, popup s? uu tiên link Google Slides. V?i `bài t?p`, giao di?n hi?n dang dùng danh sách mock d? ch? n?i DB th?t.
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
                      Ch?n l?i
                    </Button>
                  ) : null}
                </div>
              ) : null}

              {selectedOption === "lecture" ? (
                <>
                  <ContentTextFields
                    titleLabel="Tên bài gi?ng"
                    titlePlaceholder="Ví d?: Bài gi?ng Bài 01"
                    titleValue={label}
                    onTitleChange={handleLectureTitleChange}
                    descriptionLabel="Mô t? ng?n"
                    descriptionPlaceholder="Ví d?: Slide dùng cho ti?t m? d?u, có note cho giáo viên"
                    descriptionValue={description}
                    onDescriptionChange={setDescription}
                    autoFocus
                  />
                  <ContentLinkField
                    label="Link Google Slides"
                    value={slidesUrl}
                    onChange={setSlidesUrl}
                    placeholder="Dán link edit, publish ho?c embed c?a Google Slides"
                    hint="Popup này luu link Google Slides vào asset, không upload file th?t lên server."
                  />
                  <Field label="T?ng s? slide">
                    <Input
                      value={slidesTotal}
                      onChange={(event) => setSlidesTotal(event.target.value.replace(/[^\d]/g, ""))}
                      inputMode="numeric"
                      placeholder="Ví d?: 20"
                    />
                    <p className="text-xs leading-5 text-slate-500">
                      Dùng cho popup xác nh?n khi giáo viên back ho?c t?t bài trình chi?u.
                    </p>
                  </Field>
                  <StatusSelectField value={status} onChange={setStatus} />
                </>
              ) : null}

              {selectedOption === "exercise" ? (
                <>
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
                    <Field label="Tìm bài t?p">
                      <Input value={exerciseQuery} onChange={(event) => setExerciseQuery(event.target.value)} placeholder="Tìm theo tên, ch? d? ho?c d? khó" autoFocus />
                    </Field>
                    <Field label="Môn h?c">
                      <Input value={selectedSubject?.label ?? "Chua ch?n"} readOnly />
                    </Field>
                    <Field label="Ng? c?nh">
                      <Input value={selectedNode?.label ?? "Chua ch?n"} readOnly />
                    </Field>
                  </div>
                  <ContentTextFields
                    titleLabel="Tên hi?n th?"
                    titlePlaceholder="Ví d?: Bài t?p luy?n cu?i ti?t"
                    titleValue={label}
                    onTitleChange={setLabel}
                    descriptionLabel="Ghi chú cho l?n g?n này"
                    descriptionPlaceholder="Ví d?: Giao cu?i ti?t ho?c dùng d? luy?n t?p v? nhà"
                    descriptionValue={description}
                    onDescriptionChange={setDescription}
                    autoFocus
                  />
                  <StatusSelectField value={status} onChange={setStatus} />
                  <div className="rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div className="font-semibold text-slate-950">Danh sách bài t?p mock</div>
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
                              <span>{item.questionCount} câu h?i</span>
                              <span>{item.durationMinutes} phút</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                          Không có bài t?p mock kh?p v?i b? l?c hi?n t?i.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}

              {selectedOption === "resource" ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Lo?i tài li?u">
                      <select className={inputClassName} value={resourceFileType} onChange={(event) => setResourceFileType(event.target.value)}>
                        <option value="PDF">PDF / Giáo trình</option>
                        <option value="PPTX">Bài gi?ng di?n t?</option>
                        <option value="VIDEO">Video</option>
                        <option value="AUDIO">Audio</option>
                        <option value="IMAGE">?nh / thumbnail</option>
                        <option value="ZIP">Gói h?c li?u ZIP</option>
                        <option value="HTML5">HTML5</option>
                      </select>
                    </Field>
                    <div className="md:col-span-2">
                      <ContentTextFields
                        titleLabel="Tên hi?n th?"
                        titlePlaceholder="Ví d?: Unit 1 - Lesson 1"
                        titleValue={label}
                        onTitleChange={setLabel}
                        descriptionLabel="Mô t? ng?n"
                        descriptionPlaceholder="Ví d?: Tài li?u dùng cho ti?t m? d?u ho?c bài luy?n t?p"
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
                        placeholder="Dán link share, preview ho?c embed t? Google Drive"
                        hint={`Link s? du?c luu vào asset c?a tài li?u t?i ${pathLabel(selectedSubject?.label ?? "", selectedPath)}. Không upload file th?t lên server.`}
                      />
                    </div>
                    {resourceFileType === "PPTX" ? (
                      <div className="md:col-span-2">
                        <Field label="T?ng s? slide">
                          <Input
                            value={resourceTotalSlides}
                            onChange={(event) => setResourceTotalSlides(event.target.value.replace(/[^\d]/g, ""))}
                            inputMode="numeric"
                            placeholder="Ví d?: 20"
                          />
                          <p className="text-xs leading-5 text-slate-500">
                            Dùng cho popup dánh d?u khi giáo viên back/t?t trình chi?u.
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
                    titleLabel={isSubject ? "Tên môn h?c" : "Tên hi?n th?"}
                    titlePlaceholder={isSubject ? "Ví d?: IC3 GS6" : kind === "category" ? "Ví d?: Ch? d? 1, H?c ph?n b? tr?" : "Ví d?: Bài 01. Làm quen v?i máy tính"}
                    titleValue={label}
                    onTitleChange={setLabel}
                    descriptionLabel="Mô t? ng?n"
                    descriptionPlaceholder="Giúp giáo viên hi?u m?c này dùng d? làm gì"
                    descriptionValue={description}
                    onDescriptionChange={setDescription}
                    autoFocus
                  />

                  {!isSubject ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Ðang t?o: <b>{kind === "category" ? "Nhóm h?c li?u" : "Bài h?c"}</b>. Lo?i này du?c quy?t d?nh theo v? trí dang ch?n trong cây.
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
              H?y
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
                  ? "Ðang luu..."
                  : selectedOption === "lecture"
                    ? "Thêm bài gi?ng"
                    : selectedOption === "exercise"
                      ? "G?n bài t?p"
                      : selectedOption === "resource"
                        ? "G?n link tài li?u"
                        : selectedOption === "category"
                          ? "T?o nhóm h?c li?u"
                          : selectedOption === "section"
                            ? "T?o bài h?c"
                            : "T?o m?i"}
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
    setLabel(target.label);
    setDescription(target.description || "");
    setStatus(target.status || "active");
    setCoverImageUrl(target.metadata?.coverImageUrl || "");
    setPresentationUrl(target.metadata?.presentationUrl || "");
    setPdfUrl(target.metadata?.pdfUrl || "");
    setExternalUrl(target.metadata?.externalUrl || "");
    setError("");
    setSaving(false);
  }, [target]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setError("Vui lòng nh?p tên.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateHocLieuTaxonomy(apiKindForEditTarget(target.kind), target.id, {
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
      setError(submitError instanceof Error ? submitError.message : "Không th? c?p nh?t. Vui lòng th? l?i.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>S?a {target?.kind === "subject" ? "môn h?c" : "n?i dung h?c li?u"}</DialogTitle>
          <DialogDescription>C?p nh?t tên, mô t? và tr?ng thái d? trang Hoclieu hi?n th? rõ ràng hon.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ContentTextFields
            titleLabel="Tên hi?n th?"
            titleValue={label}
            onTitleChange={setLabel}
            descriptionLabel="Mô t? cho giáo viên/h?c sinh"
            descriptionValue={description}
            onDescriptionChange={setDescription}
            autoFocus
          />
          <StatusSelectField value={status} onChange={setStatus} taxonomy />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="font-semibold text-slate-950">Thông tin hi?n th? trên Hoclieu</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              C?u trúc luu ph?n mô t? và ?nh d?i di?n. Tài li?u th?t s? du?c g?n b?ng link Google Drive/Google Slides ? ph?n N?i dung ho?c màn G?n link.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="?nh bìa / thumbnail URL">
                <Input value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} placeholder="https://.../cover.webp" />
              </Field>
              {showPresentationField ? (
                <Field label="Link bài gi?ng PPT/Slides">
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
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>H?y</Button>
            <Button type="submit" disabled={saving || !label.trim()} className="bg-[var(--erg-blue)] hover:bg-blue-800">
              {saving ? "Ðang luu..." : "Luu thay d?i"}
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
    setTitle(target.title);
    setDescription(target.detail?.description || "");
    setLinkUrl(target.linkUrl || "");
    setStatus(target.asset?.status || target.status || "published");
    setSaving(false);
    setError("");
  }, [target]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;
    setSaving(true);
    setError("");
    try {
      const normalizedUrl = linkUrl.trim() ? normalizeGoogleViewerUrl(linkUrl) || linkUrl.trim() : undefined;
      await updateHocLieuResource(target.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        visibility: status === "hidden" ? "private" : "public",
      });
      if (target.asset?.id) {
        await updateHocLieuAsset(target.asset.id, {
          title: title.trim(),
          storageUrl: normalizedUrl,
          upstreamUrl: normalizedUrl,
          status,
        });
      }
      await onSaved();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không th? c?p nh?t tài li?u.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>S?a tài li?u</DialogTitle>
          <DialogDescription>C?p nh?t tên, link và tr?ng thái hi?n th? c?a tài li?u.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ContentTextFields
            titleLabel="Tên hi?n th?"
            titleValue={title}
            onTitleChange={setTitle}
            descriptionLabel="Mô t?"
            descriptionValue={description}
            onDescriptionChange={setDescription}
            autoFocus
          />
          <ContentLinkField
            label="Link tài li?u"
            value={linkUrl}
            onChange={setLinkUrl}
            placeholder="https://docs.google.com/... ho?c link PDF"
          />
          <StatusSelectField value={status} onChange={setStatus} />
          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>H?y</Button>
            <Button type="submit" disabled={saving || !title.trim()} className="bg-[var(--erg-blue)] hover:bg-blue-800">
              {saving ? "Ðang luu..." : "Luu thay d?i"}
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
    setTitle(target.title);
    setDescription(target.description || "");
    setResourceUrl(target.slidesUrl || target.resourceUrl || "");
    setStatus(target.status || "published");
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
          <DialogTitle>S?a {target?.kind === "exercise" ? "bài t?p" : "bài gi?ng"}</DialogTitle>
          <DialogDescription>C?p nh?t n?i dung hi?n th? và tr?ng thái trong màn biên so?n.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ContentTextFields
            titleLabel="Tên hi?n th?"
            titleValue={title}
            onTitleChange={setTitle}
            descriptionLabel="Mô t?"
            descriptionValue={description}
            onDescriptionChange={setDescription}
            autoFocus
          />
          <ContentLinkField
            label={target?.kind === "exercise" ? "Link tham chi?u" : "Link bài gi?ng"}
            value={resourceUrl}
            onChange={setResourceUrl}
            placeholder="https://..."
          />
          <StatusSelectField value={status} onChange={setStatus} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>H?y</Button>
            <Button type="submit" className="bg-[var(--erg-blue)] hover:bg-blue-800">Luu thay d?i</Button>
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
    setDeleting(false);
    setError("");
  }, [target]);

  async function handleDelete() {
    if (!target) return;
    setDeleting(true);
    setError("");
    try {
      await deleteHocLieuTaxonomy(apiKindForEditTarget(target.kind), target.id);
      await onDeleted();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không th? xóa. Vui lòng th? l?i.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Xóa {target?.label}</DialogTitle>
          <DialogDescription>Thao tác này xóa n?i dung kh?i DB. N?u m?c có c?p du?i ho?c tài li?u liên quan, b?n nên chuy?n d? li?u tru?c khi xóa.</DialogDescription>
        </DialogHeader>
        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>H?y</Button>
          <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Ðang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function ChecklistItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
  );
}

function PublishCard({ title, value, description }: { title: string; value: number; description: string }) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</div>
        <div className="mt-2 text-3xl font-bold text-slate-950">{value}</div>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}

function PublishStep({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-[var(--erg-blue)]">{icon}</span>
      <div className="mt-4 font-semibold text-slate-950">{title}</div>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
