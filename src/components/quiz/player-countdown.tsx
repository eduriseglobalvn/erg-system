import { useEffect, useState, type ReactNode } from "react";

import type { LocalQuizAttemptSession } from "@/features/lcms/quiz/quiz-runtime";
import { serverNowMs } from "@/components/quiz/player-shell-utils";

type PlayerCountdownProps = {
  session: LocalQuizAttemptSession | null;
  deadlineAt: number | null;
  /** When false the interval is stopped and nothing is rendered. */
  active: boolean;
  /** Fires only when the "time is up" flag flips, not every second. */
  onExpiredChange: (expired: boolean) => void;
  children: (remainingSeconds: number) => ReactNode;
};

/** Owns the 1s tick so the (very large) player shell does not re-render every second. */
export function PlayerCountdown({ session, deadlineAt, active, onExpiredChange, children }: PlayerCountdownProps) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!active || deadlineAt === null || !session) return;
    const tick = () => {
      const now = serverNowMs(session);
      setRemaining(now === null ? null : Math.max(0, Math.ceil((deadlineAt - now) / 1000)));
    };
    tick();
    const timerId = window.setInterval(tick, 1000);
    return () => window.clearInterval(timerId);
  }, [active, deadlineAt, session]);

  const expired = remaining === 0;
  useEffect(() => {
    onExpiredChange(expired);
  }, [expired, onExpiredChange]);

  return active && remaining !== null ? <>{children(remaining)}</> : null;
}
