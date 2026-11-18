import { expect, test } from "vitest";

import { shouldOfferPushPrompt } from "./push-prompt-model";

const DAY = 24 * 60 * 60_000;
const NOW = 100 * DAY;

test("never on the first visit, offered from the second", () => {
  expect(shouldOfferPushPrompt({ visits: 1, snoozedAt: [] }, NOW)).toBe(false);
  expect(shouldOfferPushPrompt({ visits: 2, snoozedAt: [] }, NOW)).toBe(true);
});

test("after «Để sau» it waits 7 days, and stops after the second snooze", () => {
  expect(shouldOfferPushPrompt({ visits: 5, snoozedAt: [NOW - 6 * DAY] }, NOW)).toBe(false);
  expect(shouldOfferPushPrompt({ visits: 5, snoozedAt: [NOW - 7 * DAY] }, NOW)).toBe(true);
  expect(shouldOfferPushPrompt({ visits: 9, snoozedAt: [NOW - 30 * DAY, NOW - 20 * DAY] }, NOW)).toBe(false);
});
