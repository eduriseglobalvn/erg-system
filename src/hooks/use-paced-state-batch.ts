import { Batcher } from "@tanstack/pacer";
import { useCallback, useEffect, useMemo } from "react";

type StateUpdate = () => void;

export function usePacedStateBatch(wait = 0) {
  const batcher = useMemo(
    () =>
      new Batcher<StateUpdate>((updates) => {
        updates.forEach((update) => update());
      }, { wait }),
    [wait],
  );

  useEffect(
    () => () => {
      batcher.cancel();
      batcher.clear();
    },
    [batcher],
  );

  return useCallback((update: StateUpdate) => batcher.addItem(update), [batcher]);
}
