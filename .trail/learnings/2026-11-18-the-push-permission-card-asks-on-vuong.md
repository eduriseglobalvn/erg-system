---
title: The push permission card asks on every app open until this browser holds a subscription
author: Vuong
date: 2026-11-18
branch: fix/push-notifications
id: l-d6d87c72
scope: repo
status: active
src: agent
touches:
  - src/features/lcms/admin-erg-portal-shell.tsx
  - src/features/lcms/admin-menu.tsx
  - src/features/notifications/push/push-permission-prompt.tsx
  - src/features/notifications/push/push-prompt-model.test.ts
  - src/features/notifications/push/push-prompt-model.ts
---

## Decided
Owner request 2026-11-18: after sign-in, ask for push permission on every app open while permission is default (or granted but the browser lost its subscription) and the server reports push ready. "Để sau" hides it only for the current app open; a reload asks again. Once subscribed it never asks. When permission is denied the browser cannot ask again, so a one-time hint per account explains how to re-enable it (lock icon, or iPhone Settings).

## Tried and ruled out
The old visit-count/snooze rule: it waited several visits and hid the card for days, so most admins never saw it.

## Watch out
iOS only grants permission inside a user tap, so the card asks through its "Bật thông báo" button and never calls requestPermission on load. Before iOS 16.4, or in Safari outside an installed PWA, there is no PushManager and nothing renders. The card stays hidden while a quiz is open.

In the code: push-prompt-model.ts shouldOfferPushPrompt, push-permission-prompt.tsx (module-level dismissedThisOpen; tests re-import the module per test).
