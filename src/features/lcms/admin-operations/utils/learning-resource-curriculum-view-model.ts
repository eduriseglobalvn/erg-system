import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import type { LearningResourceTaxonomyOption } from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import type {
  AttachedResourceItem,
  LocalContentItem,
  StudioNode,
  StudioSubject,
} from "@/features/lcms/admin-operations/types/learning-resource-authoring";

export type CurriculumFolderRole = "subject" | "level" | "topic";
export type CurriculumContentKind = "lecture" | "resource" | "exercise";
export type CurriculumSelectionKind = "none" | CurriculumFolderRole;

export type ContentSummary = {
  levels: number;
  topics: number;
  lectures: number;
  documents: number;
  exercises: number;
  totalContent: number;
  published: number;
  draft: number;
  hidden: number;
};

export type CurriculumTarget =
  | { type: "subject"; id: string }
  | { type: "node"; id: string }
  | { type: "local-content"; id: string }
  | { type: "resource"; id: string };

export type CurriculumFolder = {
  id: string;
  role: CurriculumFolderRole;
  title: string;
  description?: string;
  status?: string;
  sourceKind?: string;
  target: CurriculumTarget;
  pathLabels: string[];
  summary: ContentSummary;
};

export type CurriculumContentItem = {
  id: string;
  kind: CurriculumContentKind;
  title: string;
  description?: string;
  sourceLabel: string;
  typeLabel: string;
  status?: string;
  target: CurriculumTarget;
  meta: string[];
  actionLabel: string;
  href?: string;
  questionCount?: number;
  durationMinutes?: number;
  fileType?: string;
};

export type CurriculumExplorerModel = {
  selectedKind: CurriculumSelectionKind;
  selectedFolder?: CurriculumFolder;
  folders: CurriculumFolder[];
  contentGroups: Record<CurriculumContentKind, CurriculumContentItem[]>;
  summary: ContentSummary;
  pathLabels: string[];
  searchPlaceholder: string;
};

export type CurriculumRoadmapLesson = {
  folder: CurriculumFolder;
  content: CurriculumContentItem[];
};

export type CurriculumRoadmapTopic = {
  id: string;
  title: string;
  lessons: CurriculumRoadmapLesson[];
};

export type CurriculumRoadmapStage = {
  level: CurriculumFolder;
  topics: CurriculumRoadmapTopic[];
};

export type ResourceCurriculumLocation = {
  subjectLabel: string;
  levelLabel?: string;
  topicLabel?: string;
  pathLabels: string[];
  isResolved: boolean;
};

export type ResourceCommandId =
  | "create-subject"
  | "create-level"
  | "create-topic"
  | "add-lecture"
  | "add-resource"
  | "add-exercise"
  | "copy-url"
  | "edit"
  | "delete";

export type ResourceCommandSpec = {
  id: ResourceCommandId;
  label: string;
  enabled: boolean;
  tone: "primary" | "blue" | "red" | "neutral" | "danger";
};

export type BuildCurriculumExplorerModelInput = {
  subjects: StudioSubject[];
  selectedSubject?: StudioSubject;
  selectedNode?: StudioNode;
  selectedPath: StudioNode[];
  localContentItems: LocalContentItem[];
  resources: AttachedResourceItem[];
  quizBankItems: QuizBankItem[];
};

const EMPTY_SUMMARY: ContentSummary = {
  levels: 0,
  topics: 0,
  lectures: 0,
  documents: 0,
  exercises: 0,
  totalContent: 0,
  published: 0,
  draft: 0,
  hidden: 0,
};

export function emptyContentSummary(): ContentSummary {
  return { ...EMPTY_SUMMARY };
}

export function buildCurriculumExplorerModel({
  subjects,
  selectedSubject,
  selectedNode,
  selectedPath,
  localContentItems,
  resources,
  quizBankItems,
}: BuildCurriculumExplorerModelInput): CurriculumExplorerModel {
  const selectedKind = getSelectedKind(selectedSubject, selectedNode);
  const pathLabels = [selectedSubject?.label, ...selectedPath.map((node) => node.label)].filter(Boolean) as string[];
  const summary = selectedSubject
    ? summarizeFolder(selectedSubject, selectedNode, localContentItems, resources)
    : summarizeSubjects(subjects, localContentItems, resources);
  const folders = selectedSubject
    ? (selectedNode?.children ?? selectedSubject.tree).map((node) =>
        nodeToFolder({ node, pathLabels, resources, localContentItems, subject: selectedSubject }),
      )
    : subjects.map((subject) => subjectToFolder(subject, localContentItems, resources));
  const selectedFolder = selectedSubject
    ? selectedNode
      ? nodeToFolder({
          node: selectedNode,
          pathLabels: pathLabels.slice(0, -1),
          resources,
          localContentItems,
          subject: selectedSubject,
        })
      : subjectToFolder(selectedSubject, localContentItems, resources)
    : undefined;
  const contentGroups = selectedKind === "topic" && selectedSubject && selectedNode
    ? buildTopicContentGroups(selectedSubject, selectedNode, localContentItems, resources, quizBankItems)
    : emptyContentGroups();

  return {
    selectedKind,
    selectedFolder,
    folders,
    contentGroups,
    summary,
    pathLabels,
    searchPlaceholder: getSearchPlaceholder(selectedKind, selectedSubject),
  };
}

export function buildCurriculumRoadmapStages({
  subject,
  levelNode,
  localContentItems,
  resources,
  taxonomyTopics,
  quizBankItems,
}: {
  subject: StudioSubject;
  levelNode?: StudioNode;
  localContentItems: LocalContentItem[];
  resources: AttachedResourceItem[];
  taxonomyTopics: LearningResourceTaxonomyOption[];
  quizBankItems: QuizBankItem[];
}): CurriculumRoadmapStage[] {
  const levelNodes = levelNode
    ? [levelNode]
    : subject.tree.filter((node) => getNodeFolderRole(node) === "level");

  return levelNodes.map((level) => {
    const topicGroups = new Map<string, CurriculumRoadmapTopic>();

    collectTopicNodes(level.children).forEach((lessonNode) => {
      const contentGroups = buildTopicContentGroups(subject, lessonNode, localContentItems, resources, quizBankItems);
      const content = [...contentGroups.lecture, ...contentGroups.resource, ...contentGroups.exercise];
      const matchingResources = resources.filter(
        (resource) => resource.subjectId === subject.id && resourceBelongsToNode(resource, lessonNode),
      );
      const matchingLocalItems = localContentItems.filter(
        (item) => item.subjectId === subject.id && localContentBelongsToNode(item, lessonNode),
      );
      const taxonomyTopicId = lessonNode.metadata?.topicId
        || lessonNode.location.topicId
        || matchingResources.find((resource) => resource.topicId)?.topicId;
      const localTopicLabel = matchingLocalItems.find((item) => item.topicLabel)?.topicLabel;
      const taxonomyTopic = taxonomyTopics.find((topic) =>
        topic.id === taxonomyTopicId || Boolean(localTopicLabel && normalizeForMatch(topic.label) === normalizeForMatch(localTopicLabel)),
      );
      const groupId = taxonomyTopic?.id || (localTopicLabel ? `label-${normalizeForMatch(localTopicLabel)}` : "uncategorized");
      const group = topicGroups.get(groupId) ?? {
        id: groupId,
        title: taxonomyTopic?.label || localTopicLabel || "Chưa phân chủ đề",
        lessons: [],
      };

      group.lessons.push({
        folder: nodeToFolder({
          node: lessonNode,
          pathLabels: [subject.label, level.label, group.title],
          resources,
          localContentItems,
          subject,
        }),
        content,
      });
      topicGroups.set(groupId, group);
    });

    return {
      level: nodeToFolder({
        node: level,
        pathLabels: [subject.label],
        resources,
        localContentItems,
        subject,
      }),
      topics: [...topicGroups.values()],
    };
  });
}

export function resolveResourceCurriculumLocation(
  subjects: StudioSubject[],
  resource: Pick<AttachedResourceItem, "subjectId" | "categoryId" | "levelId" | "sectionId" | "topicId">,
): ResourceCurriculumLocation {
  const subject = subjects.find((candidate) => candidate.id === resource.subjectId);
  if (!subject) {
    return {
      subjectLabel: "Chưa xác định môn học",
      pathLabels: ["Chưa xác định môn học"],
      isResolved: false,
    };
  }

  const expectedLevelId = resource.levelId || resource.categoryId;
  const level = subject.tree.find((node) =>
    node.optionId === expectedLevelId
    || node.location.categoryId === expectedLevelId,
  );
  const topic = level
    ? findDescendant(level.children, (node) =>
        node.optionId === resource.sectionId
        || node.optionId === resource.topicId
        || node.location.sectionId === resource.sectionId
        || node.location.topicId === resource.topicId,
      )
    : undefined;
  const pathLabels = [subject.label, level?.label, topic?.label].filter(Boolean) as string[];

  return {
    subjectLabel: subject.label,
    levelLabel: level?.label,
    topicLabel: topic?.label,
    pathLabels,
    isResolved: Boolean(level && topic),
  };
}

export function getResourceCommandSpecs({
  canDeleteSelection,
  canEditSelection,
  hasSelectedSubject,
  selectedKind,
}: {
  canDeleteSelection: boolean;
  canEditSelection: boolean;
  hasSelectedSubject: boolean;
  selectedKind: CurriculumSelectionKind;
}): ResourceCommandSpec[] {
  const createCommand: ResourceCommandSpec =
    !hasSelectedSubject || selectedKind === "none"
      ? { id: "create-subject", label: "Tạo môn học", enabled: true, tone: "primary" }
      : selectedKind === "subject"
        ? { id: "create-level", label: "Tạo level", enabled: true, tone: "primary" }
        : selectedKind === "level"
          ? { id: "create-topic", label: "Tạo chủ đề", enabled: true, tone: "primary" }
          : { id: "add-lecture", label: "Thêm bài giảng", enabled: true, tone: "primary" };

  return [
    createCommand,
    { id: "add-lecture", label: "Thêm bài giảng", enabled: selectedKind === "topic", tone: "blue" },
    { id: "add-resource", label: "Gắn tài liệu", enabled: selectedKind === "topic", tone: "blue" },
    { id: "add-exercise", label: "Gắn bài tập từ Quiz bank", enabled: selectedKind === "topic", tone: "red" },
    { id: "copy-url", label: "Copy URL", enabled: hasSelectedSubject, tone: "neutral" },
    { id: "edit", label: "Sửa", enabled: canEditSelection, tone: "neutral" },
    { id: "delete", label: "Xem tác động", enabled: canDeleteSelection, tone: "danger" },
  ];
}

export function classifyAttachedResource(resource: AttachedResourceItem): CurriculumContentKind {
  const type = `${resource.fileTypeBadge ?? ""} ${resource.selectedFileType ?? ""} ${resource.title ?? ""}`.toLowerCase();
  if (type.includes("quiz") || type.includes("bai tap") || type.includes("bài tập") || type.includes("html5")) return "exercise";
  if (type.includes("ppt") || type.includes("slide") || type.includes("presentation")) return "lecture";
  return "resource";
}

function buildTopicContentGroups(
  subject: StudioSubject,
  topicNode: StudioNode,
  localContentItems: LocalContentItem[],
  resources: AttachedResourceItem[],
  quizBankItems: QuizBankItem[],
): Record<CurriculumContentKind, CurriculumContentItem[]> {
  const quizById = new Map(quizBankItems.map((quiz) => [quiz.id, quiz]));
  const topicOptionId = topicNode.optionId;
  const localItems = localContentItems.filter(
    (item) => item.subjectId === subject.id && item.parentOptionId === topicOptionId,
  );
  const attachedItems = resources.filter((resource) => resource.subjectId === subject.id && resourceBelongsToNode(resource, topicNode));
  const groups = emptyContentGroups();

  localItems.forEach((item) => {
    const quiz = item.sourceQuizId ? quizById.get(item.sourceQuizId) : findQuizForLocalContent(item, quizBankItems);
    const content = localContentToItem(item, quiz);
    groups[content.kind].push(content);
  });

  attachedItems.forEach((resource) => {
    const content = attachedResourceToItem(resource);
    groups[content.kind].push(content);
  });

  return groups;
}

function localContentToItem(item: LocalContentItem, quiz?: QuizBankItem): CurriculumContentItem {
  if (item.kind === "lecture") {
    return {
      id: `local-${item.id}`,
      kind: "lecture",
      title: item.title,
      description: item.description,
      sourceLabel: "Google Slides",
      typeLabel: "Bài giảng",
      status: item.status,
      href: item.slidesUrl,
      target: { type: "local-content", id: item.id },
      meta: compactMeta([item.topicLabel, item.durationMinutes ? `${item.durationMinutes} phút` : undefined]),
      actionLabel: "Mở bài",
      durationMinutes: item.durationMinutes,
      fileType: "PPTX",
    };
  }

  return {
    id: `local-${item.id}`,
    kind: "exercise",
    title: item.title,
    description: item.description || quiz?.topicLabels.join(", "),
    sourceLabel: "Quiz bank",
    typeLabel: quiz?.kind === "test" ? "Bài kiểm tra" : "Bài tập",
    status: item.status ?? quiz?.status,
    href: item.resourceUrl,
    target: { type: "local-content", id: item.id },
    meta: compactMeta([
      quiz?.scopeLabel,
      `${item.questionCount ?? quiz?.questionCount ?? 0} câu`,
      item.durationMinutes ? `${item.durationMinutes} phút` : quiz?.durationLabel,
    ]),
    actionLabel: "Xem quiz",
    questionCount: item.questionCount ?? quiz?.questionCount,
    durationMinutes: item.durationMinutes,
    fileType: "QUIZ",
  };
}

function attachedResourceToItem(resource: AttachedResourceItem): CurriculumContentItem {
  const kind = classifyAttachedResource(resource);
  const fileType = resource.fileTypeBadge || resource.selectedFileType || (kind === "resource" ? "FILE" : "PPTX");
  const sourceLabel = kind === "exercise" ? "Quiz bank" : resolveResourceSourceLabel(resource, kind);

  return {
    id: `resource-${resource.id}`,
    kind,
    title: resource.title,
    description: resource.subtitle,
    sourceLabel,
    typeLabel: kind === "lecture" ? "Bài giảng" : kind === "exercise" ? "Bài tập" : "Tài liệu",
    status: resource.status,
    href: resource.linkUrl,
    target: { type: "resource", id: resource.id },
    meta: compactMeta([fileType, resource.subtitle, resource.canDownload ? "Có tải về" : undefined]),
    actionLabel: kind === "lecture" ? "Mở bài" : kind === "exercise" ? "Xem quiz" : "Mở tài liệu",
    fileType,
  };
}

function subjectToFolder(subject: StudioSubject, localContentItems: LocalContentItem[], resources: AttachedResourceItem[]): CurriculumFolder {
  return {
    id: `subject-${subject.id}`,
    role: "subject",
    title: subject.label,
    description: subject.description,
    status: subject.status,
    target: { type: "subject", id: subject.id },
    pathLabels: [subject.label],
    summary: summarizeFolder(subject, undefined, localContentItems, resources),
  };
}

function nodeToFolder({
  localContentItems,
  node,
  pathLabels,
  resources,
  subject,
}: {
  localContentItems: LocalContentItem[];
  node: StudioNode;
  pathLabels: string[];
  resources: AttachedResourceItem[];
  subject?: StudioSubject;
}): CurriculumFolder {
  return {
    id: node.id,
    role: getNodeFolderRole(node),
    title: node.label,
    description: node.description,
    status: node.status,
    sourceKind: node.sourceKind,
    target: { type: "node", id: node.id },
    pathLabels: [...pathLabels, node.label],
    summary: subject ? summarizeFolder(subject, node, localContentItems, resources) : emptyContentSummary(),
  };
}

function summarizeSubjects(subjects: StudioSubject[], localContentItems: LocalContentItem[], resources: AttachedResourceItem[]): ContentSummary {
  return subjects.reduce((summary, subject) => mergeSummary(summary, summarizeFolder(subject, undefined, localContentItems, resources)), emptyContentSummary());
}

function summarizeFolder(
  subject: StudioSubject,
  node: StudioNode | undefined,
  localContentItems: LocalContentItem[],
  resources: AttachedResourceItem[],
): ContentSummary {
  const summary = emptyContentSummary();
  const nodes = node ? node.children : subject.tree;
  summary.levels = countNodesByRole(nodes, "level");
  summary.topics = countNodesByRole(nodes, "topic");

  const matchingLocalItems = localContentItems.filter(
    (item) => item.subjectId === subject.id && (!node || localContentBelongsToNode(item, node)),
  );
  const matchingResources = resources.filter(
    (resource) => resource.subjectId === subject.id && (!node || resourceBelongsToNode(resource, node)),
  );

  matchingLocalItems.forEach((item) => {
    if (item.kind === "lecture") summary.lectures += 1;
    if (item.kind === "exercise") summary.exercises += 1;
    addStatusCount(summary, item.status);
  });

  matchingResources.forEach((resource) => {
    const kind = classifyAttachedResource(resource);
    if (kind === "lecture") summary.lectures += 1;
    if (kind === "exercise") summary.exercises += 1;
    if (kind === "resource") summary.documents += 1;
    addStatusCount(summary, resource.status);
  });

  summary.totalContent = summary.lectures + summary.documents + summary.exercises;
  return summary;
}

function mergeSummary(left: ContentSummary, right: ContentSummary): ContentSummary {
  return {
    levels: left.levels + right.levels,
    topics: left.topics + right.topics,
    lectures: left.lectures + right.lectures,
    documents: left.documents + right.documents,
    exercises: left.exercises + right.exercises,
    totalContent: left.totalContent + right.totalContent,
    published: left.published + right.published,
    draft: left.draft + right.draft,
    hidden: left.hidden + right.hidden,
  };
}

function countNodesByRole(nodes: StudioNode[], role: CurriculumFolderRole): number {
  return nodes.reduce((total, node) => {
    const current = getNodeFolderRole(node) === role ? 1 : 0;
    return total + current + countNodesByRole(node.children, role);
  }, 0);
}

function collectTopicNodes(nodes: StudioNode[]): StudioNode[] {
  return nodes.flatMap((node) =>
    getNodeFolderRole(node) === "topic" ? [node] : collectTopicNodes(node.children),
  );
}

function findDescendant(nodes: StudioNode[], predicate: (node: StudioNode) => boolean): StudioNode | undefined {
  for (const node of nodes) {
    if (predicate(node)) return node;
    const nested = findDescendant(node.children, predicate);
    if (nested) return nested;
  }
  return undefined;
}

function localContentBelongsToNode(item: LocalContentItem, node: StudioNode) {
  if (node.kind === "lesson" || node.kind === "section" || node.kind === "topic") {
    return item.parentOptionId === node.optionId || item.parentNodeId === node.id;
  }

  const lessonIds = collectLessonOptionIds(node);
  return lessonIds.has(item.parentOptionId);
}

function resourceBelongsToNode(resource: AttachedResourceItem, node: StudioNode) {
  if (node.kind === "lesson" || node.kind === "section" || node.kind === "topic") {
    return resource.sectionId === node.location.sectionId || resource.sectionId === node.optionId || resource.topicId === node.location.topicId;
  }

  if (node.location.categoryId && resource.categoryId === node.location.categoryId) return true;
  const lessonIds = collectLessonOptionIds(node);
  return Boolean(resource.sectionId && lessonIds.has(resource.sectionId));
}

function collectLessonOptionIds(node: StudioNode): Set<string> {
  const ids = new Set<string>();
  const visit = (current: StudioNode) => {
    if ((current.kind === "lesson" || current.kind === "section" || current.kind === "topic") && current.optionId) {
      ids.add(current.optionId);
    }
    current.children.forEach(visit);
  };
  visit(node);
  return ids;
}

function getSelectedKind(subject?: StudioSubject, node?: StudioNode): CurriculumSelectionKind {
  if (!subject) return "none";
  if (!node) return "subject";
  return getNodeFolderRole(node);
}

export function getNodeFolderRole(node: StudioNode): Exclude<CurriculumFolderRole, "subject"> {
  if (node.metadata?.taxonomyRole === "level" || node.kind === "group" || node.kind === "category" || node.kind === "bookSeries") {
    return "level";
  }
  return "topic";
}

function getSearchPlaceholder(selectedKind: CurriculumSelectionKind, subject?: StudioSubject) {
  if (selectedKind === "topic") return "Tìm trong chủ đề này";
  if (selectedKind === "level") return "Tìm trong level này";
  if (subject) return `Tìm trong ${subject.label}`;
  return "Tìm môn học, level, chủ đề";
}

function emptyContentGroups(): Record<CurriculumContentKind, CurriculumContentItem[]> {
  return {
    lecture: [],
    resource: [],
    exercise: [],
  };
}

function findQuizForLocalContent(item: LocalContentItem, quizBankItems: QuizBankItem[]) {
  const normalizedTitle = normalizeForMatch(item.title);
  return quizBankItems.find((quiz) => normalizeForMatch(quiz.title) === normalizedTitle || normalizedTitle.includes(normalizeForMatch(quiz.title)));
}

function resolveResourceSourceLabel(resource: AttachedResourceItem, kind: CurriculumContentKind) {
  const link = resource.linkUrl?.toLowerCase() ?? "";
  if (link.includes("docs.google.com/presentation")) return "Google Slides";
  if (link.includes("drive.google.com")) return "Google Drive";
  if (kind === "lecture") return "Slide";
  return "Học liệu";
}

function addStatusCount(summary: ContentSummary, status?: string) {
  const normalized = status?.toLowerCase();
  if (normalized === "hidden") {
    summary.hidden += 1;
    return;
  }
  if (normalized === "draft" || normalized === "reviewing") {
    summary.draft += 1;
    return;
  }
  summary.published += 1;
}

function compactMeta(values: Array<string | number | undefined | null>) {
  return values
    .map((value) => (value === undefined || value === null ? "" : String(value).trim()))
    .filter(Boolean);
}

function normalizeForMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
