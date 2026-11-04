---
title: "Status palette light colors are soft tints, so MUI Alerts need a theme override"
author: Vuong
date: 2026-11-04
branch: codex/mui-system-refactor
cost: { minutes: 43, tokens: 221605 }
id: l-6d7fc1c8
scope: repo
status: active
src: agent
touches:
  - src/features/access-management/components/role-management-workspace.tsx
  - src/features/elearning/student-dashboard/components/student-dashboard-content-views.tsx
  - src/features/elearning/student-dashboard/components/student-dashboard-mobile-overview.tsx
  - src/features/elearning/student-dashboard/components/student-dashboard-overview-surface.tsx
  - src/features/elearning/student-dashboard/components/student-dashboard-workspace-runtime.tsx
  - src/features/employee-management/components/employee-access-log-workspace.tsx
  - src/features/employee-management/components/employee-list-workspace.tsx
  - src/features/employee-management/components/employee-list/list-toolbar.tsx
  - src/themes/erg-enterprise-theme.tsx
  - ".github/workflows/ci.yml"
---

## Decided
palette.error/success/warning/info.light are translucent tints (alpha ~0.1) because ~15 screens use "error.light" etc. as a soft background. MUI's standard Alert derives BOTH text and background from palette.*.light, so every Alert rendered with text at alpha 0.1 (invisible). We keep the soft tints and override MuiAlert in the theme instead (text.primary text, severity main icon, nowrap action button).

## Watch out
Any other MUI component that derives colors from palette.*.light (e.g. outlined Alert border, some Chip/Badge variants) will inherit the translucent value. Check computed color alpha if text looks washed out.

In the code: src/themes/erg-enterprise-theme.tsx (MuiAlert styleOverrides), tokens in src/themes/erg-enterprise-tokens.ts (dangerSoft etc.).
