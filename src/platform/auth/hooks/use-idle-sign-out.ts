import { useEffect } from "react";
import { isRunningStandalone } from "@/hooks/use-install-prompt";
import { getCurrentAccount } from "@/platform/auth/api/auth-storage";
import { readStoredRefreshSession } from "@/platform/auth/api/auth-token-storage";
import { getCurrentStudentSession } from "@/platform/auth/api/student-auth-storage";
import { getDesktopRuntime } from "@/platform/desktop";

/** A browser tab signs out after this long without any interaction (installed PWA and desktop app are exempt). */
export const IDLE_SIGN_OUT_MS = 156 * 60 * 1000;
export const LAST_ACTIVITY_KEY = "erg-last-activity";
const ACTIVITY_WRITE_THROTTLE_MS = 15_000;
const CHECK_INTERVAL_MS = 30_000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

export function isIdleExpired(lastActivity: number | null, now: number) {
  return lastActivity !== null && now - lastActivity >= IDLE_SIGN_OUT_MS;
}

function readLastActivity() {
  try {
    const value = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function hasSession() {
  // A remembered refresh token counts: reopening the browser after the idle window must not resume it.
  return Boolean(getCurrentAccount() || getCurrentStudentSession() || readStoredRefreshSession());
}

/** Calls `onExpire` once the signed-in user has been idle (in every tab) for IDLE_SIGN_OUT_MS. The clock is shared via localStorage so it survives reloads and closing the browser. */
export function useIdleSignOut(onExpire: () => void) {
  useEffect(() => {
    if (typeof window === "undefined" || isRunningStandalone() || getDesktopRuntime() === "tauri") return;

    let lastWrite = 0;
    function touch() {
      const now = Date.now();
      if (now - lastWrite < ACTIVITY_WRITE_THROTTLE_MS) return;
      lastWrite = now;
      try {
        window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      } catch {
        // storage blocked: the in-tab timer below still works from the last successful write
      }
    }

    function check() {
      if (!hasSession()) {
        touch();
        return;
      }
      if (isIdleExpired(readLastActivity(), Date.now())) {
        try {
          window.localStorage.removeItem(LAST_ACTIVITY_KEY);
        } catch {
          // ignore
        }
        onExpire();
      }
    }

    // Only a first sign-in or a stale clock needs seeding; an existing recent value must be judged first.
    if (readLastActivity() === null) touch();
    check();
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, touch, { capture: true, passive: true });
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, touch, { capture: true });
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [onExpire]);
}
