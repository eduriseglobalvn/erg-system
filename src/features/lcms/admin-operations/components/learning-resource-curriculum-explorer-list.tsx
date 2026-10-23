import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";
import type { CurriculumContentItem, CurriculumFolder, CurriculumTarget } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import { StatusBadge } from "./learning-resource-curriculum-explorer-badges";
import { folderRoleLabel, resourcePalette, roleIcon, roleTone, targetsEqual } from "./learning-resource-curriculum-explorer-model";

export function EnterpriseList({
  folders,
  items,
  selectedTarget,
  onContextMenuContent,
  onContextMenuFolder,
  onOpenContent,
  onOpenFolder,
  onSelectContent,
  onSelectFolder,
}: {
  folders: CurriculumFolder[];
  items: CurriculumContentItem[];
  selectedTarget?: CurriculumTarget | null;
  onContextMenuContent?: (event: MouseEvent, item: CurriculumContentItem) => void;
  onContextMenuFolder?: (event: MouseEvent, folder: CurriculumFolder) => void;
  onOpenContent?: (item: CurriculumContentItem) => void;
  onOpenFolder: (folder: CurriculumFolder) => void;
  onSelectContent?: (item: CurriculumContentItem) => void;
  onSelectFolder: (folder: CurriculumFolder) => void;
}) {
  return (
    <div className="h-full min-h-0 overflow-hidden bg-white" role="grid">
      <div className="grid min-w-[880px] grid-cols-[minmax(300px,1fr)_124px_124px_104px_128px_104px] border-b bg-[#F4F7FA] text-[11px] font-bold uppercase text-[#52606D]" style={{ borderColor: resourcePalette.border }} role="row">
        <span className="px-4 py-2">Tên</span>
        <span className="px-3 py-2">Phân loại</span>
        <span className="px-3 py-2">Nguồn</span>
        <span className="px-3 py-2">Số lượng</span>
        <span className="px-3 py-2">Trạng thái</span>
        <span className="px-3 py-2">Cập nhật</span>
      </div>
      <div className="h-[calc(100%-33px)] overflow-auto [scrollbar-gutter:stable]">
        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            className={cn(
              "relative grid min-h-14 min-w-[880px] w-full grid-cols-[minmax(300px,1fr)_124px_124px_104px_128px_104px] items-center border-b text-left text-[13px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#75B6F2]",
              targetsEqual(selectedTarget, folder.target) ? "bg-[#DCEEFF] shadow-[inset_4px_0_0_#0F6CBD]" : "bg-white hover:bg-[#F1F4F7]",
            )}
            aria-selected={targetsEqual(selectedTarget, folder.target)}
            role="row"
            onClick={() => onSelectFolder(folder)}
            onDoubleClick={() => onOpenFolder(folder)}
            onContextMenu={(event) => onContextMenuFolder?.(event, folder)}
          >
            <span className="flex min-w-0 items-center gap-2 px-4 py-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border" style={{ background: roleTone(folder.role).background, borderColor: roleTone(folder.role).border, color: roleTone(folder.role).foreground }}>
                {roleIcon(folder.role)}
              </span>
              <span className="truncate font-bold text-[#1C252E]">{folder.title}</span>
            </span>
            <span className="px-3 py-2 text-[#637381]">{folderRoleLabel(folder.role)}</span>
            <span className="px-3 py-2 text-[#637381]">Taxonomy</span>
            <span className="px-3 py-2 text-[#637381]">{folder.summary.totalContent} mục</span>
            <span className="px-3 py-2"><StatusBadge status={folder.status} /></span>
            <span className="px-3 py-2 text-[#637381]">-</span>
          </button>
        ))}
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              "relative grid min-h-14 min-w-[880px] w-full grid-cols-[minmax(300px,1fr)_124px_124px_104px_128px_104px] items-center border-b text-left text-[13px] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#75B6F2]",
              targetsEqual(selectedTarget, item.target) ? "bg-[#DCEEFF] shadow-[inset_4px_0_0_#0F6CBD]" : "bg-white hover:bg-[#F1F4F7]",
            )}
            aria-selected={targetsEqual(selectedTarget, item.target)}
            role="row"
            onClick={() => onSelectContent?.(item)}
            onDoubleClick={() => onOpenContent?.(item)}
            onContextMenu={(event) => onContextMenuContent?.(event, item)}
          >
            <span className="flex min-w-0 items-center gap-2 px-4 py-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border" style={{ background: roleTone(item.kind).background, borderColor: roleTone(item.kind).border, color: roleTone(item.kind).foreground }}>
                {roleIcon(item.kind)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-bold text-[#1C252E]">{item.title}</span>
                {item.description ? <span className="mt-0.5 block truncate text-[12px] text-[#637381]">{item.description}</span> : null}
              </span>
            </span>
            <span className="px-3 py-2 text-[#637381]">{item.typeLabel}</span>
            <span className="px-3 py-2 text-[#637381]">{item.sourceLabel}</span>
            <span className="px-3 py-2 text-[#637381]">{item.questionCount ? `${item.questionCount} câu` : item.fileType ?? ""}</span>
            <span className="px-3 py-2"><StatusBadge status={item.status} /></span>
            <span className="px-3 py-2 text-[#637381]">-</span>
          </button>
        ))}
      </div>
    </div>
  );
}

