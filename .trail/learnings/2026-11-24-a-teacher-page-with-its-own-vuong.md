---
title: "A teacher page with its own route still needs a line in the sidebar permission table, or its menu entry is hidden"
author: Vuong
date: 2026-11-24
branch: fix/teacher-games-menu
id: l-74d40745
scope: repo
status: active
src: agent
touches:
  - src/features/lms/navigation/lms-navigation.test.ts
  - src/features/lms/navigation/lms-navigation.ts
  - src/platform/auth/permissions/lms-permission-catalog.ts
---

## Decided
The teacher sidebar hides every entry whose path has no permission in its own lookup, even when the route has a row in the route permission matrix. The games page is routed outside the LMS shell, so the sidebar lookup now also knows games -> lms.games.host.

## Tried and ruled out
Blaming the browser cache or a stale session: production already had lms.games.host on role_lms_teacher and the entry was in the sidebar config, yet a hard reload did not show it. Adding "games" to the LMS shell route list was also dropped: that list generates matrix rows without matchChildren and would duplicate the existing /teacher/games row.

## Watch out
The dev preview and AUTH_BYPASS skip this filter, so a missing line only shows on production. After adding a teacher menu entry, check it with a real permission list (the navigation test does this for games).

In the code: src/features/lms/navigation/lms-navigation.ts (canNavigateToLmsPath returns false when no permission is found), src/platform/auth/permissions/lms-permission-catalog.ts (LMS_ROUTE_PERMISSIONS), lms-teacher-shell-config.tsx (entry id "games").
