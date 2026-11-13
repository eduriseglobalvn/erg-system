import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
import type { components } from "@/lib/api/generated/erg-openapi";
import { apiRequest } from "@/lib/api-client";
import { runtimeFixturesEnabled } from "@/lib/runtime-fixtures";
import type {
  NotificationDeviceHeartbeatInput,
  NotificationDeviceRegistrationInput,
  NotificationDeviceRegistrationResponse,
  NotificationDeviceUnregisterInput,
  NotificationPortal,
} from "./notification-types";
import {
  assertNotificationDeviceIdentity,
  assertNotificationHeartbeatIdentity,
  normalizePortal,
  toApiPortal,
} from "./notification-mappers";

// DEV is inlined at build time, so production bundles drop this branch and the fixture chunk with it.
const loadMockDevices = () => (import.meta.env.DEV && runtimeFixturesEnabled() ? import("./notification-mock-devices") : undefined);

export async function registerNotificationDevice(input: NotificationDeviceRegistrationInput) {
  const portal = normalizePortal(input.portal);
  assertNotificationDeviceIdentity(input);

  const mock = await loadMockDevices();
  if (mock) {
    return mock.registerMockNotificationDevice({
      ...input,
      portal,
    });
  }

  return apiRequest<NotificationDeviceRegistrationResponse>(API_ENDPOINTS.notifications.devices, {
    method: "POST",
    body: JSON.stringify({
      ...input,
      portal,
    }),
    portal: toApiPortal(portal),
  });
}

export type WebPushConfig = components["schemas"]["WebPushConfigResponse"];

/** VAPID public key for Web Push; `enabled: false` when the server has no VAPID keys. */
export async function fetchWebPushConfig(portal: NotificationPortal = "lms", signal?: AbortSignal) {
  if (runtimeFixturesEnabled()) {
    return { enabled: false } satisfies WebPushConfig;
  }
  return apiRequest<WebPushConfig>(API_ENDPOINTS.notifications.webPushConfig, {
    portal: toApiPortal(normalizePortal(portal)),
    ...(signal ? { signal } : {}),
  });
}

export async function unregisterNotificationDevice(input: NotificationDeviceUnregisterInput) {
  const portal = normalizePortal(input.portal);
  assertNotificationDeviceIdentity(input);

  const mock = await loadMockDevices();
  if (mock) {
    mock.unregisterMockNotificationDevice({
      ...input,
      portal,
    });
    return { unregistered: true };
  }

  return apiRequest<{ unregistered: boolean }>(API_ENDPOINTS.notifications.unregisterDevice, {
    method: "POST",
    body: JSON.stringify({
      ...input,
      portal,
    }),
    portal: toApiPortal(portal),
  });
}

export async function heartbeatNotificationDevice(input: NotificationDeviceHeartbeatInput) {
  const portal = normalizePortal(input.portal);
  assertNotificationHeartbeatIdentity(input);

  const mock = await loadMockDevices();
  if (mock) {
    mock.heartbeatMockNotificationDevice({
      ...input,
      portal,
    });
    return;
  }

  await apiRequest<void>(API_ENDPOINTS.notifications.heartbeat, {
    method: "POST",
    body: JSON.stringify({
      ...input,
      portal,
    }),
    portal: toApiPortal(portal),
  });
}

export async function revokeNotificationDevice(deviceId: string, portal: NotificationPortal = "lms") {
  if (!deviceId) {
    throw new Error("deviceId is required.");
  }

  const normalizedPortal = normalizePortal(portal);

  const mock = await loadMockDevices();
  if (mock) {
    mock.revokeMockNotificationDevice(normalizedPortal, deviceId);
    return { revoked: true };
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<{ revoked: boolean }>(`${API_ENDPOINTS.notifications.device(deviceId)}?${search.toString()}`, {
    method: "DELETE",
    portal: toApiPortal(normalizedPortal),
  });
}
