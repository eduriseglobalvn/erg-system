import { afterEach, expect, test } from "vitest";

import { markDeniedHintSeen, pushServerReady, readDeniedHintSeen, shouldOfferPushPrompt, type PushPromptInput } from "./push-prompt-model";

const ready: PushPromptInput = { serverReady: true, permissionGranted: false, subscriptionMissing: true, state: "default", dismissed: false, quizActive: false };

afterEach(() => window.localStorage.clear());

test("offered on every app open while this browser has no subscription", () => {
  expect(shouldOfferPushPrompt(ready)).toBe(true);
});

test("not offered once subscribed, while still checking, or when the server has push off", () => {
  expect(shouldOfferPushPrompt({ ...ready, subscriptionMissing: false })).toBe(false);
  expect(shouldOfferPushPrompt({ ...ready, subscriptionMissing: null })).toBe(false);
  expect(shouldOfferPushPrompt({ ...ready, state: "enabled" })).toBe(false);
  expect(shouldOfferPushPrompt({ ...ready, state: "unsupported" })).toBe(false);
  expect(shouldOfferPushPrompt({ ...ready, serverReady: false })).toBe(false);
  expect(shouldOfferPushPrompt({ ...ready, permissionGranted: true })).toBe(false);
});

test("«Để sau» and an open quiz hide it for now", () => {
  expect(shouldOfferPushPrompt({ ...ready, dismissed: true })).toBe(false);
  expect(shouldOfferPushPrompt({ ...ready, quizActive: true })).toBe(false);
});

test("server readiness needs FCM or a VAPID key", () => {
  expect(pushServerReady({ enabled: true, provider: "fcm" })).toBe(true);
  expect(pushServerReady({ enabled: true, provider: "webpush", publicKey: "BPk" })).toBe(true);
  expect(pushServerReady({ enabled: true, provider: "webpush", publicKey: null })).toBe(false);
  expect(pushServerReady({ enabled: false, provider: "fcm" })).toBe(false);
  expect(pushServerReady(undefined)).toBe(false);
});

test("the denied hint is remembered per account", () => {
  expect(readDeniedHintSeen("a1")).toBe(false);
  markDeniedHintSeen("a1");
  expect(readDeniedHintSeen("a1")).toBe(true);
  expect(readDeniedHintSeen("a2")).toBe(false);
});
