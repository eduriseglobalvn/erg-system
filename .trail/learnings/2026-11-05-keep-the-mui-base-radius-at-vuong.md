---
title: Keep the MUI base radius at 8 and set role radii per component
author: Vuong
date: 2026-11-05
branch: codex/mui-system-refactor
cost: { minutes: 130, tokens: 614051 }
id: l-ffab03d3
scope: repo
status: active
src: agent
touches:
  - CLAUDE.md
  - scripts/design-token-baseline.json
  - src/components/portal/portal-sidebar-motion.test.ts
  - src/components/portal/portal-sidebar-motion.ts
  - src/components/portal/portal-sidebar-styles.ts
  - src/components/shared/erg-calendar-navigator.tsx
  - src/features/elearning/student-dashboard/components/student-dashboard-content-views.tsx
  - src/features/elearning/student-dashboard/components/student-dashboard-workspace.copy.tsx
  - src/features/elearning/student-dashboard/types/dashboard-view-types.ts
  - src/features/lcms/school-management/components/school-analytics-workspace.tsx
---

## Decided
The theme's base border radius stays 8. Rounded corners by role (shell 20, card 14, control 10, chip 999) are set on each component override instead.

## Tried and ruled out
Raising the base radius to match the new card radius. MUI multiplies every numeric sx borderRadius by the base value (borderRadius: 2 means 16px), so changing it would silently resize hundreds of hand-written corners across the app.

## Watch out
New code should read the role radius from the tokens. Do not use numeric sx multipliers for it.

In the code: src/themes/erg-enterprise-theme.tsx (shape.borderRadius = t.radius.sm), src/themes/erg-enterprise-tokens.ts (radius.shell/card/control/chip, shadow.float, motion).
