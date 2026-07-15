import type { MouseEvent, ReactNode } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileQuestion,
  FileText,
  Folder,
  GraduationCap,
  Layers3,
  Link as LinkIcon,
  Pencil,
  Plus,
  Presentation,
  RefreshCw,
  Search,
  Trash2,
} from "@/components/mui-icon-shim";

import { ExplorerViewToggle, type ExplorerViewMode } from "@/components/learning-resources/explorer-ui";
import { cn } from "@/lib/utils";
import {
  type ContentSummary,
  type CurriculumContentItem,
  type CurriculumContentKind,
  type CurriculumFolder,
  type CurriculumFolderRole,
  type CurriculumTarget,
  type ResourceCommandId,
  type ResourceCommandSpec,
} from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";

const resourcePalette = {
  blue: "#0F6CBD",
  blueSoft: "#EAF4FF",
  blueBorder: "#B8D6FA",
  red: "#F35C6B",
  redSoft: "#FFF1F3",
  redBorder: "#FFD0D6",
  text: "#1C252E",
  muted: "#637381",
  border: "rgba(145, 158, 171, 0.2)",
};

type BreadcrumbItem = {
  label: string;
  onClick: () => void;
};

type ResourceExplorerTopBarProps = {
  breadcrumbItems: BreadcrumbItem[];
  canGoBack: boolean;
  onBack: () => void;
  onRefresh: () => void;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  summary: ContentSummary;
  title?: string;
  onSearchChange: (value: string) => void;
};

export function ResourceExplorerTopBar({
  breadcrumbItems,
  canGoBack,
  onBack,
  onRefresh,
  searchLabel,
  searchPlaceholder,
  searchValue,
  summary,
  title,
  onSearchChange,
}: ResourceExplorerTopBarProps) {
  return (
    <header className="flex min-h-[58px] shrink-0 items-center border-b px-4 py-3" style={{ borderColor: resourcePalette.border }}>
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#637381] hover:bg-[#EAF4FF] disabled:cursor-not-allowed disabled:text-[#C4CDD5]"
          disabled={!canGoBack}
          onClick={onBack}
          aria-label="Quay lại"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#C4CDD5]"
          disabled
          aria-label="Tiến tới"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#637381] hover:bg-[#EAF4FF]"
          onClick={onRefresh}
          aria-label="Tải lại"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <nav
          className="flex h-9 min-w-0 flex-1 items-center overflow-hidden rounded-lg border bg-white px-2"
          style={{ borderColor: resourcePalette.border }}
          title={title}
        >
          <BookOpen className="mx-2 h-4 w-4 shrink-0" style={{ color: resourcePalette.blue }} />
          {breadcrumbItems.length ? (
            breadcrumbItems.map((item, index) => (
              <span key={`${item.label}-${index}`} className="flex min-w-0 items-center">
                {index > 0 ? <ChevronRight className="mx-1 h-3.5 w-3.5 shrink-0 text-[#919EAB]" /> : null}
                <button
                  type="button"
                  className={cn(
                    "min-w-0 truncate rounded-md px-1.5 py-1 text-left text-[13px] hover:bg-[#EAF4FF]",
                    index === breadcrumbItems.length - 1 ? "font-bold text-[#1C252E]" : "font-semibold text-[#637381]",
                  )}
                  onClick={item.onClick}
                >
                  {item.label}
                </button>
              </span>
            ))
          ) : (
            <span className="text-[13px] font-semibold text-[#637381]">Resources</span>
          )}
        </nav>
        <CompactSummary summary={summary} />
        <label className="flex h-9 w-[280px] max-w-[28vw] shrink-0 items-center rounded-lg border bg-white px-3" style={{ borderColor: resourcePalette.border }}>
          <span className="sr-only">{searchLabel}</span>
          <Search className="mr-2 h-4 w-4 text-[#637381]" />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#919EAB]"
            type="text"
          />
        </label>
      </div>
      <div className="hidden">
        <SummaryChip label="Level" value={summary.levels} tone="blue" />
        <SummaryChip label="Chủ đề" value={summary.topics} tone="blue" />
        <SummaryChip label="Bài giảng" value={summary.lectures} tone="blue" />
        <SummaryChip label="Tài liệu" value={summary.documents} tone="neutral" />
        <SummaryChip label="Bài tập" value={summary.exercises} tone="red" />
      </div>
    </header>
  );
}

type ResourceToolbarProps = {
  commands: ResourceCommandSpec[];
  viewMode: ExplorerViewMode;
  onCommand: (id: ResourceCommandId) => void;
  onViewModeChange: (mode: ExplorerViewMode) => void;
};

export function ResourceToolbar({ commands, viewMode, onCommand, onViewModeChange }: ResourceToolbarProps) {
  const visibleCommands = uniqueCommands(commands).filter((command) => command.enabled);
  const primaryCommand = visibleCommands.find((command) => command.tone === "primary");
  const secondaryCommands = visibleCommands.filter((command) => command.id !== primaryCommand?.id);

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b bg-white px-4" style={{ borderColor: resourcePalette.border }}>
      {primaryCommand ? <CommandButton command={primaryCommand} onCommand={onCommand} primary /> : null}
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        {secondaryCommands.map((command) => (
          <CommandButton key={command.id} command={command} onCommand={onCommand} />
        ))}
      </div>
      <ExplorerViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
    </div>
  );
}

function CommandButton({
  command,
  primary = false,
  onCommand,
}: {
  command: ResourceCommandSpec;
  primary?: boolean;
  onCommand: (id: ResourceCommandId) => void;
}) {
  return (
    <button
      type="button"
      disabled={!command.enabled}
      onClick={() => onCommand(command.id)}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-45",
        primary && "min-w-[118px]",
        command.tone === "primary" && "bg-[#0F6CBD] text-white hover:bg-[#0b5da5]",
        command.tone === "blue" && "bg-[#EAF4FF] text-[#0F6CBD] hover:bg-[#dceeff]",
        command.tone === "red" && "bg-[#FFF1F3] text-[#D73D50] hover:bg-[#FFE2E7]",
        command.tone === "neutral" && "bg-white text-[#637381] hover:bg-[#F4F6F8]",
        command.tone === "danger" && "bg-white text-[#B71D18] hover:bg-[#FFF1F3]",
      )}
      title={command.label}
    >
      {commandIcon(command.id)}
      <span className="whitespace-nowrap">{command.label}</span>
    </button>
  );
}

export function ResourceTaxonomyTree({
  children,
  empty,
  onContextMenu,
}: {
  children: ReactNode;
  empty?: ReactNode;
  onContextMenu?: (event: MouseEvent<HTMLElement>) => void;
}) {
  return (
    <aside
      className="min-h-0 overflow-y-auto border-r bg-[#FBFCFE] px-3 py-3 [scrollbar-gutter:stable]"
      style={{ borderColor: resourcePalette.border }}
      onContextMenu={onContextMenu}
    >
      <nav className="space-y-1">{children || empty}</nav>
    </aside>
  );
}

type ResourceTreeRowProps = {
  action?: ReactNode;
  countLabel?: string;
  depth?: number;
  expanded?: boolean;
  hasChildren?: boolean;
  label: string;
  role: CurriculumFolderRole | CurriculumContentKind;
  selected?: boolean;
  title?: string;
  onAction?: () => void;
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
  onSelect: () => void;
  onToggle?: () => void;
};

export function ResourceTreeRow({
  action,
  countLabel,
  depth = 0,
  expanded,
  hasChildren,
  label,
  role,
  selected,
  title,
  onAction,
  onContextMenu,
  onSelect,
  onToggle,
}: ResourceTreeRowProps) {
  const tone = roleTone(role);

  return (
    <div
      className={cn(
        "group relative flex h-8 w-full items-center gap-1 rounded-md pr-1 text-[13px] transition",
        selected ? "bg-[#DCEEFF] font-semibold" : "text-[#1C252E] hover:bg-[#F1F4F7]",
      )}
      style={{
        paddingLeft: `${8 + Math.min(depth, 8) * 18}px`,
        color: selected ? tone.foreground : undefined,
        boxShadow: selected ? `inset 3px 0 0 ${tone.foreground}` : undefined,
      }}
      onContextMenu={onContextMenu}
    >
      {hasChildren ? (
        <button
          type="button"
          className="grid h-6 w-5 shrink-0 place-items-center rounded-md text-[#919EAB] hover:bg-black/5"
          onClick={(event) => {
            event.stopPropagation();
            onToggle?.();
          }}
          aria-label={expanded ? "Thu gọn" : "Mở rộng"}
        >
          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded ? "rotate-90" : undefined)} />
        </button>
      ) : (
        <span className="w-5 shrink-0" />
      )}
      <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" title={title ?? label} onClick={onSelect}>
        <span
          className="grid h-5 w-5 shrink-0 place-items-center rounded-sm"
          style={{ color: tone.foreground }}
        >
          {roleIcon(role)}
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold">{label}</span>
        {countLabel ? <span className="shrink-0 pr-1 text-[11px] font-semibold text-[#919EAB]">{countLabel}</span> : null}
      </button>
      {action || onAction ? (
        <button
          type="button"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-[#919EAB] opacity-0 transition hover:bg-[#EAF4FF] hover:text-[#0F6CBD] group-hover:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            onAction?.();
          }}
          aria-label="Thêm bên trong"
        >
          {action ?? <Plus className="h-3.5 w-3.5" />}
        </button>
      ) : null}
    </div>
  );
}

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

type TopicContentLanesProps = {
  contentGroups: Record<CurriculumContentKind, CurriculumContentItem[]>;
  selectedTarget?: CurriculumTarget | null;
  onAddContent: (kind: CurriculumContentKind) => void;
  onOpenContent: (item: CurriculumContentItem) => void;
  onSelectContent: (item: CurriculumContentItem) => void;
  onContextMenu?: (event: MouseEvent, item: CurriculumContentItem) => void;
};

export function TopicContentLanes({
  contentGroups,
  selectedTarget,
  onAddContent,
  onOpenContent,
  onSelectContent,
  onContextMenu,
}: TopicContentLanesProps) {
  const lanes: Array<{ kind: CurriculumContentKind; title: string; description: string; action: string }> = [
    { kind: "lecture", title: "Bài giảng", description: "Google Slides hoặc PPTX dùng trên LMS.", action: "Thêm bài giảng" },
    { kind: "resource", title: "Tài liệu", description: "PDF, Drive, Video, Audio hoặc file tham khảo.", action: "Gắn tài liệu" },
    { kind: "exercise", title: "Bài tập từ Quiz bank", description: "Train/Test quiz lấy từ ngân hàng bài tập.", action: "Gắn bài tập từ Quiz bank" },
  ];

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-y-auto p-5 [scrollbar-gutter:stable] xl:grid-cols-3">
      {lanes.map((lane) => {
        const items = contentGroups[lane.kind];
        const tone = roleTone(lane.kind);
        return (
          <section key={lane.kind} className="flex min-h-[420px] min-w-0 flex-col rounded-xl border bg-white" style={{ borderColor: tone.border }}>
            <div className="border-b px-4 py-3" style={{ borderColor: tone.border, background: lane.kind === "exercise" ? resourcePalette.redSoft : resourcePalette.blueSoft }}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-[#1C252E]">{lane.title}</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[#637381]">{lane.description}</p>
                </div>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-bold" style={{ color: tone.foreground }}>
                  {items.length}
                </span>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
              {items.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  selected={targetsEqual(selectedTarget, item.target)}
                  onClick={() => onSelectContent(item)}
                  onContextMenu={(event) => onContextMenu?.(event, item)}
                  onOpen={() => onOpenContent(item)}
                />
              ))}
              {!items.length ? (
                <button
                  type="button"
                  onClick={() => onAddContent(lane.kind)}
                  className="flex min-h-[142px] flex-col items-center justify-center rounded-lg border border-dashed px-4 text-center text-[13px] font-bold transition hover:bg-white"
                  style={{ borderColor: tone.border, color: tone.foreground, background: lane.kind === "exercise" ? "#FFF9FA" : "#F8FBFF" }}
                >
                  {roleIcon(lane.kind)}
                  <span className="mt-3">{lane.action}</span>
                </button>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}

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

export function EnterpriseContentGrid({
  items,
  selectedTarget,
  onOpenContent,
  onSelectContent,
}: {
  items: CurriculumContentItem[];
  selectedTarget?: CurriculumTarget | null;
  onOpenContent: (item: CurriculumContentItem) => void;
  onSelectContent: (item: CurriculumContentItem) => void;
}) {
  if (!items.length) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center bg-[#FBFCFE] p-8 text-center">
        <div className="max-w-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg border border-[#B8D6FA] bg-[#EAF4FF] text-[#0F6CBD]">
            <FileText className="h-6 w-6" />
          </span>
          <h3 className="mt-3 text-sm font-bold text-[#1C252E]">Chưa có nội dung</h3>
          <p className="mt-1 text-[13px] leading-5 text-[#637381]">Thêm bài giảng, bài tập hoặc tài liệu từ thanh công cụ phía trên.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#FBFCFE] p-5 [scrollbar-gutter:stable]">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
        {items.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            selected={targetsEqual(selectedTarget, item.target)}
            onClick={() => onSelectContent(item)}
            onOpen={() => onOpenContent(item)}
          />
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const normalized = status?.toLowerCase() ?? "";
  const published = normalized === "published" || normalized === "active";
  const hidden = normalized === "hidden" || normalized === "archived";
  return (
    <span className={cn(
      "inline-flex max-w-full items-center rounded-md border px-2 py-1 text-[11px] font-bold",
      published && "border-[#A9DFC0] bg-[#EAF8EF] text-[#166534]",
      hidden && "border-[#D8DEE8] bg-[#F1F3F6] text-[#52606D]",
      !published && !hidden && "border-[#F4D58D] bg-[#FFF8E6] text-[#8A5A00]",
    )}>
      <span className="truncate">{statusLabel(status)}</span>
    </span>
  );
}

export function ResourceInspector({
  content,
  folder,
  onPrimaryAction,
}: {
  content?: CurriculumContentItem;
  folder?: CurriculumFolder;
  onPrimaryAction?: () => void;
}) {
  const targetTone = content ? roleTone(content.kind) : folder ? roleTone(folder.role) : roleTone("subject");
  const title = content?.title ?? folder?.title ?? "Chưa chọn mục";
  const description = content?.description ?? folder?.description ?? "Chọn một môn học, level, chủ đề hoặc học liệu để xem chi tiết.";

  return (
    <aside className="h-full min-h-0 overflow-y-auto border-l bg-[#FBFCFE] p-4 [scrollbar-gutter:stable]" style={{ borderColor: resourcePalette.border }}>
      <div className="rounded-xl border bg-white p-4" style={{ borderColor: targetTone.border }}>
        <span className="grid h-11 w-11 place-items-center rounded-lg border" style={{ background: targetTone.background, borderColor: targetTone.border, color: targetTone.foreground }}>
          {content ? roleIcon(content.kind) : roleIcon(folder?.role ?? "subject")}
        </span>
        <h3 className="mt-4 text-base font-bold leading-6 text-[#1C252E]">{title}</h3>
        <p className="mt-2 text-[13px] leading-5 text-[#637381]">{description}</p>
        {content && onPrimaryAction ? (
          <button type="button" onClick={onPrimaryAction} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-[#0F6CBD] px-3 text-[13px] font-bold text-white hover:bg-[#0b5da5]">
            <LinkIcon className="h-4 w-4" />
            {content.actionLabel}
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        {folder ? (
          <>
            <InspectorRow label="Loại" value={folderRoleLabel(folder.role)} />
            <InspectorRow label="Đường dẫn" value={folder.pathLabels.join(" / ")} />
            <InspectorRow label="Level" value={String(folder.summary.levels)} />
            <InspectorRow label="Chủ đề" value={String(folder.summary.topics)} />
            <InspectorRow label="Bài giảng" value={String(folder.summary.lectures)} />
            <InspectorRow label="Tài liệu" value={String(folder.summary.documents)} />
            <InspectorRow label="Bài tập" value={String(folder.summary.exercises)} />
            <InspectorRow label="Trạng thái" value={statusLabel(folder.status)} />
          </>
        ) : null}
        {content ? (
          <>
            <InspectorRow label="Loại" value={content.typeLabel} />
            <InspectorRow label="Nguồn" value={content.sourceLabel} />
            <InspectorRow label="Trạng thái" value={statusLabel(content.status)} />
            {content.fileType ? <InspectorRow label="Định dạng" value={content.fileType} /> : null}
            {content.questionCount ? <InspectorRow label="Số câu" value={String(content.questionCount)} /> : null}
            {content.durationMinutes ? <InspectorRow label="Thời lượng" value={`${content.durationMinutes} phút`} /> : null}
            {content.meta.map((meta) => (
              <InspectorRow key={meta} label="Metadata" value={meta} />
            ))}
          </>
        ) : null}
      </div>
    </aside>
  );
}

export function flattenContentGroups(groups: Record<CurriculumContentKind, CurriculumContentItem[]>) {
  return [...groups.lecture, ...groups.resource, ...groups.exercise];
}

export function targetsEqual(left?: CurriculumTarget | null, right?: CurriculumTarget | null) {
  return Boolean(left && right && left.type === right.type && left.id === right.id);
}

function FolderCanvasHeader({ childCount, folder }: { childCount: number; folder?: CurriculumFolder }) {
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

function FolderCard({
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

function folderSummaryText(folder: CurriculumFolder) {
  const parts = [
    folder.role === "subject" ? `${folder.summary.levels} level` : null,
    `${folder.summary.topics} chủ đề`,
    `${folder.summary.lectures} bài giảng`,
    `${folder.summary.documents} tài liệu`,
    `${folder.summary.exercises} bài tập`,
  ].filter(Boolean);
  return parts.join(" / ");
}

void folderSummaryText;

function simpleFolderCount(folder: CurriculumFolder) {
  if (folder.role === "subject") return `${folder.summary.levels} level`;
  if (folder.role === "level") return `${folder.summary.topics} chủ đề`;
  return `${folder.summary.totalContent} học liệu`;
}

function ContentCard({
  item,
  selected,
  onClick,
  onContextMenu,
  onOpen,
}: {
  item: CurriculumContentItem;
  selected?: boolean;
  onClick: () => void;
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
  onOpen: () => void;
}) {
  const tone = roleTone(item.kind);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "relative min-h-[188px] rounded-lg border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#75B6F2] hover:border-[#75B6F2] hover:shadow-md",
        selected ? "bg-[#DCEEFF]" : "bg-white hover:bg-[#F1F4F7]",
      )}
      aria-selected={selected}
      style={{ borderColor: selected ? resourcePalette.blue : tone.border, boxShadow: selected ? `0 0 0 3px ${resourcePalette.blueSoft}` : undefined }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      {selected ? <span className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-[#0F6CBD]" aria-hidden="true" /> : null}
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border" style={{ background: tone.background, borderColor: tone.border, color: tone.foreground }}>
          {roleIcon(item.kind)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 text-[13px] font-bold leading-5 text-[#1C252E]">{item.title}</span>
          <span className="mt-1 flex flex-wrap gap-1.5">
            <SmallBadge label={item.sourceLabel} tone={item.kind === "exercise" ? "red" : "blue"} />
            {item.fileType ? <SmallBadge label={item.fileType} tone="neutral" /> : null}
          </span>
        </span>
      </div>
      <div className="mt-3 min-h-10 line-clamp-2 text-xs leading-5 text-[#637381]">
        {item.description || item.meta.join(" / ") || item.typeLabel}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <StatusBadge status={item.status} />
        <span className="truncate text-[11px] font-semibold text-[#637381]">{item.questionCount ? `${item.questionCount} câu` : item.fileType ?? item.typeLabel}</span>
      </div>
      <button
        type="button"
        className="mt-3 inline-flex h-8 items-center rounded-lg px-3 text-xs font-bold"
        style={{ background: tone.background, color: tone.foreground }}
        onClick={(event) => {
          event.stopPropagation();
          onOpen();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            onOpen();
          }
        }}
      >
        {item.actionLabel}
      </button>
    </div>
  );
}

function CompactSummary({ summary }: { summary: ContentSummary }) {
  return (
    <div className="hidden h-9 shrink-0 items-center gap-1.5 rounded-lg border bg-[#FBFCFE] px-3 text-[12px] font-bold text-[#637381] xl:flex" style={{ borderColor: resourcePalette.border }}>
      <span className="text-[#0F6CBD]">{summary.levels}</span>
      <span>level</span>
      <span className="text-[#C4CDD5]">/</span>
      <span className="text-[#0F6CBD]">{summary.topics}</span>
      <span>chủ đề</span>
      <span className="text-[#C4CDD5]">/</span>
      <span className="text-[#F35C6B]">{summary.exercises}</span>
      <span>bài tập</span>
    </div>
  );
}

function SummaryChip({ label, tone, value }: { label: string; tone: "blue" | "red" | "neutral"; value: number }) {
  const colors = toneColors(tone);
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-bold" style={{ background: colors.background, borderColor: colors.border, color: colors.foreground }}>
      <span>{value}</span>
      <span>{label}</span>
    </span>
  );
}

function MiniCount({ label, tone, value }: { label: string; tone: "blue" | "red"; value: number }) {
  const colors = toneColors(tone);
  return (
    <span className="rounded-lg border px-2 py-1.5" style={{ background: colors.background, borderColor: colors.border }}>
      <span className="block text-sm font-bold" style={{ color: colors.foreground }}>{value}</span>
      <span className="block truncate text-[10px] font-bold text-[#637381]">{label}</span>
    </span>
  );
}

function SmallBadge({ label, tone }: { label: string; tone: "blue" | "red" | "neutral" }) {
  const colors = toneColors(tone);
  return (
    <span className="rounded-md border px-1.5 py-0.5 text-[11px] font-bold" style={{ background: colors.background, borderColor: colors.border, color: colors.foreground }}>
      {label}
    </span>
  );
}

function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-white px-3 py-2 text-[13px]" style={{ borderColor: resourcePalette.border }}>
      <span className="shrink-0 font-semibold text-[#637381]">{label}</span>
      <span className="min-w-0 text-right font-bold text-[#1C252E]">{value || "-"}</span>
    </div>
  );
}

function uniqueCommands(commands: ResourceCommandSpec[]) {
  const seen = new Set<ResourceCommandId>();
  return commands.filter((command) => {
    if (seen.has(command.id)) return false;
    seen.add(command.id);
    return true;
  });
}

function commandIcon(id: ResourceCommandId) {
  const className = "h-4 w-4";
  switch (id) {
    case "create-subject":
      return <BookOpen className={className} />;
    case "create-level":
      return <Layers3 className={className} />;
    case "create-topic":
      return <Folder className={className} />;
    case "add-lecture":
      return <Presentation className={className} />;
    case "add-resource":
      return <FileText className={className} />;
    case "add-exercise":
      return <FileQuestion className={className} />;
    case "copy-url":
      return <Copy className={className} />;
    case "edit":
      return <Pencil className={className} />;
    case "delete":
      return <Trash2 className={className} />;
    default:
      return <Plus className={className} />;
  }
}

function roleIcon(role: CurriculumFolderRole | CurriculumContentKind) {
  const className = "h-4 w-4";
  switch (role) {
    case "subject":
      return <BookOpen className={className} />;
    case "level":
      return <Layers3 className={className} />;
    case "topic":
      return <Folder className={className} />;
    case "lecture":
      return <Presentation className={className} />;
    case "exercise":
      return <FileQuestion className={className} />;
    case "resource":
      return <FileText className={className} />;
    default:
      return <GraduationCap className={className} />;
  }
}

function roleTone(role: CurriculumFolderRole | CurriculumContentKind) {
  if (role === "exercise" || role === "topic") {
    return {
      background: resourcePalette.redSoft,
      border: resourcePalette.redBorder,
      foreground: resourcePalette.red,
    };
  }
  if (role === "resource") {
    return {
      background: "#F4F6F8",
      border: resourcePalette.border,
      foreground: resourcePalette.muted,
    };
  }
  return {
    background: resourcePalette.blueSoft,
    border: resourcePalette.blueBorder,
    foreground: resourcePalette.blue,
  };
}

function toneColors(tone: "blue" | "red" | "neutral") {
  if (tone === "red") {
    return { background: resourcePalette.redSoft, border: resourcePalette.redBorder, foreground: resourcePalette.red };
  }
  if (tone === "neutral") {
    return { background: "#F4F6F8", border: resourcePalette.border, foreground: resourcePalette.muted };
  }
  return { background: resourcePalette.blueSoft, border: resourcePalette.blueBorder, foreground: resourcePalette.blue };
}

function folderRoleLabel(role: CurriculumFolderRole) {
  if (role === "subject") return "Môn học";
  if (role === "level") return "Level";
  return "Chủ đề";
}

function statusLabel(status?: string) {
  if (status === "hidden") return "Đã ẩn";
  if (status === "draft" || status === "reviewing") return "Bản nháp";
  if (status === "active" || status === "published" || status === "ready") return "Đã xuất bản";
  return status || "Chưa rõ";
}
