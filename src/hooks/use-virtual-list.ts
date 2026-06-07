import { useVirtualizer } from "@tanstack/react-virtual";
import type { RefObject } from "react";

type UseVirtualListOptions = {
  count: number;
  estimateSize: number | (() => number);
  overscan?: number;
  scrollRef: RefObject<HTMLElement | null>;
};

export function useVirtualList({
  count,
  estimateSize,
  overscan = 6,
  scrollRef,
}: UseVirtualListOptions) {
  const estimateSizeFn = typeof estimateSize === "function" ? estimateSize : () => estimateSize;
  const initialItemSize = estimateSizeFn();

  return useVirtualizer({
    count,
    estimateSize: estimateSizeFn,
    getScrollElement: () => scrollRef.current,
    initialRect: {
      height: initialItemSize * Math.min(count, overscan + 1),
      width: 0,
    },
    overscan,
  });
}
