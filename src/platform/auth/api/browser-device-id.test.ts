import { beforeEach, expect, test, vi } from "vitest";

import { getOrCreateBrowserDeviceId } from "@/platform/auth/api/browser-device-id";

beforeEach(() => {
  window.localStorage.clear();
  document.cookie = "erg_device_id=; Max-Age=0; Path=/";
  vi.restoreAllMocks();
});

test("login and refresh reuse one browser device id", () => {
  const first = getOrCreateBrowserDeviceId();
  window.localStorage.clear();

  const second = getOrCreateBrowserDeviceId();

  expect(second).toBe(first);
  expect(document.cookie).toContain(`erg_device_id=${first}`);
});
