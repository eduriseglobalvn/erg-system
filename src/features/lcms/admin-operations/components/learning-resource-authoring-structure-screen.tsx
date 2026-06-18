import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { ArrowUpRight, BookOpen, Clipboard, Copy, FileCheck, FileQuestion, FileText, Folder, FolderPlus, MoreHorizontal, Pencil, Plus, Presentation, RefreshCw, Scissors, Trash2 } from "@/components/mui-icon-shim";

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
import { cn } from "@/lib/utils";
import {
  LearningResourceExplorerCardGrid,
  LearningResourceExplorerCommandBar,
  LearningResourceExplorerShell,
  LearningResourceExplorerTopBar,
  LearningResourceExplorerTreePane,
  LearningResourceExplorerTreeRow,
  LearningResourceFolderTile,
  LearningResourceSquareCard,
  WindowsFolderIcon,
  type ExplorerViewMode,
  type LearningResourceExplorerCommand,
} from "@/components/learning-resources/explorer-ui";
import {
  buildExplorerPathUrl,
  copyTextToClipboard,
  getDisplayLink,
  getExplorerSize,
  getResourceCardMeta,
  getResourceDisplayBadge,
  getStableDate,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";
import {
  ExplorerTreeRow,
  filterTree,
  flattenVisibleNodes,
  getNodeIcon,
  getNodeKindLabel,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-tree";

function SubjectTreeSection({
  subject,
  treeQuery,
  selectedNode,
  localContentItems,
  resources,
  expandedNodeIds,
  selection,
  onSelectNode,
  onSelectLocalContent,
  onSelectResource,
  onToggleNode,
  onCreateChild,
  onOpenContextMenu,
  selectedSubjectId,
}: {
  subject: StudioSubject;
  treeQuery: string;
  selectedNode?: StudioNode;
  localContentItems: LocalContentItem[];
  resources: AttachedResourceItem[];
  expandedNodeIds: Set<string>;
  selection: StructureSelection;
  onSelectNode: (nodeId: string) => void;
  onSelectLocalContent: (item: LocalContentItem) => void;
  onSelectResource: (resource: AttachedResourceItem) => void;
  onToggleNode: (nodeId: string) => void;
  onCreateChild: (node: StudioNode) => void;
  onOpenContextMenu: (event: MouseEvent, node?: StudioNode, localContent?: LocalContentItem, resource?: AttachedResourceItem, subject?: StudioSubject) => void;
  selectedSubjectId: string;
}) {
  const localContentByNodeId = useMemo(() => {
    const grouped = new Map<string, LocalContentItem[]>();
    localContentItems
      .filter((item) => item.subjectId === subject.id)
      .forEach((item) => {
        const bucket = grouped.get(item.parentNodeId) ?? [];
        bucket.push(item);
        grouped.set(item.parentNodeId, bucket);
      });
    return grouped;
  }, [localContentItems, subject.id]);

  const resourcesByNodeId = useMemo(() => {
    const grouped = new Map<string, AttachedResourceItem[]>();
    resources
      .filter((resource) => resource.subjectId === subject.id && resource.sectionId)
      .forEach((resource) => {
        const nodeId = `lesson-${resource.sectionId}`;
        const bucket = grouped.get(nodeId) ?? [];
        bucket.push(resource);
        grouped.set(nodeId, bucket);
      });
    return grouped;
  }, [resources, subject.id]);

  const displayTree = useMemo(() => {
    function attachItems(nodes: StudioNode[]): StudioNode[] {
      return nodes.map((node) => {
        const contentChildren: StudioNode[] = (localContentByNodeId.get(node.id) ?? []).map((item) => ({
          id: `local-${item.id}`,
          label: item.title,
          kind: "topic",
          sourceKind: "folder",
          optionId: item.id,
          description: item.description,
          status: item.status,
          metadata: { displayKind: item.kind },
          location: node.location,
          children: [],
        }));
        const resourceChildren: StudioNode[] = (resourcesByNodeId.get(node.id) ?? []).map((resource) => ({
          id: `resource-${resource.id}`,
          label: resource.title,
          kind: "topic",
          sourceKind: "folder",
          optionId: resource.id,
          description: resource.subtitle,
          status: resource.status,
          metadata: { displayKind: "resource" },
          location: node.location,
          children: [],
        }));

        return {
          ...node,
          children: [...attachItems(node.children), ...contentChildren, ...resourceChildren],
        };
      });
    }

    return attachItems(subject.tree);
  }, [localContentByNodeId, resourcesByNodeId, subject.tree]);

  const visibleRows = useMemo(() => {
    return flattenVisibleNodes(filterTree(displayTree, treeQuery), expandedNodeIds);
  }, [displayTree, treeQuery, expandedNodeIds]);

  return (
    <div className="mt-0.5 space-y-0.5">
      {visibleRows.length ? (
        visibleRows.map(({ node, depth }) => {
          const localContent = node.id.startsWith("local-")
            ? localContentItems.find((item) => `local-${item.id}` === node.id)
            : undefined;
          const resource = node.id.startsWith("resource-")
            ? resources.find((item) => `resource-${item.id}` === node.id)
            : undefined;

          if (localContent || resource) {
            return (
              <LearningResourceExplorerTreeRow
                key={node.id}
                label={node.label}
                title={node.label}
                depth={depth}
                indentBase={22}
                selected={
                  Boolean(localContent && selection?.type === "local-content" && selection.id === localContent.id) ||
                  Boolean(resource && selection?.type === "resource" && selection.id === resource.id)
                }
                icon={getNodeIcon(node)}
                onSelect={() => {
                  if (localContent) onSelectLocalContent(localContent);
                  if (resource) onSelectResource(resource);
                }}
                onContextMenu={(event) => onOpenContextMenu(event, undefined, localContent, resource, undefined)}
              />
            );
          }

          return (
            <ExplorerTreeRow
              key={node.id}
              node={node}
              depth={depth}
              selected={subject.id === selectedSubjectId && node.id === selectedNode?.id}
              expanded={expandedNodeIds.has(node.id)}
              onSelectNode={onSelectNode}
              onToggleNode={onToggleNode}
              onCreateChild={onCreateChild}
              onOpenContextMenu={(event, node) => onOpenContextMenu(event, node, undefined, undefined, undefined)}
            />
          );
        })
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
  onCreateChild: (option?: "section" | "lecture" | "exercise") => void;
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
  resources: LearningResourceResourceCard[];
}) {
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Set<string>>(new Set());
  const [treeQuery, setTreeQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node?: StudioNode; localContent?: LocalContentItem; resource?: AttachedResourceItem; subject?: StudioSubject } | null>(null);
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
      // Subject root level: only show resources directly attached to the subject, not inside any category or lesson
      return resources.filter((resource) => resource.subjectId === selectedSubject.id && !resource.categoryId && !resource.sectionId);
    }
    return resources.filter((resource) => {
      if (resource.subjectId !== selectedSubject.id) return false;
      if (selectedNode.kind === "lesson") {
        return resource.sectionId === selectedNode.optionId;
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
  const currentLocalContentItems = useMemo(
    () => (selectedNodeOptionId ? localContentItems.filter((item) => item.parentOptionId === selectedNodeOptionId) : []),
    [localContentItems, selectedNodeOptionId],
  );
  const totalAttachedItems = currentResources.length + currentLocalContentItems.length;
  const showChildrenPanel = currentChildren.length > 0 || selectedNode?.kind !== "lesson";

  const handleGoBack = useCallback(() => {
    if (!selectedNode) return;
    if (selectedPath.length > 1) {
      const parentNode = selectedPath[selectedPath.length - 2];
      onSelectNode(parentNode.id);
    } else {
      onSelectNode("");
    }
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

  const selectedExplorerUrl = buildExplorerPathUrl(selectedSubject, selectedPath);
  const breadcrumbItems = useMemo(() => {
    const items: { label: string; onClick: () => void }[] = [];
    if (selectedSubject) {
      items.push({
        label: selectedSubject.label,
        onClick: () => onSelectSubject(selectedSubject.id),
      });
    }
    selectedPath.forEach((node) => {
      items.push({
        label: node.label,
        onClick: () => onSelectNode(node.id),
      });
    });
    return items;
  }, [selectedSubject, selectedPath, onSelectSubject, onSelectNode]);

  const commandActions = useMemo<LearningResourceExplorerCommand[]>(() => [
    {
      icon: <Folder className="h-4 w-4" />,
      label: "New folder",
      onClick: () => {
        if (!selectedSubject) {
          onCreateSubject();
        } else {
          onCreateRoot();
        }
      },
    },
    {
      disabled: selectedNode?.kind !== "group" && selectedNode?.kind !== "lesson",
      icon: <Presentation className="h-4 w-4" />,
      label: "Thêm bài giảng",
      onClick: () => {
        if (selectedNode?.kind === "group") {
          onCreateChild("section");
        } else {
          onCreateChild("lecture");
        }
      },
    },
    {
      disabled: selectedNode?.kind !== "lesson",
      icon: <FileQuestion className="h-4 w-4" />,
      label: "Thêm bài tập",
      onClick: () => onCreateChild("exercise"),
    },
    { icon: null, label: "separator-primary", variant: "separator" },
    { disabled: true, icon: <Scissors className="h-4 w-4" />, label: "Cut", title: "Cut", variant: "icon" },
    {
      icon: <Copy className="h-4 w-4" />,
      label: "Copy URL",
      onClick: () => copyTextToClipboard(selectedExplorerUrl),
      title: "Copy URL",
      variant: "icon",
    },
    { disabled: true, icon: <Clipboard className="h-4 w-4" />, label: "Paste", title: "Paste", variant: "icon" },
    {
      disabled: !canEditSelection,
      icon: <Pencil className="h-4 w-4" />,
      label: "Rename",
      onClick: handleEditSelection,
      title: "Rename",
      variant: "icon",
    },
    {
      disabled: !canDeleteSelection,
      icon: <Trash2 className="h-4 w-4" />,
      label: "Delete",
      onClick: () => void handleDeleteSelection(),
      title: "Delete",
      variant: "icon",
    },
    { icon: <MoreHorizontal className="h-4 w-4" />, label: "More", title: "More", variant: "icon" },
  ], [
    canDeleteSelection,
    canEditSelection,
    handleDeleteSelection,
    handleEditSelection,
    onCreateChild,
    onCreateRoot,
    onCreateSubject,
    selectedExplorerUrl,
    selectedNode?.kind,
    selectedSubject,
  ]);

  return (
    <LearningResourceExplorerShell>
      <LearningResourceExplorerTopBar
        breadcrumbItems={breadcrumbItems}
        canGoBack={Boolean(selectedNode)}
        onBack={handleGoBack}
        onRefresh={() => void onRefreshData()}
        searchLabel="Tìm kiếm học liệu LCMS"
        searchPlaceholder={`Search ${selectedSubject?.label || "Resources"}`}
        searchValue={treeQuery}
        title={breadcrumbItems.length ? selectedExplorerUrl : ""}
        onSearchChange={setTreeQuery}
      />
      <LearningResourceExplorerCommandBar actions={commandActions} viewMode={viewMode} onViewModeChange={setViewMode} />

      <div className="grid h-[calc(100vh-178px)] min-h-[560px] min-w-0 grid-cols-[250px_minmax(0,1fr)] overflow-hidden">
        <LearningResourceExplorerTreePane onContextMenu={(event) => openContextMenu(event)}>
            {subjects.length ? subjects.map((subject) => (
              <div key={subject.id}>
                <LearningResourceExplorerTreeRow
                  label={subject.label}
                  title={subject.label}
                  selected={selectedSubject?.id === subject.id && !selectedNode?.id}
                  expanded={expandedSubjectIds.has(subject.id)}
                  hasChildren={subject.tree.length > 0}
                  icon={<WindowsFolderIcon open={expandedSubjectIds.has(subject.id)} />}
                  onSelect={() => {
                    onSelectSubject(subject.id);
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
                  onContextMenu={(event) => openContextMenu(event, undefined, undefined, undefined, subject)}
                />
                {expandedSubjectIds.has(subject.id) ? (
                  <SubjectTreeSection
                    subject={subject}
                    treeQuery={debouncedTreeQuery}
                    selectedNode={selectedNode}
                    localContentItems={localContentItems}
                    resources={resources.map((resource) => attachedResources[resource.id] ?? resource)}
                    expandedNodeIds={expandedNodeIds}
                    selection={selection}
                    onSelectNode={(nodeId) => {
                      onSelectSubject(subject.id);
                      onSelectNode(nodeId);
                    }}
                    onSelectLocalContent={(item) => {
                      onSelectSubject(subject.id);
                      setSelection({ type: "local-content", id: item.id });
                    }}
                    onSelectResource={(resource) => {
                      onSelectSubject(subject.id);
                      setSelection({ type: "resource", id: resource.id });
                    }}
                    onToggleNode={toggleNode}
                    onCreateChild={handleCreateChild}
                    onOpenContextMenu={openContextMenu}
                    selectedSubjectId={selectedSubject?.id ?? ""}
                  />
                ) : null}
              </div>
            )) : (
              <div
                className="m-2 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs leading-5 text-slate-500"
                onContextMenu={(event) => openContextMenu(event)}
              >
                Chưa có môn học. Bấm New để bắt đầu.
              </div>
            )}
        </LearningResourceExplorerTreePane>

        <section
          className="min-h-0 min-w-0 overflow-hidden bg-white"
          onContextMenu={(event) => openContextMenu(event)}
        >
          {viewMode === "list" ? (
            <>
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
                        <span className="shrink-0 text-[var(--erg-blue)]">{item.kind === "lecture" ? <Presentation className="h-4 w-4" /> : <FileCheck className="h-4 w-4" />}</span>
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
                        <FileText className="h-4 w-4 shrink-0 text-[var(--erg-blue)]" />
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
                    <p className="mt-1 max-w-sm text-[#64748b]">Dùng chuột phải hoặc nút New để tạo thư mục, bài học hoặc gắn tài liệu.</p>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
              <LearningResourceExplorerCardGrid className="p-5">
                  {showChildrenPanel && currentChildren.map((child) => (
                    <div
                      key={child.id}
                      onContextMenu={(event) => openContextMenu(event, child)}
                    >
                      <LearningResourceFolderTile
                        label={child.label}
                        selected={selection?.type === "node" && selection.id === child.id}
                        onClick={() => setSelection({ type: "node", id: child.id })}
                        onDoubleClick={() => onSelectNode(child.id)}
                      />
                    </div>
                  ))}

                  {currentLocalContentItems.map((item) => {
                    const meta = getResourceCardMeta(item.id, item.title, item.kind === "lecture" ? "PPTX" : "QUIZ");
                    return (
                      <div
                        key={item.id}
                        onContextMenu={(event) => openContextMenu(event, undefined, item)}
                        className={cn(
                          selection?.type === "local-content" && selection.id === item.id ? "ring-2 ring-[#33b653] rounded-lg" : "",
                        )}
                      >
                        <LearningResourceSquareCard
                          actionLabel={meta.actionLabel}
                          heading={meta.heading}
                          minutes={meta.minutes}
                          questions={meta.questions}
                          tag={meta.tag}
                          title={item.title}
                          unit={meta.unit}
                          onOpen={() => {
                            setSelection({ type: "local-content", id: item.id });
                            const link = getDisplayLink(item);
                            if (link && typeof window !== "undefined") window.open(link, "_blank", "noopener,noreferrer");
                          }}
                        />
                      </div>
                    );
                  })}

                  {currentAttachedResources.map((resource) => {
                    const fileType = resource.fileTypeBadge || resource.selectedFileType || "PDF";
                    const meta = getResourceCardMeta(resource.id, resource.title, fileType);
                    return (
                      <div
                        key={resource.id}
                        onContextMenu={(event) => openContextMenu(event, undefined, undefined, resource)}
                        className={cn(
                          selection?.type === "resource" && selection.id === resource.id ? "ring-2 ring-[#33b653] rounded-lg" : "",
                        )}
                      >
                        <LearningResourceSquareCard
                          actionLabel={meta.actionLabel}
                          heading={meta.heading}
                          minutes={meta.minutes}
                          questions={meta.questions}
                          tag={meta.tag}
                          title={resource.title}
                          unit={meta.unit}
                          onOpen={() => {
                            setSelection({ type: "resource", id: resource.id });
                            handleOpenResourceLink(resource);
                          }}
                        />
                      </div>
                    );
                  })}

                  {!currentChildren.length && !totalAttachedItems ? (
                    <div className="flex h-full min-h-[340px] w-full flex-col items-center justify-center text-center text-[13px] col-span-full">
                      <Folder className="h-12 w-12 text-[#cbd5e1]" />
                      <div className="mt-3 font-semibold text-[#111827]">This folder is empty</div>
                      <p className="mt-1 max-w-sm text-[#64748b]">Dùng chuột phải hoặc nút New để tạo thư mục, bài học hoặc gắn tài liệu.</p>
                    </div>
                  ) : null}
              </LearningResourceExplorerCardGrid>
            )}
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
    </LearningResourceExplorerShell>
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
  const targetTitle = node?.label || localContent?.title || resource?.title || subject?.label || "Vị trí hiện tại";
  const targetType = node ? getNodeKindLabel(node.kind) : localContent ? (localContent.kind === "lecture" ? "Bài giảng" : "Bài tập") : resource ? getResourceDisplayBadge(resource) : subject ? "Môn học" : "Thư mục hiện tại";
  return (
    <div
      className="fixed z-50 w-[294px] overflow-hidden rounded-md border border-[#d8d8d8] bg-white py-1 text-[13px] text-[#1f1f1f] shadow-sm"
      style={{ left: x, top: y }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="border-b border-[#eeeeee] px-3 py-2">
        <div className="truncate font-medium">{targetTitle}</div>
        <div className="truncate text-[12px] text-[#6b7280]">{targetType}</div>
      </div>
      <button type="button" onClick={onOpen} disabled={!canOpen} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]">
        <ArrowUpRight className="h-4 w-4 text-[#374151]" />
        Mở
      </button>
      <button type="button" onClick={onRefresh} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6]">
        <RefreshCw className="h-4 w-4 text-[#374151]" />
        Làm mới dữ liệu
      </button>
      <div className="my-1 h-px bg-[#eeeeee]" />
      <button type="button" onClick={onEdit} disabled={!hasTarget} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]">
        <Pencil className="h-4 w-4 text-[#374151]" />
        Sửa tên / thông tin
      </button>
      <button type="button" onClick={onCopyUrl} disabled={!canCopyUrl} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]">
        <Copy className="h-4 w-4 text-[#374151]" />
        Copy đường dẫn
      </button>
      <button type="button" onClick={onDelete} disabled={!hasTarget} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]">
        <Trash2 className="h-4 w-4 text-[#dc2626]" />
        Xóa
      </button>
      <div className="my-1 h-px bg-[#eeeeee]" />
      <button type="button" onClick={onCreateSubject} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6]">
        <BookOpen className="h-4 w-4 text-[#374151]" />
        Tạo môn học
      </button>
      <button type="button" onClick={onCreateRoot} disabled={!canCreateRoot} className="flex w-full items-center gap-3 px-3 py-1.5 text-left hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:text-[#9ca3af]">
        <FolderPlus className="h-4 w-4 text-[#374151]" />
        Tạo nhóm học liệu
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
