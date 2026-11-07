import { useEffect, useState } from "react";

/** Re-renders every second with the server-corrected time; `now` is the stable `useServerClock().now`. */
export function useServerNow(now: () => Date, tickMs = 1000): Date {
  const [value, setValue] = useState(now);
  useEffect(() => {
    const id = setInterval(() => setValue(now()), tickMs);
    return () => clearInterval(id);
  }, [now, tickMs]);
  return value;
}
