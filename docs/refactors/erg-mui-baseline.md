# ERG MUI Refactor Baseline

Recorded on 2026-07-15 from commit `38bf42b` before production UI migration. The implementation branch is `codex/mui-system-refactor`.

## Legacy UI inventory

Command: `node scripts/check-legacy-ui.mjs`

- Policy result: FAIL, as expected before migration.
- Token-level violations: 25,013.
- Files with at least one violation: 166.
- TSX files in `src`: 312.
- TSX files containing `className`: 168.
- Files importing lucide, Radix, tailwind-merge, or class-variance-authority: 82.
- Tailwind build dependencies/directives are present in `package.json`, `vite.config.ts`, `src/styles/globals.css`, `src/styles/shadcn-utilities.css`, and `src/styles/theme.css`.

The scanner counts each utility token independently. This deliberately produces a strict, monotonic migration metric; the final required value is zero.

## Highest-density files

| File | Violations |
| --- | ---: |
| `src/features/lms/components/assign-homework-page.tsx` | 2,140 |
| `src/features/lcms/admin-operations/components/user-access-control-sections.tsx` | 1,022 |
| `src/features/lcms/admin-operations/components/admin-operations-workspace.tsx` | 818 |
| `src/features/lcms/quiz/question-type-demo/components/question-type-demo-workspace.tsx` | 762 |
| `src/features/lcms/admin-operations/components/learning-resource-curriculum-explorer.tsx` | 721 |
| `src/features/elearning/student-dashboard/components/discussion/student-discussion-feed.tsx` | 672 |
| `src/features/lms/components/exercise-bank-page.tsx` | 587 |
| `src/pages/profile-page.tsx` | 540 |
| `src/features/lcms/admin-operations/components/student-sheet-import-workspace.tsx` | 511 |
| `src/components/quiz/quiz-welcome-screen.tsx` | 479 |
| `src/features/lms/components/student-groups-page.tsx` | 471 |
| `src/components/learning-resources/explorer-ui.tsx` | 426 |
| `src/features/lms/components/score/mobile-score-sheet-panel.tsx` | 424 |
| `src/features/crm/seo/components/seo-crm-workspace.tsx` | 415 |
| `src/features/lms/components/lms-notification-detail-page.tsx` | 407 |

## Pre-migration verification state

- `bun run lint`: PASS.
- `bun run typecheck`: PASS.
- `bun run build`: PASS.
- Targeted sidebar/menu tests: PASS.
- The full Vitest suite contains existing failures unrelated to this migration:
  - `student-auth-storage.test.ts`.
  - Two teacher-resource cache tests with a missing mocked `ApiClientError`.
  - Dashboard/navigation avatar fallback tests.
  - Hoisted mock error in `school-management-api.test.ts`.
  - A Playwright spec incorrectly collected by Vitest.

Migration waves must not introduce additional failures. Existing failures are tracked separately and are not treated as evidence that the MUI refactor failed unless their behavior changes.

## Protected visual baselines

- Matching Question card geometry, connector paths, drag effect, active drag color, placeholder color, and practice/editor layouts.
- Sidebar open/close dimensions and account-card placement.
- Zoom, scrolling, PDF canvas ownership, and quiz/editor coordinate systems.
- FullCalendar density, current-day state, schedule event status, and event detail overlays.
