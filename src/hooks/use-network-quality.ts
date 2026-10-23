import { useSyncExternalStore } from "react";

import {
  getAdaptiveLoadingSnapshot,
  resolveAdaptiveLoadingPolicy,
  subscribeAdaptiveLoading,
} from "@/lib/network-quality";

const SERVER_POLICY = resolveAdaptiveLoadingPolicy();

export function useAdaptiveLoadingPolicy() {
  return useSyncExternalStore(subscribeAdaptiveLoading, getAdaptiveLoadingSnapshot, () => SERVER_POLICY);
}
