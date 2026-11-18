---
title: "New-message toasts in the open app come from polling the unread count, not from Web Push"
author: Vuong
date: 2026-11-18
branch: fix/push-notifications
id: l-ee04f4fc
scope: repo
status: active
src: agent
touches:
  - src/features/notifications/hooks/use-new-notification-toast.ts
---

## Decided
We chose to show in-app toasts for new messages when the polled unread count rises, instead of relying only on Web Push. Push can be turned off on the server or blocked on a device, and when it is, users only saw new messages by opening the bell. The toast id is the notification id, so when a push for the same message also arrives, sonner shows it once.

## Watch out
- If one message is read and a new one arrives within the same poll, the count does not change and no toast shows. Move to SSE if that matters.
- No toast shows while a quiz is active (an attribute on <html>).
- The admin inbox is portal "lcms". Push devices are lms/elearning.

In the code: src/features/notifications/hooks/use-new-notification-toast.ts, UNREAD_POLL_MS in use-unread-notification-count.ts, and push-floating-host.tsx (it invalidates ["notifications"] when a push message arrives).
