import { Calendar } from "lucide-react";
import { DateTimePickerPopover } from "@/features/lms/components/assign-date-time-picker";
import { AppSelect } from "@/components/ui/app-select";
import type { AssignHomeworkController } from "@/features/lms/components/use-assign-homework-controller";

export function AssignHomeworkSetupCard({ model }: { model: AssignHomeworkController }) {
  const {
    title,
    setTitle,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    openDatePicker,
    setOpenDatePicker,
    targetType,
    setTargetType,
    attemptLimit,
    setAttemptLimit,
    maxDurationMinutes,
    setMaxDurationMinutes,
    selectedStudentIds,
  } = model;
  return (
        <section className="shrink-0 rounded-lg border border-[#cbd7e6] bg-white px-4 py-3 shadow-[var(--shadow-xs)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-900">Thiết lập giao bài</h2>
            <span className="hidden rounded-md bg-[#f8fbff] px-2.5 py-1 text-[12px] font-bold text-slate-500 xl:inline-flex">
              {selectedStudentIds.size} học sinh đã chọn
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[210px_minmax(260px,1fr)_130px_160px_210px_210px]">
            <label className="grid gap-1.5">
              <span className="text-[13px] font-semibold text-slate-600">Đối tượng giao bài</span>
              <div className="relative">
                <AppSelect
                  value={targetType}
                  onChange={(event) => setTargetType(event.target.value as "grade" | "class" | "group")}
                  className="h-10 w-full rounded-lg border border-[#cbd7e6] bg-white px-3 pr-10 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                >
                  <option value="grade">Giao theo khối</option>
                  <option value="class">Giao theo lớp</option>
                  <option value="group">Giao theo nhóm học tập</option>
                </AppSelect>
              </div>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[13px] font-semibold text-slate-600">Tên bài tập <span className="text-rose-400">*</span></span>
              <input
                type="text"
                placeholder="Nhập tên bài tập..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#cbd7e6] bg-white px-3 text-[14px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-[13px] font-semibold text-slate-600">Số lần làm</span>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={attemptLimit}
                  onChange={(event) => setAttemptLimit(Math.max(1, Number(event.target.value) || 1))}
                  className="h-10 w-full rounded-lg border border-[#d7e0ec] bg-white pl-3 pr-11 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-600">lần</span>
              </div>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[13px] font-semibold text-slate-600">Thời gian tối đa</span>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={maxDurationMinutes}
                  onChange={(event) => setMaxDurationMinutes(Math.max(1, Number(event.target.value) || 1))}
                  className="h-10 w-full rounded-lg border border-[#d7e0ec] bg-white pl-3 pr-12 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-600">phút</span>
              </div>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[13px] font-semibold text-slate-600">Ngày bắt đầu</span>
              <div className="relative">
                <input
                  type="text"
                  value={startDate}
                  readOnly
                  onClick={() => setOpenDatePicker("start")}
                  className="h-10 w-full rounded-lg border border-[#d7e0ec] bg-white pl-3 pr-10 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                />
                <button
                  type="button"
                  onClick={() => setOpenDatePicker(openDatePicker === "start" ? null : "start")}
                  className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-300 transition hover:bg-[var(--erg-blue-light)] hover:text-[var(--erg-blue)]"
                  aria-label="Chọn ngày bắt đầu"
                >
                  <Calendar className="h-4 w-4" />
                </button>
                <DateTimePickerPopover
                  open={openDatePicker === "start"}
                  value={startDate}
                  onChange={setStartDate}
                  onClose={() => setOpenDatePicker(null)}
                />
              </div>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[13px] font-semibold text-slate-600">Ngày kết thúc</span>
              <div className="relative">
                <input
                  type="text"
                  value={endDate}
                  readOnly
                  onClick={() => setOpenDatePicker("end")}
                  className="h-10 w-full rounded-lg border border-[#d7e0ec] bg-white pl-3 pr-10 text-[14px] font-semibold text-slate-900 outline-none transition focus:border-[var(--erg-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--erg-blue-ring)]"
                />
                <button
                  type="button"
                  onClick={() => setOpenDatePicker(openDatePicker === "end" ? null : "end")}
                  className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-300 transition hover:bg-[var(--erg-blue-light)] hover:text-[var(--erg-blue)]"
                  aria-label="Chọn ngày kết thúc"
                >
                  <Calendar className="h-4 w-4" />
                </button>
                <DateTimePickerPopover
                  open={openDatePicker === "end"}
                  value={endDate}
                  onChange={setEndDate}
                  onClose={() => setOpenDatePicker(null)}
                />
              </div>
            </label>
          </div>
        </section>
  );
}
