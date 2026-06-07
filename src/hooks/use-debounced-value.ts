import { Debouncer } from "@tanstack/pacer";
import { useEffect, useMemo, useState } from "react";

export function useDebouncedValue<TValue>(value: TValue, wait = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const debouncer = useMemo(
    () =>
      new Debouncer((nextValue: TValue) => {
        setDebouncedValue(nextValue);
      }, { wait }),
    [wait],
  );

  useEffect(() => {
    debouncer.maybeExecute(value);
    return () => debouncer.cancel();
  }, [debouncer, value]);

  return debouncedValue;
}
