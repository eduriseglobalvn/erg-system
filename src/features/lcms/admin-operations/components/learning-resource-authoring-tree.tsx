import { memo, type MouseEvent } from "react";
import {
  BookMarked,
  ChevronRight,
  ClipboardList,
  FileCheck,
  FileText,
  GraduationCap,
  Headphones,
  HelpCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Presentation,
  Video,
} from "@/components/mui-icon-shim";

import { WindowsFolderIcon } from "@/components/learning-resources/explorer-ui";
import type { StudioNode, StudioNodeKind } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { cn } from "@/lib/utils";

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
    <div
      className={cn(
        "group relative flex items-center justify-between gap-1.5 rounded-sm py-1.5 px-2 text-[13px] transition",
        selected ? "bg-[#dceeff] font-semibold text-[#0b3f7a] [&_svg]:text-[#0b6fcf]" : "text-[#111827] hover:bg-[#eef6ff]",
      )}
      style={{ paddingLeft: `${8 + Math.min(depth, 8) * 14}px` }}
      onContextMenu={(event) => onOpenContextMenu(event, node)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleNode(node.id)}
            className="grid h-5 w-5 shrink-0 place-items-center rounded text-[#6b7280] hover:bg-slate-200/50"
            aria-label={expanded ? "Thu gọn" : "Mở rộng"}
          >
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-150", expanded ? "rotate-90" : undefined)} />
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onSelectNode(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left pr-8"
        >
          <span className="shrink-0">
            {getNodeIcon(node, selected || expanded)}
          </span>
          <span className={cn("truncate", selected ? "font-semibold text-[#0b3f7a]" : "font-medium text-[#111827]")} title={node.label}>
            {node.label}
          </span>
        </button>
      </div>
      <button
        type="button"
        onClick={() => onCreateChild(node)}
        disabled={!node.optionId}
        className="absolute right-2 top-1/2 -translate-y-1/2 shadow-sm bg-white/80 backdrop-blur-sm grid h-6 w-6 shrink-0 place-items-center rounded text-[#9ca3af] opacity-0 hover:bg-white hover:text-[var(--erg-blue)] group-hover:opacity-100 disabled:cursor-not-allowed disabled:text-[#cbd5e1] transition-opacity"
        aria-label="Thêm nội dung bên trong"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});

export function getNodeIcon(node: StudioNode, expanded?: boolean) {
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
  if (node.kind === "group" || node.kind === "folder") {
    return <WindowsFolderIcon open={expanded} />;
  }
  if (node.kind === "lesson") {
    return <FileText className="h-4 w-4" />;
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
