import type { ReactNode } from "react";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { AppSelect } from "@/components/ui/app-select";
import { inputClassName } from "@/components/ui/input";
import type { StudioNode, StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { TaxonomyRole } from "@/features/lcms/admin-operations/components/learning-resource-authoring-icons";
import type { ContentDialogOptionId, ExerciseLibraryItem } from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";
import { cn } from "@/lib/utils";
import { RESOURCE_BLUE, RESOURCE_BLUE_BORDER, RESOURCE_BLUE_SOFT, RESOURCE_BORDER, RESOURCE_RED, RESOURCE_RED_BORDER, RESOURCE_RED_SOFT, type ResolvedTaxonomyMode } from "./learning-resource-authoring-create-dialog-config";
import { getOptionMeta, getTaxonomyMeta } from "./learning-resource-authoring-create-dialog-model";

export function ContentTypePicker({ options, onPick }: { options: ContentDialogOptionId[]; onPick: (option: ContentDialogOptionId) => void }) {
  return (
    <div className="mt-5 grid gap-3 md:grid-cols-3">
      {options.map((option) => {
        const meta = getOptionMeta(option);
        return (
          <button
            key={option}
            type="button"
            className="rounded-lg border bg-white p-4 text-left transition hover:border-[#B8D6FA] hover:bg-[#F8FBFF]"
            style={{ borderColor: RESOURCE_BORDER }}
            onClick={() => onPick(option)}
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: meta.tone === "red" ? RESOURCE_RED_SOFT : RESOURCE_BLUE_SOFT, color: meta.tone === "red" ? RESOURCE_RED : RESOURCE_BLUE }}>
              {meta.icon}
            </span>
            <span className="mt-3 block text-sm font-bold text-[#1C252E]">{meta.title}</span>
            <span className="mt-1 block text-xs leading-5 text-[#637381]">{meta.description}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SelectedOptionHeader({ canGoBack, option, onBack }: { canGoBack: boolean; option: ContentDialogOptionId; onBack: () => void }) {
  const meta = getOptionMeta(option);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-[#FBFCFE] px-4 py-3" style={{ borderColor: RESOURCE_BORDER }}>
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white"
          style={{ color: option === "lecture" ? "#E8710A" : meta.tone === "red" ? RESOURCE_RED : RESOURCE_BLUE }}
        >
          {meta.icon}
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-[#1C252E]">{meta.title}</div>
          {option !== "lecture" ? <div className="truncate text-xs text-[#637381]">{meta.description}</div> : null}
        </div>
      </div>
      {canGoBack ? (
        <ErgButton type="button" variant="outlined" size="small" startIcon={<ChevronLeft className="h-4 w-4" />} onClick={onBack}>
          Chọn lại
        </ErgButton>
      ) : null}
    </div>
  );
}

export function ContextBox({
  contextLabel,
  draftLevelId,
  draftLevelOptions,
  draftSubject,
  mode,
  option,
  selectedNode,
}: {
  contextLabel: string;
  draftLevelId: string;
  draftLevelOptions: StudioNode[];
  draftSubject?: StudioSubject;
  mode: ResolvedTaxonomyMode;
  option: ContentDialogOptionId | null;
  selectedNode?: StudioNode;
}) {
  const level = draftLevelOptions.find((item) => item.optionId === draftLevelId);
  const targetText =
    mode === "subject"
      ? "Tạo môn học ở cấp gốc"
      : mode === "level"
        ? `Level sẽ nằm dưới ${draftSubject?.label ?? "môn học đã chọn"}`
        : mode === "topic"
          ? `Chủ đề sẽ nằm dưới ${draftSubject?.label ?? "môn học"} / ${level?.label ?? "level đã chọn"}`
          : `Nội dung sẽ nằm trong ${contextLabel || selectedNode?.label || "chủ đề đang chọn"}`;

  return (
    <div className="mt-4 rounded-lg border px-4 py-3" style={{ borderColor: option === "exercise" ? RESOURCE_RED_BORDER : RESOURCE_BLUE_BORDER, background: option === "exercise" ? RESOURCE_RED_SOFT : RESOURCE_BLUE_SOFT }}>
      <div className="text-[11px] font-bold uppercase text-[#637381]">Vị trí tạo</div>
      <div className="mt-1 text-sm font-bold text-[#1C252E]">{targetText}</div>
    </div>
  );
}

export function HierarchyStrip({ active }: { active: ContentDialogOptionId | TaxonomyRole }) {
  const items: Array<{ id: ContentDialogOptionId | TaxonomyRole; label: string }> = [
    { id: "subject", label: "Môn học" },
    { id: "level", label: "Level" },
    { id: "topic", label: "Chủ đề" },
    { id: "lecture", label: "Nội dung" },
  ];
  const normalizedActive = active === "resource" || active === "exercise" ? "lecture" : active;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item, index) => {
        const selected = normalizedActive === item.id;
        return (
          <span key={item.id} className="inline-flex items-center gap-2">
            <span
              className={cn("inline-flex h-7 items-center rounded-lg border px-2.5 text-xs font-bold", selected ? "bg-[#0F6CBD] text-white" : "bg-white text-[#637381]")}
              style={{ borderColor: selected ? RESOURCE_BLUE : RESOURCE_BORDER }}
            >
              {item.label}
            </span>
            {index < items.length - 1 ? <span className="text-[#C4CDD5]">/</span> : null}
          </span>
        );
      })}
    </div>
  );
}

export function ExerciseOptionCard({ item, selected, onToggle }: { item: ExerciseLibraryItem; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={cn("rounded-lg border p-3 text-left transition", selected ? "bg-[#FFF1F3]" : "bg-white hover:bg-[#FBFCFE]")}
      style={{ borderColor: selected ? RESOURCE_RED_BORDER : RESOURCE_BORDER }}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-[#1C252E]">{item.title}</div>
          <div className="mt-1 truncate text-xs text-[#637381]">{[item.topicLabel, item.sectionLabel].filter(Boolean).join(" / ") || item.subjectLabel}</div>
        </div>
        <input type="checkbox" readOnly checked={selected} className="mt-1 h-4 w-4 shrink-0 accent-[#F35C6B]" />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#637381]">
        <span className="rounded-md bg-[#F4F6F8] px-2 py-1">{item.quizKind === "test" ? "Test" : "Train"}</span>
        <span>{item.questionCount} câu</span>
        <span>{item.durationMinutes} phút</span>
        {item.scopeLabel ? <span>{item.scopeLabel}</span> : null}
      </div>
    </button>
  );
}

export function StatusField({ taxonomy, value, onChange }: { taxonomy?: boolean; value: string; onChange: (value: string) => void }) {
  return (
    <Field label="Trạng thái">
      <AppSelect variant="native" className={inputClassName} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value={taxonomy ? "active" : "published"}>Đã xuất bản</option>
        <option value="draft">Bản nháp</option>
        <option value="hidden">Đã ẩn</option>
      </AppSelect>
    </Field>
  );
}

export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <Field label={label}>
      <div className={cn(inputClassName, "flex items-center truncate bg-[#F8FAFC] text-[#637381]")}>{value}</div>
    </Field>
  );
}

export function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-bold text-[#637381]">{label}</span>
      {children}
    </label>
  );
}

export function ModeIcon({ option, taxonomyMode }: { option: ContentDialogOptionId | null; taxonomyMode: ResolvedTaxonomyMode }) {
  const meta = taxonomyMode ? getTaxonomyMeta(taxonomyMode) : option ? getOptionMeta(option) : getTaxonomyMeta("subject");
  const isLecture = option === "lecture";
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border" style={{ background: isLecture ? "#FFF4E5" : meta.tone === "red" ? RESOURCE_RED_SOFT : RESOURCE_BLUE_SOFT, borderColor: isLecture ? "#FFD29B" : meta.tone === "red" ? RESOURCE_RED_BORDER : RESOURCE_BLUE_BORDER, color: isLecture ? "#E8710A" : meta.tone === "red" ? RESOURCE_RED : RESOURCE_BLUE }}>
      {meta.icon}
    </span>
  );
}
