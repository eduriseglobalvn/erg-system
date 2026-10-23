import {
  AUTH_SESSION_STORAGE_CHANGED_EVENT,
  clearStoredAuthSessions,
  hasStoredAuthCredential,
  readStoredAuthIdentity,
  writeStoredAuthIdentity,
  type StoredAuthIdentity,
  type StoredAuthSession,
} from "@/platform/auth/api/auth-token-storage";

const CHANNEL_NAME = "erg-auth-session-sync-v1";
const DEFAULT_HYDRATION_TIMEOUT_MS = 150;

type SyncMessage =
  | { type: "SESSION_REQUEST"; requestId: string; portal: StoredAuthSession["portal"] }
  | { type: "SESSION_RESPONSE"; requestId: string; session: StoredAuthIdentity }
  | { type: "SESSION_UPDATED"; session: StoredAuthIdentity }
  | { type: "SESSION_CLEARED" };

let channel: BroadcastChannel | null = null;
let applyingRemoteMessage = false;
const pendingHydrations = new Map<string, (session: StoredAuthIdentity) => void>();

export function initializeCrossTabAuthSync() {
  if (channel || typeof window === "undefined" || typeof BroadcastChannel === "undefined") return channel;
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = ({ data }: MessageEvent<SyncMessage>) => handleMessage(data);
  window.addEventListener(AUTH_SESSION_STORAGE_CHANGED_EVENT, handleLocalSessionChange as EventListener);
  return channel;
}

export async function hydrateSessionFromPeerTab(
  portal: StoredAuthSession["portal"],
  timeoutMs = DEFAULT_HYDRATION_TIMEOUT_MS,
) {
  const activeChannel = initializeCrossTabAuthSync();
  if (hasStoredAuthCredential(readStoredAuthIdentity(portal))) return false;
  if (!activeChannel) return false;
  const requestId = createRequestId();

  return new Promise<boolean>((resolve) => {
    const timeoutId = window.setTimeout(() => {
      pendingHydrations.delete(requestId);
      resolve(false);
    }, timeoutMs);
    pendingHydrations.set(requestId, (session) => {
      window.clearTimeout(timeoutId);
      pendingHydrations.delete(requestId);
      applyingRemoteMessage = true;
      try {
        writeStoredAuthIdentity(session);
      } finally {
        applyingRemoteMessage = false;
      }
      resolve(true);
    });
    activeChannel.postMessage({ type: "SESSION_REQUEST", requestId, portal } satisfies SyncMessage);
  });
}

function handleMessage(message: SyncMessage) {
  if (!message || typeof message !== "object" || !("type" in message)) return;
  if (message.type === "SESSION_REQUEST") {
    const session = readStoredAuthIdentity(message.portal);
    if (session && hasStoredAuthCredential(session)) {
      channel?.postMessage({ type: "SESSION_RESPONSE", requestId: message.requestId, session } satisfies SyncMessage);
    }
    return;
  }
  if (message.type === "SESSION_RESPONSE") {
    pendingHydrations.get(message.requestId)?.(message.session);
    return;
  }
  applyingRemoteMessage = true;
  try {
    if (message.type === "SESSION_UPDATED" && hasStoredAuthCredential(message.session)) {
      writeStoredAuthIdentity(message.session);
    } else if (message.type === "SESSION_CLEARED") {
      clearStoredAuthSessions();
    }
  } finally {
    applyingRemoteMessage = false;
  }
}

function handleLocalSessionChange(event: CustomEvent<StoredAuthIdentity | null>) {
  if (applyingRemoteMessage || !channel) return;
  if (event.detail && hasStoredAuthCredential(event.detail)) {
    channel.postMessage({ type: "SESSION_UPDATED", session: event.detail } satisfies SyncMessage);
  } else {
    channel.postMessage({ type: "SESSION_CLEARED" } satisfies SyncMessage);
  }
}

function createRequestId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}
