import type { MouseEvent } from "react";
import type { CurriculumContentItem, CurriculumContentKind, CurriculumTarget } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import { ContentCard } from "./learning-resource-curriculum-explorer-grid";
import { resourcePalette, roleIcon, roleTone, targetsEqual } from "./learning-resource-curriculum-explorer-model";

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
