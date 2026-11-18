---
title: "Legacy admin paths without a real page are deleted, and the 2-periods-a-week class limit only warns"
author: Vuong
date: 2026-11-18
branch: fix/owner-decisions-18-11
cost: { minutes: 30, tokens: 218519 }
id: l-75afa5ac
scope: repo
status: active
src: agent
touches:
  - src/components/quiz/player-shell-runtime/use-player-derived-state.ts
---

## Decided
- Owner (18/11): "Xóa hẳn đi" — legacy admin workspace paths that only rendered a placeholder/generic workspace are removed outright, not redirected. An admin route with no page now throws at route build time, so a new menu entry must come with a real page.
- Owner (18/11): a class with more than 2 periods in one week gets a highlighted yellow warning (grid: filled warning Alert; mobile add: toast.warning), but saving and publishing still go through. Teacher/class double booking in the same period stays a blocking ERROR conflict.

## Watch out
- DashboardPlaceholderWorkspace is still used by the CRM portal, so it stays.
- setting/setting-center-role is kept in lcmsWorkspacePaths as redirect-only.

In the code: portal-route-registry.ts lcmsWorkspacePaths, admin-routes.tsx adminPageFor, schedule-grid-model.ts WEEKLY_PERIOD_SOFT_LIMIT / classesOverWeeklyLimit.
