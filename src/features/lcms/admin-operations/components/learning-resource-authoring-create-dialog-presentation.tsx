import type { ReactNode } from "react";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import { ErgButton } from "@/components/erg-mui/erg-actions";
import { AppSelect } from "@/components/erg-mui/app-select";
import { ErgTextField } from "@/components/erg-mui";
import type { StudioNode, StudioSubject } from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import type { TaxonomyRole } from "@/features/lcms/admin-operations/components/learning-resource-authoring-icons";
import type { ContentDialogOptionId, ExerciseLibraryItem } from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";
import { cn } from "@/lib/utils";
import { RESOURCE_BLUE, RESOURCE_BLUE_BORDER, RESOURCE_BLUE_SOFT, RESOURCE_BORDER, RESOURCE_RED, RESOURCE_RED_BORDER, RESOURCE_RED_SOFT, type ResolvedTaxonomyMode } from "./learning-resource-authoring-create-dialog-config";
import { getOptionMeta, getTaxonomyMeta } from "./learning-resource-authoring-create-dialog-model";

export type AuthoringItemType = "level" | "topic" | "lesson";

export function TypeSelectorStrip({
  selectedType,
  onSelectType,
  disabled,
}: {
  selectedType: AuthoringItemType;
  onSelectType: (type: AuthoringItemType) => void;
  disabled?: boolean;
}) {
  const items: Array<{ id: AuthoringItemType; title: string }> = [
    { id: "level", title: "Chặng học (Level)" },
    { id: "topic", title: "Chủ đề" },
    { id: "lesson", title: "Bài học" },
  ];

  return (
    <div className="flex rounded-lg border border-[#D9E2EF] bg-[#F4F6F8] p-1">
      {items.map((item) => {
        const active = selectedType === item.id;
        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectType(item.id)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-center text-xs font-bold transition",
              active
                ? "bg-white text-[#0071E3] shadow-sm"
                : "text-[#637381] hover:text-[#1C252E]",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {item.title}
          </button>
        );
      })}
    </div>
  );
}

export function LessonSubtypePicker({
  selected,
  onSelect,
}: {
  selected: ContentDialogOptionId;
  onSelect: (option: ContentDialogOptionId) => void;
}) {
  const options: Array<{ id: ContentDialogOptionId; label: string }> = [
    { id: "lecture", label: "Bài giảng" },
    { id: "exercise", label: "Bài tập" },
    { id: "resource", label: "Tài liệu" },
  ];

  return (
    <div className="flex rounded-lg border border-[#D9E2EF] bg-[#F4F6F8] p-1">
      {options.map((opt) => {
        const active = selected === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-center text-xs font-bold transition",
              active
                ? "bg-white text-[#0071E3] shadow-sm"
                : "text-[#637381] hover:text-[#1C252E]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function getContextBreadcrumbText({
  contextLabel,
  draftLevelId,
  draftLevelOptions,
  draftSubject,
  draftTopicId,
  draftTopicOptions,
  itemType,
  mode,
  selectedNode,
}: {
  contextLabel?: string;
  draftLevelId?: string;
  draftLevelOptions?: StudioNode[];
  draftSubject?: StudioSubject;
  draftTopicId?: string;
  draftTopicOptions?: StudioNode[];
  itemType?: AuthoringItemType;
  mode?: ResolvedTaxonomyMode;
  selectedNode?: StudioNode;
}) {
  if (mode === "subject") return "";

  const level = draftLevelOptions?.find(
    (item) => item.optionId === draftLevelId || item.id === draftLevelId || (selectedNode?.location.categoryId && (item.optionId === selectedNode.location.categoryId || item.id === selectedNode.location.categoryId)),
  );
  const topic = draftTopicOptions?.find(
    (item) => item.optionId === draftTopicId || item.id === draftTopicId,
  );
  const subjectName = draftSubject?.label ?? "Môn học";

  const parts: string[] = [subjectName];
  if (itemType === "level" || mode === "level") {
    // Level is direct child of subject
  } else if (itemType === "topic" || mode === "topic") {
    if (level) parts.push(level.label);
  } else {
    // lesson
    if (level) parts.push(level.label);
    if (topic) {
      parts.push(topic.label);
    } else if (selectedNode?.label && selectedNode?.sourceKind !== "category") {
      parts.push(selectedNode.label);
    } else if (contextLabel) {
      parts.push(contextLabel);
    }
  }

  return parts.join(" › ");
}

export function ContextBox(props: {
  contextLabel?: string;
  draftLevelId?: string;
  draftLevelOptions?: StudioNode[];
  draftSubject?: StudioSubject;
  draftTopicId?: string;
  draftTopicOptions?: StudioNode[];
  itemType?: AuthoringItemType;
  mode?: ResolvedTaxonomyMode;
  option?: ContentDialogOptionId | null;
  selectedNode?: StudioNode;
}) {
  const text = getContextBreadcrumbText(props);
  if (!text) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-[#637381]">
      <span className="font-semibold text-[#52606D]">Vị trí:</span>
      <span className="font-bold text-[#0071E3]">{text}</span>
    </div>
  );
}

export function HierarchyStrip({ active: _active }: { active: ContentDialogOptionId | TaxonomyRole }) {
  return null;
}

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
      <AppSelect style={{ width: "100%" }} value={value} onChange={(event) => onChange(event.target.value)}>
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
      <ErgTextField compact value={value} slotProps={{ input: { readOnly: true } }} sx={{ "& .MuiOutlinedInput-root": { bgcolor: "grey.50", color: "text.secondary" } }} />
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
