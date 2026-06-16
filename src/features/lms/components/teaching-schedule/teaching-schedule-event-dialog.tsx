import Notifications from "@mui/icons-material/Notifications";
import {
  AlignLeft,
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
import { AppSelect } from "@/components/ui/app-select";

const statusOptions: Array<{ label: string; value: TeachingScheduleStatus }> = [
  { label: "Đã phân bổ", value: "confirmed" },
  { label: "Lịch nháp", value: "draft" },
  { label: "Cần học liệu", value: "needs-material" },
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
      <div className="w-full max-w-[760px] overflow-hidden rounded-lg border border-[#cbd7e6] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.08)]">
        <div className="flex h-10 items-center justify-between border-b border-[#cbd7e6] bg-[#f8fbff] px-3">
          <span className="h-1.5 w-8 rounded-full bg-[#b8c8db]" />
          <div className="flex items-center text-[var(--muted-foreground)]">
            {mode === "edit" && onDelete ? (
              <button type="button" onClick={onDelete} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#e8eaed]" aria-label="Xóa">
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#e8eaed]" aria-label="Đóng">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-y-4 px-6 pb-5 pt-5 md:grid-cols-[40px_1fr] md:px-8">
          <div className="hidden md:block" />
          <input
            value={draft.title}
            onChange={(event) => updateDraft("title", event.target.value)}
            className="border-0 border-b border-[#cbd7e6] px-0 pb-2 text-[22px] font-semibold text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]"
            placeholder="Thêm tiêu đề"
            autoFocus
          />

          <div className="hidden md:block" />
          <div className="flex flex-wrap gap-2">
            <Pill active>Sự kiện</Pill>
            <Pill>Việc cần làm</Pill>
            <Pill>Lên lịch hẹn</Pill>
          </div>

          <Clock3 className="mt-2 hidden h-5 w-5 text-[var(--muted-foreground)] md:block" />
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
            <label className="grid gap-1">
              <span className="text-[13px] font-semibold text-[#4f5866]">Bắt đầu</span>
              <input
                type="datetime-local"
                value={draft.start}
                onChange={(event) => updateDraft("start", event.target.value)}
                className="h-10 rounded-lg border border-[#d7e0ec] bg-white px-3 text-sm font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[13px] font-semibold text-[#4f5866]">Kết thúc</span>
              <input
                type="datetime-local"
                value={draft.end}
                onChange={(event) => updateDraft("end", event.target.value)}
                className="h-10 rounded-lg border border-[#d7e0ec] bg-white px-3 text-sm font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <Chip>Không lặp lại</Chip>
              <Chip>Thêm thời gian</Chip>
              <Chip>Không có giờ bận</Chip>
            </div>
          </div>

          <Users className="mt-2 hidden h-5 w-5 text-[var(--muted-foreground)] md:block" />
          <Field value={draft.className} onChange={(value) => updateDraft("className", value)} placeholder="Thêm lớp hoặc nhóm học sinh" />

          <Video className="mt-2 hidden h-5 w-5 text-[var(--muted-foreground)] md:block" />
          <Field value={draft.lesson} onChange={(value) => updateDraft("lesson", value)} placeholder="Phân tiết / tiết dạy" />

          <MapPin className="mt-2 hidden h-5 w-5 text-[var(--muted-foreground)] md:block" />
          <div className="grid gap-2 lg:grid-cols-2">
            <Field value={draft.school} onChange={(value) => updateDraft("school", value)} placeholder="Dạy ở trường nào" />
            <Field value={draft.room} onChange={(value) => updateDraft("room", value)} placeholder="Phòng học" />
          </div>

          <Notifications className="mt-2 hidden h-5 w-5 text-[var(--muted-foreground)] md:block" />
          <div className="flex flex-wrap items-center gap-2">
            <Chip>30 phút trước</Chip>
            <Chip>Email</Chip>
            <button type="button" className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-soft)]">
              Thêm thông báo
            </button>
          </div>

          <CalendarDays className="mt-2 hidden h-5 w-5 text-[var(--muted-foreground)] md:block" />
          <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
            <Chip>Lịch dạy của tôi</Chip>
            <AppSelect
              value={draft.status}
              onChange={(event) => updateDraft("status", event.target.value)}
              className="h-10 rounded-lg border border-[#d7e0ec] bg-white px-3 text-sm font-bold text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--ring)]"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </AppSelect>
          </div>

          <AlignLeft className="mt-2 hidden h-5 w-5 text-[var(--muted-foreground)] md:block" />
          <textarea
            value={draft.note}
            onChange={(event) => updateDraft("note", event.target.value)}
            className="min-h-24 rounded-lg border border-[#d7e0ec] bg-white px-3 py-3 text-sm font-semibold leading-6 text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--ring)]"
            placeholder="Thêm mô tả, tài nguyên cần chuẩn bị, ghi chú phân bổ giáo viên..."
          />
        </div>

        <div className="flex items-center justify-between border-t border-[#cbd7e6] bg-[#f8fbff] px-6 py-3 md:px-8">
          <button type="button" className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--accent-soft)]">
            Tùy chọn khác
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-bold text-white hover:bg-[var(--erg-blue-hover)]"
          >
            <Check className="h-4 w-4" />
            Lưu
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
      className={active ? "rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--primary)]" : "rounded-full px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[#f8fbff]"}
    >
      {children}
    </button>
  );
}

function Chip({ children }: { children: string }) {
  return <span className="inline-flex h-10 items-center rounded-lg border border-[#cbd7e6] bg-[#f8fbff] px-3 text-[14px] font-bold text-slate-800 shadow-[var(--shadow-xs)]">{children}</span>;
}

function Field({ onChange, placeholder, value }: { onChange: (value: string) => void; placeholder: string; value: string }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-lg border border-[#d7e0ec] bg-white px-3 text-sm font-semibold text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--ring)]"
      placeholder={placeholder}
    />
  );
}
