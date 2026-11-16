import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { ApiClientError } from "@/lib/api-client/errors";
import type { TeachingScheduleDraftResult } from "@/features/teaching-calendar/api/teaching-calendar-schedule-api";
import type { GridRow } from "@/features/teaching-calendar/domain/schedule-grid-model";

import { useScheduleDraft } from "./use-schedule-draft";

const meta = { applyFrom: "2026-11-09", periodTemplateId: "tpl", repeatUntil: "2027-01-17", schoolId: "school" };
const row = (id: string): GridRow => ({ classId: "c", className: "9A1", clientRowId: id, periodNo: 1, weekday: 1 });

function result(version: number, rowIdMap: Array<{ clientRowId: string; eventId: string }> = []): TeachingScheduleDraftResult {
  return {
    accessChanges: [],
    batch: { affectedEventCount: 0, id: "batch-1", label: "Đợt 1", schoolId: "school", status: "DRAFT", version },
    conflicts: [],
    rowIdMap,
    savedAt: "2026-11-14T07:00:00Z",
    version,
  } as unknown as TeachingScheduleDraftResult;
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

it("debounces edits into one save and applies the row id map and version", async () => {
  const save = vi.fn().mockResolvedValue(result(1, [{ clientRowId: "r1", eventId: "e1" }]));
  const { result: hook } = renderHook(() => useScheduleDraft({ save }));
  act(() => hook.current.hydrate({ meta, rows: [] }));
  act(() => hook.current.setRows(() => [row("r1")]));
  act(() => hook.current.setRows((rows) => [...rows, { ...row("r2"), periodNo: 2 }]));
  expect(save).not.toHaveBeenCalled();
  expect(hook.current.status).toBe("dirty");

  await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
  expect(save).toHaveBeenCalledTimes(1);
  expect(save.mock.calls[0][0].rows).toHaveLength(2);
  expect(hook.current.rows[0].eventId).toBe("e1");
  expect(hook.current.meta).toMatchObject({ batchId: "batch-1", version: 1 });
  expect(hook.current.status).toBe("idle");
});

it("queues a change made while saving and sends it after, with the new version", async () => {
  let release: (value: TeachingScheduleDraftResult) => void = () => undefined;
  const save = vi.fn()
    .mockImplementationOnce(() => new Promise<TeachingScheduleDraftResult>((resolve) => { release = resolve; }))
    .mockResolvedValueOnce(result(2));
  const { result: hook } = renderHook(() => useScheduleDraft({ save }));
  act(() => hook.current.hydrate({ meta, rows: [] }));
  act(() => hook.current.setRows(() => [row("r1")]));
  await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
  expect(hook.current.status).toBe("saving");

  act(() => hook.current.setRows((rows) => [...rows, { ...row("r2"), periodNo: 2 }]));
  await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
  expect(save).toHaveBeenCalledTimes(1);

  await act(async () => { release(result(1)); });
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1][0]).toMatchObject({ batchId: "batch-1", expectedVersion: 1 });
});

it("goes to stale on STALE_VERSION and to error on other failures", async () => {
  const stale = new ApiClientError("x", "GRAPHQL_ERROR", 200, [{ extensions: { code: "STALE_VERSION" }, message: "x" }]);
  const save = vi.fn().mockRejectedValueOnce(stale).mockRejectedValueOnce(new Error("boom"));
  const { result: hook } = renderHook(() => useScheduleDraft({ save }));
  act(() => hook.current.hydrate({ meta, rows: [row("r1")] }));
  await act(async () => { await hook.current.flush(); });
  expect(hook.current.status).toBe("stale");
  await act(async () => { await hook.current.flush(); });
  expect(hook.current.status).toBe("error");
});

it("flush waits for the in-flight save and its queued follow-up, and reports failure", async () => {
  let release: (value: TeachingScheduleDraftResult) => void = () => undefined;
  const save = vi.fn()
    .mockImplementationOnce(() => new Promise<TeachingScheduleDraftResult>((resolve) => { release = resolve; }))
    .mockResolvedValueOnce(result(2));
  const { result: hook } = renderHook(() => useScheduleDraft({ save }));
  act(() => hook.current.hydrate({ meta, rows: [] }));
  act(() => hook.current.setRows(() => [row("r1")]));
  await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
  act(() => hook.current.setRows((rows) => [...rows, { ...row("r2"), periodNo: 2 }]));
  let done: boolean | undefined;
  const flushing = hook.current.flush().then((ok) => { done = ok; });
  await act(async () => { release(result(1)); await flushing; });
  expect(save).toHaveBeenCalledTimes(2);
  expect(done).toBe(true);
  expect(hook.current.meta.version).toBe(2);

  save.mockRejectedValueOnce(new Error("boom"));
  act(() => hook.current.setRows(() => [row("r3")]));
  let ok: boolean | undefined;
  await act(async () => { ok = await hook.current.flush(); });
  expect(ok).toBe(false);
});

it("saves pending changes on unmount", () => {
  const save = vi.fn().mockResolvedValue(result(1));
  const { result: hook, unmount } = renderHook(() => useScheduleDraft({ save }));
  act(() => hook.current.hydrate({ meta, rows: [] }));
  act(() => hook.current.setRows(() => [row("r1")]));
  unmount();
  expect(save).toHaveBeenCalledTimes(1);
});
