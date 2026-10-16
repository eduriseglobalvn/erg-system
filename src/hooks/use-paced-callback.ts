import { Debouncer } from "@tanstack/pacer";
import { useCallback, useEffect, useMemo, useRef } from "react";

type AnyFunction = (...args: any[]) => void;

export function useDebouncedCallback<TFn extends AnyFunction>(callback: TFn, wait = 180) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const debouncer = useMemo(
    () =>
      new Debouncer((...args: Parameters<TFn>) => {
        callbackRef.current(...args);
      }, { wait }),
    [wait],
  );

  useEffect(() => () => debouncer.cancel(), [debouncer]);

  const run = useCallback((...args: Parameters<TFn>) => debouncer.maybeExecute(...args), [debouncer]);
  const cancel = useCallback(() => debouncer.cancel(), [debouncer]);

  return useMemo(() => ({ cancel, run }), [cancel, run]);
}
