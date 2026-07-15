import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  getDefaultTenantId: vi.fn(() => "tenant-a"),
  readStoredAuthSession: vi.fn(),
}));

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: mocks.getDefaultTenantId,
}));

vi.mock("@/platform/auth/api/auth-token-storage", () => ({
  readStoredAuthSession: mocks.readStoredAuthSession,
}));

vi.mock("@/features/notifications/api/notification-api", () => ({
  heartbeatNotificationDevice: vi.fn(),
  registerNotificationDevice: vi.fn(),
  revokeNotificationDevice: vi.fn(),
  unregisterNotificationDevice: vi.fn(),
}));

import {
  getPwaNotificationDeviceStorageKey,
  usePwaNotifications,
} from "@/features/lms/mobile/hooks/use-pwa-notifications";

beforeEach(() => {
  window.localStorage.clear();
  mocks.getDefaultTenantId.mockReturnValue("tenant-a");
  mocks.readStoredAuthSession.mockReturnValue({ accountId: "student-b" });
  installNotificationSupport("granted");
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

test("scopes stored PWA notification device by tenant and LMS account", () => {
  expect(getPwaNotificationDeviceStorageKey()).toBe("erg-lms-pwa-notification-device:tenant-a:student-b");
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