import {
  AlignLeft,
  Bell,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";

import type { TeachingScheduleDraft, TeachingScheduleStatus } from "./teaching-schedule-types";

const statusOptions: Array<{ label: string; value: TeachingScheduleStatus }> = [
  { label: "ÄÃ£ phÃ¢n bá»•", value: "confirmed" },
  { label: "Lá»‹ch nhÃ¡p", value: "draft" },
  { label: "Cáº§n há»c liá»‡u", value: "needs-material" },
];

type TeachingScheduleEventDialogProps = {
  draft: TeachingScheduleDraft;
  mode: "create" | "edit";
  onChange: (draft: TeachingScheduleDraft) => void;
  onClose: () => void;
  onDelete?: () => void;
  onSave: () => void;
};

export function TeachingScheduleEventDialog({
  draft,
  mode,
  onChange,
  onClose,
  onDelete,
  onSave,
}: TeachingScheduleEventDialogProps) {
  function updateDraft(field: keyof TeachingScheduleDraft, value: string) {
    onChange({ ...draft, [field]: value });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-3 pt-16">
      <div className="w-full max-w-[760px] overflow-hidden rounded-lg bg-white shadow-[0_12px_32px_rgba(60,64,67,.35)]">
        <div className="flex h-10 items-center justify-between bg-[#f1f3f4] px-3">
          <span className="h-1.5 w-8 rounded-full bg-[#dadce0]" />
          <div className="flex items-center text-[#5f6368]">
            {mode === "edit" && onDelete ? (
              <button type="button" onClick={onDelete} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#e8eaed]" aria-label="XÃ³a">
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#e8eaed]" aria-label="ÄÃ³ng">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-y-4 px-6 pb-5 pt-5 md:grid-cols-[40px_1fr] md:px-8">
          <div className="hidden md:block" />
          <input
            value={draft.title}
            onChange={(event) => updateDraft("title", event.target.value)}
            className="border-0 border-b border-[#dadce0] px-0 pb-2 text-[22px] font-normal text-[#3c4043] outline-none placeholder:text-[#5f6368] focus:border-[#1a73e8]"
            placeholder="ThÃªm tiÃªu Ä‘á»"
            autoFocus
          />

          <div className="hidden md:block" />
          <div className="flex flex-wrap gap-2">
            <Pill active>Sá»± kiá»‡n</Pill>
            <Pill>Viá»‡c cáº§n lÃ m</Pill>
            <Pill>LÃªn lá»‹ch háº¹n</Pill>
          </div>

          <Clock3 className="mt-2 hidden h-5 w-5 text-[#5f6368] md:block" />
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
            <label className="grid gap-1">
              <span className="text-xs font-medium text-[#5f6368]">Báº¯t Ä‘áº§u</span>
              <input
                type="datetime-local"
                value={draft.start}
                onChange={(event) => updateDraft("start", event.target.value)}
                className="h-10 rounded border border-transparent bg-[#f1f3f4] px-3 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:bg-white"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-medium text-[#5f6368]">Káº¿t thÃºc</span>
              <input
                type="datetime-local"
                value={draft.end}
                onChange={(event) => updateDraft("end", event.target.value)}
                className="h-10 rounded border border-transparent bg-[#f1f3f4] px-3 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:bg-white"
              />
            </label>
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <Chip>KhÃ´ng láº·p láº¡i</Chip>
              <Chip>ThÃªm thá»i gian</Chip>
              <Chip>KhÃ´ng cÃ³ giá» báº­n</Chip>
            </div>
          </div>

          <Users className="mt-2 hidden h-5 w-5 text-[#5f6368] md:block" />
          <Field value={draft.className} onChange={(value) => updateDraft("className", value)} placeholder="ThÃªm lá»›p hoáº·c nhÃ³m há»c sinh" />

          <Video className="mt-2 hidden h-5 w-5 text-[#5f6368] md:block" />
          <Field value={draft.lesson} onChange={(value) => updateDraft("lesson", value)} placeholder="PhÃ¢n tiáº¿t / tiáº¿t dáº¡y" />

          <MapPin className="mt-2 hidden h-5 w-5 text-[#5f6368] md:block" />
          <div className="grid gap-2 lg:grid-cols-2">
            <Field value={draft.school} onChange={(value) => updateDraft("school", value)} placeholder="Dáº¡y á»Ÿ trÆ°á»ng nÃ o" />
            <Field value={draft.room} onChange={(value) => updateDraft("room", value)} placeholder="PhÃ²ng há»c" />
          </div>

          <Bell className="mt-2 hidden h-5 w-5 text-[#5f6368] md:block" />
          <div className="flex flex-wrap items-center gap-2">
            <Chip>30 phÃºt trÆ°á»›c</Chip>
            <Chip>Email</Chip>
            <button type="button" className="rounded px-3 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#e8f0fe]">
              ThÃªm thÃ´ng bÃ¡o
            </button>
          </div>

          <CalendarDays className="mt-2 hidden h-5 w-5 text-[#5f6368] md:block" />
          <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
            <Chip>Lá»‹ch dáº¡y cá»§a tÃ´i</Chip>
            <select
              value={draft.status}
              onChange={(event) => updateDraft("status", event.target.value)}
              className="h-10 rounded border border-transparent bg-[#f1f3f4] px-3 text-sm text-[#3c4043] outline-none focus:border-[#1a73e8] focus:bg-white"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <AlignLeft className="mt-2 hidden h-5 w-5 text-[#5f6368] md:block" />
          <textarea
            value={draft.note}
            onChange={(event) => updateDraft("note", event.target.value)}
            className="min-h-24 rounded border border-transparent bg-[#f1f3f4] px-3 py-3 text-sm leading-6 text-[#3c4043] outline-none placeholder:text-[#5f6368] focus:border-[#1a73e8] focus:bg-white"
            placeholder="ThÃªm mÃ´ táº£, tÃ i nguyÃªn cáº§n chuáº©n bá»‹, ghi chÃº phÃ¢n bá»• giÃ¡o viÃªn..."
          />
        </div>

        <div className="flex items-center justify-between border-t border-[#e8eaed] px-6 py-3 md:px-8">
          <button type="button" className="rounded px-3 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#e8f0fe]">
            TÃ¹y chá»n khÃ¡c
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-9 items-center gap-2 rounded bg-[#1a73e8] px-5 text-sm font-medium text-white hover:bg-[#1765cc]"
          >
            <Check className="h-4 w-4" />
            LÆ°u
          </button>
        </div>
      </div>
    </div>
  );
}

function Pill({ active, children }: { active?: boolean; children: string }) {
  return (
    <button
      type="button"
      className={active ? "rounded-full bg-[#e8f0fe] px-4 py-2 text-sm font-medium text-[#1967d2]" : "rounded-full px-4 py-2 text-sm font-medium text-[#3c4043] hover:bg-[#f1f3f4]"}
    >
      {children}
    </button>
  );
}

function Chip({ children }: { children: string }) {
  return <span className="inline-flex h-10 items-center rounded bg-[#f1f3f4] px-3 text-sm text-[#3c4043]">{children}</span>;
}

function Field({ onChange, placeholder, value }: { onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded border border-transparent bg-[#f1f3f4] px-3 text-sm text-[#3c4043] outline-none placeholder:text-[#5f6368] focus:border-[#1a73e8] focus:bg-white"
      placeholder={placeholder}
    />
  );
}
