const DENIED_HINT_PREFIX = "erg-push-denied-hint:";

/** Server push is usable: FCM, or Web Push with a VAPID public key. */
export function pushServerReady(config: { enabled?: boolean; provider?: string | null; publicKey?: string | null } | null | undefined) {
  return Boolean(config?.enabled && (config.provider === "fcm" || config.publicKey));
}

export type PushPromptInput = {
  serverReady: boolean;
  /** Browser permission already granted: usePwaNotifications subscribes silently, so never ask. */
  permissionGranted: boolean;
  /** null while the browser's push subscription is still being read. */
  subscriptionMissing: boolean | null;
  /** usePwaNotifications state: "default" = not asked yet, or granted without a subscription. */
  state: string;
  dismissed: boolean;
  quizActive: boolean;
};

/** Asked on every app open until this browser is subscribed; «Để sau» only hides it for this app open. */
export function shouldOfferPushPrompt(input: PushPromptInput) {
  return input.serverReady && !input.permissionGranted && input.subscriptionMissing === true && input.state === "default" && !input.dismissed && !input.quizActive;
}

/** Permission denied: the how-to-re-enable hint is shown once per account, never repeated. */
export function readDeniedHintSeen(accountId: string) {
  try {
    return window.localStorage.getItem(DENIED_HINT_PREFIX + accountId) === "1";
  } catch {
    // Blocked storage: treat as seen so the hint cannot nag on every load.
    return true;
  }
}

export function markDeniedHintSeen(accountId: string) {
  try {
    window.localStorage.setItem(DENIED_HINT_PREFIX + accountId, "1");
  } catch {
    // Storage unavailable: nothing to remember.
  }
}
