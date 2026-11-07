import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { timekeepingApi } from "../api/timekeeping-api";
import { SERVER_CLOCK_REMEASURE_MS, useServerClock } from "./use-server-clock";

vi.mock("../api/timekeeping-api", () => ({ timekeepingApi: { clock: vi.fn() } }));
const clock = vi.mocked(timekeepingApi.clock);

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-11-06T01:00:00Z") });
  clock.mockReset();
});
afterEach(() => vi.useRealTimers());

test("offset = serverTime - midpoint of the request, not ready until measured", async () => {
  // Server is 90 s ahead; the request takes 200 ms, so the server stamped it at the midpoint.
  clock.mockImplementation(async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { serverTime: new Date(Date.now() - 100 + 90_000).toISOString() };
  });
  const { result } = renderHook(() => useServerClock());
  expect(result.current.ready).toBe(false);
  expect(result.current.offsetMs).toBeNull();
  await act(async () => { await vi.advanceTimersByTimeAsync(250); });
  expect(result.current.ready).toBe(true);
  expect(Math.abs((result.current.offsetMs ?? 0) - 90_000)).toBeLessThanOrEqual(150);
  expect(result.current.now().getTime() - Date.now()).toBeCloseTo(90_000, -3);
});

test("re-measures on visibility change at most every 5 minutes", async () => {
  clock.mockImplementation(async () => ({ serverTime: new Date().toISOString() }));
  renderHook(() => useServerClock());
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  expect(clock).toHaveBeenCalledTimes(1);

  await act(async () => { await vi.advanceTimersByTimeAsync(SERVER_CLOCK_REMEASURE_MS - 1_000); });
  act(() => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(clock).toHaveBeenCalledTimes(1);

  await act(async () => { await vi.advanceTimersByTimeAsync(2_000); });
  act(() => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(clock).toHaveBeenCalledTimes(2);
});

test("retries with backoff until the first success, then re-measures on the 5-minute interval", async () => {
  clock.mockRejectedValueOnce(new Error("offline")).mockRejectedValueOnce(new Error("offline"));
  clock.mockImplementation(async () => ({ serverTime: new Date().toISOString() }));
  const { result, unmount } = renderHook(() => useServerClock());
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  expect(result.current.ready).toBe(false);
  await act(async () => { await vi.advanceTimersByTimeAsync(2_000); });
  expect(result.current.ready).toBe(false);
  await act(async () => { await vi.advanceTimersByTimeAsync(5_000); });
  expect(result.current.ready).toBe(true);
  expect(clock).toHaveBeenCalledTimes(3);
  await act(async () => { await vi.advanceTimersByTimeAsync(SERVER_CLOCK_REMEASURE_MS); });
  expect(clock).toHaveBeenCalledTimes(4);
  unmount();
  await act(async () => { await vi.advanceTimersByTimeAsync(SERVER_CLOCK_REMEASURE_MS * 2); });
  expect(clock).toHaveBeenCalledTimes(4);
});
