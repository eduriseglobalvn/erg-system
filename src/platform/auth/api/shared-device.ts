import { STUDENT_LOCAL_SESSION_KEY } from "@/platform/auth/api/auth-token-storage";
import { getPersistedJsonValue, removePersistedJsonValue, setPersistedJsonValue } from "@/stores/persisted-store";

/**
 * Shared computer (school computer room): students are never remembered there.
 * A teacher or admin turns it on once per computer by opening the student login page with
 * `?shared-device=on` (e.g. https://<student host>/login?shared-device=on) and off with `?shared-device=off`.
 * The flag lives in this browser's localStorage, so it is per computer and per browser profile.
 */
export const SHARED_DEVICE_KEY = "erg-shared-device";

export function isSharedDevice() {
  return getPersistedJsonValue<boolean>(SHARED_DEVICE_KEY, false) === true;
}

export function applySharedDeviceParam(search: string) {
  const value = new URLSearchParams(search).get("shared-device");
  if (value === "on") {
    setPersistedJsonValue(SHARED_DEVICE_KEY, true);
    // A student remembered before the switch must not stay signed in on the shared computer.
    removePersistedJsonValue(STUDENT_LOCAL_SESSION_KEY);
  } else if (value === "off") {
    removePersistedJsonValue(SHARED_DEVICE_KEY);
  }
}
