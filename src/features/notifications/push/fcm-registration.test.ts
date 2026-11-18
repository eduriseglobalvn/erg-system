import { expect, test } from "vitest";

import { needsChannelSwitch, readFirebaseWebConfig, resolvePushChannel } from "./fcm-registration";

const env = {
  VITE_FIREBASE_API_KEY: "k",
  VITE_FIREBASE_APP_ID: "a",
  VITE_FIREBASE_AUTH_DOMAIN: "d",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "s",
  VITE_FIREBASE_PROJECT_ID: "p",
  VITE_FIREBASE_STORAGE_BUCKET: "b",
  VITE_FIREBASE_VAPID_KEY: "v",
};

test("Firebase web config needs every VITE_FIREBASE_* value", () => {
  expect(readFirebaseWebConfig(env)).toMatchObject({ apiKey: "k", projectId: "p", vapidKey: "v" });
  expect(readFirebaseWebConfig({ ...env, VITE_FIREBASE_VAPID_KEY: " " })).toBeNull();
  expect(readFirebaseWebConfig({})).toBeNull();
});

test("only an explicit fcm provider selects FCM; older servers mean Web Push", () => {
  expect(resolvePushChannel("fcm")).toBe("fcm");
  expect(resolvePushChannel("webpush")).toBe("webpush");
  expect(resolvePushChannel(undefined)).toBe("webpush");
});

test("a device moves only when its channel differs from the server's", () => {
  expect(needsChannelSwitch("webpush", "fcm")).toBe(true);
  expect(needsChannelSwitch("fcm", "webpush")).toBe(true);
  expect(needsChannelSwitch(undefined, "webpush")).toBe(false);
  expect(needsChannelSwitch("fcm", "fcm")).toBe(false);
});
