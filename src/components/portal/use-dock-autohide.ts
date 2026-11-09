import { useEffect, useState } from "react";

/** Scroll distance in one direction before the dock reacts, so a finger wobble does not flicker it. */
const DIRECTION_THRESHOLD = 12;
/** Near the top of any scroller the dock is always shown. */
const TOP_ZONE = 32;
const TEXT_FIELD = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"]), textarea, select, [contenteditable=""], [contenteditable="true"]';

/**
 * Dock visibility like mobile YouTube: hidden while scrolling down, back on scrolling up. It is also hidden while a
 * text field is focused, because the on-screen keyboard otherwise leaves the dock peeking above it.
 * Scroll events do not bubble, so one capture listener sees every scroller (the shells scroll an inner `main`).
 */
export function useDockAutohide(resetKey: unknown) {
  const [scrolledAway, setScrolledAway] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const lastTop = new WeakMap<Element, number>();
    let travelled = 0;

    function onScroll(event: Event) {
      const target = event.target === document ? document.scrollingElement : (event.target as Element | null);
      if (!(target instanceof HTMLElement) || target.closest('[role="dialog"]')) return;

      const top = target.scrollTop;
      const delta = top - (lastTop.get(target) ?? top);
      lastTop.set(target, top);
      if (top <= TOP_ZONE) {
        travelled = 0;
        setScrolledAway(false);
        return;
      }
      if (delta === 0) return;
      travelled = Math.sign(delta) === Math.sign(travelled) ? travelled + delta : delta;
      if (Math.abs(travelled) >= DIRECTION_THRESHOLD) setScrolledAway(travelled > 0);
    }
    const onFocusIn = (event: FocusEvent) => setTyping(event.target instanceof Element && event.target.matches(TEXT_FIELD));
    const onFocusOut = () => setTyping(false);

    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Navigating to another tab always brings the dock back (state reset during render, not in an effect).
  const [seenKey, setSeenKey] = useState(resetKey);
  if (seenKey !== resetKey) {
    setSeenKey(resetKey);
    setScrolledAway(false);
  }

  return scrolledAway || typing;
}
