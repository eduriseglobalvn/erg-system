import { useEffect, useState } from "react";

/** Wall clock that re-renders its component every `intervalMs` (keep it in small leaf components). */
export function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
