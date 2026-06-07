import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Clipboard, Copy, FileCheck, FileQuestion, FileText, Folder, FolderPlus, Monitor, MoreHorizontal, Pencil, Plus, Presentation, RefreshCw, Search, Scissors, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/dashboard-kit";
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
  ExplorerViewToggle,
  LearningResourceFolderTile,
  LearningResourceSquareCard,
  WindowsFolderIcon,
  type ExplorerViewMode,
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
  expandedNodeIds,
  onSelectNode,
  onToggleNode,
  onCreateChild,
  onOpenContextMenu,
  selectedSubjectId,
}: {
  subject: StudioSubject;
  treeQuery: string;
  selectedNode?: StudioNode;
  expandedNodeIds: Set<string>;
  onSelectNode: (nodeId: string) => void;
  onToggleNode: (nodeId: string) => void;
  onCreateChild: (node: StudioNode) => void;
  onOpenContextMenu: (event: MouseEvent, node?: StudioNode, localContent?: LocalContentItem, resource?: AttachedResourceItem, subject?: StudioSubject) => void;
  selectedSubjectId: string;
}) {
  const visibleRows = useMemo(() => {
    const baseTree = filterTree(subject.tree, treeQuery);
    const treeWithoutLessons = baseTree.map((node) => ({
      ...node,
      children: [], // Hide lessons from the sidebar tree view to match LMS
    }));
    return flattenVisibleNodes(treeWithoutLessons, expandedNodeIds);
  }, [subject.tree, treeQuery, expandedNodeIds]);

  return (
    <div className="ml-5 space-y-0.5">
      {visibleRows.length ? (
        visibleRows.map(({ node, depth }) => (
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
        ))
      ) : (
        <div className="px-2 py-3 text-xs text-slate-500">Không tìm thấy nội dung phù hợp.</div>
      )}
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
      setExpandedNodeIds(new Set(selectedSubject?.tree.map((node) => node.id) ?? []));
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

  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white text-[13px] text-slate-900 shadow-sm">
      <div className="flex h-12 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-[#374151]" onClick={handleGoBack} disabled={!selectedNode}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-[#9aa5b1]" disabled>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-[#374151]" onClick={() => void onRefreshData()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <div className="flex h-8 min-w-0 flex-1 items-center overflow-hidden rounded-md bg-white px-2 shadow-sm" title={breadcrumbItems.length ? selectedExplorerUrl : ""}>
          {breadcrumbItems.length ? <Monitor className="mx-2 h-4 w-4 shrink-0 text-[#52616f]" /> : null}
          {breadcrumbItems.map((item, index) => (
            <span key={`${item.label}-${index}`} className="flex min-w-0 items-center">
              {index > 0 ? <ChevronRight className="mx-1 h-3.5 w-3.5 shrink-0 text-[#6b7280]" /> : null}
              <button
                type="button"
                onClick={item.onClick}
                className={cn(
                  "truncate rounded px-1.5 py-0.5 text-[13px] transition-colors duration-150 outline-none hover:bg-slate-200/60 cursor-pointer text-left",
                  index === breadcrumbItems.length - 1 ? "font-medium text-[#111827]" : "text-[#1f2937] hover:text-[#111827]"
                )}
              >
                {item.label}
              </button>
            </span>
          ))}
        </div>
        <div className="flex h-8 w-[280px] max-w-[28vw] items-center rounded-md bg-white px-3 shadow-sm">
          <Search className="mr-2 h-4 w-4 text-[#52616f]" />
          <input
            value={treeQuery}
            onChange={(event) => setTreeQuery(event.target.value)}
            placeholder={`Search ${selectedSubject?.label || "Resources"}`}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#64748b]"
          />
        </div>
      </div>

      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-slate-200 bg-white px-3">
        <button
          type="button"
          onClick={() => {
            if (!selectedSubject) {
              onCreateSubject();
            } else {
              onCreateRoot();
            }
          }}
          className="inline-flex h-9 items-center gap-2 rounded px-2 text-[#1f2937] hover:bg-[#eef6ff]"
        >
          <Folder className="h-4 w-4" />
          New folder
        </button>
        <button
          type="button"
          disabled={selectedNode?.kind !== "group" && selectedNode?.kind !== "lesson"}
          onClick={() => {
            if (selectedNode?.kind === "group") {
              onCreateChild("section");
            } else {
              onCreateChild("lecture");
            }
          }}
          className="inline-flex h-9 items-center gap-2 rounded px-2 text-[#1f2937] hover:bg-[#eef6ff] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Presentation className="h-4 w-4" />
          Thêm bài giảng
        </button>
        <button
          type="button"
          disabled={selectedNode?.kind !== "lesson"}
          onClick={() => onCreateChild("exercise")}
          className="inline-flex h-9 items-center gap-2 rounded px-2 text-[#1f2937] hover:bg-[#eef6ff] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileQuestion className="h-4 w-4" />
          Thêm bài tập
        </button>
        <div className="mx-2 h-7 w-px bg-[#e5e7eb]" />
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded text-[#8aa6c1] hover:bg-[#eef6ff] disabled:opacity-50"
          title="Cut"
          disabled
        >
          <Scissors className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => copyTextToClipboard(selectedExplorerUrl)}
          className="grid h-9 w-9 place-items-center rounded text-[#8aa6c1] hover:bg-[#eef6ff]"
          title="Copy URL"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded text-[#8aa6c1] hover:bg-[#eef6ff]"
          disabled
          title="Paste"
        >
          <Clipboard className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleEditSelection}
          disabled={!canEditSelection}
          className="grid h-9 w-9 place-items-center rounded text-[#8aa6c1] hover:bg-[#eef6ff] disabled:opacity-50"
          title="Rename"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => void handleDeleteSelection()}
          disabled={!canDeleteSelection}
          className="grid h-9 w-9 place-items-center rounded text-[#8aa6c1] hover:bg-[#eef6ff] disabled:opacity-50"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded text-[#1f2937] hover:bg-[#eef6ff]"
          title="More"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <ExplorerViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      <div className="grid h-[calc(100vh-178px)] min-h-[560px] min-w-0 grid-cols-[250px_minmax(0,1fr)] overflow-hidden">
        <aside
          className="min-h-0 overflow-y-auto border-r border-[#e5e7eb] bg-[#fbfbfb] px-1.5 py-2 [scrollbar-gutter:stable]"
          onContextMenu={(event) => openContextMenu(event)}
        >
          <div className="space-y-0.5">
            {subjects.length ? subjects.map((subject) => (
              <div key={subject.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectSubject(subject.id);
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
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px]",
                    selectedSubject?.id === subject.id && !selectedNode?.id ? "bg-[#dceeff] text-[#111827]" : "text-[#111827] hover:bg-[#eef6ff]",
                  )}
                >
                  <ChevronRight className={cn("h-3.5 w-3.5 text-[#6b7280] shrink-0 transition-transform duration-150", expandedSubjectIds.has(subject.id) ? "rotate-90" : undefined)} />
                  <WindowsFolderIcon open={expandedSubjectIds.has(subject.id)} />
                  <span className="min-w-0 flex-1 truncate">{subject.label}</span>
                </button>
                {expandedSubjectIds.has(subject.id) ? (
                  <SubjectTreeSection
                    subject={subject}
                    treeQuery={debouncedTreeQuery}
                    selectedNode={selectedNode}
                    expandedNodeIds={expandedNodeIds}
                    onSelectNode={(nodeId) => {
                      onSelectSubject(subject.id);
                      onSelectNode(nodeId);
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
          </div>
        </aside>

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
              <div className="h-full overflow-y-auto p-5 [scrollbar-gutter:stable]">
                <div className="grid grid-cols-[repeat(auto-fill,210px)] gap-4">
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
                </div>
              </div>
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
    </div>
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
