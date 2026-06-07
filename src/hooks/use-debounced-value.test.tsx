import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { useDebouncedValue } from "@/hooks/use-debounced-value";

afterEach(() => {
  vi.useRealTimers();
});

test("debounces value updates with TanStack Pacer", () => {
  vi.useFakeTimers();

  const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
    initialProps: { value: "a" },
  });

  expect(result.current).toBe("a");

  rerender({ value: "ab" });
  rerender({ value: "abc" });

  expect(result.current).toBe("a");

  act(() => {
    vi.advanceTimersByTime(299);
  });
  expect(result.current).toBe("a");

  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(result.current).toBe("abc");
});
