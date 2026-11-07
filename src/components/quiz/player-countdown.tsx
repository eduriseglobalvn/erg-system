import { useEffect, useState, type ReactNode } from "react";

import type { LocalQuizAttemptSession } from "@/domain/quiz/quiz-runtime-types";
import { serverNowMs } from "@/components/quiz/player-shell-utils";

type PlayerCountdownProps = {
  session: LocalQuizAttemptSession | null;
  deadlineAt: number | null;
  /** When false the interval is stopped and nothing is rendered. */
  active: boolean;
  /** Portable/offline: tick against the device clock because no server offset exists. */
  localClock?: boolean;
  /** Fires only when the "time is up" flag flips, not every second. */
  onExpiredChange: (expired: boolean) => void;
  children: (remainingSeconds: number) => ReactNode;
};

function secondsLeft({ session, deadlineAt, active, localClock }: { session: LocalQuizAttemptSession | null; deadlineAt: number | null; active: boolean; localClock: boolean }) {
  if (!active || deadlineAt === null || !session) return null;
  const now = serverNowMs(session, Date.now(), localClock);
  return now === null ? null : Math.max(0, Math.ceil((deadlineAt - now) / 1000));
}

/** Whole seconds left until `deadlineAt` (ticks every second), or null while unknown. */
export function useRemainingSeconds({ session, deadlineAt, active, localClock = false }: Pick<PlayerCountdownProps, "session" | "deadlineAt" | "active" | "localClock">) {
  // Lazy init so the first render already has the value (no flash of a time-less dialog).
  const [remaining, setRemaining] = useState<number | null>(() => secondsLeft({ session, deadlineAt, active, localClock }));

  useEffect(() => {
    if (!active || deadlineAt === null || !session) return;
    const tick = () => setRemaining(secondsLeft({ session, deadlineAt, active, localClock }));
    tick();
    const timerId = window.setInterval(tick, 1000);
    return () => window.clearInterval(timerId);
  }, [active, deadlineAt, localClock, session]);

  return remaining;
}

/** Owns the 1s tick so the (very large) player shell does not re-render every second. */
export function PlayerCountdown({ session, deadlineAt, active, localClock = false, onExpiredChange, children }: PlayerCountdownProps) {
  const remaining = useRemainingSeconds({ session, deadlineAt, active, localClock });
  const expired = remaining === 0;
  useEffect(() => {
    onExpiredChange(expired);
  }, [expired, onExpiredChange]);

  return active && remaining !== null ? <>{children(remaining)}</> : null;
}
