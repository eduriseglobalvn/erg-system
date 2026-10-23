import { API_ENDPOINTS } from "@/lib/api/api-endpoints";
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
import {
  heartbeatMockNotificationDevice,
  registerMockNotificationDevice,
  revokeMockNotificationDevice,
  unregisterMockNotificationDevice,
} from "./notification-mock-devices";

export async function registerNotificationDevice(input: NotificationDeviceRegistrationInput) {
  const portal = normalizePortal(input.portal);
  assertNotificationDeviceIdentity(input);

  if (runtimeFixturesEnabled()) {
    return registerMockNotificationDevice({
      ...input,
      portal,
    });
  }

  return apiRequest<NotificationDeviceRegistrationResponse>(API_ENDPOINTS.legacy.v1NotificationDevices, {
    method: "POST",
    body: JSON.stringify({
      ...input,
      portal,
    }),
    portal: toApiPortal(portal),
  });
}

export async function unregisterNotificationDevice(input: NotificationDeviceUnregisterInput) {
  const portal = normalizePortal(input.portal);
  assertNotificationDeviceIdentity(input);

  if (runtimeFixturesEnabled()) {
    unregisterMockNotificationDevice({
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

  if (runtimeFixturesEnabled()) {
    heartbeatMockNotificationDevice({
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

  if (runtimeFixturesEnabled()) {
    revokeMockNotificationDevice(normalizedPortal, deviceId);
    return { revoked: true };
  }

  const search = new URLSearchParams();
  search.set("portal", normalizedPortal);
  return apiRequest<{ revoked: boolean }>(`${API_ENDPOINTS.notifications.device(deviceId)}?${search.toString()}`, {
    method: "DELETE",
    portal: toApiPortal(normalizedPortal),
  });
}
