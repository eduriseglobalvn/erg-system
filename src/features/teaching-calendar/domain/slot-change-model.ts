import type { EditSlotInput, SlotChangeResult, SwapTeacherInput } from "@/features/teaching-calendar/api/teaching-calendar-slot-change-api";
import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";

export type ScopeKind = "THIS_ONLY" | "FROM_DATE_TO_END" | "SELECTED_DATES";
export type ScopeState = { dates: string[]; kind: ScopeKind };
export type SwapReason = NonNullable<SwapTeacherInput["reason"]>;

export const SWAP_REASONS: ReadonlyArray<{ label: string; value: SwapReason }> = [
  { label: "Trùng giờ", value: "TIME_CONFLICT" },
  { label: "Giáo viên nghỉ", value: "TEACHER_ON_LEAVE" },
  { label: "Đổi phân công", value: "REASSIGNMENT" },
];

export const NOTE_MAX = 200;

/** Tiet da xuat ban moi sua/doi duoc bang hai mutation nay; ban nhap sua o luoi xep lich. */
export const isChangeable = (event: Pick<TeachingCalendarEvent, "status">) => event.status === "PUBLISHED";

export const scopeInput = (scope: ScopeState): EditSlotInput["scope"] => ({ dates: scope.kind === "SELECTED_DATES" ? [...scope.dates].sort() : undefined, kind: scope.kind });

export const scopeReady = (scope: ScopeState) => scope.kind !== "SELECTED_DATES" || scope.dates.length > 0;

export type EditDraft = { assistantId: string; newDate: string; periodNo: number; roomId: string; subjectId: string };
type Patch = { -readonly [K in keyof Omit<EditSlotInput, "dryRun" | "eventId" | "scope">]?: Omit<EditSlotInput, "dryRun" | "eventId" | "scope">[K] };

export const mainTeacherOf = (event: TeachingCalendarEvent) => event.teachers.find((teacher) => teacher.role === "MAIN");
export const assistantOf = (event: TeachingCalendarEvent) => event.teachers.find((teacher) => teacher.role === "ASSISTANT");

export const initialDraft = (event: TeachingCalendarEvent): EditDraft => ({
  assistantId: assistantOf(event)?.userId ?? "", newDate: event.date, periodNo: event.periodStart, roomId: event.roomId ?? "", subjectId: event.subjectId ?? "",
});

/** Chi gui truong khac gia tri hien tai (null = giu nguyen). Tra `null` neu khong co gi doi. */
export function editPatch(event: TeachingCalendarEvent, draft: EditDraft, scope: ScopeState): Patch | null {
  const before = initialDraft(event);
  const patch: Patch = {};
  if (draft.periodNo !== before.periodNo) patch.periodNo = draft.periodNo;
  if (scope.kind === "THIS_ONLY" && draft.newDate && draft.newDate !== before.newDate) patch.newDate = draft.newDate;
  if (draft.roomId && draft.roomId !== before.roomId) patch.roomId = draft.roomId;
  if (draft.subjectId && draft.subjectId !== before.subjectId) patch.subjectId = draft.subjectId;
  if (draft.assistantId !== before.assistantId) {
    if (draft.assistantId) patch.assistantId = draft.assistantId;
    else patch.removeAssistant = true;
  }
  return Object.keys(patch).length ? patch : null;
}

export function swapInput(event: TeachingCalendarEvent, scope: ScopeState, teacherId: string, reason: SwapReason | null, note: string): Omit<SwapTeacherInput, "dryRun"> {
  return { eventId: event.id, newTeacherId: teacherId, note: note.trim() || undefined, reason: reason ?? undefined, scope: scopeInput(scope) };
}

const ERROR_COPY: Record<string, string> = {
  ASSISTANT_CHANGE_AMBIGUOUS: "Không vừa đổi vừa bỏ trợ giảng trong một lần. Chọn một thao tác.",
  ASSISTANT_SAME_AS_TEACHER: "Trợ giảng không được trùng giáo viên chính.",
  CHANGE_BLOCKED_BY_CONFLICTS: "Còn xung đột chưa xử lý nên chưa lưu được. Đổi lựa chọn rồi thử lại.",
  DATES_INVALID: "Ngày chọn không hợp lệ hoặc không thuộc các tuần lặp của tiết này.",
  DATE_CHANGE_NEEDS_SINGLE_SCOPE: "Đổi ngày chỉ áp dụng cho «Chỉ tiết này».",
  DATE_HAS_NO_PERIOD: "Ngày mới không có tiết này trong bảng giờ của trường.",
  DATE_IS_HOLIDAY: "Ngày mới là ngày nghỉ.",
  EVENT_ALREADY_STARTED: "Tiết đã bắt đầu nên không đổi được.",
  EVENT_CANCELLED: "Tiết đã bị huỷ.",
  EVENT_IN_THE_PAST: "Tiết đã qua nên không đổi được.",
  EVENT_NOT_PUBLISHED: "Tiết chưa xuất bản. Sửa trong trang xếp lịch.",
  INVALID_WEEKDAY: "Ngày mới phải rơi vào các thứ có lịch của trường.",
  NOTHING_TO_CHANGE: "Chưa có gì thay đổi.",
  NOT_FOUND: "Không tìm thấy tiết. Có thể tiết đã bị xoá.",
  PERIOD_HAS_NO_TIME: "Tiết này chưa có giờ trong bảng giờ của trường.",
  REASON_TOO_LONG: `Ghi chú tối đa ${NOTE_MAX} ký tự.`,
  ROOM_INVALID: "Phòng không thuộc trường này.",
  SAME_TEACHER: "Giáo viên mới trùng giáo viên hiện tại.",
  SCOPE_INVALID: "Phạm vi áp dụng không hợp lệ.",
  STALE_VERSION: "Tiết vừa được người khác thay đổi. Mở lại để xem bản mới.",
  SUBJECT_INVALID: "Môn không hợp lệ.",
  SWAP_REASON_INVALID: "Lý do đổi không hợp lệ.",
  TEACHER_INVALID: "Giáo viên không hợp lệ.",
  TEACHER_REQUIRED: "Chọn giáo viên mới.",
};

/** Ma loi BE (`extensions.code`) -> cau tieng Viet cho nguoi dung. */
export function slotChangeErrorMessage(code: string | undefined): string {
  return (code && ERROR_COPY[code]) || "Chưa lưu được. Thử lại sau.";
}

export type PreviewState =
  | { kind: "idle" }
  | { kind: "ok"; text: string }
  | { conflicts: SlotChangeResult["conflicts"]; kind: "blocked" | "warn"; text: string };

/** Dong xem truoc tu ket qua dryRun: «6 tiết sẽ đổi», hoac xung dot (ERROR chan luu, WARNING chi bao). */
export function previewState(result: SlotChangeResult | undefined): PreviewState {
  if (!result) return { kind: "idle" };
  const count = `${result.affectedCount} tiết sẽ đổi`;
  if (result.blocking) return { conflicts: result.conflicts.filter((conflict) => conflict.severity === "ERROR"), kind: "blocked", text: `${count}, nhưng còn xung đột phải xử lý` };
  if (result.conflicts.length) return { conflicts: result.conflicts, kind: "warn", text: `${count}. Có cảnh báo, vẫn lưu được` };
  return { kind: "ok", text: `${count}.` };
}
