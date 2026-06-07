import { renderHook } from "@testing-library/react";
import { createRef } from "react";
import { expect, test } from "vitest";

import { useVirtualList } from "@/hooks/use-virtual-list";

test("creates a TanStack virtualizer configured for fixed-size lists", () => {
  const scrollRef = createRef<HTMLDivElement>();
  const { result } = renderHook(() =>
    useVirtualList({
      count: 100,
      estimateSize: 32,
      overscan: 8,
      scrollRef,
    }),
  );

  expect(result.current.getTotalSize()).toBe(3200);
  expect(result.current.options.count).toBe(100);
  expect(result.current.options.overscan).toBe(8);
});
