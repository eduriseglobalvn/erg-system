import { useCallback, useEffect, useMemo, useState } from "react";
import AutoStories from "@mui/icons-material/AutoStories";

import {
  deleteLearningResourceResource,
  type LearningResourceResourceCard,
  type LearningResourceTaxonomyOption,
} from "@/features/lms/learning-resources/api/learning-resource-authoring-api";
import { ResourceEditDialog } from "@/features/lcms/admin-operations/components/learning-resource-authoring-edit-dialogs";
import { CurriculumTeachingPlanDialog } from "@/features/lcms/admin-operations/components/curriculum-teaching-plan-dialog";
import type {
  AttachedResourceItem,
  LocalContentItem,
  StudioNode,
  StudioSubject,
  StructureSelection,
} from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { CurriculumActionBar } from "@/features/lcms/admin-operations/components/learning-resource-authoring-structure-screen/curriculum-action-bar";
import { filterCurrentResources } from "@/features/lcms/admin-operations/components/learning-resource-authoring-structure-screen/filter-current-resources";
import { SubjectRail } from "@/features/lcms/admin-operations/components/learning-resource-authoring-structure-screen/subject-rail";
import { useAttachedResources } from "@/features/lcms/admin-operations/components/learning-resource-authoring-structure-screen/use-attached-resources";
import { useRoadmapActions } from "@/features/lcms/admin-operations/components/learning-resource-authoring-structure-screen/use-roadmap-actions";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
// explorer-ui imports removed for streamlined modern layout
import { COURSE_STRUCTURE_WORKSPACE_LABEL } from "@/components/learning-resources/learning-resource-workspace-labels";
import {
  buildExplorerPathUrl,
  getDisplayLink,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import {
  buildCurriculumExplorerModel,
  buildCurriculumRoadmapStages,
  type CurriculumContentItem,
  type CurriculumFolder,
  type CurriculumTarget,
  type ResourceCommandId,
} from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import { CurriculumRoadmapView } from "@/features/lcms/admin-operations/components/curriculum-roadmap-view";
import type { QuizBankItem } from "@/features/question-bank/types/question-bank-types";

export function StructureScreen({
  subjects,
  selectedSubject,
  selectedNode,
  selectedPath,
  onSelectSubject,
  onSelectNode,
  onCreateSubject,
  onCreateRoot,
  onCreateTopic,
  onCreateChild,
  onBackToSubjects,
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
  quizBankItems,
  resources,
  taxonomyTopics,
}: {
  subjects: StudioSubject[];
  selectedSubject?: StudioSubject;
  selectedNode?: StudioNode;
  selectedPath: StudioNode[];
  onSelectSubject: (id: string) => void;
  onSelectNode: (id: string) => void;
  onCreateSubject: () => void;
  onCreateRoot: () => void;
  onCreateTopic: () => void;
  onCreateChild: (option?: "section" | "lecture" | "exercise" | "resource") => void;
  onBackToSubjects: () => void;
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
  quizBankItems: QuizBankItem[];
  resources: LearningResourceResourceCard[];
  taxonomyTopics: LearningResourceTaxonomyOption[];
}) {
  const [treeQuery, setTreeQuery] = useState("");
  const [teachingPlanOpen, setTeachingPlanOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<AttachedResourceItem | null>(null);
  const [selection, setSelection] = useState<StructureSelection>(null);
  const paceStateUpdate = usePacedStateBatch();

  const currentChildren = useMemo(() => selectedNode?.children ?? selectedSubject?.tree ?? [], [selectedNode?.children, selectedSubject?.tree]);
  const selectedNodeOptionId = selectedNode?.optionId;

  const currentResources = useMemo(() => filterCurrentResources(resources, selectedSubject, selectedNode), [resources, selectedNode, selectedSubject]);
  const [attachedResources, setAttachedResources] = useAttachedResources(currentResources);

  const currentAttachedResources = useMemo(
    () => currentResources.map((resource) => attachedResources[resource.id] ?? resource),
    [attachedResources, currentResources],
  );
  const allAttachedResources = useMemo(
    () => resources.map((resource) => attachedResources[resource.id] ?? resource),
    [attachedResources, resources],
  );
  const currentLocalContentItems = useMemo(
    () => (selectedNodeOptionId ? localContentItems.filter((item) => item.parentOptionId === selectedNodeOptionId) : []),
    [localContentItems, selectedNodeOptionId],
  );

  const _handleGoBack = useCallback(() => {
    if (!selectedNode) return;
    if (selectedPath.length > 1) {
      const parentNode = selectedPath[selectedPath.length - 2];
      onSelectNode(parentNode.id);
    } else {
      onSelectNode("");
    }
    setSelection(null);
  }, [selectedNode, selectedPath, onSelectNode]);
  void _handleGoBack;

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
  const canEditSelection = Boolean(selectedChildRow || selectedLocalContent || selectedAttachedResource || selectedNode || selectedSubject);
  const canDeleteSelection = canEditSelection;

  useEffect(() => {
    if (!selection) return;
    if (selection.type === "node" && currentChildren.some((child) => child.id === selection.id)) return;
    if (selection.type === "local-content" && selectedLocalContent) return;
    if (selection.type === "resource" && selectedAttachedResource) return;
    paceStateUpdate(() => setSelection(null));
  }, [currentChildren, paceStateUpdate, selectedAttachedResource, selectedLocalContent, selection]);


  const handleDeleteResource = useCallback(async (resource: AttachedResourceItem) => {
    await deleteLearningResourceResource(resource.id);
    setAttachedResources((current) => {
      const next = { ...current };
      delete next[resource.id];
      return next;
    });
    await onRefreshData();
  }, [onRefreshData, setAttachedResources]);

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

  const _selectedExplorerUrl = buildExplorerPathUrl(selectedSubject, selectedPath);
  void _selectedExplorerUrl;
  const breadcrumbItems = useMemo(() => {
    const items: { label: string; onClick: () => void }[] = [];
    if (selectedSubject) {
      items.push({
        label: selectedSubject.label,
        onClick: () => {
          onSelectSubject(selectedSubject.id);
          onSelectNode("");
          setSelection(null);
        },
      });
    }
    selectedPath.forEach((node) => {
      items.push({
        label: node.label,
        onClick: () => {
          onSelectNode(node.id);
          setSelection(null);
        },
      });
    });
    return items;
  }, [selectedSubject, selectedPath, onSelectSubject, onSelectNode]);

  const _explorerBreadcrumbItems = useMemo(
    () => breadcrumbItems.length
      ? breadcrumbItems
      : [{
          label: COURSE_STRUCTURE_WORKSPACE_LABEL,
          onClick: () => {
            onSelectSubject("");
            onSelectNode("");
            setSelection(null);
          },
        }],
    [breadcrumbItems, onSelectNode, onSelectSubject],
  );
  void _explorerBreadcrumbItems;

  const curriculumModel = useMemo(
    () =>
      buildCurriculumExplorerModel({
        subjects,
        selectedSubject,
        selectedNode,
        selectedPath,
        localContentItems,
        resources: allAttachedResources,
        quizBankItems,
      }),
    [allAttachedResources, localContentItems, quizBankItems, selectedNode, selectedPath, selectedSubject, subjects],
  );

  // Always build all roadmap stages for the entire subject
  const roadmapStages = useMemo(
    () => selectedSubject
      ? buildCurriculumRoadmapStages({
          subject: selectedSubject,
          localContentItems,
          resources: allAttachedResources,
          taxonomyTopics,
          quizBankItems,
        })
      : [],
    [allAttachedResources, localContentItems, quizBankItems, selectedSubject, taxonomyTopics],
  );

  const selectedTarget = useMemo<CurriculumTarget | null>(() => {
    if (selection?.type === "node") return { type: "node", id: selection.id };
    if (selection?.type === "local-content") return { type: "local-content", id: selection.id };
    if (selection?.type === "resource") return { type: "resource", id: selection.id };
    if (selectedNode) return { type: "node", id: selectedNode.id };
    if (selectedSubject) return { type: "subject", id: selectedSubject.id };
    return null;
  }, [selectedNode, selectedSubject, selection]);

  const handleOpenFolder = useCallback((folder: CurriculumFolder) => {
    setSelection(null);
    if (folder.target.type === "subject") {
      onSelectSubject(folder.target.id);
      return;
    }
    if (folder.target.type === "node") {
      onSelectNode(folder.target.id);
    }
  }, [onSelectNode, onSelectSubject]);

  const handleSelectContent = useCallback((item: CurriculumContentItem) => {
    if (item.target.type === "local-content") {
      setSelection({ type: "local-content", id: item.target.id });
      return;
    }
    if (item.target.type === "resource") {
      setSelection({ type: "resource", id: item.target.id });
    }
  }, []);

  const handleOpenContent = useCallback((item: CurriculumContentItem) => {
    handleSelectContent(item);
    if (item.target.type === "resource") {
      const resource = allAttachedResources.find((entry) => entry.id === item.target.id);
      if (resource) handleOpenResourceLink(resource);
      return;
    }
    if (item.target.type === "local-content") {
      const localItem = localContentItems.find((entry) => entry.id === item.target.id);
      const link = localItem ? getDisplayLink(localItem) : item.href;
      if (link && typeof window !== "undefined") {
        window.open(link, "_blank", "noopener,noreferrer");
      }
    }
  }, [allAttachedResources, handleOpenResourceLink, handleSelectContent, localContentItems]);

  const handleResourceCommand = useCallback((id: ResourceCommandId) => {
    if (id === "create-subject") {
      onCreateSubject();
      return;
    }
    if (id === "create-level") {
      onCreateRoot();
      return;
    }
    if (id === "create-topic") {
      onCreateTopic();
      return;
    }
    if (id === "create-lesson") {
      onCreateChild("lecture");
      return;
    }
    if (id === "add-lecture") {
      onCreateChild("lecture");
      return;
    }
    if (id === "add-resource") {
      onCreateChild("resource");
      return;
    }
    if (id === "add-exercise") {
      onCreateChild("exercise");
      return;
    }
    if (id === "edit") {
      handleEditSelection();
      return;
    }
    if (id === "delete") {
      void handleDeleteSelection();
    }
  }, [
    handleDeleteSelection,
    handleEditSelection,
    onCreateChild,
    onCreateRoot,
    onCreateSubject,
    onCreateTopic,
  ]);


  const roadmapActions = useRoadmapActions({
    onCreateChild,
    onCreateRoot,
    onCreateTopic,
    onDeleteNodeSelection,
    onDeleteSubject,
    onEditNodeSelection,
    onEditSubject,
    onSelectNode,
    selectedSubject,
  });

  const _visibleItemCount = roadmapStages.reduce(
    (total, stage) => total + 1 + stage.topics.length + stage.topics.reduce((count, topic) => count + topic.lessons.length, 0),
    0,
  );
  void _visibleItemCount;
  const selectedLabel = selectedNode?.label ?? selectedSubject?.label ?? COURSE_STRUCTURE_WORKSPACE_LABEL;

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-[#D9E2EF] bg-white shadow-sm">
      <CurriculumActionBar
        selectedKind={curriculumModel.selectedKind}
        selectedLabel={selectedLabel}
        canEdit={canEditSelection}
        canDelete={canDeleteSelection}
        onOpenSchedule={() => setTeachingPlanOpen(true)}
        onCommand={handleResourceCommand}
        searchValue={treeQuery}
        onSearchChange={setTreeQuery}
        onRefresh={() => void onRefreshData()}
      />

      <div className="grid h-[calc(100vh-140px)] min-h-[580px] min-w-0 grid-cols-1 overflow-hidden lg:grid-cols-[260px_minmax(0,1fr)]">
        <SubjectRail
          subjects={subjects}
          selectedSubjectId={selectedSubject?.id}
          query={treeQuery}
          onSelectSubject={(subjectId) => {
            onSelectSubject(subjectId);
            onSelectNode("");
            setSelection(null);
          }}
          onBackToSubjects={onBackToSubjects}
          onCreateSubject={onCreateSubject}
        />

        <section
          className="min-h-0 min-w-0 overflow-hidden bg-white"
          onClick={(event) => {
            if (event.currentTarget !== event.target) return;
            onSelectSubject("");
            onSelectNode("");
            setSelection(null);
          }}
        >
          {curriculumModel.selectedKind === "none" ? (
            <div className="flex h-full items-center justify-center bg-[#F8FAFC] px-8 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-[#EAF4FF] text-[#0F6CBD]"><AutoStories className="h-5 w-5" /></span>
                <h3 className="mt-3 text-sm font-bold text-[#172033]">Chọn một môn học</h3>
                <p className="mt-1 text-[13px] leading-5 text-[#637381]">Chọn môn ở danh sách bên trái để xem và chỉnh sửa level, chủ đề và nội dung học.</p>
              </div>
            </div>
          ) : (
            <CurriculumRoadmapView
              stages={roadmapStages}
              subjectTitle={selectedSubject?.label ?? selectedLabel}
              query={treeQuery}
              selectedTarget={selectedTarget}
              onOpenFolder={handleOpenFolder}
              onOpenContent={handleOpenContent}
              actions={roadmapActions}
            />
          )}
        </section>
      </div>

      <ResourceEditDialog
        target={editingResource}
        onClose={() => setEditingResource(null)}
        onSaved={async () => {
          setEditingResource(null);
          await onRefreshData();
        }}
      />
      <CurriculumTeachingPlanDialog
        open={teachingPlanOpen}
        onClose={() => setTeachingPlanOpen(false)}
        subject={selectedSubject}
        stages={roadmapStages}
        onRefreshStructure={onRefreshData}
      />
    </div>
  );
}
