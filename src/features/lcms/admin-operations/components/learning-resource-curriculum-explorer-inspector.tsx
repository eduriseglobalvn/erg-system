import LinkIcon from "@mui/icons-material/Link";
import type { CurriculumContentItem, CurriculumFolder } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import { folderRoleLabel, resourcePalette, roleIcon, roleTone, statusLabel } from "./learning-resource-curriculum-explorer-model";

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

export function InspectorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-white px-3 py-2 text-[13px]" style={{ borderColor: resourcePalette.border }}>
      <span className="shrink-0 font-semibold text-[#637381]">{label}</span>
      <span className="min-w-0 text-right font-bold text-[#1C252E]">{value || "-"}</span>
    </div>
  );
}

