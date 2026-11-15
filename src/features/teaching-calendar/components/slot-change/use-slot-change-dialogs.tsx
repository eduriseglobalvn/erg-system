import { useState, type ReactNode } from "react";

import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { isChangeable } from "@/features/teaching-calendar/domain/slot-change-model";
import { SlotEditDialog } from "./slot-edit-dialog";
import { TeacherSwapDialog } from "./teacher-swap-dialog";

type Intent = "edit" | "copy" | "teacher" | "move";
type Open = { event: TeachingCalendarEvent; focus?: "period"; kind: "edit" | "swap" };

/**
 * Cac dialog «Sửa tiết» / «Đổi giáo viên» dung chung cho Main, Bang tong va mobile.
 * `open(event, intent)` tra true khi da mo dialog (tiet da xuat ban, intent edit/teacher/move); false thi noi goi
 * giu luong cu (chuyen toi trang xep lich — dung cho tiet nhap va «Nhân bản»).
 */
export function useSlotChangeDialogs(canDelete: boolean): { element: ReactNode; open: (event: TeachingCalendarEvent | undefined, intent: Intent) => boolean } {
  const [state, setState] = useState<Open | null>(null);
  const open = (event: TeachingCalendarEvent | undefined, intent: Intent) => {
    if (!event || !isChangeable(event) || intent === "copy") return false;
    setState(intent === "teacher" ? { event, kind: "swap" } : { event, focus: intent === "move" ? "period" : undefined, kind: "edit" });
    return true;
  };
  const close = () => setState(null);
  const element = state ? (state.kind === "edit"
    ? <SlotEditDialog canDelete={canDelete} event={state.event} focus={state.focus} key={`edit:${state.event.id}`} onClose={close} />
    : <TeacherSwapDialog event={state.event} key={`swap:${state.event.id}`} onClose={close} />) : null;
  return { element, open };
}
