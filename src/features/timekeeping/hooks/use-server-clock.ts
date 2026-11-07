import { useCallback, useEffect, useRef, useState } from "react";

import { timekeepingApi } from "../api/timekeeping-api";

/** Re-measure on tab focus, and on a timer while visible, at most this often. */
export const SERVER_CLOCK_REMEASURE_MS = 5 * 60_000;
/** Waits after a failed measurement until the first success; the last value repeats. */
export const SERVER_CLOCK_RETRY_MS = [2_000, 5_000, 10_000, 30_000] as const;

/** The device clock is never trusted for punches: show server time = device time + a measured offset. */
export function useServerClock(): { now(): Date; offsetMs: number | null; ready: boolean } {
  const [offsetMs, setOffsetMs] = useState<number | null>(null);
  const offsetRef = useRef(0);
  const measuredAt = useRef(0);
  const inFlight = useRef(false);

  const measure = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) return false;
    inFlight.current = true;
    try {
      const t0 = Date.now();
      const { serverTime } = await timekeepingApi.clock();
      const t1 = Date.now();
      const server = Date.parse(serverTime ?? "");
      if (Number.isNaN(server)) return false;
      offsetRef.current = server - (t0 + t1) / 2;
      measuredAt.current = t1;
      setOffsetMs(offsetRef.current);
      return true;
    } catch {
      // Keep the last offset; a failed measurement must not mark the clock ready.
      return false;
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    // Retry with backoff until the first success; later failures keep the old offset until the next tick.
    const first = async (attempt: number) => {
      if (await measure() || cancelled) return;
      retryTimer = setTimeout(() => void first(attempt + 1), SERVER_CLOCK_RETRY_MS[Math.min(attempt, SERVER_CLOCK_RETRY_MS.length - 1)]);
    };
    void first(0);
    const refresh = () => {
      if (document.visibilityState === "visible" && Date.now() - measuredAt.current >= SERVER_CLOCK_REMEASURE_MS) void measure();
    };
    const interval = setInterval(() => { if (document.visibilityState === "visible") void measure(); }, SERVER_CLOCK_REMEASURE_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [measure]);

  const now = useCallback(() => new Date(Date.now() + offsetRef.current), []);
  return { now, offsetMs, ready: offsetMs !== null };
}
