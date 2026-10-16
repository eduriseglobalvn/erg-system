import type { MouseEvent } from "react";
import Folder from "@mui/icons-material/Folder";
import type { ExplorerViewMode } from "@/components/learning-resources/explorer-ui";
import { cn } from "@/lib/utils";
import type { CurriculumFolder, CurriculumTarget } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import { MiniCount } from "./learning-resource-curriculum-explorer-badges";
import { EnterpriseList } from "./learning-resource-curriculum-explorer-list";
import { folderRoleLabel, resourcePalette, roleIcon, roleTone, targetsEqual } from "./learning-resource-curriculum-explorer-model";

type CurriculumFolderCanvasProps = {
  folders: CurriculumFolder[];
  parentFolder?: CurriculumFolder;
  selectedTarget?: CurriculumTarget | null;
  viewMode: ExplorerViewMode;
  onContextMenu?: (event: MouseEvent, folder: CurriculumFolder) => void;
  onOpenFolder: (folder: CurriculumFolder) => void;
  onSelectFolder: (folder: CurriculumFolder) => void;
};

export function CurriculumFolderCanvas({
  folders,
  parentFolder,
  selectedTarget,
  viewMode,
  onContextMenu,
  onOpenFolder,
  onSelectFolder,
}: CurriculumFolderCanvasProps) {
  const header = <FolderCanvasHeader folder={parentFolder} childCount={folders.length} />;

  if (!folders.length) {
    return (
      <div className="flex h-full min-h-[340px] items-center justify-center p-8 text-center">
        <div className="max-w-sm">
          <Folder className="mx-auto h-12 w-12 text-[#C4CDD5]" />
          <div className="mt-3 text-sm font-bold text-[#1C252E]">Chưa có thư mục con</div>
          <p className="mt-1 text-[13px] leading-5 text-[#637381]">Dùng thanh công cụ để tạo level hoặc chủ đề phù hợp với vị trí hiện tại.</p>
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <EnterpriseList
        folders={folders}
        items={[]}
        selectedTarget={selectedTarget}
        onContextMenuFolder={onContextMenu}
        onOpenFolder={onOpenFolder}
        onSelectFolder={onSelectFolder}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto p-6 [scrollbar-gutter:stable]">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,240px))] gap-3">
        {folders.map((folder) => (
          <FolderCard
            key={folder.id}
            folder={folder}
            selected={targetsEqual(selectedTarget, folder.target)}
            onClick={() => onSelectFolder(folder)}
            onContextMenu={(event) => onContextMenu?.(event, folder)}
            onDoubleClick={() => onOpenFolder(folder)}
          />
        ))}
      </div>
      </div>
    </div>
  );
}

export function FolderCanvasHeader({ childCount, folder }: { childCount: number; folder?: CurriculumFolder }) {
  const role = folder?.role ?? "subject";
  const tone = roleTone(role);
  const childLabel = role === "subject" ? "level" : role === "level" ? "chủ đề" : "mục";

  return (
    <div className="flex min-h-[56px] shrink-0 items-center justify-between gap-3 border-b bg-white px-6" style={{ borderColor: resourcePalette.border }}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md" style={{ background: tone.background, color: tone.foreground }}>
          {roleIcon(role)}
        </span>
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-normal text-[#637381]">Đang mở {folderRoleLabel(role)}</div>
          <div className="truncate text-sm font-bold text-[#1C252E]">{folder?.pathLabels.join(" / ") || "Kho học liệu"}</div>
        </div>
      </div>
      <div className="shrink-0 text-[12px] font-semibold text-[#637381]">
        {childCount} {childLabel} bên trong
      </div>
    </div>
  );
}

export function FolderCard({
  folder,
  selected,
  onClick,
  onContextMenu,
  onDoubleClick,
}: {
  folder: CurriculumFolder;
  selected?: boolean;
  onClick: () => void;
  onContextMenu?: (event: MouseEvent<HTMLButtonElement>) => void;
  onDoubleClick: () => void;
}) {
  const tone = roleTone(folder.role);

  return (
    <button
      type="button"
      className={cn(
        "group flex h-[92px] items-center gap-3 rounded-lg border px-4 text-left transition hover:border-[#B8D6FA]",
        selected ? "bg-[#DCEEFF]" : "bg-white hover:bg-[#F1F4F7]",
      )}
      style={{ borderColor: selected ? tone.foreground : resourcePalette.border, boxShadow: selected ? `0 0 0 3px ${tone.background}` : undefined }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
    >
      <div className="flex shrink-0 items-center">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg" style={{ background: tone.background, color: tone.foreground }}>
          {roleIcon(folder.role)}
        </span>
      </div>
      <div className="mt-0 min-w-0 flex-1">
        <h3 className="line-clamp-2 text-[13px] font-bold leading-5 text-[#1C252E]">{folder.title}</h3>
        <p className="mt-1 truncate text-xs text-[#637381]">{simpleFolderCount(folder)}</p>
      </div>
      <div className="hidden">
        <MiniCount label="Chủ đề" value={folder.summary.topics} tone="blue" />
        <MiniCount label="Bài giảng" value={folder.summary.lectures} tone="blue" />
        <MiniCount label="Tài liệu" value={folder.summary.documents} tone="blue" />
        <MiniCount label="Bài tập" value={folder.summary.exercises} tone="red" />
      </div>
    </button>
  );
}

function simpleFolderCount(folder: CurriculumFolder) {
  if (folder.role === "subject") return `${folder.summary.levels} level`;
  if (folder.role === "level") return `${folder.summary.topics} chủ đề`;
  return `${folder.summary.totalContent} học liệu`;
}
