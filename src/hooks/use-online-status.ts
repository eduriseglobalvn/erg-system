import { useSyncExternalStore } from "react";

import {
  getNetworkStateServerSnapshot,
  getNetworkStateSnapshot,
  subscribeNetworkState,
} from "@/lib/network-quality";

export function useOnlineStatus() {
  return useSyncExternalStore(
    subscribeNetworkState,
    () => getNetworkStateSnapshot().online,
    () => getNetworkStateServerSnapshot().online,
  );
}
