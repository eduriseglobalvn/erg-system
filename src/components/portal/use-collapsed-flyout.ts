import { useEffect, useRef, useState } from "react";

/**
 * Open/close state for a collapsed nav item's right-hand flyout submenu.
 * Handles the hover-close grace timer and resets when the layer deactivates.
 */
export function useCollapsedFlyout(collapsed: boolean, sidebarActive: boolean) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!collapsed || !sidebarActive) {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      const resetTimer = window.setTimeout(() => setAnchor(null), 0);
      return () => window.clearTimeout(resetTimer);
    }
  }, [collapsed, sidebarActive]);

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
