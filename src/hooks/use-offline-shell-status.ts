import { useEffect, useSyncExternalStore } from "react";

import {
  getNetworkStateServerSnapshot,
  getNetworkStateSnapshot,
  subscribeNetworkState,
  type NetworkStateSnapshot,
} from "@/lib/network-quality";
import { recordOfflineShellTelemetry, type OfflineShellTelemetryState } from "@/lib/client-telemetry";

export type OfflineShellStatusOptions = {
  conflictCount?: number;
  failedCount?: number;
  pendingCount?: number;
  trackTelemetry?: boolean;
};

export function useOfflineShellStatus(options: OfflineShellStatusOptions = {}): NetworkStateSnapshot {
  const snapshot = useSyncExternalStore(subscribeNetworkState, getNetworkStateSnapshot, getNetworkStateServerSnapshot);

  useEffect(() => {
    if (options.trackTelemetry === false) return;
    const timer = window.setTimeout(() => {
      const state: OfflineShellTelemetryState = options.failedCount ? "failed"
        : options.conflictCount ? "conflict"
          : options.pendingCount ? "pending"
            : snapshot.quality;
      recordOfflineShellTelemetry({
        conflictCount: options.conflictCount,
        networkQuality: snapshot.quality,
        pendingCount: options.pendingCount,
        state,
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [options.conflictCount, options.failedCount, options.pendingCount, options.trackTelemetry, snapshot]);

  return snapshot;
}
