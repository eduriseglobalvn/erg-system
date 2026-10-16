export type EffectiveConnectionType = "slow-2g" | "2g" | "3g" | "4g";
export type AdaptiveLoadingMode = "full" | "reduced" | "minimal";

export type ConnectionSnapshot = {
  effectiveType?: EffectiveConnectionType;
  online?: boolean;
  saveData?: boolean;
};

export type NetworkQuality = "offline" | "degraded" | "online";

export type NetworkStateSnapshot = Readonly<{
  effectiveType?: EffectiveConnectionType;
  online: boolean;
  policy: AdaptiveLoadingPolicy;
  quality: NetworkQuality;
  saveData: boolean;
}>;

export type AdaptiveLoadingPolicy = {
  mode: AdaptiveLoadingMode;
  preferReducedMedia: boolean;
  prefetchNonEssential: boolean;
  preloadRoutes: boolean;
};

type BrowserConnection = EventTarget & {
  effectiveType?: string;
  saveData?: boolean;
};

const FULL_POLICY: AdaptiveLoadingPolicy = {
  mode: "full",
  preferReducedMedia: false,
  prefetchNonEssential: true,
  preloadRoutes: true,
};

const REDUCED_POLICY: AdaptiveLoadingPolicy = {
  mode: "reduced",
  preferReducedMedia: true,
  prefetchNonEssential: false,
  preloadRoutes: false,
};

const MINIMAL_POLICY: AdaptiveLoadingPolicy = {
  mode: "minimal",
  preferReducedMedia: true,
  prefetchNonEssential: false,
  preloadRoutes: false,
};

export function resolveAdaptiveLoadingPolicy(snapshot?: ConnectionSnapshot): AdaptiveLoadingPolicy {
  if (!snapshot) return FULL_POLICY;
  if (snapshot.online === false || snapshot.saveData || snapshot.effectiveType === "slow-2g" || snapshot.effectiveType === "2g") {
    return MINIMAL_POLICY;
  }
  if (snapshot.effectiveType === "3g") return REDUCED_POLICY;
  return FULL_POLICY;
}

export function resolveNetworkState(snapshot: ConnectionSnapshot = {}): NetworkStateSnapshot {
  const online = snapshot.online !== false;
  const saveData = snapshot.saveData === true;
  const policy = resolveAdaptiveLoadingPolicy({ ...snapshot, online, saveData });
  return Object.freeze({
    effectiveType: snapshot.effectiveType,
    online,
    policy,
    quality: !online ? "offline" : policy.mode === "full" ? "online" : "degraded",
    saveData,
  });
}

function getBrowserConnection() {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: BrowserConnection }).connection;
}

function readBrowserState(): NetworkStateSnapshot {
  if (typeof navigator === "undefined") return resolveNetworkState();
  const connection = getBrowserConnection();
  const effectiveType = connection?.effectiveType;
  return resolveNetworkState({
    effectiveType: effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g" || effectiveType === "4g" ? effectiveType : undefined,
    online: navigator.onLine !== false,
    saveData: connection?.saveData === true,
  });
}

let currentState = readBrowserState();
let currentPolicy = currentState.policy;
const listeners = new Set<() => void>();
let detachBrowserListeners: (() => void) | undefined;

function refreshPolicy() {
  const nextState = readBrowserState();
  if (
    nextState.online === currentState.online &&
    nextState.effectiveType === currentState.effectiveType &&
    nextState.saveData === currentState.saveData &&
    nextState.quality === currentState.quality
  ) return;
  currentState = nextState;
  currentPolicy = nextState.policy;
  listeners.forEach((listener) => listener());
}

function attachBrowserListeners() {
  if (typeof window === "undefined") return () => undefined;
  const connection = getBrowserConnection();
  connection?.addEventListener("change", refreshPolicy);
  window.addEventListener("online", refreshPolicy);
  window.addEventListener("offline", refreshPolicy);
  return () => {
    connection?.removeEventListener("change", refreshPolicy);
    window.removeEventListener("online", refreshPolicy);
    window.removeEventListener("offline", refreshPolicy);
  };
}

export function getAdaptiveLoadingPolicy() {
  return readBrowserState().policy;
}

export function getAdaptiveLoadingSnapshot() {
  return currentPolicy;
}

export function getNetworkStateSnapshot() {
  return currentState;
}

export function getNetworkStateServerSnapshot() {
  return resolveNetworkState({ online: true });
}

export function subscribeAdaptiveLoading(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) detachBrowserListeners = attachBrowserListeners();
  refreshPolicy();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      detachBrowserListeners?.();
      detachBrowserListeners = undefined;
    }
  };
}

export const subscribeNetworkState = subscribeAdaptiveLoading;
