import { useEffect, useRef, useState } from "react";

/** Open/close state for a collapsed nav item's right-hand flyout, with a hover-close grace timer. */
export function useCollapsedFlyout() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  function cancelClose() {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function open(nextAnchor: HTMLElement) {
    cancelClose();
    setAnchor(nextAnchor);
  }

  function scheduleClose() {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => {
      setAnchor(null);
      closeTimerRef.current = null;
    }, 180);
  }

  function close() {
    cancelClose();
    setAnchor(null);
  }

  return { anchor, cancelClose, open, scheduleClose, close };
}
