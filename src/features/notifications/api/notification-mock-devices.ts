import type {
  NotificationDeviceHeartbeatInput,
  NotificationDeviceRecord,
  NotificationDeviceRegistrationInput,
  NotificationDeviceRegistrationResponse,
  NotificationDeviceUnregisterInput,
} from "./notification-types";
import { currentIsoString, getDeviceIdentity, normalizePortal } from "./notification-mappers";

const devicesById = new Map<string, NotificationDeviceRecord>();
const devicesByIdentity = new Map<string, NotificationDeviceRecord>();

export function registerMockNotificationDevice(input: NotificationDeviceRegistrationInput) {
  const normalizedPortal = normalizePortal(input.portal);
  const identity = getDeviceIdentity(input);
  const existing = devicesByIdentity.get(identity);
  const now = currentIsoString();

  if (existing) {
    existing.enabled = true;
    existing.permissionState = input.permissionState;
    existing.lastSeenAt = now;
    existing.client = input.client ?? existing.client;
    existing.endpoint = input.endpoint ?? existing.endpoint;
    existing.firebaseInstallationId = input.firebaseInstallationId ?? existing.firebaseInstallationId;
    existing.locale = input.locale ?? existing.locale;
    existing.platform = input.platform;
    existing.registrationToken = input.registrationToken ?? existing.registrationToken;
    existing.serviceWorkerScope = input.serviceWorkerScope ?? existing.serviceWorkerScope;
    existing.timezone = input.timezone ?? existing.timezone;
    existing.portal = normalizedPortal;
    return serializeMockDevice(existing);
  }

  const deviceId = `device-${Math.random().toString(36).slice(2, 10)}`;
  const record: NotificationDeviceRecord = {
    client: input.client,
    deviceId,
    enabled: true,
    endpoint: input.endpoint,
    firebaseInstallationId: input.firebaseInstallationId,
    lastSeenAt: now,
    locale: input.locale,
    permissionState: input.permissionState,
    platform: input.platform,
    portal: normalizedPortal,
    registrationToken: input.registrationToken,
    serviceWorkerScope: input.serviceWorkerScope,
    timezone: input.timezone,
  };
  devicesByIdentity.set(identity, record);
  devicesById.set(deviceId, record);
  return serializeMockDevice(record);
}

export function unregisterMockNotificationDevice(input: NotificationDeviceUnregisterInput) {
  const normalizedPortal = normalizePortal(input.portal);
  const identity = getDeviceIdentity(input);
  const record = devicesByIdentity.get(identity);
  if (!record) {
    return;
  }

  record.enabled = false;
  record.portal = normalizedPortal;
  record.lastSeenAt = currentIsoString();
  devicesByIdentity.set(identity, record);
  devicesById.set(record.deviceId, record);
}

export function heartbeatMockNotificationDevice(input: NotificationDeviceHeartbeatInput) {
  const normalizedPortal = normalizePortal(input.portal);
  const record =
    (input.deviceRegistrationId ? devicesById.get(input.deviceRegistrationId) : undefined) ??
    devicesByIdentity.get(getDeviceIdentity(input));

  if (!record) {
    if (input.firebaseInstallationId || input.registrationToken) {
      const registrationInput: NotificationDeviceRegistrationInput = {
        client: undefined,
        endpoint: input.registrationToken,
        firebaseInstallationId: input.firebaseInstallationId,
        permissionState: input.permissionState ?? "default",
        platform: "web_pwa",
        portal: normalizedPortal,
        registrationToken: input.registrationToken,
      };
      registerMockNotificationDevice(registrationInput);
    }
    return;
  }

  record.enabled = true;
  record.lastSeenAt = currentIsoString();
  record.permissionState = input.permissionState ?? record.permissionState;
  record.portal = normalizedPortal;
  devicesByIdentity.set(getDeviceIdentity(record), record);
  devicesById.set(record.deviceId, record);
}

export function revokeMockNotificationDevice(portal: string, deviceId: string) {
  const normalizedPortal = normalizePortal(portal);
  const record = devicesById.get(deviceId);
  if (!record) {
    return;
  }

  record.enabled = false;
  record.portal = normalizedPortal;
  record.lastSeenAt = currentIsoString();
  devicesById.set(deviceId, record);
  devicesByIdentity.set(getDeviceIdentity(record), record);
}

export function serializeMockDevice(record: NotificationDeviceRecord): NotificationDeviceRegistrationResponse {
  return {
    enabled: record.enabled,
    id: record.deviceId,
    lastSeenAt: record.lastSeenAt,
    permissionState: record.permissionState,
    platform: record.platform,
    portal: record.portal,
  };
}

