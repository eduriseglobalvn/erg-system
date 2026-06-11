import { useCallback, useEffect, useRef, useState } from "react";

import {
  heartbeatNotificationDevice,
  registerNotificationDevice,
  revokeNotificationDevice,
  unregisterNotificationDevice,
  type NotificationDeviceClientInfo,
  type NotificationDeviceRegistrationInput,
  type NotificationPermissionState,
} from "@/features/notifications/api/notification-api";

type NotificationState = "unsupported" | "blocked" | "default" | "enabled" | "unconfigured";

type BrowserPushRegistration = {
  registration: ServiceWorkerRegistration;
  subscription: PushSubscription;
};

type StoredPwaNotificationDevice = {
  deviceRegistrationId: string;
  endpoint?: string;
  firebaseInstallationId?: string;
  permissionState: NotificationPermissionState;
  portal: "lms";
  registrationToken?: string;
  serviceWorkerScope?: string;
  syncedAt: string;
};

const NOTIFICATION_PORTAL = "lms";
const HEARTBEAT_INTERVAL_MS = 15 * 60_000;
const DEVICE_STORAGE_KEY = "erg-lms-pwa-notification-device";

export function usePwaNotifications() {
  const [state, setState] = useState<NotificationState>(() => getInitialNotificationState());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncInFlightRef = useRef<Promise<NotificationState> | null>(null);

  const syncDeviceRegistration = useCallback(async () => {
    if (syncInFlightRef.current) {
      return syncInFlightRef.current;
    }

    const request = (async (): Promise<NotificationState> => {
      if (!isNotificationSupported()) {
        clearStoredDeviceRegistration();
        setState("unsupported");
        return "unsupported";
      }

      if (Notification.permission !== "granted") {
        clearStoredDeviceRegistration();
        const nextState = resolvePermissionOnlyState(Notification.permission);
        setState(nextState);
        return nextState;
      }

      const currentRegistration = await readCurrentBrowserPushRegistration();
      if (!currentRegistration) {
        clearStoredDeviceRegistration();
        setState("default");
        return "default";
      }

      await syncRegistrationWithApi(currentRegistration);
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
  }, []);

  useEffect(() => {
    if (!isNotificationSupported() || Notification.permission !== "granted") {
      return;
    }

    void syncDeviceRegistration().catch(() => {
      setState(resolvePermissionOnlyState(Notification.permission));
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
      clearStoredDeviceRegistration();
      setState("unsupported");
      return "unsupported" as const;
    }

    setBusy(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        clearStoredDeviceRegistration();
        const nextState = resolvePermissionOnlyState(permission);
        setState(nextState);
        return permission;
      }

      const currentRegistration = await ensureBrowserPushRegistration();
      await syncRegistrationWithApi(currentRegistration);
      setState("enabled");
      return "granted" as const;
    } catch (caught) {
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
  }, []);

  const disableNotifications = useCallback(async () => {
    if (!isNotificationSupported()) {
      clearStoredDeviceRegistration();
      setState("unsupported");
      return false;
    }

    setBusy(true);
    setError(null);

    try {
      const currentRegistration = await readCurrentBrowserPushRegistration();
      const storedDevice = readStoredDeviceRegistration();
      const registrationToken = currentRegistration?.subscription.endpoint ?? storedDevice?.registrationToken;
      const firebaseInstallationId = storedDevice?.firebaseInstallationId;

      if (registrationToken || firebaseInstallationId) {
        await unregisterNotificationDevice({
          portal: NOTIFICATION_PORTAL,
          firebaseInstallationId,
          registrationToken,
        });
      }

      if (storedDevice?.deviceRegistrationId) {
        await revokeNotificationDevice(storedDevice.deviceRegistrationId, NOTIFICATION_PORTAL).catch(() => undefined);
      }

      if (currentRegistration?.subscription) {
        await currentRegistration.subscription.unsubscribe();
      }

      clearStoredDeviceRegistration();
      setState(resolvePermissionOnlyState(Notification.permission));
      return true;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Khong the tat thong bao.";
      setError(message);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    busy,
    disableNotifications,
    enableNotifications,
    error,
    state,
  };
}

async function syncRegistrationWithApi({ registration, subscription }: BrowserPushRegistration) {
  const input = await buildDeviceRegistrationInput(registration, subscription);
  const storedDevice = readStoredDeviceRegistration();

  if (storedDevice && deviceIdentityMatches(input, storedDevice)) {
    await heartbeatNotificationDevice({
      portal: NOTIFICATION_PORTAL,
      deviceRegistrationId: storedDevice.deviceRegistrationId,
      firebaseInstallationId: input.firebaseInstallationId,
      registrationToken: input.registrationToken,
      permissionState: input.permissionState,
    });
    writeStoredDeviceRegistration({
      ...storedDevice,
      endpoint: input.endpoint,
      permissionState: input.permissionState,
      registrationToken: input.registrationToken,
      serviceWorkerScope: input.serviceWorkerScope,
      syncedAt: new Date().toISOString(),
    });
    return;
  }

  const response = await registerNotificationDevice(input);
  writeStoredDeviceRegistration({
    deviceRegistrationId: response.id,
    endpoint: input.endpoint,
    firebaseInstallationId: input.firebaseInstallationId,
    permissionState: input.permissionState,
    portal: NOTIFICATION_PORTAL,
    registrationToken: input.registrationToken,
    serviceWorkerScope: input.serviceWorkerScope,
    syncedAt: response.lastSeenAt ?? new Date().toISOString(),
  });
}

async function buildDeviceRegistrationInput(
  registration: ServiceWorkerRegistration,
  subscription: PushSubscription,
): Promise<NotificationDeviceRegistrationInput> {
  const pushRegistration = await resolvePushRegistrationAdapter(subscription);

  return {
    portal: NOTIFICATION_PORTAL,
    platform: "web_pwa",
    firebaseInstallationId: pushRegistration.firebaseInstallationId,
    registrationToken: pushRegistration.registrationToken,
    endpoint: pushRegistration.endpoint,
    serviceWorkerScope: registration.scope,
    permissionState: toNotificationPermissionState(Notification.permission),
    locale: readLocale(),
    timezone: readTimezone(),
    client: readClientInfo(),
  };
}

// Adapter boundary: future Firebase/Tauri providers can replace this without coupling the hook to an SDK import.
async function resolvePushRegistrationAdapter(subscription: PushSubscription) {
  return {
    endpoint: subscription.endpoint,
    firebaseInstallationId: undefined,
    registrationToken: subscription.endpoint,
  };
}

async function readCurrentBrowserPushRegistration(): Promise<BrowserPushRegistration | null> {
  if (!isNotificationSupported()) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return null;
  }

  return { registration, subscription };
}

async function ensureBrowserPushRegistration(): Promise<BrowserPushRegistration> {
  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    return { registration, subscription: existingSubscription };
  }

  const publicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY?.trim();
  if (!publicKey) {
    throw new PushConfigurationError("Chua cau hinh VITE_WEB_PUSH_PUBLIC_KEY.");
  }

  const subscription = await registration.pushManager.subscribe({
    applicationServerKey: urlBase64ToUint8Array(publicKey),
    userVisibleOnly: true,
  });

  return { registration, subscription };
}

function getInitialNotificationState(): NotificationState {
  if (!isNotificationSupported()) return "unsupported";
  if (Notification.permission === "denied") return "blocked";
  if (Notification.permission === "granted" && readStoredDeviceRegistration()) return "enabled";
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

function readStoredDeviceRegistration(): StoredPwaNotificationDevice | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!value) return null;
    return JSON.parse(value) as StoredPwaNotificationDevice;
  } catch {
    return null;
  }
}

function writeStoredDeviceRegistration(value: StoredPwaNotificationDevice) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage is best-effort; the backend registration remains the source of truth.
  }
}

function clearStoredDeviceRegistration() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(DEVICE_STORAGE_KEY);
  } catch {
    // Best-effort cleanup only.
  }
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
