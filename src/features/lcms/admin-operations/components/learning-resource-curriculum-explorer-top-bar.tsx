import BookOpen from "@mui/icons-material/AutoStories";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import RefreshCw from "@mui/icons-material/Refresh";
import Search from "@mui/icons-material/Search";
import { ExplorerViewToggle, type ExplorerViewMode } from "@/components/learning-resources/explorer-ui";
import { cn } from "@/lib/utils";
import type { ContentSummary, ResourceCommandId, ResourceCommandSpec } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import { commandIcon, resourcePalette, uniqueCommands } from "./learning-resource-curriculum-explorer-model";
import { CompactSummary, SummaryChip } from "./learning-resource-curriculum-explorer-badges";

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

export function CommandButton({
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

