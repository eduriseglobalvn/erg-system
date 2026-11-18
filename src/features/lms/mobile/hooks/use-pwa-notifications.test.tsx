import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  getDefaultTenantId: vi.fn(() => "tenant-a"),
  readStoredAuthSession: vi.fn(),
  fetchWebPushConfig: vi.fn(),
  registerNotificationDevice: vi.fn(),
  getFcmRegistrationToken: vi.fn(),
  unregisterNotificationDevice: vi.fn(),
}));

vi.mock("@/features/notifications/push/fcm-registration", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/notifications/push/fcm-registration")>()),
  getFcmRegistrationToken: mocks.getFcmRegistrationToken,
  readFirebaseWebConfig: () => ({ vapidKey: "fcm-key" }),
}));

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: mocks.getDefaultTenantId,
}));

vi.mock("@/platform/auth/api/auth-token-storage", () => ({
  readStoredAuthSession: mocks.readStoredAuthSession,
}));

vi.mock("@/features/notifications/api/notification-api", () => ({
  fetchWebPushConfig: mocks.fetchWebPushConfig,
  heartbeatNotificationDevice: vi.fn(),
  registerNotificationDevice: mocks.registerNotificationDevice,
  revokeNotificationDevice: vi.fn(async () => undefined),
  unregisterNotificationDevice: mocks.unregisterNotificationDevice,
}));

import {
  getPwaNotificationDeviceStorageKey,
  usePwaNotifications,
} from "@/features/lms/mobile/hooks/use-pwa-notifications";

beforeEach(() => {
  window.localStorage.clear();
  mocks.getDefaultTenantId.mockReturnValue("tenant-a");
  mocks.readStoredAuthSession.mockReturnValue({ accountId: "student-b" });
  mocks.fetchWebPushConfig.mockReset();
  mocks.registerNotificationDevice.mockReset();
  mocks.getFcmRegistrationToken.mockReset();
  mocks.unregisterNotificationDevice.mockReset();
  installNotificationSupport("granted");
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

test("scopes stored PWA notification device by tenant and LMS account", () => {
  expect(getPwaNotificationDeviceStorageKey()).toBe("erg-lms-pwa-notification-device:tenant-a:student-b");
});

test("uses an isolated device key for the Student PWA", () => {
  expect(getPwaNotificationDeviceStorageKey("elearning")).toBe(
    "erg-elearning-pwa-notification-device:tenant-a:student-b",
  );
  expect(mocks.readStoredAuthSession).toHaveBeenCalledWith("elearning");
});

test("does not treat a legacy global notification device as enabled for a signed-in account", () => {
  window.localStorage.setItem(
    "erg-lms-pwa-notification-device",
    JSON.stringify({
      deviceRegistrationId: "device-a",
      permissionState: "granted",
      portal: "lms",
      registrationToken: "token-a",
      syncedAt: new Date(0).toISOString(),
    }),
  );

  const { result } = renderHook(() => usePwaNotifications());

  expect(result.current.state).toBe("default");
});

test("keeps the legacy storage key only for anonymous/no-session notification state", () => {
  mocks.readStoredAuthSession.mockReturnValue(null);

  expect(getPwaNotificationDeviceStorageKey()).toBe("erg-lms-pwa-notification-device");
});

test("subscribes with the server VAPID key and registers a WEB_PUSH device with the subscription keys", async () => {
  mocks.fetchWebPushConfig.mockResolvedValue({ enabled: true, publicKey: "AQID" });
  mocks.registerNotificationDevice.mockResolvedValue({ id: "device-1", lastSeenAt: null });
  const push = installPushRegistration();

  const { result } = renderHook(() => usePwaNotifications("elearning"));
  let outcome: unknown;
  await act(async () => {
    outcome = await result.current.enableNotifications();
  });

  expect(outcome).toBe("granted");
  expect(mocks.fetchWebPushConfig).toHaveBeenCalledWith("elearning");
  expect(push.subscribe).toHaveBeenCalledWith({ applicationServerKey: new Uint8Array([1, 2, 3]), userVisibleOnly: true });
  expect(mocks.registerNotificationDevice).toHaveBeenCalledWith(expect.objectContaining({
    portal: "elearning",
    platform: "web_pwa",
    transport: "WEB_PUSH",
    endpoint: "https://fcm.googleapis.com/wp/abc",
    keys: { p256dh: "p-key", auth: "a-key" },
  }));
  expect(result.current.state).toBe("enabled");
});

test("skips subscribing when the server has Web Push disabled", async () => {
  mocks.fetchWebPushConfig.mockResolvedValue({ enabled: false });
  const push = installPushRegistration();

  const { result } = renderHook(() => usePwaNotifications());
  await act(async () => {
    await result.current.enableNotifications();
  });

  expect(push.subscribe).not.toHaveBeenCalled();
  expect(mocks.registerNotificationDevice).not.toHaveBeenCalled();
  expect(result.current.state).toBe("unconfigured");
});

test("on app open a Web Push device moves to FCM silently when the server switched channel", async () => {
  mocks.fetchWebPushConfig.mockResolvedValue({ enabled: true, provider: "fcm" });
  mocks.registerNotificationDevice.mockResolvedValue({ id: "device-2", lastSeenAt: null });
  mocks.getFcmRegistrationToken.mockResolvedValue("fcm-token-1");
  window.localStorage.setItem(getPwaNotificationDeviceStorageKey(), JSON.stringify({
    channel: "webpush",
    deviceRegistrationId: "device-1",
    permissionState: "granted",
    portal: "lms",
    registrationToken: "https://fcm.googleapis.com/wp/abc",
    syncedAt: new Date(0).toISOString(),
  }));
  const oldSubscription = { endpoint: "https://fcm.googleapis.com/wp/abc", toJSON: () => ({}), unsubscribe: vi.fn(async () => true) };
  const fcmSubscription = { endpoint: "https://fcm.googleapis.com/fcm/send/x", toJSON: () => ({}) };
  const getSubscription = vi.fn().mockResolvedValueOnce(oldSubscription).mockResolvedValue(fcmSubscription);
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { ready: Promise.resolve({ scope: "/", pushManager: { getSubscription, subscribe: vi.fn() } }) },
  });

  const { result } = renderHook(() => usePwaNotifications());
  await vi.waitFor(() => expect(mocks.registerNotificationDevice).toHaveBeenCalled());
  expect(result.current.state).toBe("enabled");

  expect(mocks.unregisterNotificationDevice).toHaveBeenCalledWith(expect.objectContaining({ registrationToken: "https://fcm.googleapis.com/wp/abc" }));
  expect(oldSubscription.unsubscribe).toHaveBeenCalled();
  expect(mocks.registerNotificationDevice).toHaveBeenCalledWith(expect.objectContaining({ transport: "FCM", registrationToken: "fcm-token-1", keys: undefined }));
  expect(JSON.parse(window.localStorage.getItem(getPwaNotificationDeviceStorageKey()) ?? "{}")).toMatchObject({ channel: "fcm", registrationToken: "fcm-token-1" });
});

test("on app open a browser that lost its subscription subscribes again when push was turned on here", async () => {
  mocks.fetchWebPushConfig.mockResolvedValue({ enabled: true, provider: "fcm" });
  mocks.registerNotificationDevice.mockResolvedValue({ id: "device-3", lastSeenAt: null });
  mocks.getFcmRegistrationToken.mockResolvedValue("fcm-token-2");
  window.localStorage.setItem(getPwaNotificationDeviceStorageKey(), JSON.stringify({
    channel: "fcm",
    deviceRegistrationId: "device-1",
    permissionState: "granted",
    portal: "lms",
    registrationToken: "fcm-token-1",
    syncedAt: new Date(0).toISOString(),
  }));
  const fcmSubscription = { endpoint: "https://fcm.googleapis.com/fcm/send/y", toJSON: () => ({}) };
  // Nothing at first (dropped), then the one Firebase creates.
  const getSubscription = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValue(fcmSubscription);
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { ready: Promise.resolve({ scope: "/", pushManager: { getSubscription, subscribe: vi.fn() } }) },
  });

  const { result } = renderHook(() => usePwaNotifications());
  await vi.waitFor(() => expect(mocks.registerNotificationDevice).toHaveBeenCalled());

  expect(result.current.state).toBe("enabled");
  expect(mocks.registerNotificationDevice).toHaveBeenCalledWith(expect.objectContaining({ transport: "FCM", registrationToken: "fcm-token-2" }));
});

function installPushRegistration() {
  const subscription = {
    endpoint: "https://fcm.googleapis.com/wp/abc",
    toJSON: () => ({ endpoint: "https://fcm.googleapis.com/wp/abc", keys: { p256dh: "p-key", auth: "a-key" } }),
  };
  const subscribe = vi.fn(async () => subscription);
  Object.defineProperty(window, "Notification", {
    configurable: true,
    value: { permission: "granted", requestPermission: async () => "granted" },
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { ready: Promise.resolve({ scope: "/", pushManager: { getSubscription: async () => null, subscribe } }) },
  });
  return { subscribe };
}

function installNotificationSupport(permission: NotificationPermission) {
  Object.defineProperty(window, "Notification", {
    configurable: true,
    value: { permission },
  });
  Object.defineProperty(window, "PushManager", {
    configurable: true,
    value: function PushManager() {},
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      ready: new Promise<ServiceWorkerRegistration>(() => undefined),
    },
  });
}
