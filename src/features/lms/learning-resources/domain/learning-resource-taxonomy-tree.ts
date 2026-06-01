import type { HocLieuResourceCard, HocLieuTaxonomyOption, HocLieuTaxonomyResponse } from "@/features/admin-operations/api/learning-resource-authoring-api";

export type LearningResourceTreeNodeKind = "category" | "topic" | "section" | "bookSeries" | "folder";

export type LearningResourceTreeNode = {
  id: string;
  label: string;
  kind: LearningResourceTreeNodeKind;
  description?: string;
  optionId?: string;
  status?: string;
  metadata?: Record<string, string>;
  children: LearningResourceTreeNode[];
};

export type LearningResourceTreeSubject = {
  id: string;
  label: string;
  description?: string;
  status?: string;
  metadata?: Record<string, string>;
  tree: LearningResourceTreeNode[];
  categoryCount: number;
  resourceCount: number;
};

function belongsToSubject(option: HocLieuTaxonomyOption, subjectId: string) {
  return option.subjectId === subjectId || option.id === subjectId || !option.subjectId;
}

function sortOptions<T extends HocLieuTaxonomyOption>(items: T[]) {
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.label ?? "").localeCompare(String(b.label ?? ""), "vi"));
}

function getTopicId(option: HocLieuTaxonomyOption) {
  return (option as HocLieuTaxonomyOption & { topicId?: string }).topicId;
}

function buildCategoryNode(
  category: HocLieuTaxonomyOption,
  allCategories: HocLieuTaxonomyOption[],
  model: HocLieuTaxonomyResponse,
  visited = new Set<string>(),
): LearningResourceTreeNode {
  const visitKey = `category:${category.id}`;
  if (visited.has(visitKey)) {
    return {
      id: `category-${category.id}`,
      label: category.label,
      description: category.description,
      status: category.status,
      metadata: category.metadata,
      kind: "category",
      optionId: category.id,
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
    optionId: category.id,
    children: buildChildNodes("category", category.id, allCategories, model, nextVisited),
  };
}

function buildTopicNode(
  topic: HocLieuTaxonomyOption,
  allCategories: HocLieuTaxonomyOption[],
  model: HocLieuTaxonomyResponse,
  visited: Set<string>,
): LearningResourceTreeNode {
  const visitKey = `topic:${topic.id}`;
  const nextVisited = new Set(visited).add(visitKey);
  return {
    id: `topic-${topic.id}`,
    label: topic.label,
    description: topic.description,
    status: topic.status,
    metadata: topic.metadata,
    kind: "topic",
    optionId: topic.id,
    children: visited.has(visitKey) ? [] : buildChildNodes("topic", topic.id, allCategories, model, nextVisited),
  };
}

function buildBookSeriesNode(
  bookSeries: HocLieuTaxonomyOption,
  allCategories: HocLieuTaxonomyOption[],
  model: HocLieuTaxonomyResponse,
  visited: Set<string>,
): LearningResourceTreeNode {
  const visitKey = `bookSeries:${bookSeries.id}`;
  const nextVisited = new Set(visited).add(visitKey);
  return {
    id: `book-${bookSeries.id}`,
    label: bookSeries.label,
    description: bookSeries.description,
    status: bookSeries.status,
    metadata: bookSeries.metadata,
    kind: "bookSeries",
    optionId: bookSeries.id,
    children: visited.has(visitKey) ? [] : buildChildNodes("bookSeries", bookSeries.id, allCategories, model, nextVisited),
  };
}

function buildSectionNode(
  section: HocLieuTaxonomyOption,
  allCategories: HocLieuTaxonomyOption[],
  model: HocLieuTaxonomyResponse,
  visited: Set<string>,
): LearningResourceTreeNode {
  const visitKey = `section:${section.id}`;
  const nextVisited = new Set(visited).add(visitKey);
  return {
    id: `section-${section.id}`,
    label: section.label,
    description: section.description,
    status: section.status,
    metadata: section.metadata,
    kind: "section",
    optionId: section.id,
    children: visited.has(visitKey) ? [] : buildChildNodes("section", section.id, allCategories, model, nextVisited),
  };
}

function buildChildNodes(
  parentKind: LearningResourceTreeNodeKind,
  parentId: string,
  allCategories: HocLieuTaxonomyOption[],
  model: HocLieuTaxonomyResponse,
  visited: Set<string>,
): LearningResourceTreeNode[] {
  const nodes: LearningResourceTreeNode[] = [];
  const pushed = new Set<string>();
  const push = (key: string, node: LearningResourceTreeNode) => {
    if (pushed.has(key)) return;
    pushed.add(key);
    nodes.push(node);
  };

  sortOptions(allCategories.filter((item) => item.parentId === parentId)).forEach((item) => {
    push(`category:${item.id}`, buildCategoryNode(item, allCategories, model, visited));
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

export function buildLearningResourceSubjectTree(subject: HocLieuTaxonomyOption, model: HocLieuTaxonomyResponse): LearningResourceTreeNode[] {
  const categories = sortOptions(model.categories.filter((item) => belongsToSubject(item, subject.id)));
  const rootCategories = categories.filter((item) => !item.parentId);
  const bookSeries = sortOptions(model.bookSeries.filter((item) => belongsToSubject(item, subject.id) && !item.parentId && !item.categoryId));
  const orphanTopics = sortOptions(model.topics.filter((item) => belongsToSubject(item, subject.id) && !item.parentId && !item.categoryId));
  const orphanSections = sortOptions(model.sections.filter((item) => belongsToSubject(item, subject.id) && !item.parentId && !item.categoryId && !getTopicId(item)));

  const nodes = rootCategories.map((item) => buildCategoryNode(item, categories, model));

  if (bookSeries.length) {
    nodes.push({
      id: `books-${subject.id}`,
      label: "Bá»™ sÃ¡ch / chÆ°Æ¡ng trÃ¬nh",
      kind: "folder",
      children: bookSeries.map((item) => ({
        ...buildBookSeriesNode(item, categories, model, new Set()),
      })),
    });
  }

  if (orphanTopics.length) {
    nodes.push({
      id: `topics-${subject.id}`,
      label: "Chá»§ Ä‘á» chÆ°a xáº¿p nhÃ³m",
      kind: "folder",
      children: orphanTopics.map((item) => ({
        ...buildTopicNode(item, categories, model, new Set()),
      })),
    });
  }

  if (orphanSections.length) {
    nodes.push({
      id: `sections-${subject.id}`,
      label: "Há»c pháº§n chÆ°a xáº¿p nhÃ³m",
      kind: "folder",
      children: orphanSections.map((item) => ({
        ...buildSectionNode(item, categories, model, new Set()),
      })),
    });
  }

  return nodes;
}

export function countLearningResourceTreeNodes(nodes: LearningResourceTreeNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countLearningResourceTreeNodes(node.children), 0);
}

export function findLearningResourceTreeNode(nodes: LearningResourceTreeNode[], nodeId: string): LearningResourceTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    const child = findLearningResourceTreeNode(node.children, nodeId);
    if (child) return child;
  }
  return undefined;
}

export function findLearningResourceTreePath(nodes: LearningResourceTreeNode[], nodeId: string, trail: LearningResourceTreeNode[] = []): LearningResourceTreeNode[] {
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    if (node.id === nodeId) return nextTrail;
    const childPath = findLearningResourceTreePath(node.children, nodeId, nextTrail);
    if (childPath.length) return childPath;
  }
  return [];
}

export function flattenLearningResourceTreeNodes(nodes: LearningResourceTreeNode[]): LearningResourceTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenLearningResourceTreeNodes(node.children)]);
}

export function collectLearningResourceLeafNodeIds(node: LearningResourceTreeNode): string[] {
  if (node.kind === "section" && node.children.length === 0) {
    return [node.id];
  }
  return node.children.flatMap((child) => collectLearningResourceLeafNodeIds(child));
}

export function buildLearningResourceSubjects(model: HocLieuTaxonomyResponse, resources: HocLieuResourceCard[]): LearningResourceTreeSubject[] {
  return sortOptions(model.subjects).map((subject) => {
    const tree = buildLearningResourceSubjectTree(subject, model);
    return {
      id: subject.id,
      label: subject.label,
      description: subject.description,
      status: subject.status,
      metadata: subject.metadata,
      tree,
      categoryCount: countLearningResourceTreeNodes(tree),
      resourceCount: resources.filter((resource) => resource.subjectId === subject.id).length,
    };
  });
}
