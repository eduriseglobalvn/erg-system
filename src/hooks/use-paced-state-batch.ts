import { useCallback } from "react";

type StateUpdate = () => void;

export function usePacedStateBatch() {
  return useCallback((update: StateUpdate) => update(), []);
}
