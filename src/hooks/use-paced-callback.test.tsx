import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { useDebouncedCallback } from "@/hooks/use-paced-callback";

afterEach(() => {
  vi.useRealTimers();
});

test("runs the latest debounced callback with TanStack Pacer", () => {
  vi.useFakeTimers();
  const callback = vi.fn();
  const { result, rerender } = renderHook(({ label }) => useDebouncedCallback((value: string) => callback(label, value), 200), {
    initialProps: { label: "first" },
  });

  act(() => {
    result.current.run("a");
    result.current.run("ab");
  });
  expect(callback).not.toHaveBeenCalled();

  rerender({ label: "latest" });
  act(() => {
    vi.advanceTimersByTime(200);
  });

  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith("latest", "ab");
});

test("cancels a pending debounced callback", () => {
  vi.useFakeTimers();
  const callback = vi.fn();
  const { result } = renderHook(() => useDebouncedCallback(callback, 200));

  act(() => {
    result.current.run();
    result.current.cancel();
    vi.advanceTimersByTime(200);
  });

  expect(callback).not.toHaveBeenCalled();
});
