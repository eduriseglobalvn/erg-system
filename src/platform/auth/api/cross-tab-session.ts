import {
  AUTH_SESSION_STORAGE_CHANGED_EVENT,
  clearStoredAuthSessions,
  currentTabAccountId,
} from "@/platform/auth/api/auth-token-storage";

const CHANNEL_NAME = "erg-auth-session-sync-v2";

/** Signals only. Tokens must never travel between tabs; each tab re-reads its own storage. `accountId` says whose session changed. */
type SyncMessage = { type: "session-changed"; accountId?: string } | { type: "signed-out"; accountId?: string };

let channel: BroadcastChannel | null = null;
let applyingRemoteMessage = false;
/** The account this tab is signed in as; kept here because storage is already empty when a sign-out is announced. */
let ownAccountId: string | undefined;

export function initializeCrossTabAuthSync() {
  if (channel || typeof window === "undefined" || typeof BroadcastChannel === "undefined") return channel;
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = ({ data }: MessageEvent<SyncMessage>) => handleMessage(data);
  window.addEventListener(AUTH_SESSION_STORAGE_CHANGED_EVENT, handleLocalSessionChange as EventListener);
  ownAccountId = currentTabAccountId();
  return channel;
}

function handleMessage(message: SyncMessage) {
  if (!message || typeof message !== "object") return;
  const own = ownAccountId ?? currentTabAccountId();
  const otherAccount = Boolean(message.accountId && own && message.accountId !== own);
  if (message.type === "signed-out") {
    // Another account signing out is not this tab's business. Nor is an anonymous sign-out: a superseded tab left on
    // the sign-in page sends one when it re-reads its empty storage, and that ended the newer account's session.
    if (!own || message.accountId === own) clearQuietly();
  } else if (message.type === "session-changed") {
    // Owner rule 18/11: one browser holds one account. A newer sign-in as someone else ends this tab's session.
    if (otherAccount) endSupersededSession();
    else quietly(() => window.dispatchEvent(new CustomEvent(AUTH_SESSION_STORAGE_CHANGED_EVENT)));
  }
}

function clearQuietly() {
  quietly(clearStoredAuthSessions);
  ownAccountId = undefined;
}

/** Runs a reaction to a remote signal without announcing it back to the other tabs. */
function quietly(run: () => void) {
  applyingRemoteMessage = true;
  try {
    run();
  } finally {
    applyingRemoteMessage = false;
  }
}

/**
 * Forgets this tab's session and reloads, so the route guards send the tab to sign-in.
 * No server logout from here: with cookie (BFF) sign-in the cookie already belongs to the newer account, and a
 * logout would end that one. The old session just runs out; its refresh token is gone with this tab's storage.
 */
function endSupersededSession() {
  ownAccountId = undefined;
  // Only this tab's tokens: the remembered sign-in in localStorage belongs to the newer account.
  window.sessionStorage.clear();
  window.location.reload();
}

function handleLocalSessionChange(event: CustomEvent<{ accountId?: string } | null | undefined>) {
  if (applyingRemoteMessage || !channel) return;
  const accountId = event.detail?.accountId ?? ownAccountId;
  ownAccountId = event.detail ? accountId : undefined;
  channel.postMessage({ type: event.detail ? "session-changed" : "signed-out", ...(accountId ? { accountId } : {}) } satisfies SyncMessage);
}
