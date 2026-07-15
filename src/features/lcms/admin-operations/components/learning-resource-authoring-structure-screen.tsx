import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Copy,
  FileQuestion,
  FileText,
  Folder,
  Pencil,
  Presentation,
  Trash2,
} from "@/components/mui-icon-shim";

import {
  deleteLearningResourceResource,
  loadLearningResourceResourceDetail,
  type LearningResourceResourceCard,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import { ResourceEditDialog } from "@/features/lcms/admin-operations/components/learning-resource-authoring-edit-dialogs";
import type {
  AttachedResourceItem,
  LocalContentItem,
  StudioNode,
  StudioSubject,
  StructureSelection,
} from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  LearningResourceExplorerCardGrid,
  LearningResourceExplorerCommandBar,
  LearningResourceExplorerShell,
  LearningResourceExplorerTopBar,
  LearningResourceExplorerTreePane,
  LearningResourceExplorerTreeRow,
  LearningResourceFolderTile,
  WindowsFolderIcon,
  type ExplorerViewMode,
  type LearningResourceExplorerCommand,
} from "@/components/learning-resources/explorer-ui";
import {
  EnterpriseContentGrid,
  EnterpriseList,
  flattenContentGroups,
  targetsEqual,
} from "@/features/lcms/admin-operations/components/learning-resource-curriculum-explorer";
import {
  buildExplorerPathUrl,
  copyTextToClipboard,
  getDisplayLink,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import {
  filterTree,
  flattenVisibleNodes,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-tree";
import {
  buildCurriculumExplorerModel,
  getResourceCommandSpecs,
  type CurriculumContentItem,
  type CurriculumFolder,
  type CurriculumTarget,
  type ResourceCommandId,
} from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import type { QuizBankItem } from "@/features/lcms/quiz/question-bank/types/question-bank-types";

function SubjectTreeSection({
  subject,
  treeQuery,
  selectedNode,
  expandedNodeIds,
  selection,
  onSelectNode,
  onToggleNode,
  onCreateChild,
  selectedSubjectId,
}: {
  subject: StudioSubject;
  treeQuery: string;
  selectedNode?: StudioNode;
  expandedNodeIds: Set<string>;
  selection: StructureSelection;
  onSelectNode: (nodeId: string) => void;
  onToggleNode: (nodeId: string) => void;
  onCreateChild: (node: StudioNode) => void;
  selectedSubjectId: string;
}) {
  const visibleRows = useMemo(() => {
    return flattenVisibleNodes(filterTree(subject.tree, treeQuery), expandedNodeIds);
  }, [expandedNodeIds, subject.tree, treeQuery]);

  return (
    <div className="mt-0.5 space-y-0.5">
      {visibleRows.length ? (
        visibleRows.map(({ node, depth }) => (
          <LearningResourceExplorerTreeRow
            key={node.id}
            label={node.label}
            title={node.label}
            icon={<WindowsFolderIcon open={expandedNodeIds.has(node.id)} />}
            depth={depth + 1}
            selected={subject.id === selectedSubjectId && node.id === selectedNode?.id && !selection}
            expanded={expandedNodeIds.has(node.id)}
            hasChildren={node.children.length > 0}
            onSelect={() => onSelectNode(node.id)}
            onToggle={() => onToggleNode(node.id)}
            onAction={() => onCreateChild(node)}
          />
        ))
      ) : (
        <div className="px-2 py-3 text-xs text-slate-500">Không tìm thấy nội dung phù hợp.</div>
      )}
    </div>
  );
}
function collectStudioNodeIds(nodes: StudioNode[]): string[] {
  return nodes.flatMap((node) => [node.id, ...collectStudioNodeIds(node.children)]);
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
}) {
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Set<string>>(new Set());
  const [treeQuery, setTreeQuery] = useState("");
  const [editingResource, setEditingResource] = useState<AttachedResourceItem | null>(null);
  const [attachedResources, setAttachedResources] = useState<Record<string, AttachedResourceItem>>({});
  const [selection, setSelection] = useState<StructureSelection>(null);
  const [viewMode, setViewMode] = useState<ExplorerViewMode>("grid");
  const debouncedTreeQuery = useDebouncedValue(treeQuery);
  const paceStateUpdate = usePacedStateBatch();

  useEffect(() => {
    if (selectedSubject) {
      setExpandedSubjectIds((prev) => {
        if (prev.has(selectedSubject.id)) return prev;
        const next = new Set(prev);
        next.add(selectedSubject.id);
        return next;
      });
    }
  }, [selectedSubject]);

  useEffect(() => {
    paceStateUpdate(() => {
      setExpandedNodeIds(new Set(collectStudioNodeIds(selectedSubject?.tree ?? [])));
    });
  }, [paceStateUpdate, selectedSubject?.id, selectedSubject?.tree]);

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
      setSelection(null);
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

  const selectedExplorerUrl = buildExplorerPathUrl(selectedSubject, selectedPath);
  const breadcrumbItems = useMemo(() => {
    const items: { label: string; onClick: () => void }[] = [];
    if (selectedSubject) {
      items.push({
        label: selectedSubject.label,
        onClick: () => {
          onSelectSubject(selectedSubject.id);
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
  const contentItems = useMemo(() => flattenContentGroups(curriculumModel.contentGroups), [curriculumModel.contentGroups]);
  const selectedTarget = useMemo<CurriculumTarget | null>(() => {
    if (selection?.type === "node") return { type: "node", id: selection.id };
    if (selection?.type === "local-content") return { type: "local-content", id: selection.id };
    if (selection?.type === "resource") return { type: "resource", id: selection.id };
    if (selectedNode) return { type: "node", id: selectedNode.id };
    if (selectedSubject) return { type: "subject", id: selectedSubject.id };
    return null;
  }, [selectedNode, selectedSubject, selection]);
  const selectedContentForInspector = useMemo(
    () => contentItems.find((item) => targetsEqual(item.target, selectedTarget)),
    [contentItems, selectedTarget],
  );
  const commandSpecs = useMemo(
    () =>
      getResourceCommandSpecs({
        selectedKind: curriculumModel.selectedKind,
        hasSelectedSubject: Boolean(selectedSubject),
        canEditSelection,
        canDeleteSelection,
      }),
    [canDeleteSelection, canEditSelection, curriculumModel.selectedKind, selectedSubject],
  );
  const handleSelectFolder = useCallback((folder: CurriculumFolder) => {
    if (folder.target.type === "node") {
      setSelection({ type: "node", id: folder.target.id });
      return;
    }
    if (folder.target.type === "subject") {
      onSelectSubject(folder.target.id);
      setSelection(null);
    }
  }, [onSelectSubject]);

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
    if (id === "copy-url") {
      copyTextToClipboard(selectedContentForInspector?.href || selectedExplorerUrl);
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
    selectedContentForInspector?.href,
    selectedExplorerUrl,
  ]);


  const commandActions = useMemo<LearningResourceExplorerCommand[]>(() => {
    const enabledCommands = commandSpecs.filter((command) => command.enabled);
    const commandById = new Map(enabledCommands.map((command) => [command.id, command]));
    const folderCreateCommand =
      commandById.get("create-subject") ?? commandById.get("create-level") ?? commandById.get("create-topic");
    const toAction = (
      id: ResourceCommandId,
      icon: ReactNode,
      label?: string,
      variant: LearningResourceExplorerCommand["variant"] = "text",
    ): LearningResourceExplorerCommand | null => {
      const command = commandById.get(id);
      if (!command) return null;
      return {
        disabled: !command.enabled,
        icon,
        label: label ?? command.label,
        onClick: () => handleResourceCommand(id),
        title: command.label,
        variant,
      };
    };

    return [
      folderCreateCommand
        ? {
            icon: <Folder className="h-4 w-4" />,
            label: folderCreateCommand.label,
            onClick: () => handleResourceCommand(folderCreateCommand.id),
            title: folderCreateCommand.label,
          }
        : null,
      toAction("add-lecture", <Presentation className="h-4 w-4" />, "Thêm bài giảng"),
      toAction("add-exercise", <FileQuestion className="h-4 w-4" />, "Thêm bài tập"),
      toAction("add-resource", <FileText className="h-4 w-4" />, "Gắn tài liệu"),
      { icon: null, label: "separator-content", variant: "separator" },
      toAction("copy-url", <Copy className="h-4 w-4" />, undefined, "icon"),
      toAction("edit", <Pencil className="h-4 w-4" />, undefined, "icon"),
      toAction("delete", <Trash2 className="h-4 w-4" />, undefined, "icon"),
    ].filter(Boolean) as LearningResourceExplorerCommand[];
  }, [commandSpecs, handleResourceCommand]);

  const visibleItemCount = curriculumModel.selectedKind === "topic" ? contentItems.length : curriculumModel.folders.length;

  return (
    <LearningResourceExplorerShell className="border-[rgba(145,158,171,0.2)] shadow-none">
      <LearningResourceExplorerTopBar
        breadcrumbItems={breadcrumbItems}
        canGoBack={Boolean(selectedNode)}
        onBack={handleGoBack}
        onRefresh={() => void onRefreshData()}
        searchLabel="Tìm kiếm học liệu"
        searchPlaceholder={curriculumModel.searchPlaceholder}
        searchValue={treeQuery}
        title={breadcrumbItems.length ? selectedExplorerUrl : ""}
        onSearchChange={setTreeQuery}
      />
      <LearningResourceExplorerCommandBar actions={commandActions} viewMode={viewMode} onViewModeChange={setViewMode} />

      <div className="grid h-[calc(100vh-220px)] min-h-[560px] min-w-0 grid-cols-[250px_minmax(0,1fr)] overflow-hidden">
        <LearningResourceExplorerTreePane
          onClick={(event) => {
            if (event.currentTarget !== event.target) return;
            onSelectSubject("");
            onSelectNode("");
            setSelection(null);
          }}
        >
          {subjects.length ? subjects.map((subject) => {
            const expanded = expandedSubjectIds.has(subject.id);
            return (
              <div key={subject.id}>
                <LearningResourceExplorerTreeRow
                  label={subject.label}
                  title={subject.label}
                  icon={<WindowsFolderIcon open={expanded} />}
                  selected={selectedSubject?.id === subject.id && !selectedNode?.id && !selection}
                  expanded={expanded}
                  hasChildren={subject.tree.length > 0}
                  onSelect={() => {
                    onSelectSubject(subject.id);
                    setSelection(null);
                    setExpandedSubjectIds((prev) => {
                      const next = new Set(prev);
                      next.add(subject.id);
                      return next;
                    });
                  }}
                  onToggle={() => {
                    setExpandedSubjectIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(subject.id)) {
                        next.delete(subject.id);
                      } else {
                        next.add(subject.id);
                      }
                      return next;
                    });
                  }}
                />
                {expanded ? (
                  <SubjectTreeSection
                    subject={subject}
                    treeQuery={debouncedTreeQuery}
                    selectedNode={selectedNode}
                    expandedNodeIds={expandedNodeIds}
                    selection={selection}
                    onSelectNode={(nodeId) => {
                      onSelectSubject(subject.id);
                      onSelectNode(nodeId);
                      setSelection(null);
                    }}
                    onToggleNode={toggleNode}
                    onCreateChild={handleCreateChild}
                    selectedSubjectId={selectedSubject?.id ?? ""}
                  />
                ) : null}
              </div>
            );
          }) : (
            <div
              className="m-2 rounded-lg border border-dashed border-[#B8D6FA] bg-[#EAF4FF] p-3 text-xs leading-5 text-[#0F6CBD]"
            >
              Chưa có môn học. Bấm Tạo môn học để bắt đầu.
            </div>
          )}
        </LearningResourceExplorerTreePane>

        <section
          className="min-h-0 min-w-0 overflow-hidden bg-white"
          onClick={(event) => {
            if (event.currentTarget !== event.target) return;
            onSelectSubject("");
            onSelectNode("");
            setSelection(null);
          }}
        >
          {curriculumModel.selectedKind === "topic" ? (
            viewMode === "list" ? (
              <EnterpriseList
                folders={[]}
                items={contentItems}
                selectedTarget={selectedTarget}
                onOpenContent={handleOpenContent}
                onOpenFolder={handleOpenFolder}
                onSelectContent={handleSelectContent}
                onSelectFolder={handleSelectFolder}
              />
            ) : (
              <EnterpriseContentGrid
                items={contentItems}
                selectedTarget={selectedTarget}
                onOpenContent={handleOpenContent}
                onSelectContent={handleSelectContent}
              />
            )
          ) : (
            viewMode === "list" ? (
              <EnterpriseList
                folders={curriculumModel.folders}
                items={[]}
                selectedTarget={selectedTarget}
                onOpenFolder={handleOpenFolder}
                onSelectFolder={handleSelectFolder}
              />
            ) : (
              <LearningResourceExplorerCardGrid
                className="p-5"
                contentClassName="lms-resource-card-grid"
                onClick={(event) => {
                  if (event.currentTarget !== event.target) return;
                  onSelectSubject("");
                  onSelectNode("");
                  setSelection(null);
                }}
              >
                {curriculumModel.folders.map((folder) => (
                  <LearningResourceFolderTile
                    key={folder.id}
                    label={folder.title}
                    selected={targetsEqual(selectedTarget, folder.target)}
                    title={folder.pathLabels.join(" / ")}
                    onClick={() => handleSelectFolder(folder)}
                    onDoubleClick={() => handleOpenFolder(folder)}
                  />
                ))}
              </LearningResourceExplorerCardGrid>
            )
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
      <div className="flex h-7 items-center justify-between border-t border-[rgba(145,158,171,0.2)] bg-white px-3 text-[12px] text-[#637381]">
        <span>{visibleItemCount} mục hiển thị</span>
        <span className="max-w-[60%] truncate" title={selectedExplorerUrl}>{selectedExplorerUrl}</span>
      </div>
    </LearningResourceExplorerShell>
  );
}
