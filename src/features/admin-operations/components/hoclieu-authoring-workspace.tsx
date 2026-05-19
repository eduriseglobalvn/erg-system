import { useEffect, useMemo, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import {
  ArrowUpRight,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck,
  FileText,
  FileUp,
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
  Pencil,
  Plus,
  Presentation,
  Search,
  Settings2,
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
  listHocLieuSubjects,
  listHocLieuResources,
  loadHocLieuTaxonomies,
  updateHocLieuTaxonomy,
  uploadHocLieuResource,
  type CreateTaxonomyPayload,
  type HocLieuResourceCard,
  type HocLieuTaxonomyOption,
  type HocLieuTaxonomyResponse,
} from "@/features/admin-operations/api/hoclieu-authoring-api";
import { mockExerciseLibrary } from "@/features/admin-operations/api/mock-exercise-library";
import type { DashboardLeaf } from "@/features/dashboard/types/dashboard-types";
import {
  filterMockExercises,
  getAvailableContentOptions,
  normalizeGoogleSlidesUrl,
  type ContentDialogOptionId,
} from "@/features/admin-operations/utils/hoclieu-content-dialog";
import { cn } from "@/lib/utils";
import {
  buildHocLieuLearningSubjects,
  matchesResourceToLearningNode,
  type HocLieuLearningNode,
  type HocLieuLearningNodeKind,
  type HocLieuLearningSubject,
  type HocLieuLearningSourceKind,
} from "@/utils/hoclieu-learning-tree";

type StudioNodeKind = HocLieuLearningNodeKind | "category" | "topic" | "section" | "bookSeries";
type StudioNodeSourceKind = HocLieuLearningSourceKind;
type StudioNode = {
  id: string;
  label: string;
  kind: StudioNodeKind;
  sourceKind: StudioNodeSourceKind;
  optionId?: string;
  description?: string;
  status?: string;
  metadata?: Record<string, string>;
  location: HocLieuLearningNode["location"];
  children: StudioNode[];
};
type StudioSubject = HocLieuLearningSubject;

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
  topicLabel?: string;
  sectionLabel?: string;
  questionCount?: number;
  durationMinutes?: number;
};
type TaxonomyEditTarget =
  | { kind: "subject"; id: string; label: string; description?: string; status?: string; metadata?: Record<string, string> }
  | { kind: StudioNodeKind; id: string; label: string; description?: string; status?: string; metadata?: Record<string, string> };
type TaxonomyDeleteTarget = TaxonomyEditTarget;

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

const screenMeta: Record<string, { title: string; description: string; icon: ReactNode }> = {
  "admin-hoclieu-studio": {
    title: "Chủ đề học liệu",
    description: "Tạo môn học, xây cây chủ đề và gắn tài liệu theo một luồng duy nhất.",
    icon: <ListTree className="h-5 w-5" />,
  },
  "admin-hoclieu-structure": {
    title: "Cấu trúc",
    description: "Tổ chức môn học thành nhóm học liệu, chủ đề và unit/lesson để Hoclieu hiển thị.",
    icon: <ListTree className="h-5 w-5" />,
  },
  "admin-hoclieu-resources": {
    title: "Tài liệu",
    description: "Tra cứu và cập nhật học liệu đã gắn vào từng vị trí trong cấu trúc môn học.",
    icon: <LibraryBig className="h-5 w-5" />,
  },
  "admin-hoclieu-upload": {
    title: "Upload",
    description: "Đưa file mới lên kho và chọn nơi gắn trong cây học liệu.",
    icon: <FileUp className="h-5 w-5" />,
  },
  "admin-hoclieu-publish": {
    title: "Xuất bản",
    description: "Kiểm tra trạng thái sẵn sàng trước khi hiển thị trên Hoclieu.",
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

function sortOptions<T extends HocLieuTaxonomyOption>(items: T[]) {
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.label ?? "").localeCompare(String(b.label ?? ""), "vi"));
}

function belongsToSubject(option: HocLieuTaxonomyOption, subjectId: string) {
  return option.subjectId === subjectId || option.id === subjectId || !option.subjectId;
}

function getTopicId(option: HocLieuTaxonomyOption) {
  return (option as HocLieuTaxonomyOption & { topicId?: string }).topicId;
}

function buildCategoryNodes(
  category: HocLieuTaxonomyOption,
  allCategories: HocLieuTaxonomyOption[],
  model: HocLieuTaxonomyResponse,
  visited = new Set<string>(),
): StudioNode {
  const visitKey = `category:${category.id}`;
  if (visited.has(visitKey)) {
    return {
      id: `category-${category.id}`,
      label: category.label,
      description: category.description,
      status: category.status,
      metadata: category.metadata,
      kind: "category",
      sourceKind: "category",
      optionId: category.id,
      location: { categoryId: category.id },
      children: [],
    };
  }
  const nextVisited = new Set(visited).add(visitKey);

  return {
    id: `category-${category.id}`,
    label: category.label,
    description: category.description,
    status: category.status,
    metadata: category.metadata,
    kind: "category",
    sourceKind: "category",
    optionId: category.id,
    location: { categoryId: category.id },
    children: buildChildNodes("category", category.id, allCategories, model, nextVisited),
  };
}

function buildTopicNode(
  topic: HocLieuTaxonomyOption,
  allCategories: HocLieuTaxonomyOption[],
  model: HocLieuTaxonomyResponse,
  visited: Set<string>,
): StudioNode {
  const visitKey = `topic:${topic.id}`;
  const nextVisited = new Set(visited).add(visitKey);
  return {
    id: `topic-${topic.id}`,
    label: topic.label,
    description: topic.description,
    status: topic.status,
    metadata: topic.metadata,
    kind: "topic",
    sourceKind: "topic",
    optionId: topic.id,
    location: { categoryId: topic.categoryId, topicId: topic.id },
    children: visited.has(visitKey) ? [] : buildChildNodes("topic", topic.id, allCategories, model, nextVisited),
  };
}

function buildBookSeriesNode(
  bookSeries: HocLieuTaxonomyOption,
  allCategories: HocLieuTaxonomyOption[],
  model: HocLieuTaxonomyResponse,
  visited: Set<string>,
): StudioNode {
  const visitKey = `bookSeries:${bookSeries.id}`;
  const nextVisited = new Set(visited).add(visitKey);
  return {
    id: `book-${bookSeries.id}`,
    label: bookSeries.label,
    description: bookSeries.description,
    status: bookSeries.status,
    metadata: bookSeries.metadata,
    kind: "bookSeries",
    sourceKind: "bookSeries",
    optionId: bookSeries.id,
    location: { categoryId: bookSeries.categoryId, bookSeriesId: bookSeries.id },
    children: visited.has(visitKey) ? [] : buildChildNodes("bookSeries", bookSeries.id, allCategories, model, nextVisited),
  };
}

function buildSectionNode(
  section: HocLieuTaxonomyOption,
  allCategories: HocLieuTaxonomyOption[],
  model: HocLieuTaxonomyResponse,
  visited: Set<string>,
): StudioNode {
  const visitKey = `section:${section.id}`;
  const nextVisited = new Set(visited).add(visitKey);
  return {
    id: `section-${section.id}`,
    label: section.label,
    description: section.description,
    status: section.status,
    metadata: section.metadata,
    kind: "section",
    sourceKind: "section",
    optionId: section.id,
    location: { categoryId: section.categoryId, topicId: getTopicId(section), sectionId: section.id, bookSeriesId: section.bookSeriesId },
    children: visited.has(visitKey) ? [] : buildChildNodes("section", section.id, allCategories, model, nextVisited),
  };
}

function buildChildNodes(
  parentKind: StudioNodeKind,
  parentId: string,
  allCategories: HocLieuTaxonomyOption[],
  model: HocLieuTaxonomyResponse,
  visited: Set<string>,
): StudioNode[] {
  const nodes: StudioNode[] = [];
  const pushed = new Set<string>();
  const push = (key: string, node: StudioNode) => {
    if (pushed.has(key)) return;
    pushed.add(key);
    nodes.push(node);
  };

  sortOptions(allCategories.filter((item) => item.parentId === parentId)).forEach((item) => {
    push(`category:${item.id}`, buildCategoryNodes(item, allCategories, model, visited));
  });

  sortOptions(model.bookSeries.filter((item) => item.parentId === parentId || (parentKind === "category" && item.categoryId === parentId))).forEach((item) => {
    push(`bookSeries:${item.id}`, buildBookSeriesNode(item, allCategories, model, visited));
  });

  sortOptions(model.topics.filter((item) => item.parentId === parentId || (parentKind === "category" && item.categoryId === parentId))).forEach((item) => {
    push(`topic:${item.id}`, buildTopicNode(item, allCategories, model, visited));
  });

  sortOptions(
    model.sections.filter(
      (item) =>
        item.parentId === parentId ||
        (parentKind === "category" && item.categoryId === parentId && !getTopicId(item)) ||
        (parentKind === "topic" && getTopicId(item) === parentId) ||
        (parentKind === "bookSeries" && item.bookSeriesId === parentId),
    ),
  ).forEach((item) => {
    push(`section:${item.id}`, buildSectionNode(item, allCategories, model, visited));
  });

  return nodes;
}

function buildSubjectTree(subject: HocLieuTaxonomyOption, model: HocLieuTaxonomyResponse): StudioNode[] {
  const categories = sortOptions(model.categories.filter((item) => belongsToSubject(item, subject.id)));
  const rootCategories = categories.filter((item) => !item.parentId);
  const bookSeries = sortOptions(model.bookSeries.filter((item) => belongsToSubject(item, subject.id) && !item.parentId && !item.categoryId));
  const orphanTopics = sortOptions(model.topics.filter((item) => belongsToSubject(item, subject.id) && !item.parentId && !item.categoryId));
  const orphanSections = sortOptions(model.sections.filter((item) => belongsToSubject(item, subject.id) && !item.parentId && !item.categoryId && !getTopicId(item)));

  const nodes = rootCategories.map((item) => buildCategoryNodes(item, categories, model));

  if (bookSeries.length) {
    nodes.push({
      id: `books-${subject.id}`,
      label: "Bộ sách / chương trình",
      kind: "folder",
      sourceKind: "folder",
      location: {},
      children: bookSeries.map((item) => ({
        ...buildBookSeriesNode(item, categories, model, new Set()),
      })),
    });
  }

  if (orphanTopics.length) {
    nodes.push({
      id: `topics-${subject.id}`,
      label: "Chủ đề chưa xếp nhóm",
      kind: "folder",
      sourceKind: "folder",
      location: {},
      children: orphanTopics.map((item) => ({
        ...buildTopicNode(item, categories, model, new Set()),
      })),
    });
  }

  if (orphanSections.length) {
    nodes.push({
      id: `sections-${subject.id}`,
      label: "Học phần chưa xếp nhóm",
      kind: "folder",
      sourceKind: "folder",
      location: {},
      children: orphanSections.map((item) => ({
        ...buildSectionNode(item, categories, model, new Set()),
      })),
    });
  }

  return nodes;
}

function countNodes(nodes: StudioNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countNodes(node.children), 0);
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
  return buildHocLieuLearningSubjects(model, resources) as StudioSubject[];
}

void buildSubjectTree;
void countNodes;

function flattenNodes(nodes: StudioNode[]): StudioNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children)]);
}

function screenKind(activeLeafId: string) {
  if (activeLeafId === "admin-hoclieu-studio") return "structure";
  if (activeLeafId === "admin-hoclieu-structure") return "structure";
  if (activeLeafId === "admin-hoclieu-resources") return "resources";
  if (activeLeafId === "admin-hoclieu-upload") return "upload";
  if (activeLeafId === "admin-hoclieu-publish") return "publish";
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
      description: "Upload PDF, video, audio, ảnh hoặc gói học liệu trực tiếp trong popup này.",
      icon: <FileUp className="h-5 w-5" />,
    };
  }
  return {
    title: "Bài tập",
    description: "Chọn từ danh sách bài tập mock theo môn, chủ đề và bài học để gắn nhanh vào lesson.",
    icon: <FileCheck className="h-5 w-5" />,
  };
}

export function HocLieuAuthoringWorkspace({ activeLeaf, onOpenLeaf: _onOpenLeaf }: { activeLeaf: DashboardLeaf; onOpenLeaf?: (leafId: string) => void }) {
  const [model, setModel] = useState<HocLieuTaxonomyResponse>(emptyModel);
  const [resources, setResources] = useState<HocLieuResourceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [dialogState, setDialogState] = useState<TaxonomyDialogState>(null);
  const [editTarget, setEditTarget] = useState<TaxonomyEditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaxonomyDeleteTarget | null>(null);
  const [localContentItems, setLocalContentItems] = useState<LocalContentItem[]>([]);

  async function refreshData() {
    setLoading(true);
    try {
      const [contentModelResult, subjectListResult, resourceListResult] = await Promise.allSettled([
        loadHocLieuTaxonomies(),
        listHocLieuSubjects(),
        listHocLieuResources({ limit: 120 }),
      ]);

      const contentModel = contentModelResult.status === "fulfilled" ? contentModelResult.value : emptyModel;
      const subjectList = subjectListResult.status === "fulfilled" ? subjectListResult.value : [];
      const resourceList = resourceListResult.status === "fulfilled" ? resourceListResult.value : { data: [] as HocLieuResourceCard[] };

      const nextModel = { ...normalizeContentModel(contentModel), subjects: normalizeTaxonomyOptions(subjectList) };
      setModel(nextModel);
      setResources(normalizeResources(resourceList?.data));
      return nextModel;
    } catch {
      setModel(emptyModel);
      setResources([]);
      return emptyModel;
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
  const meta = screenMeta[activeLeaf.id] ?? screenMeta["admin-hoclieu-studio"];
  void meta;
  void loading;
  const selectedSubjectTarget = selectedSubject
    ? {
        kind: "subject" as const,
        id: selectedSubject.id,
        label: selectedSubject.label,
        description: selectedSubject.description,
        status: selectedSubject.status,
        metadata: selectedSubject.metadata,
      }
    : undefined;
  const selectedNodeTarget = selectedNode?.optionId
    ? {
        kind: selectedNode.kind,
        id: selectedNode.optionId,
        label: selectedNode.label,
        description: selectedNode.description,
        status: selectedNode.status,
        metadata: selectedNode.metadata,
      }
    : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {currentScreen === "subjects" ? (
        <SubjectsScreen
          subjects={filteredSubjects}
          query={query}
          onQueryChange={setQuery}
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubjectId}
          onCreateSubject={() => setDialogState({ mode: "subject" })}
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
          onSelectSubject={(subjectId) => {
            const nextSubject = subjects.find((subject) => subject.id === subjectId);
            setSelectedSubjectId(subjectId);
            setSelectedNodeId(nextSubject?.tree[0]?.id ?? "");
          }}
          onSelectNode={setSelectedNodeId}
          onCreateSubject={() => setDialogState({ mode: "subject" })}
          onCreateRoot={() => setDialogState({ mode: "root" })}
          onCreateChild={() => setDialogState({ mode: "child" })}
          onEditSubject={() => selectedSubjectTarget && setEditTarget(selectedSubjectTarget)}
          onDeleteSubject={() => selectedSubjectTarget && setDeleteTarget(selectedSubjectTarget)}
          onEditNode={() => selectedNodeTarget && setEditTarget(selectedNodeTarget)}
          onDeleteNode={() => selectedNodeTarget && setDeleteTarget(selectedNodeTarget)}
          localContentItems={localContentItems}
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
          await refreshData();
          setDialogState(null);
        }}
        onUploadResource={async () => {
          await refreshData();
          setDialogState(null);
        }}
        onCreated={async ({ mode, kind, id }) => {
          const nextModel = await refreshData();
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
          await refreshData();
          setEditTarget(null);
        }}
      />
      <TaxonomyDeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={async () => {
          await refreshData();
          setDeleteTarget(null);
          if (deleteTarget?.kind === "subject") {
            setSelectedSubjectId("");
            setSelectedNodeId("");
          } else if (deleteTarget?.id === selectedNode?.optionId) {
            setSelectedNodeId("");
          }
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
                  "grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_120px_120px_120px_120px] items-center gap-3 border-t border-slate-200 px-4 py-4 text-left transition hover:bg-blue-50/50",
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
                  <Badge tone={subject.status === "ACTIVE" ? "success" : "outline"}>{subject.status || "draft"}</Badge>
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
              <InfoRow label="Trạng thái" value={selectedSubject.status || "draft"} />
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
  onEditNode,
  onDeleteNode,
  localContentItems,
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
  onEditNode: () => void;
  onDeleteNode: () => void;
  localContentItems: LocalContentItem[];
  resources: HocLieuResourceCard[];
}) {
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [treeQuery, setTreeQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node?: StudioNode } | null>(null);

  useEffect(() => {
    setExpandedNodeIds(new Set(selectedSubject?.tree.map((node) => node.id) ?? []));
  }, [selectedSubject?.id, selectedSubject?.tree]);

  const currentChildren = selectedNode?.children ?? selectedSubject?.tree ?? [];
  const currentResources = useMemo(() => {
    if (!selectedSubject) return [];
    if (!selectedNode?.optionId) return resources.filter((resource) => resource.subjectId === selectedSubject.id);
    return resources.filter((resource) => {
      if (resource.subjectId !== selectedSubject.id) return false;
      return matchesResourceToLearningNode(resource, selectedNode as HocLieuLearningNode);
    });
  }, [resources, selectedNode, selectedSubject]);
  const currentLocalContentItems = selectedNode?.optionId
    ? localContentItems.filter((item) => item.parentOptionId === selectedNode.optionId)
    : [];
  const totalAttachedItems = currentResources.length + currentLocalContentItems.length;
  const selectedBreadcrumb = selectedSubject ? [selectedSubject.label, ...selectedPath.map((node) => node.label)] : [];
  const filteredTree = useMemo(() => {
    if (!selectedSubject) {
      return [];
    }
    return filterTree(selectedSubject.tree, treeQuery);
  }, [selectedSubject, treeQuery]);
  const visibleRows = useMemo(() => flattenVisibleNodes(filteredTree, expandedNodeIds), [filteredTree, expandedNodeIds]);
  const canCreateChild = Boolean(selectedNode?.optionId);

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

  const toggleNode = (nodeId: string) => {
    setExpandedNodeIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleCreateChild = (node?: StudioNode) => {
    if (node) {
      onSelectNode(node.id);
    }
    onCreateChild();
  };

  const openContextMenu = (event: MouseEvent, node?: StudioNode) => {
    event.preventDefault();
    event.stopPropagation();
    if (node) {
      onSelectNode(node.id);
    }
    setContextMenu({
      x: Math.min(event.clientX, window.innerWidth - 240),
      y: Math.min(event.clientY, window.innerHeight - 260),
      node,
    });
  };

  return (
    <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="min-h-0 self-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--erg-blue)]">Bước 1</div>
          <div className="mt-1 text-base font-bold text-slate-950">Chọn môn học</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">Mỗi môn có cây chủ đề và tài liệu riêng.</div>
          <Button type="button" size="sm" onClick={onCreateSubject} className="mt-3 w-full bg-[var(--erg-blue)] hover:bg-blue-800">
            <Plus className="h-4 w-4" />
            Tạo môn mới
          </Button>
        </div>
        <div className="max-h-[calc(100vh-250px)] space-y-2 overflow-y-auto p-3">
          {subjects.length ? subjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => onSelectSubject(subject.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                selectedSubject?.id === subject.id ? "border-[var(--erg-blue)] bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50",
              )}
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-slate-950">{subject.label}</span>
                <span className="text-xs text-slate-500">{subject.groupCount} nhóm · {subject.lessonCount} bài · {subject.resourceCount} tài liệu</span>
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>
          )) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
              Chưa có môn học. Bấm <b>Tạo môn mới</b> để bắt đầu.
            </div>
          )}
        </div>
      </aside>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_42px_-34px_rgba(15,23,42,0.38)]">
        <div className="p-3">
          <div className="grid h-[calc(100vh-128px)] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white xl:grid-cols-[minmax(320px,31%)_minmax(0,1fr)] 2xl:grid-cols-[minmax(360px,33%)_minmax(0,1fr)]">
            <aside className="min-h-0 border-b border-slate-200 bg-slate-50/80 p-3 xl:border-b-0 xl:border-r">
              <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm shadow-slate-200/70">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[var(--erg-blue)]">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="truncate">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-extrabold tracking-[0.02em] text-[var(--erg-blue)]">
                      {selectedSubject?.label || "Chưa chọn môn"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">Cấu trúc thật từ API</div>
                </div>
                {selectedSubject ? (
                  <div className="ml-auto flex gap-1">
                    <Button variant="ghost" size="sm" onClick={onEditSubject}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onDeleteSubject}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="mt-3">
                <SearchInput value={treeQuery} onChange={setTreeQuery} placeholder="Tìm nhóm, chủ đề, unit" />
              </div>

              <button
                type="button"
                onClick={() => (selectedSubject?.tree[0] ? onSelectNode(selectedSubject.tree[0].id) : undefined)}
                onContextMenu={(event) => openContextMenu(event)}
                className="mt-4 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-white"
              >
                <LibraryBig className="h-4 w-4 text-slate-500" />
                Toàn bộ cấu trúc
              </button>

              <div className="mt-2 max-h-[calc(100vh-415px)] space-y-1 overflow-y-auto pr-1">
                {visibleRows.length ? (
                  visibleRows.map(({ node, depth }) => (
                    <ExplorerTreeRow
                      key={node.id}
                      node={node}
                      depth={depth}
                      selectedNodeId={selectedNode?.id ?? ""}
                      expanded={expandedNodeIds.has(node.id)}
                      onSelectNode={onSelectNode}
                      onToggleNode={toggleNode}
                      onCreateChild={handleCreateChild}
                      onOpenContextMenu={openContextMenu}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">Không tìm thấy nội dung phù hợp.</div>
                )}
              </div>
            </aside>

            <section className="min-h-0 min-w-0 overflow-y-auto p-4">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                    {selectedBreadcrumb.length ? (
                      selectedBreadcrumb.map((label, index) => (
                        <span key={`${label}-${index}`} className="inline-flex items-center gap-2">
                          {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-slate-300" /> : null}
                          <span className={index === selectedBreadcrumb.length - 1 ? "text-[var(--erg-blue)]" : undefined}>{label}</span>
                        </span>
                      ))
                    ) : (
                      <span>Chọn môn để bắt đầu</span>
                    )}
                  </div>
                  <h3 className="mt-1 truncate text-[22px] font-bold text-slate-950">{selectedNode?.label || selectedSubject?.label || "Cấu trúc học liệu"}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {selectedNode
                      ? selectedNode.description || "Vị trí này chưa có mô tả. Bạn có thể tạo nội dung bên trong hoặc gắn tài liệu vào đây."
                      : "Chọn một vị trí bên trái hoặc tạo nhóm học liệu đầu tiên cho môn học."}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {selectedNode?.optionId ? (
                    <>
                      <Button variant="outline" onClick={onEditNode}>
                        <Pencil className="h-4 w-4" />
                        Sửa
                      </Button>
                      <Button variant="outline" onClick={onDeleteNode}>
                        <Trash2 className="h-4 w-4" />
                        Xóa
                      </Button>
                    </>
                  ) : null}
                  <Button variant="outline" onClick={onCreateRoot}>
                    <FolderPlus className="h-4 w-4" />
                    Tạo mới
                  </Button>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <div className="font-semibold text-slate-950">Bên trong vị trí đang chọn</div>
                    <div className="text-xs text-slate-500">Các chủ đề, bài học hoặc unit con sẽ nằm ở đây.</div>
                  </div>
                  <Badge tone="outline">{currentChildren.length} mục</Badge>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_120px_90px_120px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  <span>Tên</span>
                  <span>Loại</span>
                  <span>Con</span>
                  <span className="text-right">Thao tác</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {currentChildren.length ? (
                    currentChildren.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => onSelectNode(child.id)}
                        className={cn(
                          "grid w-full grid-cols-[minmax(0,1fr)_120px_90px_120px] items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-50/60",
                          child.id === selectedNode?.id ? "bg-blue-50" : "bg-white",
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500">{getNodeIcon(child, expandedNodeIds.has(child.id))}</span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-950">{child.label}</span>
                            <span className="block truncate text-xs text-slate-500">{child.description || "Chưa có mô tả"}</span>
                          </span>
                        </span>
                        <Badge tone="secondary">{getNodeKindLabel(child.kind)}</Badge>
                        <span className="text-sm font-semibold text-slate-600">{child.children.length}</span>
                        <span className="flex justify-end gap-2">
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (child.optionId) handleCreateChild(child);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                event.stopPropagation();
                                if (child.optionId) handleCreateChild(child);
                              }
                            }}
                            className={cn(
                              "inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-[var(--erg-blue)] hover:text-[var(--erg-blue)]",
                              !child.optionId && "pointer-events-none text-slate-300",
                            )}
                          >
                            + Con
                          </span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="flex min-h-[180px] flex-col items-center justify-center px-6 text-center">
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                        <Folder className="h-7 w-7" />
                      </span>
                      <div className="mt-4 font-semibold text-slate-950">Chưa có nội dung bên trong</div>
                      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Chọn Thêm bên trong để tạo chủ đề, bài học hoặc unit mới tại đúng vị trí này.</p>
                      <Button onClick={() => handleCreateChild()} disabled={!canCreateChild} className="mt-4 bg-[var(--erg-blue)] hover:bg-blue-800">
                        <Plus className="h-4 w-4" />
                        Thêm bên trong
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <div className="font-semibold text-slate-950">Nội dung đã gắn tại đây</div>
                    <div className="text-xs text-slate-500">Tài liệu, bài giảng và bài tập được thêm từ popup sẽ hiển thị tại đây.</div>
                  </div>
                  <Badge tone={totalAttachedItems ? "success" : "outline"}>{totalAttachedItems} mục</Badge>
                </div>
                {totalAttachedItems ? (
                  <div className="grid gap-2 p-3">
                    {currentLocalContentItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[var(--erg-blue)]">
                          {item.kind === "lecture" ? <Presentation className="h-5 w-5" /> : <FileCheck className="h-5 w-5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-slate-950">{item.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <Badge tone="secondary">{item.kind === "lecture" ? "Bài giảng" : "Bài tập"}</Badge>
                            {item.kind === "lecture" ? <span>Google Slides</span> : <span>{item.questionCount} câu hỏi</span>}
                            {item.kind === "exercise" && item.durationMinutes ? <span>{item.durationMinutes} phút</span> : null}
                          </div>
                        </div>
                      </div>
                    ))}
                    {currentResources.map((resource) => (
                      <div key={resource.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-[var(--erg-blue)]">
                          <FileText className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-slate-950">{resource.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <Badge tone="secondary">{resource.fileTypeBadge || resource.selectedFileType}</Badge>
                            <span>{resource.status || "draft"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[160px] flex-col items-center justify-center px-6 text-center">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                      <FileText className="h-6 w-6" />
                    </span>
                    <div className="mt-3 font-semibold text-slate-950">Chưa có nội dung gắn vào mục này</div>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Dùng nút Thêm bên trong để mở popup lớn và thêm tài liệu, bài giảng hoặc bài tập.</p>
                  </div>
                )}
              </div>
            </section>

            {contextMenu ? (
              <StructureContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                node={contextMenu.node}
                onCreateRoot={() => {
                  setContextMenu(null);
                  onCreateRoot();
                }}
                onCreateChild={() => {
                  setContextMenu(null);
                  handleCreateChild(contextMenu.node ?? selectedNode);
                }}
              />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function StructureContextMenu({
  x,
  y,
  node,
  onCreateRoot,
  onCreateChild,
}: {
  x: number;
  y: number;
  node?: StudioNode;
  onCreateRoot: () => void;
  onCreateChild: () => void;
}) {
  const canCreateChild = Boolean(node?.optionId);
  return (
    <div
      className="fixed z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.55)]"
      style={{ left: x, top: y }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="border-b border-slate-100 px-4 pb-2 pt-1">
        <div className="truncate text-sm font-semibold text-slate-950">{node?.label || "Cấu trúc học liệu"}</div>
        <div className="text-xs text-slate-500">{node ? getNodeKindLabel(node.kind) : "Root môn học"}</div>
      </div>
      <button type="button" onClick={onCreateRoot} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
        <FolderPlus className="h-4 w-4 text-[var(--erg-blue)]" />
        Tạo chủ đề đầu tiên
      </button>
      <button
        type="button"
        onClick={onCreateChild}
        disabled={!canCreateChild}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
      >
        <Plus className="h-4 w-4 text-[var(--erg-blue)]" />
        Thêm bên trong
      </button>
      <button type="button" disabled className="flex w-full cursor-not-allowed items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-300">
        <FileUp className="h-4 w-4" />
        Gắn tài liệu vào đây
      </button>
      <button type="button" disabled className="flex w-full cursor-not-allowed items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-300">
        <Settings2 className="h-4 w-4" />
        Sửa thông tin hiển thị
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
            <CardTitle>Kho tài liệu</CardTitle>
            <CardDescription>Cập nhật thông tin, trạng thái và nơi gắn tài liệu.</CardDescription>
          </div>
          <Button className="bg-[var(--erg-blue)] hover:bg-blue-800">
            <FileUp className="h-4 w-4" />
            Upload tài liệu
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
                    {resource.fileTypeBadge || resource.selectedFileType} · {resource.status || "draft"}
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
  const subjectNodes = subject ? flattenNodes(subject.tree) : allNodes;
  const [nodeId, setNodeId] = useState(subjectNodes[0]?.id ?? "");
  const node = subjectNodes.find((item) => item.id === nodeId) ?? subjectNodes[0];
  const path = subject && node ? findPath(subject.tree, node.id) : [];
  const location = buildResourceLocation(path);
  const [title, setTitle] = useState("");
  const [fileType, setFileType] = useState("PDF");
  const [file, setFile] = useState<File | null>(null);
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
    if (!file || !subject || !location.categoryId) {
      setMessage("Vui lòng chọn môn, vị trí có nhóm học liệu và file cần upload.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await uploadHocLieuResource({
        file,
        title: title.trim() || file.name,
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
        canDownload: fileType !== "PPTX",
      });
      setMessage("Đã upload và gắn tài liệu vào đúng vị trí trong cây học liệu.");
      setTitle("");
      setFile(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không upload được tài liệu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Upload tài liệu mới</CardTitle>
          <CardDescription>Chọn môn, vị trí trong cấu trúc và loại tài liệu. File sẽ được gửi lên BE và gắn vào đúng node.</CardDescription>
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
              <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-[var(--erg-blue)] hover:bg-blue-50">
                <FileUp className="h-10 w-10 text-[var(--erg-blue)]" />
                <div className="mt-4 font-semibold text-slate-950">{file ? file.name : "Kéo thả hoặc bấm để chọn file"}</div>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  API thật: tạo resource, upload asset và mapping vào {location.categoryId ? "vị trí đang chọn" : "nhóm học liệu hợp lệ"}.
                </p>
                <input className="sr-only" type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </label>
            </div>
            {message ? <div className="md:col-span-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{message}</div> : null}
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving || !file || !subject || !location.categoryId} className="bg-[var(--erg-blue)] hover:bg-blue-800">
                {saving ? "Đang upload..." : "Upload và gắn tài liệu"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin vị trí</CardTitle>
          <CardDescription>Giúp giáo viên kiểm tra file sẽ được gắn vào đâu trước khi upload.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Môn" value={subject?.label ?? "Chưa chọn"} />
          <InfoRow label="Vị trí" value={pathLabel(subject?.label ?? "", path) || "Chưa chọn"} />
          <InfoRow label="Loại" value={node ? getNodeKindLabel(node.kind) : "Chưa chọn"} />
          <ChecklistItem label={location.categoryId ? "Đã xác định nhóm học liệu" : "Cần chọn một nhóm học liệu"} />
          <ChecklistItem label={file ? "Đã chọn file" : "Chưa chọn file"} />
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

function pathLabel(subjectLabel: string, path: StudioNode[]) {
  return [subjectLabel, ...path.map((item) => item.label)].filter(Boolean).join(" / ");
}

function PublishScreen({ subjects, resources }: { subjects: StudioSubject[]; resources: HocLieuResourceCard[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <PublishCard title="Môn học" value={subjects.length} description="Sẵn sàng đưa vào catalog." />
      <PublishCard title="Tài liệu" value={resources.length} description="Đang có trong kho Hoclieu." />
      <PublishCard title="Cần kiểm tra" value={resources.filter((item) => item.status !== "published").length} description="Chưa ở trạng thái published." />
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Luồng xuất bản đề xuất</CardTitle>
          <CardDescription>Tách khỏi màn hình tạo cấu trúc để admin kiểm tra trước khi public.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <PublishStep icon={<BookOpen className="h-5 w-5" />} title="Môn học" description="Có tên, mô tả và trạng thái." />
          <PublishStep icon={<ListTree className="h-5 w-5" />} title="Cấu trúc" description="Có nhóm học liệu, chủ đề và unit/lesson." />
          <PublishStep icon={<FileUp className="h-5 w-5" />} title="Tài liệu" description="File đã upload và gắn đúng vị trí." />
          <PublishStep icon={<Settings2 className="h-5 w-5" />} title="Public" description="Kiểm tra visibility trước khi lên web." />
        </CardContent>
      </Card>
    </div>
  );
}

function ExplorerTreeRow({
  node,
  depth = 0,
  selectedNodeId,
  expanded,
  onSelectNode,
  onToggleNode,
  onCreateChild,
  onOpenContextMenu,
}: {
  node: StudioNode;
  depth?: number;
  selectedNodeId: string;
  expanded: boolean;
  onSelectNode: (id: string) => void;
  onToggleNode: (id: string) => void;
  onCreateChild: (node: StudioNode) => void;
  onOpenContextMenu: (event: MouseEvent, node: StudioNode) => void;
}) {
  const selected = node.id === selectedNodeId;
  const hasChildren = node.children.length > 0;
  return (
    <div
      className={cn(
        "group grid grid-cols-[28px_minmax(0,1fr)_32px] items-center gap-2 rounded-2xl px-3 py-2 text-sm transition",
        selected ? "bg-blue-100 text-[var(--erg-blue)]" : "text-slate-700 hover:bg-white",
      )}
      style={{ paddingLeft: `${12 + Math.min(depth, 8) * 20}px` }}
      onContextMenu={(event) => onOpenContextMenu(event, node)}
    >
      <button
        type="button"
        onClick={() => (hasChildren ? onToggleNode(node.id) : onSelectNode(node.id))}
        className="grid h-7 w-7 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"
        aria-label={expanded ? "Thu gọn" : "Mở rộng"}
      >
        {hasChildren ? (expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />}
      </button>
      <button type="button" onClick={() => onSelectNode(node.id)} className="flex min-w-0 items-start gap-2 rounded-xl px-1 py-1 text-left">
        <span className={cn("mt-0.5 shrink-0 text-slate-500", selected ? "text-[var(--erg-blue)]" : undefined)}>{getNodeIcon(node, expanded)}</span>
        <span
          className="line-clamp-2 break-words text-[15px] font-medium leading-5 text-slate-900"
          title={node.label}
        >
          {node.label}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onCreateChild(node)}
        disabled={!node.optionId}
        className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 opacity-0 transition hover:bg-blue-50 hover:text-[var(--erg-blue)] disabled:cursor-not-allowed disabled:text-slate-200 group-hover:opacity-100"
        aria-label="Thêm nội dung bên trong"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

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

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "0 KB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
    selectedFileType: "LINK";
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
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [resourceFileType, setResourceFileType] = useState("PDF");
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const open = Boolean(state);
  const isSubject = state?.mode === "subject";
  const title = isSubject ? "Tạo môn học" : state?.mode === "root" ? "Tạo chủ đề đầu tiên" : "Thêm nội dung bên trong";
  const descriptionText = isSubject
    ? "Môn học là cấp đầu tiên. Sau khi tạo, bạn sẽ xây dựng các nhóm học liệu, chủ đề và unit bên trong."
    : state?.mode === "root"
      ? "Tạo cấp đầu tiên dưới môn học, ví dụ Sách mềm, Hợp phần bổ trợ, Level 1 hoặc nhóm học liệu chính."
      : "Nội dung mới sẽ nằm bên trong chủ đề, bài học hoặc unit đang chọn.";
  const availableOptions = getAvailableContentOptions(state?.mode ?? "subject", selectedNode?.kind as "group" | "lesson" | "folder" | undefined);
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
    setStep(isSubject ? "details" : "pick");
    setSelectedOption(isSubject ? "category" : null);
    setLabel("");
    setDescription("");
    setKind("category");
    setSlidesUrl("");
    setExerciseQuery("");
    setSelectedExerciseIds([]);
    setResourceFileType("PDF");
    setResourceFile(null);
    setError("");
    setSaving(false);
  }, [isSubject, open, state?.mode]);

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
          documentTypeId: resourceLocation.categoryId,
          selectedFileType: "LINK",
          status: "published",
          visibility: "public",
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
          })),
        );
        return;
      }

      if (selectedOption === "resource") {
        if (!selectedSubject || !selectedNode) throw new Error("Vui lòng chọn vị trí cần gắn tài liệu.");
        if (!resourceLocation.categoryId) throw new Error("Vị trí hiện tại chưa xác định được nhóm học liệu để gắn tài liệu.");
        if (!resourceFile) throw new Error("Vui lòng chọn file cần upload.");
        await uploadHocLieuResource({
          file: resourceFile,
          title: label.trim() || resourceFile.name,
          description: description.trim(),
          selectedFileType: resourceFileType,
          subjectId: selectedSubject.id,
          programSlug: selectedSubject.id,
          categoryId: resourceLocation.categoryId,
          sectionId: resourceLocation.sectionId,
          bookSeriesId: resourceLocation.bookSeriesId,
          topicId: resourceLocation.topicId,
          documentTypeId: resourceLocation.categoryId,
          status: "published",
          visibility: "public",
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
        status: "active",
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

      const created = normalizeTaxonomyOption(await createHocLieuTaxonomy(isSubject ? "subjects" : apiKindForNodeKind(resolvedKind), payload));
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
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[var(--erg-blue)] hover:bg-blue-50/40"
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
                  <Button type="button" variant="outline" size="sm" onClick={() => setStep("pick")}>
                    <ChevronLeft className="h-4 w-4" />
                    Chọn lại
                  </Button>
                </div>
              ) : null}

              {selectedOption === "lecture" ? (
                <>
                  <Field label="Tên bài giảng">
                    <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Ví dụ: Bài giảng Bài 01" autoFocus />
                  </Field>
                  <Field label="Link Google Slides">
                    <Input
                      value={slidesUrl}
                      onChange={(event) => setSlidesUrl(event.target.value)}
                      placeholder="Dán link edit, publish hoặc embed của Google Slides"
                    />
                    <p className="text-xs leading-5 text-slate-500">Popup này ưu tiên link Google Slides. Nếu cần upload file, giáo viên vẫn có thể dùng khu vực Upload nâng cao.</p>
                  </Field>
                  <Field label="Mô tả ngắn">
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Ví dụ: Slide dùng cho tiết mở đầu, có note cho giáo viên"
                      className={cn(inputClassName, "min-h-24 py-3")}
                    />
                  </Field>
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
                  <Field label="Ghi chú cho lần gắn này">
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Ví dụ: Giao cuối tiết hoặc dùng để luyện tập về nhà"
                      className={cn(inputClassName, "min-h-24 py-3")}
                    />
                  </Field>
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
                              "rounded-2xl border p-3 text-left transition",
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
                    <Field label="Tên hiển thị">
                      <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder={resourceFile?.name || "Ví dụ: Unit 1 - Lesson 1"} autoFocus />
                    </Field>
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
                      <Field label="Mô tả ngắn">
                        <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ví dụ: Tài liệu dùng cho tiết mở đầu hoặc bài luyện tập" />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center transition hover:border-[var(--erg-blue)] hover:bg-blue-50/60">
                        <FileUp className="h-10 w-10 text-[var(--erg-blue)]" />
                        <div className="mt-3 font-semibold text-slate-950">{resourceFile ? resourceFile.name : "Kéo thả hoặc bấm để chọn file"}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {resourceFile ? formatFileSize(resourceFile.size) : pathLabel(selectedSubject?.label ?? "", selectedPath)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">File sẽ được upload và gắn ngay vào vị trí đang chọn trong popup này.</div>
                        <input className="sr-only" type="file" onChange={(event) => setResourceFile(event.target.files?.[0] ?? null)} />
                      </label>
                    </div>
                  </div>
                </>
              ) : null}

              {(!selectedOption || selectedOption === "category" || selectedOption === "section" || isSubject) ? (
                <>
                  <Field label={isSubject ? "Tên môn học" : "Tên hiển thị"}>
                    <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder={isSubject ? "Ví dụ: IC3 GS6" : kind === "category" ? "Ví dụ: Chủ đề 1, Học phần bổ trợ" : "Ví dụ: Bài 01. Làm quen với máy tính"} autoFocus />
                  </Field>

                  {!isSubject ? (
                    <Field label="Loại nội dung">
                      <select value={kind} onChange={(event) => setKind(event.target.value as TaxonomyCreateKind)} className={inputClassName}>
                        <option value="category">Nhóm học liệu</option>
                        <option value="section">Bài học</option>
                      </select>
                      <p className="text-xs leading-5 text-slate-500">
                        Mô hình mới chỉ còn <b>Nhóm học liệu</b> và <b>Bài học</b>. Slide thuyết trình, bài tập và tài liệu sẽ được gắn trực tiếp bên trong từng bài học.
                      </p>
                    </Field>
                  ) : null}

                  <Field label="Mô tả ngắn">
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Giúp giáo viên hiểu mục này dùng để làm gì"
                      className={cn(inputClassName, "min-h-24 py-3")}
                    />
                  </Field>
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
                      ? !resourceFile
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
                        ? "Upload tài liệu"
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
      setError("Vui lòng nhập tên.");
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
          <DialogDescription>Cập nhật tên, mô tả và trạng thái để trang Hoclieu hiển thị rõ ràng hơn.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Tên hiển thị">
            <Input value={label} onChange={(event) => setLabel(event.target.value)} autoFocus />
          </Field>
          <Field label="Trạng thái">
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClassName}>
              <option value="active">Đang dùng</option>
              <option value="draft">Bản nháp</option>
              <option value="hidden">Ẩn khỏi Hoclieu</option>
            </select>
          </Field>
          <Field label="Mô tả cho giáo viên/học sinh">
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} className={cn(inputClassName, "min-h-28 py-3")} />
          </Field>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="font-semibold text-slate-950">Thông tin hiển thị trên Hoclieu</div>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Cấu trúc lưu phần mô tả và ảnh đại diện. File thật như PDF/video/audio nên tạo ở phần Nội dung/Upload rồi gắn vào đúng vị trí.
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
