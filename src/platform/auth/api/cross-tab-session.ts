import {
  AUTH_SESSION_STORAGE_CHANGED_EVENT,
  clearStoredAuthSessions,
} from "@/platform/auth/api/auth-token-storage";

const CHANNEL_NAME = "erg-auth-session-sync-v2";

/** Signals only. Tokens must never travel between tabs; each tab re-reads its own storage. */
type SyncMessage = { type: "session-changed" } | { type: "signed-out" };

let channel: BroadcastChannel | null = null;
let applyingRemoteMessage = false;

export function initializeCrossTabAuthSync() {
  if (channel || typeof window === "undefined" || typeof BroadcastChannel === "undefined") return channel;
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = ({ data }: MessageEvent<SyncMessage>) => handleMessage(data);
  window.addEventListener(AUTH_SESSION_STORAGE_CHANGED_EVENT, handleLocalSessionChange as EventListener);
  return channel;
}

function handleMessage(message: SyncMessage) {
  if (!message || typeof message !== "object") return;
  applyingRemoteMessage = true;
  try {
    if (message.type === "signed-out") {
      clearStoredAuthSessions();
    } else if (message.type === "session-changed") {
      window.dispatchEvent(new CustomEvent(AUTH_SESSION_STORAGE_CHANGED_EVENT, { detail: undefined }));
    }
  } finally {
    applyingRemoteMessage = false;
  }
}

function handleLocalSessionChange(event: CustomEvent<unknown>) {
  if (applyingRemoteMessage || !channel) return;
  channel.postMessage({ type: event.detail ? "session-changed" : "signed-out" } satisfies SyncMessage);
}
