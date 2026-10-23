import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CheckCircle2 from "@mui/icons-material/CheckCircleOutlined";
import LibraryBig from "@mui/icons-material/LocalLibrary";
import LinkIcon from "@mui/icons-material/Link";
import ListTree from "@mui/icons-material/AccountTree";
import Skeleton from "@mui/material/Skeleton";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { getCurrentAccount } from "@/platform/auth/api/auth-storage";
import {
  COURSE_STRUCTURE_WORKSPACE_DESCRIPTION,
  COURSE_STRUCTURE_WORKSPACE_LABEL,
  LEARNING_RESOURCE_WORKSPACE_DESCRIPTION,
  LEARNING_RESOURCE_WORKSPACE_LABEL,
} from "@/components/learning-resources/learning-resource-workspace-labels";

import {
  loadLearningResourceStudioWorkspaceData,
  type LearningResourceResourceCard,
  type LearningResourceTaxonomyResponse,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import {
  USE_LEARNING_RESOURCE_AUTHORING_MOCK,
  mockLearningResourceAuthoringLocalContent as mockExplorerLocalContent,
  mockLearningResourceAuthoringResources as mockExplorerResources,
  mockLearningResourceAuthoringTaxonomy as mockExplorerModel,
} from "@/features/lcms/admin-operations/api/mock-learning-resource-authoring-data";
import {
  PublishScreen,
  ResourcesScreen,
  SubjectsScreen,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-catalog-screens";
import { LearningResourceAuthoringDialogs } from "@/features/lcms/admin-operations/components/learning-resource-authoring-dialogs";
import { estimateTaxonomyImpact } from "@/features/lcms/admin-operations/components/learning-resource-authoring-impact";
import { StructureScreen } from "@/features/lcms/admin-operations/components/learning-resource-authoring-structure-screen";
import { UploadScreen } from "@/features/lcms/admin-operations/components/learning-resource-authoring-upload-screen";
import {
  buildSubjects,
  emptyModel,
  findNode,
  findPath,
  flattenNodes,
  normalizeContentModel,
  normalizeResources,
  normalizeTaxonomyOptions,
  screenKind,
  toEditTargetFromNode,
  type LearningResourceAuthoringScreen,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import type {
  LocalContentEditTarget,
  LocalContentItem,
  TaxonomyDeleteTarget,
  TaxonomyDialogState,
  TaxonomyEditTarget,
} from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { questionBankWorkspaceQueryOptions } from "@/features/lcms/quiz/question-bank/api/question-bank-query";
import { quizBankItems as fallbackQuizBankItems } from "@/features/lcms/quiz/question-bank/api/mock-question-bank";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { queryKeys } from "@/lib/query-keys";

const screenMeta: Record<string, { title: string; description: string; icon: ReactNode }> = {
  resources: {
    title: LEARNING_RESOURCE_WORKSPACE_LABEL,
    description: LEARNING_RESOURCE_WORKSPACE_DESCRIPTION,
    icon: <LibraryBig className="h-5 w-5" />,
  },
  structure: {
    title: COURSE_STRUCTURE_WORKSPACE_LABEL,
    description: COURSE_STRUCTURE_WORKSPACE_DESCRIPTION,
    icon: <ListTree className="h-5 w-5" />,
  },
  "admin-learning-resources": {
    title: LEARNING_RESOURCE_WORKSPACE_LABEL,
    description: LEARNING_RESOURCE_WORKSPACE_DESCRIPTION,
    icon: <ListTree className="h-5 w-5" />,
  },
  "admin-learning-structure": {
    title: COURSE_STRUCTURE_WORKSPACE_LABEL,
    description: COURSE_STRUCTURE_WORKSPACE_DESCRIPTION,
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

function LearningResourceAuthoringSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3" aria-label="Đang tải quản lý học liệu">
      <div className="flex h-12 items-center gap-3 rounded-lg border border-[rgba(145,158,171,0.2)] bg-white px-4">
        <Skeleton variant="rounded" width={28} height={28} />
        <Skeleton variant="rounded" height={32} sx={{ flex: 1, maxWidth: 420 }} />
        <Skeleton variant="rounded" width={220} height={32} />
      </div>
      <div className="grid min-h-[560px] flex-1 grid-cols-1 overflow-hidden rounded-lg border border-[rgba(145,158,171,0.2)] bg-white lg:grid-cols-[250px_minmax(0,1fr)]">
        <div className="space-y-2 border-b border-[rgba(145,158,171,0.2)] p-3 lg:border-b-0 lg:border-r">
          {Array.from({ length: 9 }, (_, index) => (
            <Skeleton key={index} variant="rounded" height={30} sx={{ width: `${72 + (index % 3) * 8}%` }} />
          ))}
        </div>
        <div className="grid grid-cols-1 content-start gap-4 p-3 sm:grid-cols-2 lg:grid-cols-3 lg:p-5">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} variant="rounded" height={132} />
          ))}
        </div>
      </div>
    </div>
  );
}
export function LearningResourceAuthoringWorkspace({ activeLeaf }: { activeLeaf: DashboardLeaf; onOpenLeaf?: (leafId: string) => void }) {
  const queryClient = useQueryClient();
  const tenantId = getDefaultTenantId();
  const accountId = getCurrentAccount("lcms")?.id?.trim() || "anonymous";
  const [model, setModel] = useState<LearningResourceTaxonomyResponse>(emptyModel);
  const [resources, setResources] = useState<LearningResourceResourceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [screenOverride, setScreenOverride] = useState<LearningResourceAuthoringScreen | null>(null);
  const [dialogState, setDialogState] = useState<TaxonomyDialogState>(null);
  const [editTarget, setEditTarget] = useState<TaxonomyEditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaxonomyDeleteTarget | null>(null);
  const [localContentItems, setLocalContentItems] = useState<LocalContentItem[]>(
    USE_LEARNING_RESOURCE_AUTHORING_MOCK ? mockExplorerLocalContent : [],
  );
  const [editingLocalContent, setEditingLocalContent] = useState<LocalContentEditTarget>(null);
  const paceStateUpdate = usePacedStateBatch();
  const questionBankQuery = useQuery(questionBankWorkspaceQueryOptions());
  const refreshData = useCallback(async (options: { force?: boolean } = {}) => {
    setLoading(true);
    try {
      if (USE_LEARNING_RESOURCE_AUTHORING_MOCK) {
        setModel(mockExplorerModel);
        setResources(mockExplorerResources);
        setLocalContentItems(mockExplorerLocalContent);
        return mockExplorerModel;
      }

      if (options.force) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.learningResourcesV2(tenantId, accountId) });
      }

      const staleTime = options.force ? 0 : 60_000;
      const workspaceData = await queryClient.fetchQuery({
        queryKey: queryKeys.adminOperations.learningResourcesWorkspace(120, tenantId, accountId),
        queryFn: ({ signal }) => loadLearningResourceStudioWorkspaceData(120, signal),
        staleTime,
      });

      const normalizedSubjects = normalizeTaxonomyOptions(workspaceData.subjects);
      const nextModel = normalizedSubjects.length
        ? { ...normalizeContentModel(workspaceData.taxonomy), subjects: normalizedSubjects }
        : USE_LEARNING_RESOURCE_AUTHORING_MOCK
          ? mockExplorerModel
          : emptyModel;
      const nextResources = normalizeResources(workspaceData.resources.data);
      setModel(nextModel);
      setResources(nextResources.length || !USE_LEARNING_RESOURCE_AUTHORING_MOCK ? nextResources : mockExplorerResources);
      return nextModel;
    } catch (error) {
      if (!USE_LEARNING_RESOURCE_AUTHORING_MOCK) {
        setModel(emptyModel);
        setResources([]);
        throw error;
      }
      setModel(mockExplorerModel);
      setResources(mockExplorerResources);
      return mockExplorerModel;
    } finally {
      setLoading(false);
    }
  }, [accountId, queryClient, tenantId]);
  useEffect(() => {
    let mounted = true;
    paceStateUpdate(() => {
      void refreshData()
        .catch(() => undefined)
        .finally(() => {
          if (!mounted) return;
        });
    });
    return () => {
      mounted = false;
    };
  }, [paceStateUpdate, refreshData]);
  const subjects = useMemo(() => buildSubjects(model, resources), [model, resources]);
  const resourceQuizBankItems = useMemo(
    () => (questionBankQuery.data?.quizzes.length || !USE_LEARNING_RESOURCE_AUTHORING_MOCK ? (questionBankQuery.data?.quizzes ?? []) : fallbackQuizBankItems),
    [questionBankQuery.data?.quizzes],
  );
  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId);
  const allNodes = selectedSubject ? flattenNodes(selectedSubject.tree) : [];
  const selectedNode = selectedSubject && selectedNodeId ? findNode(selectedSubject.tree, selectedNodeId) : undefined;
  const selectedPath = selectedSubject && selectedNode ? findPath(selectedSubject.tree, selectedNode.id) : [];
  useEffect(() => {
    paceStateUpdate(() => {
    if (selectedSubjectId && !subjects.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId("");
      setSelectedNodeId("");
    }
    });
  }, [paceStateUpdate, selectedSubject, selectedSubjectId, subjects]);
  const filteredSubjects = useMemo(() => {
    const keyword = debouncedQuery.trim().toLowerCase();
    if (!keyword) return subjects;
    return subjects.filter((subject) => `${subject.label} ${subject.description ?? ""}`.toLowerCase().includes(keyword));
  }, [debouncedQuery, subjects]);
  useEffect(() => {
    setScreenOverride(null);
  }, [activeLeaf.id]);
  const currentScreen = screenOverride ?? screenKind(activeLeaf.id);
  const meta = screenMeta[activeLeaf.id] ?? screenMeta["admin-learning-resources"];
  void meta;
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
  const openCreateRootDialog = useCallback(() => setDialogState({ mode: "level" }), []);
  const openCreateTopicDialog = useCallback(() => setDialogState({ mode: "topic" }), []);
  const openCreateChildDialog = useCallback((option?: "section" | "lecture" | "exercise" | "resource") => {
    setDialogState({ mode: "child", initialOption: option });
  }, []);
  const selectStructureSubject = useCallback((subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedNodeId("");
  }, []);
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
  const deleteImpactEstimate = useMemo(
    () =>
      estimateTaxonomyImpact({
        target: deleteTarget,
        subjects,
        localContentItems,
        resources,
        quizBankItems: resourceQuizBankItems,
      }),
    [deleteTarget, localContentItems, resourceQuizBankItems, resources, subjects],
  );
  return loading ? (
    <LearningResourceAuthoringSkeleton />
  ) : (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {currentScreen === "subjects" ? (
        <SubjectsScreen
          subjects={filteredSubjects}
          query={query}
          onQueryChange={setQuery}
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubjectId}
          onCreateSubject={openCreateSubjectDialog}
          onOpenStructure={() => setScreenOverride("structure")}
          onEditSubject={(subject) => setEditTarget({ kind: "subject", id: subject.id, label: subject.label, description: subject.description, status: subject.status, metadata: subject.metadata })}
          onDeleteSubject={(subject) => setDeleteTarget({ kind: "subject", id: subject.id, label: subject.label, description: subject.description, status: subject.status, metadata: subject.metadata })}
          onLifecycleTransitioned={() => refreshData({ force: true }).then(() => undefined)}
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
          onCreateTopic={openCreateTopicDialog}
          onCreateChild={openCreateChildDialog}
          onBackToSubjects={() => setScreenOverride("subjects")}
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
          quizBankItems={resourceQuizBankItems}
          resources={resources}
          taxonomyTopics={model.topics}
        />
      ) : null}
      {currentScreen === "resources" ? <ResourcesScreen subjects={subjects} resources={resources} onLifecycleTransitioned={() => refreshData({ force: true }).then(() => undefined)} /> : null}
      {currentScreen === "upload" ? <UploadScreen subjects={subjects} selectedSubject={selectedSubject} allNodes={allNodes} /> : null}
      {currentScreen === "publish" ? <PublishScreen subjects={subjects} resources={resources} questions={questionBankQuery.data?.questions ?? []} quizBankItems={resourceQuizBankItems} onLifecycleTransitioned={() => refreshData({ force: true }).then(() => undefined)} /> : null}
      <LearningResourceAuthoringDialogs
        dialogState={dialogState}
        subjects={subjects}
        selectedSubject={selectedSubject}
        selectedNode={selectedNode}
        selectedPath={selectedPath}
        quizBankItems={resourceQuizBankItems}
        editTarget={editTarget}
        deleteTarget={deleteTarget}
        deleteImpactEstimate={deleteImpactEstimate}
        editingLocalContent={editingLocalContent}
        refreshData={refreshData}
        setDialogState={setDialogState}
        setEditTarget={setEditTarget}
        setDeleteTarget={setDeleteTarget}
        setEditingLocalContent={setEditingLocalContent}
        setLocalContentItems={setLocalContentItems}
        setSelectedSubjectId={setSelectedSubjectId}
        setSelectedNodeId={setSelectedNodeId}
        updateLocalContentItem={updateLocalContentItem}
      />
    </div>
  );
}
