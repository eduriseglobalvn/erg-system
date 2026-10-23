import type { MouseEvent, ReactNode } from "react";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Plus from "@mui/icons-material/Add";
import { cn } from "@/lib/utils";
import type { CurriculumContentKind, CurriculumFolderRole } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import { resourcePalette, roleIcon, roleTone } from "./learning-resource-curriculum-explorer-model";

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

