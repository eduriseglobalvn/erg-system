import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ batches: vi.fn(), draft: vi.fn(), save: vi.fn(), workspace: vi.fn() }));

vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn() } }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-batch-api", () => ({ loadTeachingScheduleBatches: mocks.batches }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-schedule-api", () => ({ loadTeachingScheduleDraft: mocks.draft, saveTeachingScheduleDraft: mocks.save }));
vi.mock("@/features/teaching-calendar/api/teaching-calendar-workspace-query-api", () => ({ loadLcmsTeachingCalendarWorkspace: mocks.workspace }));

import type { TeachingCalendarEvent } from "@/features/teaching-calendar/api/teaching-calendar-workspace-types";
import { mobileCardTag } from "./admin-mobile-card";
import { periodChipHint } from "./admin-mobile-sheet";
import { useAdminMobileAdd } from "./use-admin-mobile-add";

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } })}>{children}</QueryClientProvider>
);
const row = { classId: "c1", className: "9A4", clientRowId: "r1", periodNo: 6, teacherId: "t1", teacherName: "Q.Vương", weekday: 3 };

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.save.mockResolvedValue({ batch: { id: "b1", label: "Đợt 1" } });
});

it("labels the period chips like the board", () => {
  expect(periodChipHint({ periodNo: 5, startTime: null }, false, false)).toBe("—");
  expect(periodChipHint({ periodNo: 6, startTime: "13:30" }, true, false)).toBe("13:30");
  expect(periodChipHint({ periodNo: 2, startTime: "08:00" }, false, true)).toBe("đã xếp");
  expect(periodChipHint({ periodNo: 3, startTime: "09:15" }, false, false)).toBe("trống");
});

it("tags cards with Trùng GV, Nháp or Đã áp dụng (never «Đã giao»)", () => {
  const event = (status: string) => ({ status }) as TeachingCalendarEvent;
  expect(mobileCardTag(event("PUBLISHED"), true).label).toBe("Trùng GV");
  expect(mobileCardTag(event("DRAFT"), false).label).toBe("Nháp");
  expect(mobileCardTag(event("PUBLISHED"), false).label).toBe("Đã áp dụng");
});

it("creates a new draft batch when the school has none", async () => {
  mocks.batches.mockResolvedValue({ items: [] });
  const onDone = vi.fn();
  const { result } = renderHook(() => useAdminMobileAdd(onDone), { wrapper });
  await act(async () => { result.current.mutate({ date: "2026-11-11", levelId: "l1", periodTemplateId: "tpl", row, schoolId: "s1", subjectId: "math" }); });
  await waitFor(() => expect(onDone).toHaveBeenCalled());
  const input = mocks.save.mock.calls[0][0];
  expect(input.batchId).toBeNull();
  expect(input.applyFrom).toBe("2026-11-09");
  expect(input.rows).toHaveLength(1);
  expect(input).toMatchObject({ levelId: "l1", subjectId: "math" });
  expect(input.rows[0]).toMatchObject({ classId: "c1", periodNo: 6, teacherId: "t1", weekday: 3 });
});

it("appends one row to the current draft batch with its expected version", async () => {
  mocks.batches.mockResolvedValue({ items: [{ applyFrom: "2026-11-09", id: "b1", repeatWeeks: 10 }] });
  mocks.draft.mockResolvedValue({ batch: { periodTemplateId: "tpl" }, version: 4 });
  mocks.workspace.mockResolvedValue({ events: [] });
  const { result } = renderHook(() => useAdminMobileAdd(vi.fn()), { wrapper });
  await act(async () => { result.current.mutate({ date: "2026-11-11", levelId: "l1", periodTemplateId: "tpl", row, schoolId: "s1", subjectId: "math" }); });
  await waitFor(() => expect(mocks.save).toHaveBeenCalled());
  expect(mocks.save.mock.calls[0][0]).toMatchObject({ batchId: "b1", expectedVersion: 4, levelId: "l1", repeatUntil: "2027-01-17", subjectId: "math" });
});

it("keeps the subject of a draft batch that already has lessons (BE applies it to every lesson)", async () => {
  mocks.batches.mockResolvedValue({ items: [{ applyFrom: "2026-11-09", id: "b1", repeatWeeks: 10 }] });
  mocks.draft.mockResolvedValue({ batch: { periodTemplateId: "tpl" }, version: 4 });
  const existing = { batchId: "b1", classId: "c2", className: "9A2", date: "2026-11-09", id: "e1", levelId: "l9", periodStart: 1, status: "DRAFT", subjectId: "eng", teachers: [] };
  mocks.workspace.mockResolvedValue({ events: [existing] });
  const { result } = renderHook(() => useAdminMobileAdd(vi.fn()), { wrapper });
  await act(async () => { result.current.mutate({ date: "2026-11-11", levelId: "l1", periodTemplateId: "tpl", row, schoolId: "s1", subjectId: "math" }); });
  await waitFor(() => expect(mocks.save).toHaveBeenCalled());
  expect(mocks.save.mock.calls[0][0]).toMatchObject({ levelId: "l9", subjectId: "eng" });
});

it("keeps the key for an identical retry but issues a new one for another school", async () => {
  mocks.batches.mockResolvedValue({ items: [] });
  mocks.save.mockRejectedValue(new Error("timeout"));
  const { result } = renderHook(() => useAdminMobileAdd(vi.fn()), { wrapper });
  const submit = async (schoolId: string) => { await act(async () => { result.current.mutate({ date: "2026-11-11", levelId: "l1", periodTemplateId: "tpl", row, schoolId, subjectId: "math" }); }); await waitFor(() => expect(result.current.isError).toBe(true)); };
  await submit("s1");
  await submit("s1");
  await submit("s2");
  const keys = mocks.save.mock.calls.map((call) => call[0].idempotencyKey);
  expect(keys[1]).toBe(keys[0]);
  expect(keys[2]).not.toBe(keys[0]);
});
