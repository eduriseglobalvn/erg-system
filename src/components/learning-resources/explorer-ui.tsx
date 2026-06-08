import { LayoutGrid, List, Play, Timer } from "lucide-react";
import type { MouseEventHandler } from "react";

export type ExplorerViewMode = "grid" | "list";

type WindowsFolderIconProps = {
  open?: boolean;
  size?: "sm" | "lg";
};

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
  label: string;
  open?: boolean;
  selected?: boolean;
  title?: string;
  onClick: () => void;
  onContextMenu?: MouseEventHandler<HTMLButtonElement>;
  onDoubleClick?: () => void;
};

export function LearningResourceFolderTile({
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
      className={`group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-lg border px-4 text-center transition focus:outline-none focus:ring-2 focus:ring-[var(--erg-blue-ring)] ${
        selected
          ? "border-[#b8d6fa] bg-[var(--erg-blue-light)] shadow-sm ring-1 ring-inset ring-[#b8d6fa]"
          : "border-[#d7e0ec] bg-white hover:border-[#b8d6fa] hover:bg-[#f7fbff]"
      }`}
    >
      <span className="absolute inset-x-0 top-[45%] flex -translate-y-1/2 items-center justify-center">
        <span>
          <WindowsFolderIcon size="lg" open={open} />
        </span>
      </span>
      <span className="absolute inset-x-4 bottom-5 line-clamp-2 text-[13px] font-medium leading-5 text-slate-900">
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
