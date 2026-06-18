import { memo, type MouseEvent } from "react";
import {
  BookMarked,
  ClipboardList,
  FileCheck,
  FileText,
  GraduationCap,
  Headphones,
  HelpCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  Presentation,
  Video,
} from "@/components/mui-icon-shim";

import { LearningResourceExplorerTreeRow, WindowsFolderIcon } from "@/components/learning-resources/explorer-ui";
import type { StudioNode, StudioNodeKind } from "@/features/lcms/admin-operations/types/learning-resource-authoring";

export const ExplorerTreeRow = memo(function ExplorerTreeRow({
  node,
  depth = 0,
  selected,
  expanded,
  onSelectNode,
  onToggleNode,
  onCreateChild,
  onOpenContextMenu,
}: {
  node: StudioNode;
  depth?: number;
  selected: boolean;
  expanded: boolean;
  onSelectNode: (id: string) => void;
  onToggleNode: (id: string) => void;
  onCreateChild: (node: StudioNode) => void;
  onOpenContextMenu: (event: MouseEvent, node: StudioNode) => void;
}) {
  const hasChildren = node.children.length > 0;

  return (
    <LearningResourceExplorerTreeRow
      label={node.label}
      title={node.label}
      depth={depth}
      indentBase={22}
      selected={selected}
      expanded={expanded}
      hasChildren={hasChildren}
      icon={getNodeIcon(node, selected || expanded)}
      onSelect={() => onSelectNode(node.id)}
      onToggle={() => onToggleNode(node.id)}
      onAction={() => onCreateChild(node)}
      actionDisabled={!node.optionId}
      onContextMenu={(event) => onOpenContextMenu(event, node)}
    />
  );
});

export function getNodeIcon(node: StudioNode, expanded?: boolean) {
  const displayKind = node.metadata?.displayKind;
  if (displayKind === "lecture") {
    return <Presentation className="h-4 w-4" />;
  }
  if (displayKind === "exercise") {
    return <FileCheck className="h-4 w-4" />;
  }
  if (displayKind === "resource") {
    return <FileText className="h-4 w-4" />;
  }
  if (
    node.kind === "group" ||
    node.kind === "folder" ||
    node.kind === "category" ||
    node.kind === "bookSeries" ||
    node.kind === "lesson" ||
    node.kind === "section"
  ) {
    return <WindowsFolderIcon open={expanded} />;
  }
  if (node.kind === "topic" && node.children.length > 0) {
    return <WindowsFolderIcon open={expanded} />;
  }
  if (node.kind === "topic") {
    return <FileText className="h-4 w-4" />;
  }

  const text = `${node.label} ${node.description ?? ""}`.toLowerCase();
  if (text.includes("audio") || text.includes("âm thanh") || text.includes("phát âm")) {
    return <Headphones className="h-4 w-4" />;
  }
  if (text.includes("ppt") || text.includes("slide") || text.includes("bài giảng điện tử") || text.includes("presentation")) {
    return <Presentation className="h-4 w-4" />;
  }
  if (text.includes("giáo án") || text.includes("kế hoạch")) {
    return <ClipboardList className="h-4 w-4" />;
  }
  if (text.includes("kiểm tra") || text.includes("quiz") || text.includes("question") || text.includes("bài tập")) {
    return <FileCheck className="h-4 w-4" />;
  }
  if (text.includes("video") || text.includes("hoạt hình")) {
    return <Video className="h-4 w-4" />;
  }
  if (text.includes("tranh") || text.includes("ảnh") || text.includes("image")) {
    return <ImageIcon className="h-4 w-4" />;
  }
  if (text.includes("link") || text.includes("liên kết")) {
    return <LinkIcon className="h-4 w-4" />;
  }
  if (text.includes("sách") || text.includes("giáo trình")) {
    return <BookMarked className="h-4 w-4" />;
  }
  if (text.includes("unit") || text.includes("lesson") || text.includes("bài ")) {
    return <GraduationCap className="h-4 w-4" />;
  }
  return <HelpCircle className="h-4 w-4" />;
}

export function getNodeKindLabel(kind: StudioNodeKind) {
  const labels: Record<StudioNodeKind, string> = {
    group: "Nhóm học liệu",
    lesson: "Bài học",
    bookSeries: "Bộ sách / Chương trình",
    category: "Nhóm học liệu",
    folder: "Nhóm hệ thống",
    section: "Bài học",
    topic: "Chủ đề / Bài học",
  };
  return labels[kind] ?? kind;
}

export function flattenVisibleNodes(nodes: StudioNode[], expandedNodeIds: Set<string>, depth = 0): Array<{ node: StudioNode; depth: number }> {
  return nodes.flatMap((node) => [
    { node, depth },
    ...(expandedNodeIds.has(node.id) ? flattenVisibleNodes(node.children, expandedNodeIds, depth + 1) : []),
  ]);
}

export function filterTree(nodes: StudioNode[], query: string): StudioNode[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return nodes;
  }

  return nodes
    .map((node) => {
      const children = filterTree(node.children, normalizedQuery);
      const matched = node.label.toLowerCase().includes(normalizedQuery) || node.kind.toLowerCase().includes(normalizedQuery);
      return matched || children.length ? { ...node, children } : null;
    })
    .filter(Boolean) as StudioNode[];
}
