import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Monitor,
  Play,
  RefreshCw,
  Search,
  Plus,
  Timer,
} from "lucide-react";
import type { MouseEventHandler, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ExplorerViewMode = "grid" | "list";

type LearningResourceExplorerShellProps = {
  children: ReactNode;
  className?: string;
};

export function LearningResourceExplorerShell({
  children,
  className,
}: LearningResourceExplorerShellProps) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white text-[13px] text-slate-900 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

type LearningResourceExplorerBreadcrumbItem = {
  label: string;
  onClick: () => void;
};

type LearningResourceExplorerTopBarProps = {
  breadcrumbItems: LearningResourceExplorerBreadcrumbItem[];
  canGoBack?: boolean;
  className?: string;
  onBack?: () => void;
  onRefresh: () => void;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  title?: string;
  onSearchChange: (value: string) => void;
};

export function LearningResourceExplorerTopBar({
  breadcrumbItems,
  canGoBack = false,
  className,
  onBack,
  onRefresh,
  searchLabel,
  searchPlaceholder,
  searchValue,
  title,
  onSearchChange,
}: LearningResourceExplorerTopBarProps) {
  return (
    <div className={cn("flex h-12 shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50 px-3", className)}>
      <button
        type="button"
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded text-[#374151] hover:bg-[#eef6ff] disabled:cursor-not-allowed disabled:text-[#c7d0da]",
        )}
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Quay lại"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="grid h-8 w-8 shrink-0 place-items-center rounded text-[#c7d0da] disabled:cursor-not-allowed"
        disabled
        aria-label="Tiến tới"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="grid h-8 w-8 shrink-0 place-items-center rounded text-[#374151] hover:bg-[#eef6ff]"
        onClick={onRefresh}
        aria-label="Tải lại"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
      <div
        className="flex h-8 min-w-0 flex-1 items-center overflow-hidden rounded-md bg-white px-2 shadow-sm"
        title={title}
      >
        {breadcrumbItems.length ? <Monitor className="mx-2 h-4 w-4 shrink-0 text-[#52616f]" /> : null}
        {breadcrumbItems.map((item, index) => (
          <span key={`${item.label}-${index}`} className="flex min-w-0 items-center">
            {index > 0 ? <ChevronRight className="mx-1 h-3.5 w-3.5 shrink-0 text-[#6b7280]" /> : null}
            <button
              type="button"
              onClick={item.onClick}
              className={cn(
                "cursor-pointer truncate rounded px-1.5 py-0.5 text-left text-[13px] outline-none transition-colors duration-150 hover:bg-slate-200/60",
                index === breadcrumbItems.length - 1 ? "font-medium text-[#111827]" : "text-[#1f2937] hover:text-[#111827]",
              )}
            >
              {item.label}
            </button>
          </span>
        ))}
      </div>
      <label className="flex h-8 w-[280px] max-w-[28vw] shrink-0 items-center rounded-md bg-white px-3 shadow-sm">
        <span className="sr-only">{searchLabel}</span>
        <Search className="mr-2 h-4 w-4 text-[#52616f]" />
        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#64748b]"
          type="text"
        />
      </label>
    </div>
  );
}

export type LearningResourceExplorerCommand = {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  title?: string;
  variant?: "text" | "icon" | "separator";
  tone?: "primary" | "neutral";
};

type LearningResourceExplorerCommandBarProps = {
  actions: LearningResourceExplorerCommand[];
  className?: string;
  viewMode: ExplorerViewMode;
  onViewModeChange: (mode: ExplorerViewMode) => void;
};

export function LearningResourceExplorerCommandBar({
  actions,
  className,
  viewMode,
  onViewModeChange,
}: LearningResourceExplorerCommandBarProps) {
  return (
    <div className={cn("flex h-12 shrink-0 items-center gap-1 border-b border-slate-200 bg-white px-3", className)}>
      {actions.map((action, index) => {
        if (action.variant === "separator") {
          return <div key={`${action.label}-${index}`} className="mx-2 h-7 w-px bg-[#e5e7eb]" />;
        }

        if (action.variant === "icon") {
          return (
            <button
              key={`${action.label}-${index}`}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className="grid h-9 w-9 place-items-center rounded text-[#8aa6c1] hover:bg-[#eef6ff] disabled:cursor-not-allowed disabled:opacity-50"
              title={action.title ?? action.label}
              aria-label={action.label}
            >
              {action.icon}
            </button>
          );
        }

        return (
          <button
            key={`${action.label}-${index}`}
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className="inline-flex h-9 items-center gap-2 rounded px-2 text-[#1f2937] hover:bg-[#eef6ff] disabled:cursor-not-allowed disabled:opacity-50"
            title={action.title ?? action.label}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        );
      })}
      <ExplorerViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
    </div>
  );
}

type LearningResourceExplorerTreePaneProps = {
  children: ReactNode;
  className?: string;
  navClassName?: string;
  onContextMenu?: MouseEventHandler<HTMLElement>;
  onClick?: MouseEventHandler<HTMLElement>;
};

export function LearningResourceExplorerTreePane({
  children,
  className,
  navClassName,
  onContextMenu,
  onClick,
}: LearningResourceExplorerTreePaneProps) {
  return (
    <aside
      className={cn(
        "min-h-0 overflow-y-auto border-r border-[#e5e7eb] bg-[#fbfbfb] px-1.5 py-2 [scrollbar-gutter:stable]",
        className,
      )}
      onContextMenu={onContextMenu}
      onClick={onClick}
    >
      <nav className={cn("space-y-0.5 pt-1", navClassName)}>{children}</nav>
    </aside>
  );
}

type LearningResourceExplorerTreeRowProps = {
  action?: ReactNode;
  actionDisabled?: boolean;
  actionLabel?: string;
  depth?: number;
  expanded?: boolean;
  hasChildren?: boolean;
  icon: ReactNode;
  indentBase?: number;
  indentStep?: number;
  label: string;
  onAction?: () => void;
  onContextMenu?: MouseEventHandler<HTMLDivElement>;
  onSelect: () => void;
  onToggle?: () => void;
  selected?: boolean;
  title?: string;
};

export function LearningResourceExplorerTreeRow({
  action,
  actionDisabled,
  actionLabel = "Thêm bên trong",
  depth = 0,
  expanded = false,
  hasChildren = false,
  icon,
  indentBase = 6,
  indentStep = 18,
  label,
  onAction,
  onContextMenu,
  onSelect,
  onToggle,
  selected = false,
  title,
}: LearningResourceExplorerTreeRowProps) {
  return (
    <div
      className={cn(
        "group relative flex h-8 w-full items-center justify-between gap-1 overflow-hidden rounded-md px-1.5 py-0 text-[13px] transition focus-within:ring-2 focus-within:ring-inset focus-within:ring-[#75B6F2]",
        selected
          ? "bg-[#DCEEFF] font-semibold text-[#073B72] shadow-[inset_3px_0_0_#0F6CBD] [&_svg]:text-[#0F6CBD]"
          : "text-[#111827] hover:bg-[#F1F4F7]",
      )}
      style={{ paddingLeft: `${indentBase + Math.min(depth, 8) * indentStep}px` }}
      onContextMenu={onContextMenu}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {hasChildren ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggle?.();
            }}
            className="grid h-6 w-5 shrink-0 place-items-center rounded text-[#6b7280] hover:bg-black/5"
            aria-label={expanded ? "Thu gọn" : "Mở rộng"}
          >
            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-150", expanded ? "rotate-90" : undefined)} />
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}
        <button
          type="button"
          onClick={onSelect}
          aria-selected={selected}
          className={cn("flex min-w-0 flex-1 items-center gap-1.5 text-left", action || onAction ? "pr-7" : undefined)}
          title={title ?? label}
        >
          <span className="shrink-0">{icon}</span>
          <span className={cn("min-w-0 flex-1 truncate", selected ? "font-semibold text-[#0b3f7a]" : "font-medium text-[#111827]")}>
            {label}
          </span>
        </button>
      </div>
      {action || onAction ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAction?.();
          }}
          disabled={actionDisabled}
          className="absolute right-2 top-1/2 grid h-6 w-6 shrink-0 -translate-y-1/2 place-items-center rounded bg-white/80 text-[#9ca3af] opacity-0 shadow-sm backdrop-blur-sm transition-opacity hover:bg-white hover:text-[var(--erg-blue)] group-hover:opacity-100 disabled:cursor-not-allowed disabled:text-[#cbd5e1]"
          aria-label={actionLabel}
        >
          {action ?? <Plus className="h-3.5 w-3.5" />}
        </button>
      ) : null}
    </div>
  );
}

type WindowsFolderIconProps = {
  open?: boolean;
  size?: "sm" | "lg";
};

type LearningResourceExplorerCardGridProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
};

export function LearningResourceExplorerCardGrid({
  children,
  className,
  contentClassName,
  onClick,
}: LearningResourceExplorerCardGridProps) {
  return (
    <div className={cn("h-full overflow-y-auto p-4 [scrollbar-gutter:stable]", className)} onClick={onClick}>
      <div className={cn("grid grid-cols-[repeat(auto-fill,210px)] gap-4", contentClassName)}>{children}</div>
    </div>
  );
}

export function WindowsFolderIcon({ open = false, size = "sm" }: WindowsFolderIconProps) {
  const dimensions = size === "lg" ? "h-[88px] w-[96px]" : "h-[22px] w-[24px]";
  const idSuffix = `${size}-${open ? "open" : "closed"}`;

  return (
    <svg className={`block shrink-0 ${dimensions}`} viewBox="0 0 96 88" aria-hidden="true">
      <defs>
        <linearGradient id={`folder-tab-${idSuffix}`} x1="0" x2="0" y1="12" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffd35c" />
          <stop offset="1" stopColor="#f5aa18" />
        </linearGradient>
        <linearGradient id={`folder-front-${idSuffix}`} x1="0" x2="0" y1="25" y2="82" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe892" />
          <stop offset="0.42" stopColor="#ffd664" />
          <stop offset="1" stopColor="#f3b72a" />
        </linearGradient>
        <linearGradient id={`folder-lip-${idSuffix}`} x1="0" x2="0" y1="27" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff4bd" />
          <stop offset="1" stopColor="#ffd66b" />
        </linearGradient>
        <filter id={`folder-shadow-${idSuffix}`} x="-8%" y="-8%" width="116%" height="120%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1.2" floodColor="#9a6a05" floodOpacity="0.22" />
        </filter>
      </defs>
      <g filter={`url(#folder-shadow-${idSuffix})`}>
        <path
          d="M7 15.5C7 13.6 8.6 12 10.5 12h25.8c3.3 0 5.1 1.9 7.2 5.2l3.6 5.7H86c2.2 0 4 1.8 4 4V42H7V15.5Z"
          fill={`url(#folder-tab-${idSuffix})`}
        />
        <path
          d={open ? "M4 29C4 26.8 5.8 25 8 25h80.8c2.1 0 3.8 1.8 3.7 4L90.8 77.4C90.7 79.9 88.6 82 86 82H10c-2.6 0-4.7-2-4.8-4.6L4 29Z" : "M4 29C4 26.8 5.8 25 8 25h80c2.2 0 4 1.8 4 4v49c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V29Z"}
          fill={`url(#folder-front-${idSuffix})`}
          stroke="#d49a11"
          strokeWidth="1"
        />
        <path d="M6 29.5C6 28.7 6.7 28 7.5 28h81c.8 0 1.5.7 1.5 1.5V42H6V29.5Z" fill={`url(#folder-lip-${idSuffix})`} opacity="0.92" />
        <path d="M7.5 81.5h81" stroke="#d89d10" strokeWidth="1" opacity="0.65" />
      </g>
    </svg>
  );
}

type ExplorerViewToggleProps = {
  viewMode: ExplorerViewMode;
  onViewModeChange: (mode: ExplorerViewMode) => void;
};

export function ExplorerViewToggle({ viewMode, onViewModeChange }: ExplorerViewToggleProps) {
  return (
    <div className="ml-auto flex h-8 items-center overflow-hidden rounded-md border border-[#d7e0ec] bg-white shadow-sm">
      <button
        type="button"
        title="Dạng lưới"
        aria-pressed={viewMode === "grid"}
        onClick={() => onViewModeChange("grid")}
        className={`grid h-8 w-9 place-items-center border-r border-[#d7e0ec] transition ${
          viewMode === "grid" ? "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]" : "text-slate-600 hover:bg-[#f7f8fa]"
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Dạng danh sách"
        aria-pressed={viewMode === "list"}
        onClick={() => onViewModeChange("list")}
        className={`grid h-8 w-9 place-items-center transition ${
          viewMode === "list" ? "bg-[var(--erg-blue-light)] text-[var(--erg-blue)]" : "text-slate-600 hover:bg-[#f7f8fa]"
        }`}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}

type LearningResourceFolderTileProps = {
  icon?: ReactNode;
  label: string;
  open?: boolean;
  selected?: boolean;
  title?: string;
  onClick: () => void;
  onContextMenu?: MouseEventHandler<HTMLButtonElement>;
  onDoubleClick?: () => void;
};

export function LearningResourceFolderTile({
  icon,
  label,
  open = false,
  selected = false,
  title,
  onClick,
  onContextMenu,
  onDoubleClick,
}: LearningResourceFolderTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      title={title}
      className={`group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-sm border px-4 text-center transition focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)] ${
        selected
          ? "border-[#0F6CBD] bg-[#EAF4FF] shadow-[0_0_0_3px_#DCEEFF] ring-1 ring-inset ring-[#75B6F2]"
          : "border-transparent bg-transparent hover:bg-[#F1F4F7]"
      }`}
      aria-selected={selected}
    >
      {selected ? <span className="absolute left-0 top-0 h-full w-1 bg-[#0F6CBD]" aria-hidden="true" /> : null}
      <span className="absolute inset-x-0 top-[45%] flex -translate-y-1/2 items-center justify-center">
        <span>
          {icon ?? <WindowsFolderIcon size="lg" open={open} />}
        </span>
      </span>
      <span className="absolute inset-x-4 bottom-5 line-clamp-2 text-[13px] font-medium leading-5 text-[#111827]">
        {label}
      </span>
    </button>
  );
}

type LearningResourceSquareCardProps = {
  actionLabel: string;
  heading: string;
  minutes: number;
  questions: number;
  statusLabel?: string;
  tag: string;
  title: string;
  unit: string;
  onOpen: () => void;
};

export function LearningResourceSquareCard({
  actionLabel,
  heading,
  minutes,
  questions,
  statusLabel = "Chưa sử dụng",
  tag,
  title,
  unit,
  onOpen,
}: LearningResourceSquareCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex aspect-[4/5] w-full overflow-hidden rounded-lg border border-[#d7e0ec] bg-white text-left shadow-sm transition hover:border-[#b8d6fa] hover:bg-[#f7fbff] focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
    >
      <span className="flex h-full w-full flex-col">
        <span className="relative h-[50%] shrink-0 overflow-hidden border-b border-[#e0e4ea] bg-[#f7f8fa]">
          <span className="absolute left-4 top-4 flex h-11 w-8 items-center justify-center rounded-md border border-[#b8d6fa] bg-[#ebf3fc] text-[var(--erg-blue)] shadow-sm">
            <span className="h-6 w-4 rounded-sm border border-[#b8d6fa] bg-white" />
          </span>
          <span className="absolute right-0 top-2 rounded-l-md bg-[var(--erg-blue)] px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
            {tag}
          </span>
          <span className="absolute left-6 right-6 top-[58px] text-center text-base font-semibold leading-6 text-slate-900">
            {heading}
            <br />
            {unit}
          </span>
          <span className="absolute inset-x-0 bottom-0 flex h-7 items-center justify-center gap-3 border-t border-[#e0e4ea] bg-white text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3.5 w-3.5 fill-white" />
              {minutes} Phút
            </span>
            <span className="h-4 w-px bg-white/50" />
            <span>{questions} Câu</span>
          </span>
        </span>
        <span className="flex min-h-0 flex-1 flex-col justify-between px-4 py-3">
          <span className="flex flex-col min-h-0 flex-1 justify-start">
            <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-md bg-[#fff2d6] px-2.5 py-1 text-[11px] font-medium text-[#f59e0b]">
              <span className="h-2.5 w-2.5 rounded-md border-[3px] border-[#fbbf24]" />
              {statusLabel}
            </span>
            <span className="line-clamp-2 text-[13px] font-medium leading-5 text-[#242424]">
              {title}
            </span>
          </span>
          <span className="inline-flex h-8 w-fit items-center gap-2 rounded-md bg-[var(--erg-blue)] px-3 text-[13px] font-semibold text-white shadow-sm transition group-hover:bg-[var(--erg-blue-hover)]">
            <Play className="h-4 w-4 fill-white" />
            {actionLabel}
          </span>
        </span>
      </span>
    </button>
  );
}
