import type { MouseEvent } from "react";
import FileText from "@mui/icons-material/Article";
import { cn } from "@/lib/utils";
import type { CurriculumContentItem, CurriculumTarget } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import { SmallBadge, StatusBadge } from "./learning-resource-curriculum-explorer-badges";
import { resourcePalette, roleIcon, roleTone, targetsEqual } from "./learning-resource-curriculum-explorer-model";

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

export function ContentCard({
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

