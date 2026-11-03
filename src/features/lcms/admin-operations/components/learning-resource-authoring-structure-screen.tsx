import { useCallback, useEffect, useMemo, useState } from "react";
import Add from "@mui/icons-material/Add";
import AutoStories from "@mui/icons-material/AutoStories";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import Pencil from "@mui/icons-material/Edit";
import Trash2 from "@mui/icons-material/DeleteOutlined";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Refresh from "@mui/icons-material/Refresh";
import Search from "@mui/icons-material/Search";

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
// explorer-ui imports removed for streamlined modern layout
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
  onCreateSubject,
}: {
  subjects: StudioSubject[];
  selectedSubjectId?: string;
  query: string;
  onSelectSubject: (id: string) => void;
  onBackToSubjects: () => void;
  onCreateSubject?: () => void;
}) {
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const visibleSubjects = normalizedQuery
    ? subjects.filter((subject) => `${subject.label} ${subject.description ?? ""}`.toLocaleLowerCase("vi").includes(normalizedQuery))
    : subjects;

  return (
    <aside className="flex min-h-0 flex-col border-r border-[#D9E2EF] bg-white">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#D9E2EF] px-3">
        <span className="text-[12px] font-bold uppercase tracking-wide text-[#52606D]">Môn học</span>
        <div className="flex items-center gap-1">
          {onCreateSubject ? (
            <Tooltip title="Tạo môn học mới">
              <IconButton size="small" color="primary" onClick={onCreateSubject} sx={{ p: 0.5 }}>
                <Add sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          ) : null}
          <Button size="small" variant="text" onClick={onBackToSubjects} sx={{ minWidth: 0, px: 0.75, fontSize: 12 }}>
            Quản lý
          </Button>
        </div>
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
      {onCreateSubject ? (
        <div className="border-t border-[#D9E2EF] p-2">
          <Button
            variant="outlined"
            size="small"
            fullWidth
            startIcon={<Add fontSize="small" />}
            onClick={onCreateSubject}
            sx={{
              textTransform: "none",
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 1.5,
              borderColor: "#CBD5E1",
              color: "#0F6CBD",
              "&:hover": { borderColor: "#0F6CBD", bgcolor: "#F0F7FF" },
            }}
          >
            Thêm môn học
          </Button>
        </div>
      ) : null}
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
  searchValue,
  onSearchChange,
  onRefresh,
}: {
  selectedKind: "none" | "subject" | "level" | "topic";
  selectedLabel: string;
  canEdit: boolean;
  canDelete: boolean;
  onOpenSchedule: () => void;
  onCommand: (id: ResourceCommandId) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
}) {
  const createCommand = selectedKind === "none" ? "create-subject" : selectedKind === "subject" ? "create-level" : selectedKind === "level" ? "create-topic" : "create-lesson";
  const createLabel = selectedKind === "none" ? "Tạo môn học" : selectedKind === "subject" ? "Thêm Level (Chặng học)" : selectedKind === "level" ? "Thêm chủ đề" : "Thêm bài học";

  return (
    <div className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#D9E2EF] bg-white px-4 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-[#172033]">{selectedLabel}</div>
        <div className="text-[11.5px] text-[#637381]">
          {selectedKind === "topic"
            ? "Danh sách bài học trong chủ đề"
            : "Cấu trúc môn học: Level (tùy chọn) → Chủ đề (tùy chọn) → Bài học"}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <TextField
          size="small"
          placeholder="Tìm môn học, level, chủ đề…"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 16, color: "#94A3B8" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            width: { xs: 170, sm: 220, md: 250 },
            "& .MuiOutlinedInput-root": {
              height: 32,
              fontSize: 12,
              bgcolor: "#F8FAFC",
              borderRadius: 1.5,
              "& fieldset": { borderColor: "#E2E8F0" },
              "&:hover fieldset": { borderColor: "#CBD5E1" },
              "&.Mui-focused fieldset": { borderColor: "#0F6CBD" },
            },
          }}
        />
        <Tooltip title="Làm mới dữ liệu">
          <IconButton size="small" onClick={onRefresh} sx={{ color: "#64748B", p: 0.6, "&:hover": { color: "#0F6CBD", bgcolor: "#EFF6FF" } }}>
            <Refresh sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Button
          variant="outlined"
          size="small"
          startIcon={<CalendarMonth sx={{ fontSize: 16 }} />}
          disabled={selectedKind === "none"}
          onClick={onOpenSchedule}
          aria-label="Mở khung chương trình môn học"
          title={selectedKind === "none" ? "Chọn một môn học trước" : "Thiết lập khung chương trình và phân bổ số tiết môn học"}
          sx={{
            height: 32,
            fontSize: 12,
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 1.5,
            borderColor: "#E2E8F0",
            color: "#1E293B",
            "&:hover": { borderColor: "#0F6CBD", bgcolor: "#EFF6FF" },
          }}
        >
          Khung chương trình
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add sx={{ fontSize: 16 }} />}
          onClick={() => onCommand(createCommand)}
          sx={{
            height: 32,
            fontSize: 12,
            fontWeight: 700,
            bgcolor: "#0F6CBD",
            boxShadow: "none",
            textTransform: "none",
            borderRadius: 1.5,
            "&:hover": { bgcolor: "#0B5594" },
          }}
        >
          {createLabel}
        </Button>
        <span className="mx-0.5 h-5 w-px bg-[#D9E2EF]" />
        <Tooltip title="Chỉnh sửa mục đang chọn">
          <span>
            <IconButton
              size="small"
              disabled={!canEdit}
              onClick={() => onCommand("edit")}
              aria-label="Chỉnh sửa mục đang chọn"
              sx={{ p: 0.6, color: "#64748B", "&:hover": { color: "#0F6CBD", bgcolor: "#EFF6FF" } }}
            >
              <Pencil sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Xem tác động trước khi xóa">
          <span>
            <IconButton
              size="small"
              color="error"
              disabled={!canDelete}
              onClick={() => onCommand("delete")}
              aria-label="Xem tác động trước khi xóa"
              sx={{ p: 0.6, "&:hover": { bgcolor: "#FEF2F2" } }}
            >
              <Trash2 sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
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
        onCreateChild("lecture");
      },
      onAddExercise: (lessonFolder: CurriculumFolder) => {
        if (lessonFolder.target.type === "node") {
          onSelectNode(lessonFolder.target.id);
        }
        onCreateChild("exercise");
      },
      onAddResource: (lessonFolder: CurriculumFolder) => {
        if (lessonFolder.target.type === "node") {
          onSelectNode(lessonFolder.target.id);
        }
        onCreateChild("resource");
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
