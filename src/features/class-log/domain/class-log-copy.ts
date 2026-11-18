import { formatDateTimeVi } from "@/domain/formatters/format-date";

export type LessonLogErrorKind =
  | "STALE_VERSION"
  | "MONTH_CLOSED"
  | "NOT_TEACHER_OF_PERIOD"
  | "ACTUAL_PERIOD_OUT_OF_RANGE"
  | "PERIOD_NOT_HAPPENED";

export const classLogText = {
  title: "Sổ đầu bài",
  tabs: { class: "Sổ theo lớp", teacher: "Sổ theo GV bộ môn", log: "Nhật ký sổ" },
  allSessions: "Mọi buổi",
  allStatuses: "Mọi trạng thái",
  curriculumButton: "Khung chương trình",
  curriculumView: "Chỉ để xem",
  curriculumFooter: "Tiết thực tế sửa ở cột «Tiết thực tế» trong sổ, tên bài tự cập nhật theo KCT.",
  noCurriculum: "Môn này chưa có khung chương trình.",
  noLesson: "Chưa có trong KCT",
  commentPlaceholder: "Thêm nhận xét…",
  emptyWeek: "Tuần này bạn không có tiết nào theo thời khoá biểu.",
  noDay: "Không có tiết theo TKB",
  loadError: "Không tải được dữ liệu. Thử lại",
  retry: "Thử lại",
  confirmed: "Đã xác nhận",
  pending: "Chờ xác nhận",
  notTaught: "Chưa dạy",
  unsigned: "Chưa kí",
  noAbsent: "—",
} as const;

export const sessionOptions = [
  { value: "", label: classLogText.allSessions },
  { value: "MORNING", label: "Sáng" },
  { value: "AFTERNOON", label: "Chiều" },
] as const;

export const statusOptions = [
  { value: "", label: classLogText.allStatuses },
  { value: "PENDING", label: classLogText.pending },
  { value: "CONFIRMED", label: classLogText.confirmed },
] as const;

export function sessionLabel(session: string | null | undefined) {
  return sessionOptions.find((option) => option.value && option.value === session?.toUpperCase())?.label ?? "";
}

/** "Chậm 2 tiết so với PPCT" / "Nhanh 1 tiết so với PPCT"; null when the period is on schedule. */
export function lagText(ppct: number, actual: number) {
  if (ppct === actual) return null;
  return ppct > actual ? `Chậm ${ppct - actual} tiết so với PPCT` : `Nhanh ${actual - ppct} tiết so với PPCT`;
}

export function lagChipText(chip: { className: string; lag: number }) {
  return `${chip.className} chậm ${chip.lag} tiết so với PPCT`;
}

/** "Minh (P), Khoa (K)"; "—" when nobody is absent. */
export function absenteesText(absentees: ReadonlyArray<{ shortName: string; excused: boolean }>) {
  if (absentees.length === 0) return classLogText.noAbsent;
  return absentees.map((a) => `${a.shortName} (${a.excused ? "P" : "K"})`).join(", ");
}

/** "Chiều · 4 tiết", or the empty-day wording. */
export function dayMeta(session: string | null | undefined, count: number) {
  if (count === 0) return classLogText.noDay;
  const label = sessionLabel(session);
  return label ? `${label} · ${count} tiết` : `${count} tiết`;
}

export const confirmLabel = (pending: number) => `Xác nhận ${pending} tiết`;

const fieldLabels: Record<string, string> = { actualPeriod: "Tiết thực tế", comment: "Nhận xét" };

/** "Tiết thực tế 10 → 8"; empty values print as "—". */
export function changeText(change: { field: string; oldValue?: string | null; newValue?: string | null }) {
  return `${fieldLabels[change.field] ?? change.field} ${change.oldValue || "—"} → ${change.newValue || "—"}`;
}

export const changeTimeText = (at: string) => formatDateTimeVi(at);

const errorMarkers: ReadonlyArray<[LessonLogErrorKind, RegExp]> = [
  ["STALE_VERSION", /STALE_VERSION|changed since it was read/i],
  ["MONTH_CLOSED", /MONTH_CLOSED|month .* is closed/i],
  ["NOT_TEACHER_OF_PERIOD", /NOT_TEACHER_OF_PERIOD|do not teach/i],
  ["ACTUAL_PERIOD_OUT_OF_RANGE", /ACTUAL_PERIOD_OUT_OF_RANGE|actual period must be between/i],
  ["PERIOD_NOT_HAPPENED", /PERIOD_NOT_HAPPENED/i],
];

/** The GraphQL client keeps only `code` and the joined messages, so the backend code is matched in either. */
export function lessonLogErrorKind(error: unknown): LessonLogErrorKind | null {
  const { code, message } = (error ?? {}) as { code?: unknown; message?: unknown };
  const haystack = `${typeof code === "string" ? code : ""} ${typeof message === "string" ? message : ""}`;
  return errorMarkers.find(([, pattern]) => pattern.test(haystack))?.[0] ?? null;
}

const errorTexts: Record<LessonLogErrorKind, string> = {
  STALE_VERSION: "Dữ liệu vừa được người khác sửa, đã tải lại.",
  MONTH_CLOSED: "Tháng đã chốt, không sửa được.",
  NOT_TEACHER_OF_PERIOD: "Bạn không dạy tiết này nên không sửa được.",
  ACTUAL_PERIOD_OUT_OF_RANGE: "Tiết thực tế nằm ngoài khung chương trình.",
  PERIOD_NOT_HAPPENED: "Tiết này chưa diễn ra nên chưa điểm danh được.",
};

export function lessonLogErrorText(error: unknown) {
  const kind = lessonLogErrorKind(error);
  return kind ? errorTexts[kind] : "Không lưu được sổ đầu bài. Thử lại.";
}

export type CurriculumRow = { topic?: string | null; period: number; title: string };
export type CurriculumGroup = { topic: string; from: number; to: number; title: string };

/** One row per lesson: consecutive periods of the same lesson ("10–11") merge and the topic prints once. */
export function groupCurriculum(rows: ReadonlyArray<CurriculumRow>): CurriculumGroup[] {
  const groups: CurriculumGroup[] = [];
  let lastTopic = "";
  for (const row of [...rows].sort((a, b) => a.period - b.period)) {
    const last = groups[groups.length - 1];
    if (last && last.title === row.title && last.to + 1 === row.period) {
      last.to = row.period;
      continue;
    }
    const topic = row.topic?.trim() ?? "";
    groups.push({ topic: topic && topic !== lastTopic ? topic : "", from: row.period, to: row.period, title: row.title });
    if (topic) lastTopic = topic;
  }
  return groups;
}

export const periodRangeText = (g: Pick<CurriculumGroup, "from" | "to">) => (g.from === g.to ? String(g.from) : `${g.from}–${g.to}`);
