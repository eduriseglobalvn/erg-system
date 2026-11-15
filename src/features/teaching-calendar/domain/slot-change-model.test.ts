import { expect, it } from "vitest";

import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { editPatch, initialDraft, isChangeable, previewState, scopeInput, scopeReady, slotChangeErrorMessage, swapInput } from "./slot-change-model";

const event = {
  date: "2026-11-11", id: "e1", periodStart: 6, roomId: "r1", status: "PUBLISHED", subjectId: "s1",
  teachers: [{ displayName: "Q.Vương", role: "MAIN", userId: "t1" }, { displayName: "H.Anh", role: "ASSISTANT", userId: "t2" }],
} as unknown as TeachingCalendarEvent;
const THIS = { dates: [], kind: "THIS_ONLY" } as const;

it("editPatch sends only changed fields and null when nothing changed", () => {
  const draft = initialDraft(event);
  expect(editPatch(event, draft, THIS)).toBeNull();
  expect(editPatch(event, { ...draft, periodNo: 7, roomId: "r2" }, THIS)).toEqual({ periodNo: 7, roomId: "r2" });
});

it("editPatch only sends newDate for THIS_ONLY and removes the assistant when cleared", () => {
  const draft = { ...initialDraft(event), assistantId: "", newDate: "2026-11-12" };
  expect(editPatch(event, draft, THIS)).toEqual({ newDate: "2026-11-12", removeAssistant: true });
  expect(editPatch(event, draft, { dates: [], kind: "FROM_DATE_TO_END" })).toEqual({ removeAssistant: true });
});

it("scope needs dates only for SELECTED_DATES and sorts them", () => {
  expect(scopeReady({ dates: [], kind: "SELECTED_DATES" })).toBe(false);
  expect(scopeReady({ dates: [], kind: "FROM_DATE_TO_END" })).toBe(true);
  expect(scopeInput({ dates: ["2026-11-18", "2026-11-11"], kind: "SELECTED_DATES" })).toEqual({ dates: ["2026-11-11", "2026-11-18"], kind: "SELECTED_DATES" });
  expect(scopeInput(THIS).dates).toBeUndefined();
});

it("swapInput trims the note and drops empty fields", () => {
  expect(swapInput(event, THIS, "t3", null, "  ")).toEqual({ eventId: "e1", newTeacherId: "t3", note: undefined, reason: undefined, scope: { dates: undefined, kind: "THIS_ONLY" } });
  expect(swapInput(event, THIS, "t3", "TIME_CONFLICT", " ốm ").note).toBe("ốm");
});

it("maps backend error codes to Vietnamese and falls back for unknown codes", () => {
  expect(slotChangeErrorMessage("STALE_VERSION")).toContain("người khác");
  expect(slotChangeErrorMessage("DATE_IS_HOLIDAY")).toContain("ngày nghỉ");
  expect(slotChangeErrorMessage("WHATEVER")).toBe("Chưa lưu được. Thử lại sau.");
  expect(slotChangeErrorMessage(undefined)).toBe("Chưa lưu được. Thử lại sau.");
});

it("previewState reports count, warnings and blocking conflicts", () => {
  const conflict = (severity: "ERROR" | "WARNING") => ({ severity }) as never;
  expect(previewState(undefined).kind).toBe("idle");
  expect(previewState({ affectedCount: 6, applied: false, blocking: false, conflicts: [], events: [] })).toEqual({ kind: "ok", text: "6 tiết sẽ đổi." });
  expect(previewState({ affectedCount: 2, applied: false, blocking: false, conflicts: [conflict("WARNING")], events: [] }).kind).toBe("warn");
  const blocked = previewState({ affectedCount: 2, applied: false, blocking: true, conflicts: [conflict("ERROR"), conflict("WARNING")], events: [] });
  expect(blocked.kind === "blocked" && blocked.conflicts).toHaveLength(1);
});

it("only published events are changeable here", () => {
  expect(isChangeable(event)).toBe(true);
  expect(isChangeable({ status: "DRAFT" })).toBe(false);
});
