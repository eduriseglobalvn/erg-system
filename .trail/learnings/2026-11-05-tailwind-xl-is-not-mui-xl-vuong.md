---
title: "Tailwind xl is not MUI xl: map Tailwind breakpoints by pixel, not by name"
author: Vuong
date: 2026-11-05
branch: claude/elated-ishizaka-3f3102
cost: { minutes: 33, tokens: 153780 }
id: l-5d81b720
scope: repo
status: active
src: agent
touches:
  - bun.lock
  - package.json
  - scripts/design-token-baseline.json
  - src/components/erg-mui/app-select.tsx
  - src/components/erg-mui/charts/chart-primitives.tsx
  - src/components/erg-mui/charts/erg-chart.tsx
  - src/components/erg-mui/erg-table.tsx
  - src/components/erg-mui/erg-toaster.tsx
  - src/components/erg-mui/tanstack-form.test.tsx
---

## Decided
- When moving Tailwind classes to MUI sx, map breakpoints by pixel width, not by name. The theme uses MUI defaults (sm 600, md 900, lg 1200, xl 1536); Tailwind is sm 640, md 768, lg 1024, xl 1280, 2xl 1536.
- Tailwind `xl:` (1280) becomes MUI `lg` (1200); Tailwind `2xl:` (1536) becomes MUI `xl`. sm/md/lg were kept by name in the LMS migration (only tablet widths shift).

## Tried and ruled out
- Mapping by name (xl→xl) silently broke every two-column desktop layout at 1280–1535px: e.g. the exercise bank inspector dropped below the list at 1440. tsc, eslint and the tests all passed; only before/after screenshots caught it.
- Changing the theme's breakpoints to Tailwind's values: rejected, it would shift every screen already built for MUI defaults.

## Watch out
- Files that were already MUI before the migration (e.g. lms-ui.tsx) use MUI xl on purpose; don't remap them.

In the code: src/features/lms/** (migration commit), theme has no `breakpoints` override in src/themes/erg-enterprise-theme.tsx.
