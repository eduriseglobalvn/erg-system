import { useCallback, useEffect, useRef, useState } from "react";

import { timekeepingApi } from "../api/timekeeping-api";

/** Re-measure on tab focus at most this often. */
export const SERVER_CLOCK_REMEASURE_MS = 5 * 60_000;

/** The device clock is never trusted for punches: show server time = device time + a measured offset. */
export function useServerClock(): { now(): Date; offsetMs: number | null; ready: boolean } {
  const [offsetMs, setOffsetMs] = useState<number | null>(null);
  const offsetRef = useRef(0);
  const measuredAt = useRef(0);
  const inFlight = useRef(false);

  const measure = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const t0 = Date.now();
      const { serverTime } = await timekeepingApi.clock();
      const t1 = Date.now();
      const server = Date.parse(serverTime ?? "");
      if (Number.isNaN(server)) return;
      offsetRef.current = server - (t0 + t1) / 2;
      measuredAt.current = t1;
      setOffsetMs(offsetRef.current);
    } catch {
      // Keep the last offset; a failed measurement must not mark the clock ready.
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void measure();
    const refresh = () => {
      if (document.visibilityState === "visible" && Date.now() - measuredAt.current >= SERVER_CLOCK_REMEASURE_MS) void measure();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, [measure]);

  const now = useCallback(() => new Date(Date.now() + offsetRef.current), []);
  return { now, offsetMs, ready: offsetMs !== null };
}
