import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";

/** Where each keyed item sits inside the container, so a later scroll does not look like a move. */
export function slideOffsets(container: DOMRect, items: Array<{ key: string; rect: DOMRect }>) {
  return new Map(items.map(({ key, rect }) => [key, { x: rect.left - container.left, y: rect.top - container.top }]));
}

/**
 * After a reorder, items glide from where they were to where they are now (FLIP), so a dropped card does not snap.
 * `order` is any value that changes when the order does; `keyOf` reads an item's identity from its node.
 * `vertical` ignores sideways moves, for items whose parent shifts them sideways on its own.
 */
export function useReorderSlide(container: RefObject<HTMLElement | null>, selector: string, keyOf: (node: HTMLElement) => string | undefined, order: string, vertical = false) {
  const previous = useRef(new Map<string, { x: number; y: number }>());
  const measure = (box: HTMLElement) => Array.from(box.querySelectorAll<HTMLElement>(selector)).flatMap((node) => {
    const key = keyOf(node);
    return key ? [{ key, node, rect: node.getBoundingClientRect() }] : [];
  });
  // A resize moves items without reordering them (a phone-width board settles after first paint): remember the new places,
  // or the next move would slide from the old layout. Skipped mid-slide, when rects still show the old places.
  useEffect(() => {
    const box = container.current;
    if (!box || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (box.getAnimations?.({ subtree: true }).length) return;
      previous.current = slideOffsets(box.getBoundingClientRect(), measure(box));
    });
    observer.observe(box);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useLayoutEffect(() => {
    const box = container.current;
    if (!box) return;
    const nodes = measure(box);
    const next = slideOffsets(box.getBoundingClientRect(), nodes);
    const still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (const { key, node } of nodes) {
      const from = previous.current.get(key);
      const to = next.get(key);
      // jsdom and very old browsers have no Web Animations: the item just appears in place.
      if (!from || !to || still || typeof node.animate !== "function") continue;
      const dx = vertical ? 0 : from.x - to.x;
      const dy = from.y - to.y;
      if (dx || dy) node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: tokens.motion.duration.base, easing: tokens.motion.easing.emphasized });
    }
    previous.current = next;
    // keyOf and selector are constants at each call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);
}
