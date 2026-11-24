import { useCallback, useEffect, useRef, useState } from "react";

import {
  fetchWebPushConfig,
  heartbeatNotificationDevice,
  registerNotificationDevice,
  revokeNotificationDevice,
  unregisterNotificationDevice,
  type NotificationDeviceClientInfo,
  type NotificationDeviceRegistrationInput,
  type NotificationPermissionState,
  type NotificationPortal,
} from "@/features/notifications/api/notification-api";
import {
  getFcmRegistrationToken,
  needsChannelSwitch,
  readFirebaseWebConfig,
  resolvePushChannel,
  type PushChannel,
} from "@/features/notifications/push/fcm-registration";
import { getDefaultTenantId } from "@/lib/graphql-client";
import { readStoredAuthSession } from "@/platform/auth/api/auth-token-storage";

type NotificationState = "unsupported" | "blocked" | "default" | "enabled" | "unconfigured";

type BrowserPushRegistration = {
  channel: PushChannel;
  registration: ServiceWorkerRegistration;
  subscription: PushSubscription;
};

type StoredPwaNotificationDevice = {
  channel?: PushChannel;
  deviceRegistrationId: string;
  endpoint?: string;
  firebaseInstallationId?: string;
  permissionState: NotificationPermissionState;
  portal: PwaNotificationPortal;
  registrationToken?: string;
  serviceWorkerScope?: string;
  syncedAt: string;
};

type PwaNotificationPortal = Extract<NotificationPortal, "lms" | "elearning">;

const DEFAULT_NOTIFICATION_PORTAL: PwaNotificationPortal = "lms";
const HEARTBEAT_INTERVAL_MS = 15 * 60_000;
const LMS_DEVICE_STORAGE_KEY = "erg-lms-pwa-notification-device";

export function usePwaNotifications(portal: PwaNotificationPortal = DEFAULT_NOTIFICATION_PORTAL) {
  const [state, setState] = useState<NotificationState>(() => getInitialNotificationState(portal));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncInFlightRef = useRef<Promise<NotificationState> | null>(null);
  // Server channel, read once per app open; undefined when unknown or push is off (then nothing moves).
  const wantedChannelRef = useRef<Promise<PushChannel | undefined> | null>(null);

  const syncDeviceRegistration = useCallback(async () => {
    if (syncInFlightRef.current) {
      return syncInFlightRef.current;
    }

    const request = (async (): Promise<NotificationState> => {
      if (!isNotificationSupported()) {
        clearStoredDeviceRegistration(portal);
        setState("unsupported");
        return "unsupported";
      }

      if (Notification.permission !== "granted") {
        clearStoredDeviceRegistration(portal);
        const nextState = resolvePermissionOnlyState(Notification.permission);
        setState(nextState);
        return nextState;
      }

      let currentRegistration = await readCurrentBrowserPushRegistration(portal);
      if (!currentRegistration) {
        // Permission is already granted (turning it off happens in the browser): subscribe silently, never ask again.
        currentRegistration = await ensureBrowserPushRegistration(portal);
      }

      wantedChannelRef.current ??= fetchWebPushConfig(portal).then(
        (config) => (config?.enabled ? resolvePushChannel(config.provider) : undefined),
        () => undefined,
      );
      const wantedChannel = await wantedChannelRef.current;
      if (wantedChannel && needsChannelSwitch(currentRegistration.channel, wantedChannel)) {
        // Permission is already granted: move this browser to the server's channel without asking again.
        await releaseBrowserPushRegistration(currentRegistration, portal);
        currentRegistration = await subscribeOnChannel(currentRegistration.registration, wantedChannel, portal);
      }

      await syncRegistrationWithApi(currentRegistration, portal);
      setState("enabled");
      return "enabled";
    })();

    syncInFlightRef.current = request;

    try {
      return await request;
    } finally {
      if (syncInFlightRef.current === request) {
        syncInFlightRef.current = null;
      }
    }
  }, [portal]);

  useEffect(() => {
    if (!isNotificationSupported() || Notification.permission !== "granted") {
      return;
    }

    void syncDeviceRegistration().catch((caught: unknown) => {
      setState(failureState(caught));
    });
  }, [syncDeviceRegistration]);

  useEffect(() => {
    if (!isNotificationSupported() || state !== "enabled") {
      return;
    }

    const heartbeat = () => {
      void syncDeviceRegistration().catch(() => undefined);
    };
    const intervalId = window.setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        heartbeat();
      }
    };

    window.addEventListener("focus", heartbeat);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", heartbeat);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state, syncDeviceRegistration]);

  const enableNotifications = useCallback(async () => {
    if (!isNotificationSupported()) {
      clearStoredDeviceRegistration(portal);
      setState("unsupported");
      return "unsupported" as const;
    }

    setBusy(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        clearStoredDeviceRegistration(portal);
        const nextState = resolvePermissionOnlyState(permission);
        setState(nextState);
        return permission;
      }

      const currentRegistration = await ensureBrowserPushRegistration(portal);
      await syncRegistrationWithApi(currentRegistration, portal);
      setState("enabled");
      return "granted" as const;
    } catch (caught) {
      if (caught instanceof PushUnsupportedError) {
        setState("unsupported");
        return "unsupported" as const;
      }
      if (caught instanceof PushConfigurationError) {
        setState("unconfigured");
        setError(caught.message);
        return "unconfigured" as const;
      }

      const message = caught instanceof Error ? caught.message : "Khong the bat thong bao.";
      setError(message);
      setState(resolvePermissionOnlyState(Notification.permission));
      return "failed" as const;
    } finally {
      setBusy(false);
    }
  }, [portal]);

  const disableNotifications = useCallback(async () => {
    if (!isNotificationSupported()) {
      clearStoredDeviceRegistration(portal);
      setState("unsupported");
      return false;
    }

    setBusy(true);
    setError(null);

    try {
      await releaseBrowserPushRegistration(await readCurrentBrowserPushRegistration(portal), portal);
      setState(resolvePermissionOnlyState(Notification.permission));
      return true;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Khong the tat thong bao.";
      setError(message);
      return false;
    } finally {
      setBusy(false);
    }
  }, [portal]);

  return {
    busy,
    disableNotifications,
    enableNotifications,
    error,
    state,
  };
}

async function syncRegistrationWithApi(current: BrowserPushRegistration, portal: PwaNotificationPortal) {
  const input = await buildDeviceRegistrationInput(current, portal);
  const storedDevice = readStoredDeviceRegistration(portal);

  // A rejected heartbeat means the server row was revoked or another account signed in on this browser took it:
  // register again so this browser delivers to whoever is signed in now.
  const heartbeatAccepted =
    storedDevice &&
    storedDevice.channel === current.channel &&
    deviceIdentityMatches(input, storedDevice) &&
    (await heartbeatNotificationDevice({
      portal,
      deviceRegistrationId: storedDevice.deviceRegistrationId,
      firebaseInstallationId: input.firebaseInstallationId,
      registrationToken: input.registrationToken,
      permissionState: input.permissionState,
    }).then(
      () => true,
      () => false,
    ));

  if (storedDevice && heartbeatAccepted) {
    writeStoredDeviceRegistration({
      ...storedDevice,
      endpoint: input.endpoint,
      permissionState: input.permissionState,
      registrationToken: input.registrationToken,
      serviceWorkerScope: input.serviceWorkerScope,
      syncedAt: new Date().toISOString(),
    }, portal);
    return;
  }

  const response = await registerNotificationDevice(input);
  writeStoredDeviceRegistration({
    channel: current.channel,
    deviceRegistrationId: response.id,
    endpoint: input.endpoint,
    firebaseInstallationId: input.firebaseInstallationId,
    permissionState: input.permissionState,
    portal,
    registrationToken: input.registrationToken,
    serviceWorkerScope: input.serviceWorkerScope,
    syncedAt: response.lastSeenAt ?? new Date().toISOString(),
  }, portal);
}

async function buildDeviceRegistrationInput(
  current: BrowserPushRegistration,
  portal: PwaNotificationPortal,
): Promise<NotificationDeviceRegistrationInput> {
  const { registration } = current;
  const pushRegistration = await resolvePushRegistrationAdapter(current);

  return {
    portal,
    platform: "web_pwa",
    firebaseInstallationId: pushRegistration.firebaseInstallationId,
    registrationToken: pushRegistration.registrationToken,
    endpoint: pushRegistration.endpoint,
    keys: pushRegistration.keys,
    transport: pushRegistration.transport,
    serviceWorkerScope: registration.scope,
    permissionState: toNotificationPermissionState(Notification.permission),
    locale: readLocale(),
    timezone: readTimezone(),
    client: readClientInfo(),
  };
}

// Adapter boundary: the hook never imports the Firebase SDK; fcm-registration loads it on demand.
async function resolvePushRegistrationAdapter({ channel, registration, subscription }: BrowserPushRegistration) {
  if (channel === "fcm") {
    // getToken returns the cached token, or a refreshed one when Firebase rotated it.
    const token = await getFcmRegistrationToken(registration);
    if (!token) throw new PushUnsupportedError();
    return { endpoint: undefined, firebaseInstallationId: undefined, keys: undefined, registrationToken: token, transport: "FCM" as const };
  }
  const keys = subscription.toJSON().keys;
  return {
    endpoint: subscription.endpoint,
    firebaseInstallationId: undefined,
    keys: keys ? { auth: keys.auth, p256dh: keys.p256dh } : undefined,
    registrationToken: subscription.endpoint,
    transport: "WEB_PUSH" as const,
  };
}

async function readCurrentBrowserPushRegistration(portal: PwaNotificationPortal): Promise<BrowserPushRegistration | null> {
  if (!isNotificationSupported()) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return null;
  }

  return { channel: subscriptionChannel(subscription, readStoredDeviceRegistration(portal)), registration, subscription };
}

/** Which channel created this subscription: Firebase subscribes with its own VAPID key, ours uses the server key. */
function subscriptionChannel(subscription: PushSubscription, storedDevice: StoredPwaNotificationDevice | null): PushChannel {
  const key = subscription.options?.applicationServerKey;
  const firebaseKey = readFirebaseWebConfig()?.vapidKey;
  if (key && firebaseKey) return arrayBufferToBase64Url(key) === firebaseKey ? "fcm" : "webpush";
  return storedDevice?.channel ?? "webpush";
}

async function ensureBrowserPushRegistration(portal: PwaNotificationPortal): Promise<BrowserPushRegistration> {
  const config = await fetchWebPushConfig(portal);
  if (!config.enabled) {
    throw new PushConfigurationError("Máy chủ chưa bật thông báo đẩy.");
  }
  const channel = resolvePushChannel(config.provider);
  const current = await readCurrentBrowserPushRegistration(portal);
  if (current && !needsChannelSwitch(current.channel, channel)) {
    return current;
  }
  if (current) {
    await releaseBrowserPushRegistration(current, portal);
  }
  return subscribeOnChannel(await navigator.serviceWorker.ready, channel, portal, config.publicKey);
}

async function subscribeOnChannel(
  registration: ServiceWorkerRegistration,
  channel: PushChannel,
  portal: PwaNotificationPortal,
  knownPublicKey?: string,
): Promise<BrowserPushRegistration> {
  if (channel === "fcm") {
    if (!readFirebaseWebConfig()) throw new PushConfigurationError("Thiếu cấu hình Firebase cho thông báo đẩy.");
    // Firebase subscribes the push manager of ERG's own service worker (no firebase-messaging-sw.js).
    const token = await getFcmRegistrationToken(registration);
    const subscription = token ? await registration.pushManager.getSubscription() : null;
    if (!subscription) throw new PushUnsupportedError();
    return { channel, registration, subscription };
  }

  // The VAPID key comes from the server; without it there is nothing to subscribe to.
  const publicKey = (knownPublicKey ?? (await fetchWebPushConfig(portal)).publicKey)?.trim();
  if (!publicKey) {
    throw new PushConfigurationError("Máy chủ chưa bật Web Push.");
  }

  const subscription = await registration.pushManager.subscribe({
    applicationServerKey: urlBase64ToUint8Array(publicKey),
    userVisibleOnly: true,
  });

  return { channel, registration, subscription };
}

/** Unregisters this browser's device on the server and drops its push subscription (logout of push, or channel move). */
async function releaseBrowserPushRegistration(current: BrowserPushRegistration | null, portal: PwaNotificationPortal) {
  const storedDevice = readStoredDeviceRegistration(portal);
  // An FCM device is keyed by its token, which only the stored record knows; Web Push by the endpoint.
  const registrationToken =
    current?.channel === "fcm" ? storedDevice?.registrationToken : current?.subscription.endpoint ?? storedDevice?.registrationToken;
  const firebaseInstallationId = storedDevice?.firebaseInstallationId;

  if (registrationToken || firebaseInstallationId) {
    await unregisterNotificationDevice({ portal, firebaseInstallationId, registrationToken });
  }
  if (storedDevice?.deviceRegistrationId) {
    await revokeNotificationDevice(storedDevice.deviceRegistrationId, portal).catch(() => undefined);
  }
  if (current?.subscription) {
    await current.subscription.unsubscribe();
  }
  clearStoredDeviceRegistration(portal);
}

function arrayBufferToBase64Url(buffer: ArrayBuffer) {
  let binary = "";
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function getInitialNotificationState(portal: PwaNotificationPortal): NotificationState {
  if (!isNotificationSupported()) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  if (Notification.permission === "granted" && readStoredDeviceRegistration(portal)) return "enabled";
  return "default";
}

function resolvePermissionOnlyState(permission: NotificationPermission): NotificationState {
  if (permission === "denied") return "blocked";
  return "default";
}

function toNotificationPermissionState(permission: NotificationPermission): NotificationPermissionState {
  if (permission === "granted" || permission === "denied") return permission;
  return "default";
}

function isNotificationSupported() {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function deviceIdentityMatches(input: NotificationDeviceRegistrationInput, storedDevice: StoredPwaNotificationDevice) {
  return (
    storedDevice.registrationToken === input.registrationToken &&
    storedDevice.firebaseInstallationId === input.firebaseInstallationId &&
    storedDevice.serviceWorkerScope === input.serviceWorkerScope
  );
}


export function getPwaNotificationDeviceStorageKey(portal: PwaNotificationPortal = DEFAULT_NOTIFICATION_PORTAL) {
  const tenantId = getDefaultTenantId();
  const session = readStoredAuthSession(portal) as { accountId?: string | null } | null;
  const accountId = session?.accountId?.trim();
  const baseKey = pwaNotificationDeviceBaseKey(portal);
  if (!accountId) return baseKey;
  return `${baseKey}:${tenantId}:${accountId}`;
}

function readStoredDeviceRegistration(portal: PwaNotificationPortal): StoredPwaNotificationDevice | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(getPwaNotificationDeviceStorageKey(portal));
    if (!value) return null;
    return JSON.parse(value) as StoredPwaNotificationDevice;
  } catch {
    return null;
  }
}

function writeStoredDeviceRegistration(value: StoredPwaNotificationDevice, portal: PwaNotificationPortal) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getPwaNotificationDeviceStorageKey(portal), JSON.stringify(value));
  } catch {
    // Storage is best-effort; the backend registration remains the source of truth.
  }
}

function clearStoredDeviceRegistration(portal: PwaNotificationPortal) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(getPwaNotificationDeviceStorageKey(portal));
    window.localStorage.removeItem(pwaNotificationDeviceBaseKey(portal));
  } catch {
    // Best-effort cleanup only.
  }
}

function pwaNotificationDeviceBaseKey(portal: PwaNotificationPortal) {
  return portal === "elearning" ? "erg-elearning-pwa-notification-device" : LMS_DEVICE_STORAGE_KEY;
}

function readLocale() {
  if (typeof navigator === "undefined") return undefined;
  return navigator.languages?.[0] ?? navigator.language;
}

function readTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

function readClientInfo(): NotificationDeviceClientInfo {
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const uaData = readNavigatorUserAgentData();
  const primaryBrand = uaData?.brands?.find((brand) => !brand.brand.toLowerCase().includes("not")) ?? uaData?.brands?.[0];

  return {
    browserName: primaryBrand?.brand ?? resolveBrowserName(userAgent),
    browserVersion: primaryBrand?.version ?? resolveBrowserVersion(userAgent),
    osName: uaData?.platform ?? resolveOsName(userAgent),
    userAgent,
  };
}

function readNavigatorUserAgentData() {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & {
    userAgentData?: {
      brands?: Array<{ brand: string; version: string }>;
      platform?: string;
    };
  }).userAgentData;
}

function resolveBrowserName(userAgent: string) {
  if (/Edg\//i.test(userAgent)) return "Edge";
  if (/Chrome\//i.test(userAgent)) return "Chrome";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  if (/Safari\//i.test(userAgent)) return "Safari";
  return "Browser";
}

function resolveBrowserVersion(userAgent: string) {
  const match = userAgent.match(/(?:Edg|Chrome|Firefox|Version)\/([\d.]+)/i);
  return match?.[1];
}

function resolveOsName(userAgent: string) {
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Mac OS X/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Unknown";
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

class PushConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PushConfigurationError";
  }
}

/** Firebase cannot push on this browser (isSupported() is false); the in-app bell still works. */
class PushUnsupportedError extends Error {
  constructor() {
    super("Trình duyệt này chưa nhận được thông báo đẩy.");
    this.name = "PushUnsupportedError";
  }
}

function failureState(caught: unknown): NotificationState {
  if (caught instanceof PushUnsupportedError) return "unsupported";
  if (caught instanceof PushConfigurationError) return "unconfigured";
  return resolvePermissionOnlyState(Notification.permission);
}
