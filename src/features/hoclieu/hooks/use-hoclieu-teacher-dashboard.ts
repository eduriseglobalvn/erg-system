import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { loadHocLieuTaxonomies } from "@/features/admin-operations/api/hoclieu-authoring-api";
import { loadHocLieuResourceForViewer, loadHocLieuResourcesBySubject } from "@/features/hoclieu/api/hoclieu-api";
import {
  getCurrentAcademicYear,
  listHocLieuRecentOpened,
  loadHocLieuTeacherProgress,
  toVietnameseRelativeTime,
  trackHocLieuTeacherProgressEvent,
} from "@/features/hoclieu/api/teacher-dashboard-api";
import type { HocLieuResource } from "@/features/hoclieu/api/library-data";
import { useHocLieuDashboardScope } from "@/features/hoclieu/hooks/use-hoclieu-dashboard-scope";
import type {
  HocLieuTeacherDashboardNode,
  HocLieuTeacherDashboardSubject,
  HocLieuTeacherProgressDetail,
  HocLieuTeacherProgressEventType,
  HocLieuTeacherProgressSummary,
  HocLieuTeacherRecentLecture,
  HocLieuTeacherSubjectTree,
} from "@/features/hoclieu/types/teacher-dashboard-types";
import {
  buildHocLieuLearningSubjects,
  collectHocLieuLearningLessonIds,
  findHocLieuLearningPath,
  matchesResourceToLearningNode,
  type HocLieuLearningNode,
  type HocLieuLearningSubject,
} from "@/utils/hoclieu-learning-tree";

type TeacherDashboardViewState = {
  tree: HocLieuTeacherSubjectTree | null;
  progress: HocLieuTeacherProgressDetail | null;
  recentLectures: HocLieuTeacherRecentLecture[];
};

type SubjectWithSummary = HocLieuLearningSubject & {
  progressSummary: HocLieuTeacherProgressSummary;
};

function nodeDisplayId(node: HocLieuLearningNode) {
  return node.optionId || node.id;
}

function mapTreeNodeKind(node: HocLieuLearningNode): HocLieuTeacherDashboardNode["kind"] {
  if (node.kind === "group") return "group";
  if (node.kind === "lesson") return "lesson";
  return "folder";
}

function collectLeafNodes(nodes: HocLieuLearningNode[]): HocLieuLearningNode[] {
  return nodes.flatMap((node) => {
    if (node.kind === "lesson" && node.children.length === 0) {
      return [node];
    }
    return collectLeafNodes(node.children);
  });
}

function summarizeProgressItems(items: HocLieuTeacherProgressDetail["items"]): HocLieuTeacherProgressSummary {
  if (!items.length) {
    return { progressRate: 0, taughtCount: 0, totalCount: 0, pendingCount: 0 };
  }

  let taughtCount = 0;
  let pendingCount = 0;
  let progressSum = 0;

  for (const item of items) {
    progressSum += item.progressRate;
    if (item.status === "taught") {
      taughtCount += 1;
    } else {
      pendingCount += 1;
    }
  }

  return {
    progressRate: progressSum / items.length,
    taughtCount,
    totalCount: items.length,
    pendingCount,
  };
}

function buildProgressDetail(
  subjectId: string,
  schoolId: string,
  academicYear: string,
  leafNodes: HocLieuLearningNode[],
  apiProgress?: HocLieuTeacherProgressDetail | null,
  nodeId?: string,
): HocLieuTeacherProgressDetail {
  const apiStatuses = new Map((apiProgress?.items ?? []).map((item) => [item.id, item]));
  const items = leafNodes.map((leaf) => {
    const id = nodeDisplayId(leaf);
    const apiItem = apiStatuses.get(id);
    return {
      id,
      label: leaf.label,
      kind: "lesson" as const,
      status: apiItem?.status ?? "pending",
      progressRate: apiItem?.progressRate ?? 0,
    };
  });

  return {
    subjectId,
    nodeId,
    schoolId,
    academicYear,
    summary: summarizeProgressItems(items),
    items,
  };
}

function summarizeNodeFromProgress(node: HocLieuLearningNode, progressItems: HocLieuTeacherProgressDetail["items"]): HocLieuTeacherProgressSummary {
  const leafIds = new Set(collectHocLieuLearningLessonIds(node));
  const relevantItems = progressItems.filter((item) => leafIds.has(item.id));
  return summarizeProgressItems(relevantItems);
}

function toDashboardNode(node: HocLieuLearningNode, progressItems: HocLieuTeacherProgressDetail["items"]): HocLieuTeacherDashboardNode {
  return {
    id: nodeDisplayId(node),
    label: node.label,
    kind: mapTreeNodeKind(node),
    sourceKind: node.sourceKind === "bookSeries" ? "book_series" : node.sourceKind,
    description: node.description,
    hasChildren: node.children.length > 0,
    progress: summarizeNodeFromProgress(node, progressItems),
  };
}

function buildSubjectTreeView(
  subject: HocLieuLearningSubject,
  schoolId: string,
  academicYear: string,
  parentId: string,
  apiProgress?: HocLieuTeacherProgressDetail | null,
) {
  const path = parentId ? findHocLieuLearningPath(subject.tree, parentId) : [];
  const scopedNode = parentId ? path[path.length - 1] : undefined;
  const visibleNodes = scopedNode ? scopedNode.children : subject.tree;
  const leafNodes = scopedNode ? collectLeafNodes(scopedNode.children) : collectLeafNodes(subject.tree);
  const progress = buildProgressDetail(subject.id, schoolId, academicYear, leafNodes, apiProgress, parentId || undefined);

  const tree: HocLieuTeacherSubjectTree = {
    subjectId: subject.id,
    subjectLabel: subject.label,
    schoolId,
    academicYear,
    parentId: parentId || undefined,
    breadcrumbs: path.map((node) => ({
      id: nodeDisplayId(node),
      label: node.label,
      kind: mapTreeNodeKind(node),
    })),
    children: visibleNodes.map((node) => toDashboardNode(node, progress.items)),
    progress: progress.summary,
  };

  return { tree, progress };
}

function resourcesForNode(resources: HocLieuResource[], node?: HocLieuLearningNode | null) {
  if (!node) return [];
  return resources.filter((resource) => matchesResourceToLearningNode(resource, node));
}

function progressEventNodeKind(node: HocLieuTeacherDashboardNode): Exclude<HocLieuTeacherDashboardNode["sourceKind"], undefined> {
  if (node.sourceKind) return node.sourceKind;
  if (node.kind === "lesson") return "section";
  return "folder";
}

function applySubjectSummary(subjects: SubjectWithSummary[], subjectId: string, summary: HocLieuTeacherProgressSummary) {
  return subjects.map<SubjectWithSummary>((subject) => ({
    ...subject,
    progressSummary: subject.id === subjectId ? summary : subject.progressSummary,
  }));
}

export function useHocLieuTeacherDashboard() {
  const scope = useHocLieuDashboardScope();
  const schoolId = scope?.selectedSchoolId ?? "";
  const academicYear = scope?.academicYear ?? getCurrentAcademicYear();

  const [subjectTrees, setSubjectTrees] = useState<SubjectWithSummary[]>([]);
  const [subjectProgressMap, setSubjectProgressMap] = useState<Record<string, HocLieuTeacherProgressDetail>>({});
  const [subjectResourceMap, setSubjectResourceMap] = useState<Record<string, HocLieuResource[]>>({});
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [viewState, setViewState] = useState<TeacherDashboardViewState>({
    tree: null,
    progress: null,
    recentLectures: [],
  });
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const deferredSearch = useDeferredValue(searchValue.trim().toLowerCase());

  function resolveSubjectNode(subjectId: string, nodeId?: string) {
    const subject = subjectTrees.find((item) => item.id === subjectId);
    if (!subject || !nodeId) return null;
    const path = findHocLieuLearningPath(subject.tree, nodeId);
    return path[path.length - 1] ?? null;
  }

  async function openTeachingResource(resource: HocLieuResource, previewWindow?: Window | null) {
    const hydratedResource = await loadHocLieuResourceForViewer(resource);
    const targetUrl = hydratedResource.viewer.embedUrl || hydratedResource.viewer.secureEmbedUrl;

    if (!targetUrl) {
      previewWindow?.close();
      throw new Error("Học liệu này chưa có đường dẫn mở từ hệ thống.");
    }

    if (previewWindow && !previewWindow.closed) {
      previewWindow.location.href = targetUrl;
      return;
    }

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!schoolId) {
        setSubjectTrees([]);
        setSubjectProgressMap({});
        setSubjectResourceMap({});
        setSelectedSubjectId("");
        setViewState({ tree: null, progress: null, recentLectures: [] });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [contentModel, recentLectures] = await Promise.all([
          loadHocLieuTaxonomies(),
          listHocLieuRecentOpened({ schoolId, academicYear, limit: 8 }),
        ]);
        if (cancelled) return;

        const nextSubjects = buildHocLieuLearningSubjects(contentModel, []).map((subject) => ({
          ...subject,
          progressSummary: { progressRate: 0, taughtCount: 0, totalCount: 0, pendingCount: 0 },
        }));
        const nextSubjectId = nextSubjects[0]?.id ?? "";
        setSelectedSubjectId(nextSubjectId);

        if (!nextSubjectId) {
          setSubjectTrees(nextSubjects);
          setViewState({ tree: null, progress: null, recentLectures });
          return;
        }

        const activeSubject = nextSubjects.find((subject) => subject.id === nextSubjectId) ?? nextSubjects[0];
        const [apiProgress, subjectResources] = await Promise.all([
          loadHocLieuTeacherProgress({ subjectId: nextSubjectId, schoolId, academicYear }).catch(() => null),
          loadHocLieuResourcesBySubject(nextSubjectId).catch(() => []),
        ]);
        if (cancelled) return;

        const hydratedSubjects = buildHocLieuLearningSubjects(contentModel, subjectResources).map((subject) => ({
          ...subject,
          progressSummary: { progressRate: 0, taughtCount: 0, totalCount: 0, pendingCount: 0 },
        }));
        const hydratedActiveSubject = hydratedSubjects.find((subject) => subject.id === activeSubject.id) ?? hydratedSubjects[0];
        const { tree, progress } = buildSubjectTreeView(hydratedActiveSubject, schoolId, academicYear, "", apiProgress);

        setSubjectTrees(applySubjectSummary(hydratedSubjects, nextSubjectId, tree.progress));
        setSubjectProgressMap(apiProgress ? { [nextSubjectId]: apiProgress } : {});
        setSubjectResourceMap({ [nextSubjectId]: subjectResources });
        setSelectedNodeId("");
        setViewState({ tree, progress, recentLectures });
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Không thể tải dashboard học liệu.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [academicYear, schoolId]);

  async function loadSubjectView(subjectId: string, parentId = "", focusedNodeId = "", prefetchedProgress?: HocLieuTeacherProgressDetail | null) {
    if (!subjectId || !schoolId) return;

    const subject = subjectTrees.find((item) => item.id === subjectId);
    if (!subject) return;

    setNavigating(true);
    setError(null);
    try {
      let subjectProgress: HocLieuTeacherProgressDetail | null = prefetchedProgress ?? subjectProgressMap[subjectId] ?? null;
      let subjectResources = subjectResourceMap[subjectId] ?? null;

      if (!subjectProgress) {
        subjectProgress = await loadHocLieuTeacherProgress({ subjectId, schoolId, academicYear }).catch(() => null);
      }
      if (!subjectResources) {
        subjectResources = await loadHocLieuResourcesBySubject(subjectId).catch(() => []);
      }

      const { tree, progress } = buildSubjectTreeView(subject, schoolId, academicYear, parentId, subjectProgress);
      setSubjectTrees((current) =>
        applySubjectSummary(
          current,
          subjectId,
          parentId ? current.find((item) => item.id === subjectId)?.progressSummary ?? tree.progress : tree.progress,
        ),
      );
      if (subjectProgress) {
        setSubjectProgressMap((current) => ({ ...current, [subjectId]: subjectProgress as HocLieuTeacherProgressDetail }));
      }
      if (subjectResources) {
        setSubjectResourceMap((current) => ({ ...current, [subjectId]: subjectResources as HocLieuResource[] }));
      }
      setViewState((current) => ({ ...current, tree, progress }));
      setSelectedNodeId(focusedNodeId || parentId);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Không thể tải nội dung môn học.");
    } finally {
      setNavigating(false);
    }
  }

  async function handleSelectSubject(subjectId: string) {
    setSelectedSubjectId(subjectId);
    await loadSubjectView(subjectId);
  }

  async function handleOpenNode(node: HocLieuTeacherDashboardNode) {
    if (!selectedSubjectId) return;

    await trackHocLieuTeacherProgressEvent({
      schoolId,
      academicYear,
      subjectId: selectedSubjectId,
      nodeId: node.id,
      nodeKind: progressEventNodeKind(node),
      eventType: "open",
      resourceId: node.resourceId,
    }).catch(() => undefined);

    if (node.hasChildren) {
      await loadSubjectView(selectedSubjectId, node.id, node.id);
      return;
    }

    setSelectedNodeId(node.id);
  }

  async function handleSelectBreadcrumb(parentId?: string) {
    if (!selectedSubjectId) return;
    await loadSubjectView(selectedSubjectId, parentId ?? "", parentId ?? "");
  }

  async function handleTrackTeaching(node: HocLieuTeacherDashboardNode, eventType: Exclude<HocLieuTeacherProgressEventType, "open">) {
    if (!selectedSubjectId) return;

    try {
      await trackHocLieuTeacherProgressEvent({
        schoolId,
        academicYear,
        subjectId: selectedSubjectId,
        nodeId: node.id,
        nodeKind: progressEventNodeKind(node),
        eventType,
        resourceId: node.resourceId,
      });

      const nextProgress = await loadHocLieuTeacherProgress({
        subjectId: selectedSubjectId,
        schoolId,
        academicYear,
      }).catch(() => null);

      if (nextProgress) {
        setSubjectProgressMap((current) => ({ ...current, [selectedSubjectId]: nextProgress }));
      }

      await loadSubjectView(selectedSubjectId, viewState.tree?.parentId ?? "", node.id, nextProgress);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Không thể cập nhật tiến độ dạy học.");
    }
  }

  async function handleOpenResource(resource: HocLieuResource) {
    const previewWindow = window.open("", "_blank");
    try {
      setError(null);
      await openTeachingResource(resource, previewWindow);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Không thể mở học liệu đã gắn.");
    }
  }

  const activeSubjectTree = useMemo(
    () => subjectTrees.find((subject) => subject.id === selectedSubjectId) ?? subjectTrees[0] ?? null,
    [selectedSubjectId, subjectTrees],
  );

  const availableSubjects = useMemo<HocLieuTeacherDashboardSubject[]>(
    () =>
      subjectTrees.map((subject) => ({
        id: subject.id,
        label: subject.label,
        description: subject.description,
        progress: subject.progressSummary,
      })),
    [subjectTrees],
  );

  const activeSubject = useMemo(
    () => availableSubjects.find((subject) => subject.id === selectedSubjectId) ?? availableSubjects[0] ?? null,
    [availableSubjects, selectedSubjectId],
  );

  const focusedTreeNode = useMemo(
    () => resolveSubjectNode(selectedSubjectId, selectedNodeId || viewState.tree?.parentId),
    [selectedNodeId, selectedSubjectId, subjectTrees, viewState.tree?.parentId],
  );

  const subjectResources = useMemo(() => subjectResourceMap[selectedSubjectId] ?? [], [selectedSubjectId, subjectResourceMap]);

  const currentResources = useMemo(() => resourcesForNode(subjectResources, focusedTreeNode), [focusedTreeNode, subjectResources]);

  const displayResources = useMemo(() => {
    if (!focusedTreeNode) return subjectResources;
    if (currentResources.length > 0) return currentResources;
    if (focusedTreeNode.kind === "group") {
      const lessonIds = new Set(collectHocLieuLearningLessonIds(focusedTreeNode));
      return subjectResources.filter((resource) => resource.sectionId && lessonIds.has(resource.sectionId));
    }
    return [];
  }, [currentResources, focusedTreeNode, subjectResources]);

  const rootNodes = useMemo(() => (viewState.tree?.children ?? []).filter((node) => node.kind === "group"), [viewState.tree?.children]);

  const visibleNodes = useMemo(() => {
    const nodes = viewState.tree?.children ?? [];
    if (!deferredSearch) return nodes;
    return nodes.filter((node) =>
      [node.label, node.description, node.resourceType, node.subjectLabel]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(deferredSearch),
    );
  }, [deferredSearch, viewState.tree?.children]);

  const visibleRecentLectures = useMemo(() => {
    const lectures = viewState.recentLectures.filter((lecture) => (selectedSubjectId ? lecture.subjectId === selectedSubjectId : true));
    if (!deferredSearch) return lectures;
    return lectures.filter((lecture) =>
      [lecture.nodeLabel, lecture.subjectLabel, lecture.resourceTitle, lecture.resourceType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(deferredSearch),
    );
  }, [deferredSearch, selectedSubjectId, viewState.recentLectures]);

  return {
    academicYear,
    activeSubject,
    activeSubjectTree,
    availableSubjects,
    currentNodes: visibleNodes,
    currentProgress: viewState.progress,
    currentTree: viewState.tree,
    currentDisplayResources: displayResources,
    currentResources,
    error,
    focusedNodeId: selectedNodeId,
    loading,
    navigating,
    onOpenResource: handleOpenResource,
    onSelectBreadcrumb: handleSelectBreadcrumb,
    onSelectNode: handleOpenNode,
    onSelectSubject: handleSelectSubject,
    onTrackTeaching: handleTrackTeaching,
    recentLectures: visibleRecentLectures,
    rootNodes,
    schoolId,
    searchValue,
    selectedSubjectId,
    setSearchValue,
    subjectResources,
  };
}

export function getTeacherDashboardSubjectSummary(subject: HocLieuTeacherDashboardSubject | null) {
  if (!subject) return "Chọn môn học để xem cây chương trình và tiến độ dạy học.";
  return `${subject.progress.taughtCount}/${subject.progress.totalCount} nội dung đã dạy · ${subject.progress.pendingCount} nội dung chưa dạy`;
}

export function getProgressStatusLabel(progressRate: number) {
  if (progressRate >= 100) return "Đã dạy xong";
  if (progressRate > 0) return "Đang dạy";
  return "Chưa dạy";
}

export function formatRecentOpenedLabel(value?: string) {
  return toVietnameseRelativeTime(value);
}
