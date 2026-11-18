/**
 * FCM channel for browser push. The Firebase SDK is loaded only on demand (enable click or a silent
 * channel switch) so it stays out of the main bundle; it reuses ERG's own PWA service worker.
 */

export type PushChannel = "fcm" | "webpush";

export type FirebaseWebConfig = {
  apiKey: string;
  appId: string;
  authDomain: string;
  messagingSenderId: string;
  projectId: string;
  storageBucket: string;
  vapidKey: string;
};

type FirebaseEnv = Partial<Record<string, string | boolean | undefined>>;

/** Reads the public Firebase web config from VITE_FIREBASE_*; null when any required value is missing. */
export function readFirebaseWebConfig(env: FirebaseEnv = import.meta.env): FirebaseWebConfig | null {
  const read = (name: string) => {
    const value = env[name];
    return typeof value === "string" ? value.trim() : "";
  };
  const config = {
    apiKey: read("VITE_FIREBASE_API_KEY"),
    appId: read("VITE_FIREBASE_APP_ID"),
    authDomain: read("VITE_FIREBASE_AUTH_DOMAIN"),
    messagingSenderId: read("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    projectId: read("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: read("VITE_FIREBASE_STORAGE_BUCKET"),
    vapidKey: read("VITE_FIREBASE_VAPID_KEY"),
  };
  return Object.values(config).every(Boolean) ? config : null;
}

/** Channel the server wants; older servers without `provider` only know VAPID Web Push. */
export function resolvePushChannel(provider: string | null | undefined): PushChannel {
  return provider === "fcm" ? "fcm" : "webpush";
}

/** A device registered on another channel must be moved; a device with no recorded channel predates FCM. */
export function needsChannelSwitch(stored: PushChannel | undefined, wanted: PushChannel) {
  return (stored ?? "webpush") !== wanted;
}

async function loadMessaging(config: FirebaseWebConfig) {
  const [{ getApps, initializeApp }, messaging] = await Promise.all([
    import("firebase/app"),
    import("firebase/messaging"),
  ]);
  const { apiKey, appId, authDomain, messagingSenderId, projectId, storageBucket } = config;
  // No measurementId on purpose: Analytics is never loaded.
  const app =
    getApps()[0] ?? initializeApp({ apiKey, appId, authDomain, messagingSenderId, projectId, storageBucket });
  return { app, messaging };
}

/** Returns the FCM registration token bound to ERG's service worker, or null when FCM is unavailable here. */
export async function getFcmRegistrationToken(serviceWorkerRegistration: ServiceWorkerRegistration) {
  const config = readFirebaseWebConfig();
  if (!config) return null;
  const { app, messaging } = await loadMessaging(config);
  if (!(await messaging.isSupported())) return null;
  return messaging.getToken(messaging.getMessaging(app), {
    serviceWorkerRegistration,
    vapidKey: config.vapidKey,
  });
}
