import { cn } from "@/lib/utils";
import type { ContentSummary } from "@/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model";
import { resourcePalette, statusLabel, toneColors } from "./learning-resource-curriculum-explorer-model";

export function StatusBadge({ status }: { status?: string }) {
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

export function CompactSummary({ summary }: { summary: ContentSummary }) {
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

export function SummaryChip({ label, tone, value }: { label: string; tone: "blue" | "red" | "neutral"; value: number }) {
  const colors = toneColors(tone);
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-bold" style={{ background: colors.background, borderColor: colors.border, color: colors.foreground }}>
      <span>{value}</span>
      <span>{label}</span>
    </span>
  );
}

export function MiniCount({ label, tone, value }: { label: string; tone: "blue" | "red"; value: number }) {
  const colors = toneColors(tone);
  return (
    <span className="rounded-lg border px-2 py-1.5" style={{ background: colors.background, borderColor: colors.border }}>
      <span className="block text-sm font-bold" style={{ color: colors.foreground }}>{value}</span>
      <span className="block truncate text-[10px] font-bold text-[#637381]">{label}</span>
    </span>
  );
}

export function SmallBadge({ label, tone }: { label: string; tone: "blue" | "red" | "neutral" }) {
  const colors = toneColors(tone);
  return (
    <span className="rounded-md border px-1.5 py-0.5 text-[11px] font-bold" style={{ background: colors.background, borderColor: colors.border, color: colors.foreground }}>
      {label}
    </span>
  );
}

