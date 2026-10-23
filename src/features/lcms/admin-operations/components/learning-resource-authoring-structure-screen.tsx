import { useCallback, useEffect, useMemo, useState } from "react";
import Add from "@mui/icons-material/Add";
import AutoStories from "@mui/icons-material/AutoStories";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import Pencil from "@mui/icons-material/Edit";
import Trash2 from "@mui/icons-material/DeleteOutlined";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import {
  deleteLearningResourceResource,
  loadLearningResourceResourceDetail,
  type LearningResourceResourceCard,
  type LearningResourceTaxonomyOption,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import { ResourceEditDialog } from "@/features/lcms/admin-operations/components/learning-resource-authoring-edit-dialogs";
import { CurriculumTeachingPlanDialog } from "@/features/lcms/admin-operations/components/curriculum-teaching-plan-dialog";
import type {
  AttachedResourceItem,
  LocalContentItem,
  StudioNode,
  StudioSubject,
  StructureSelection,
} from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import {
  LearningResourceExplorerShell,
  LearningResourceExplorerTopBar,
} from "@/components/learning-resources/explorer-ui";
import { COURSE_STRUCTURE_WORKSPACE_LABEL } from "@/components/learning-resources/learning-resource-workspace-labels";
import {
  buildExplorerPathUrl,
  findNode,
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
import {
  CurriculumRoadmapView,
  type CurriculumRoadmapActions,
} from "@/features/lcms/admin-operations/components/curriculum-roadmap-view";
import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";
import { cn } from "@/lib/utils";

function SubjectRail({
  subjects,
  selectedSubjectId,
  query,
  onSelectSubject,
  onBackToSubjects,
}: {
  subjects: StudioSubject[];
  selectedSubjectId?: string;
  query: string;
  onSelectSubject: (id: string) => void;
  onBackToSubjects: () => void;
}) {
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const visibleSubjects = normalizedQuery
    ? subjects.filter((subject) => `${subject.label} ${subject.description ?? ""}`.toLocaleLowerCase("vi").includes(normalizedQuery))
    : subjects;

  return (
    <aside className="flex min-h-0 flex-col border-r border-[#D9E2EF] bg-white">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#D9E2EF] px-3">
        <span className="text-[12px] font-bold uppercase tracking-wide text-[#52606D]">Môn học</span>
        <Button size="small" variant="text" onClick={onBackToSubjects} sx={{ minWidth: 0, px: 1, fontSize: 12 }}>
          Quản lý
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 [scrollbar-gutter:stable]">
        {visibleSubjects.map((subject) => {
          const selected = subject.id === selectedSubjectId;
          return (
            <button
              key={subject.id}
              type="button"
              className={cn(
                "mb-1 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#75B6F2]",
                selected ? "border-[#B8D6FA] bg-[#EAF4FF]" : "border-transparent hover:bg-[#F4F7FA]",
              )}
              onClick={() => onSelectSubject(subject.id)}
            >
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", selected ? "bg-white text-[#0F6CBD]" : "bg-[#F1F4F7] text-[#52606D]") }>
                <AutoStories className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold text-[#172033]">{subject.label}</span>
                <span className="mt-0.5 block text-[11px] text-[#637381]">{subject.groupCount} level · {subject.lessonCount} bài học</span>
              </span>
            </button>
          );
        })}
        {!visibleSubjects.length ? <p className="px-3 py-6 text-center text-xs text-[#637381]">Không tìm thấy môn học.</p> : null}
      </div>
    </aside>
  );
}

function CurriculumActionBar({
  selectedKind,
  selectedLabel,
  canEdit,
  canDelete,
  onOpenSchedule,
  onCommand,
}: {
  selectedKind: "none" | "subject" | "level" | "topic";
  selectedLabel: string;
  canEdit: boolean;
  canDelete: boolean;
  onOpenSchedule: () => void;
  onCommand: (id: ResourceCommandId) => void;
}) {
  const createCommand = selectedKind === "none" ? "create-subject" : selectedKind === "subject" ? "create-level" : selectedKind === "level" ? "create-topic" : "create-lesson";
  const createLabel = selectedKind === "none" ? "Tạo môn học" : selectedKind === "subject" ? "Tạo level" : selectedKind === "level" ? "Tạo chủ đề" : "Tạo bài học";

  return (
    <div className="flex min-h-12 shrink-0 items-center justify-between gap-3 border-b border-[#D9E2EF] bg-white px-3 py-1.5">
      <div className="min-w-0">
        <div className="truncate text-[13px] font-bold text-[#172033]">{selectedLabel}</div>
        <div className="text-[11px] text-[#637381]">{selectedKind === "topic" ? "Danh sách bài học trong chủ đề" : "Cấu trúc môn học: Level → Chủ đề → Bài học"}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="outlined"
          size="small"
          startIcon={<CalendarMonth />}
          disabled={selectedKind === "none"}
          onClick={onOpenSchedule}
          aria-label="Mở khung chương trình môn học"
          title={selectedKind === "none" ? "Chọn một môn học trước" : "Thiết lập khung chương trình và phân bổ số tiết môn học"}
          sx={{ textTransform: "none" }}
        >
          Khung chương trình
        </Button>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => onCommand(createCommand)} sx={{ boxShadow: "none", textTransform: "none" }}>
          {createLabel}
        </Button>
        <span className="mx-1 h-6 w-px bg-[#D9E2EF]" />
        <Tooltip title="Chỉnh sửa mục đang chọn"><span><IconButton size="small" disabled={!canEdit} onClick={() => onCommand("edit")} aria-label="Chỉnh sửa mục đang chọn"><Pencil fontSize="small" /></IconButton></span></Tooltip>
        <Tooltip title="Xem tác động trước khi xóa"><span><IconButton size="small" color="error" disabled={!canDelete} onClick={() => onCommand("delete")} aria-label="Xem tác động trước khi xóa"><Trash2 fontSize="small" /></IconButton></span></Tooltip>
      </div>
    </div>
  );
}

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
  const [attachedResources, setAttachedResources] = useState<Record<string, AttachedResourceItem>>({});
  const [selection, setSelection] = useState<StructureSelection>(null);
  const paceStateUpdate = usePacedStateBatch();

  const currentChildren = useMemo(() => selectedNode?.children ?? selectedSubject?.tree ?? [], [selectedNode?.children, selectedSubject?.tree]);
  const selectedNodeOptionId = selectedNode?.optionId;

  const currentResources = useMemo(() => {
    if (!selectedSubject) return [];
    if (!selectedNode) {
      return resources.filter((resource) => resource.subjectId === selectedSubject.id && !resource.categoryId && !resource.sectionId);
    }
    return resources.filter((resource) => {
      if (resource.subjectId !== selectedSubject.id) return false;
      if (selectedNode.kind === "lesson" || selectedNode.kind === "section" || selectedNode.kind === "topic") {
        return (
          resource.sectionId === selectedNode.optionId ||
          resource.sectionId === selectedNode.location.sectionId ||
          resource.topicId === selectedNode.location.topicId
        );
      }
      if (selectedNode.kind === "group") {
        return resource.categoryId === selectedNode.optionId && !resource.sectionId;
      }
      return false;
    });
  }, [resources, selectedNode, selectedSubject]);

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

  const handleGoBack = useCallback(() => {
    if (!selectedNode) return;
    if (selectedPath.length > 1) {
      const parentNode = selectedPath[selectedPath.length - 2];
      onSelectNode(parentNode.id);
    } else {
      onSelectNode("");
    }
    setSelection(null);
  }, [selectedNode, selectedPath, onSelectNode]);

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

  const selectedExplorerUrl = buildExplorerPathUrl(selectedSubject, selectedPath);
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

  const explorerBreadcrumbItems = useMemo(
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
      onCreateChild("section");
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

  const roadmapActions: CurriculumRoadmapActions = useMemo(
    () => ({
      onCreateLevel: onCreateRoot,
      onCreateTopic: (levelFolder: CurriculumFolder) => {
        if (levelFolder.target.type === "node") {
          onSelectNode(levelFolder.target.id);
        }
        onCreateTopic();
      },
      onCreateLesson: (topicFolder: CurriculumFolder) => {
        if (topicFolder.target.type === "node") {
          onSelectNode(topicFolder.target.id);
        }
        onCreateChild("section");
      },
      onEditFolder: (folder: CurriculumFolder) => {
        if (folder.target.type === "node") {
          const node = selectedSubject ? findNode(selectedSubject.tree, folder.target.id) : undefined;
          if (node) {
            onEditNodeSelection(node);
            return;
          }
        }
        if (folder.target.type === "subject") {
          onEditSubject();
        }
      },
      onDeleteFolder: (folder: CurriculumFolder) => {
        if (folder.target.type === "node") {
          const node = selectedSubject ? findNode(selectedSubject.tree, folder.target.id) : undefined;
          if (node) {
            onDeleteNodeSelection(node);
            return;
          }
        }
        if (folder.target.type === "subject") {
          onDeleteSubject();
        }
      },
    }),
    [
      onCreateChild,
      onCreateRoot,
      onCreateTopic,
      onDeleteNodeSelection,
      onDeleteSubject,
      onEditNodeSelection,
      onEditSubject,
      onSelectNode,
      selectedSubject,
    ],
  );

  const visibleItemCount = roadmapStages.reduce(
    (total, stage) => total + 1 + stage.topics.length + stage.topics.reduce((count, topic) => count + topic.lessons.length, 0),
    0,
  );
  const selectedLabel = selectedNode?.label ?? selectedSubject?.label ?? COURSE_STRUCTURE_WORKSPACE_LABEL;

  return (
    <LearningResourceExplorerShell className="border-[rgba(145,158,171,0.2)] shadow-none">
      <LearningResourceExplorerTopBar
        breadcrumbItems={explorerBreadcrumbItems}
        canGoBack={Boolean(selectedNode)}
        onBack={handleGoBack}
        onRefresh={() => void onRefreshData()}
        searchLabel="Tìm trong cấu trúc môn học"
        searchPlaceholder={curriculumModel.searchPlaceholder}
        searchValue={treeQuery}
        title={selectedExplorerUrl || COURSE_STRUCTURE_WORKSPACE_LABEL}
        onSearchChange={setTreeQuery}
      />
      <CurriculumActionBar
        selectedKind={curriculumModel.selectedKind}
        selectedLabel={selectedLabel}
        canEdit={canEditSelection}
        canDelete={canDeleteSelection}
        onOpenSchedule={() => setTeachingPlanOpen(true)}
        onCommand={handleResourceCommand}
      />

      <div className="grid h-[calc(100vh-220px)] min-h-[560px] min-w-0 grid-cols-1 overflow-hidden lg:grid-cols-[260px_minmax(0,1fr)]">
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
      />
      <div className="flex h-7 items-center justify-between border-t border-[rgba(145,158,171,0.2)] bg-white px-3 text-[12px] text-[#637381]">
        <span>{visibleItemCount} mục hiển thị</span>
        <span className="max-w-[60%] truncate" title={selectedExplorerUrl || COURSE_STRUCTURE_WORKSPACE_LABEL}>{selectedExplorerUrl || COURSE_STRUCTURE_WORKSPACE_LABEL}</span>
      </div>
    </LearningResourceExplorerShell>
  );
}
