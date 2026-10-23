# ERG MUI System Refactor Implementation Plan

> Status: completed — canonical implementation evidence is tracked in `D:/ERG/TASK/ERG_Task_Management_.xlsx` and the paired plan when present.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the complete ERG frontend to ERG MUI, remove all Tailwind/shadcn/Radix/lucide usage and dependencies, and preserve approved layouts, workflows, specialized interactions, and Matching Question visuals.

**Architecture:** Build and lock a shared MUI theme plus thin ERG wrappers first, then migrate feature surfaces in bounded waves. Each wave is guarded by a scoped legacy-usage scan, targeted tests, typecheck, build, and browser screenshots; Tailwind and other legacy dependencies are removed only after the repository-wide scan reaches zero.

**Tech Stack:** React 19, TypeScript 6, Vite 8, MUI 9, MUI Icons, TanStack Router/Query/Table/Virtual, Vitest, Testing Library, Playwright audit script, FullCalendar, dnd-kit.

---

## File map and migration boundaries

- `src/themes/erg-enterprise-tokens.ts`: single source of visual tokens.
- `src/themes/erg-enterprise-theme.tsx`: MUI palette, typography, spacing, transitions, and component overrides.
- `src/themes/ErgMuiProvider.tsx`: one application-level MUI provider and baseline.
- `src/components/erg-mui/*.tsx`: thin reusable operational primitives without business logic.
- `src/components/portal/*` and `src/layouts/dashboard/components/*`: shared shells, navigation, scope, and account controls.
- `src/features/lms/**`: LMS teacher/classroom/schedule/homework/score/attendance/resources UI.
- `src/features/lcms/**`: LCMS shell, school/admin, authoring, quiz/editor UI.
- `src/features/elearning/**`: student dashboard, mobile surfaces, lesson/test/discussion UI.
- `src/platform/auth/**`, `src/pages/**`, `src/app/pages/**`: auth and remaining shared page surfaces.
- `src/components/quiz/questions/matching-question.tsx`, matching selectors in `src/styles/globals.css`, and `src/features/lcms/quiz/quiz-editor/styles/classic-editor.css`: visual-locked Matching behavior.
- `src/styles/globals.css`: only reset and specialized global integration rules after migration; no Tailwind directives.
- `scripts/check-legacy-ui.mjs`: deterministic zero-legacy gate.
- `scripts/playwright-ui-audit.mjs`: browser route and interaction verification.
- `package.json`, `bun.lock`, `vite.config.ts`: dependency/build cleanup after zero usage.

## Migration contract applied to every TSX file

1. Keep component props, exported names, query/mutation hooks, event handlers, route IDs, test IDs, and business conditions unchanged unless a targeted test proves a required correction.
2. Replace Tailwind layout utilities with MUI `Box`, `Stack`, `Grid`, `Paper`, `Typography`, or native semantic elements styled by `sx`.
3. Replace shadcn/Radix primitives with path-imported MUI components. Preserve controlled/open state and focus restoration.
4. Replace each `lucide-react` icon with the closest `@mui/icons-material/<Icon>` path import; icon-only actions receive `aria-label` and Tooltip.
5. Keep `className` only for named integration hooks used by FullCalendar, PDF canvas, dnd-kit geometry, quiz canvas, or Matching connectors. Utility tokens are not allowed in those class names.
6. Replace dynamic class concatenation with `sx` arrays or style functions. Do not use `styled` for one-off layout.
7. Use `Skeleton` for loading regions, not a blocking full-screen spinner.
8. Run the scoped legacy scan and tests before committing each wave.

### Task 1: Add the zero-legacy guardrail and record the baseline

**Files:**
- Create: `scripts/check-legacy-ui.mjs`
- Create: `src/test/legacy-ui-policy.test.ts`
- Modify: `package.json`
- Create: `docs/refactors/erg-mui-baseline.md`

- [ ] **Step 1: Write the failing policy test**

```ts
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("legacy UI policy", () => {
  it("contains no Tailwind, shadcn, Radix, or lucide implementation", () => {
    expect(() => execFileSync(process.execPath, ["scripts/check-legacy-ui.mjs"], { stdio: "pipe" })).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the policy test and verify the current source fails**

Run: `bunx vitest run src/test/legacy-ui-policy.test.ts`

Expected: FAIL because Tailwind directives/dependencies and legacy imports still exist.

- [ ] **Step 3: Implement the complete repository scanner**

Create a Node ESM script that recursively scans `src`, `package.json`, and `vite.config.ts`; exits non-zero for imports from `lucide-react`, `radix-ui`, `@radix-ui/*`, `tailwind-merge`, or `class-variance-authority`; Tailwind directives/imports; the Tailwind Vite plugin; and common utility tokens inside `className`. Accept an optional path argument so each wave can run `node scripts/check-legacy-ui.mjs src/features/lms`. Print every violation as `relative/path:line: rule: excerpt` and print `Legacy UI policy passed` only when no violations remain.

The scanner must allow semantic hooks matching these prefixes only: `fc-`, `pdf-`, `quiz-`, `matching-`, `dnd-`, `lms-teacher-shell`, and `Mui`.

- [ ] **Step 4: Add audit scripts to `package.json`**

```json
{
  "scripts": {
    "audit:legacy-ui": "node scripts/check-legacy-ui.mjs",
    "audit:ui": "node scripts/playwright-ui-audit.mjs"
  }
}
```

- [ ] **Step 5: Record the baseline**

Run:

```powershell
node scripts/check-legacy-ui.mjs *> docs/refactors/erg-mui-baseline.md
```

Expected: non-zero exit with every legacy file listed. Add the known pre-migration test failures and current build/typecheck status below the scanner output.

- [ ] **Step 6: Commit the guardrail**

```powershell
git add scripts/check-legacy-ui.mjs src/test/legacy-ui-policy.test.ts package.json docs/refactors/erg-mui-baseline.md
git commit -m "test: add zero legacy UI migration gate"
```

### Task 2: Lock the ERG MUI foundation

**Files:**
- Modify: `src/themes/erg-enterprise-tokens.ts`
- Modify: `src/themes/erg-enterprise-theme.tsx`
- Modify: `src/themes/ErgMuiProvider.tsx`
- Modify: `src/components/erg-mui/erg-actions.tsx`
- Modify: `src/components/erg-mui/erg-feedback.tsx`
- Modify: `src/components/erg-mui/erg-form.tsx`
- Modify: `src/components/erg-mui/erg-layout.tsx`
- Modify: `src/components/erg-mui/erg-table.tsx`
- Modify: `src/components/erg-mui/index.ts`
- Create: `src/themes/erg-enterprise-theme.test.tsx`
- Create: `src/components/erg-mui/erg-layout.test.tsx`

- [ ] **Step 1: Write failing theme and wrapper tests**

Test that the theme exposes a 64px header, 280px sidebar, Manrope body font, 8px base radius, primary `#0F6CBD`, visible focus styles, reduced-motion support, dense 14px table cells, and that `ErgPageSurface`, `ErgSectionHeader`, `ErgButton`, `ErgIconButton`, `ErgSearchField`, `ErgStatusChip`, `ErgSkeleton`, `ErgDialog`, and `ErgDrawer` render accessible MUI roles/names.

- [ ] **Step 2: Verify tests fail for missing wrappers/overrides**

Run: `bunx vitest run src/themes/erg-enterprise-theme.test.tsx src/components/erg-mui/erg-layout.test.tsx`

Expected: FAIL for missing reduced-motion/global transitions and missing dialog/drawer/search/status wrapper exports.

- [ ] **Step 3: Implement theme overrides**

Add MUI overrides for `MuiCssBaseline`, `MuiButtonBase`, `MuiButton`, `MuiIconButton`, `MuiOutlinedInput`, `MuiSelect`, `MuiDialog`, `MuiDrawer`, `MuiMenu`, `MuiTooltip`, `MuiTabs`, `MuiTableCell`, `MuiChip`, `MuiSkeleton`, and `MuiSnackbar`. Use only `ergEnterpriseTokens`; add `@media (prefers-reduced-motion: reduce)` to disable nonessential transitions.

- [ ] **Step 4: Complete thin ERG wrappers**

Keep wrappers prop-compatible with MUI. `ErgIconButton` requires `label`; `ErgStatusChip` accepts `status: "success" | "warning" | "error" | "info" | "neutral"`; `ErgSearchField` exposes a normal `TextFieldProps` interface; dialog/drawer wrappers pass through MUI transition and focus props.

- [ ] **Step 5: Run foundation tests and typecheck**

Run:

```powershell
bunx vitest run src/themes/erg-enterprise-theme.test.tsx src/components/erg-mui
bun run typecheck
```

Expected: PASS with no new TypeScript errors.

- [ ] **Step 6: Commit the foundation**

```powershell
git add src/themes src/components/erg-mui
git commit -m "refactor: lock ERG MUI foundation"
```

### Task 3: Migrate shared shell, navigation, and legacy primitives

**Files:**
- Modify: `src/layouts/root-layout.tsx`
- Modify: `src/layouts/dashboard/components/dashboard-shell.tsx`
- Modify: `src/layouts/dashboard/components/dashboard-sidebar.tsx`
- Modify: `src/layouts/dashboard/components/dashboard-context-bar.tsx`
- Modify: `src/layouts/dashboard/components/dashboard-account-card.tsx`
- Modify: `src/components/portal/ErgPortalSidebar.tsx`
- Modify: `src/components/app-sidebar.tsx`
- Modify: `src/components/nav-main.tsx`
- Modify: `src/components/nav-projects.tsx`
- Modify: `src/components/nav-user.tsx`
- Modify: `src/components/team-switcher.tsx`
- Replace consumers of: `src/components/ui/*`
- Test: `src/layouts/dashboard/components/dashboard-shell.test.tsx`
- Test: `src/components/nav-user.test.tsx`

- [ ] **Step 1: Extend shell tests before implementation**

Assert 280px expanded width, stable 64px header, account card visibility at bottom-left, selected navigation state, keyboard activation, preserved route navigation, no layout jump during collapse, and `prefers-reduced-motion` behavior.

- [ ] **Step 2: Verify the new assertions fail**

Run: `bunx vitest run src/layouts/dashboard src/components/nav-user.test.tsx`

Expected: FAIL on legacy class-based layout and missing MUI accessible names.

- [ ] **Step 3: Replace shell implementation with MUI**

Use `Box`, `Drawer`, `List`, `ListItemButton`, `Collapse`, `Toolbar`, `Avatar`, `Menu`, `Tooltip`, and MUI Icons path imports. Animate only `width`, `transform`, and `opacity`; never animate `height: auto` for long menus. Preserve the current menu-pruning result and route targets.

- [ ] **Step 4: Replace shared legacy primitives at consumer sites**

Map button/input/select/checkbox/sheet/sidebar/tooltip/table/skeleton/empty-state consumers to `src/components/erg-mui` or direct path-imported MUI components. Delete a file under `src/components/ui` only after `rg` shows zero imports.

- [ ] **Step 5: Run the scoped policy and shell tests**

Run:

```powershell
node scripts/check-legacy-ui.mjs src/layouts
node scripts/check-legacy-ui.mjs src/components/portal
bunx vitest run src/layouts/dashboard src/components/nav-user.test.tsx
bun run typecheck
```

Expected: scoped scans and tests PASS.

- [ ] **Step 6: Commit shared shell migration**

```powershell
git add src/layouts src/components/portal src/components/app-sidebar.tsx src/components/nav-main.tsx src/components/nav-projects.tsx src/components/nav-user.tsx src/components/team-switcher.tsx src/components/ui
git commit -m "refactor: migrate shared shell to ERG MUI"
```

### Task 4: Migrate LMS teacher, classroom, and schedule surfaces

**Files:**
- Modify: `src/features/lms/components/lms-teacher-shell.tsx`
- Modify: `src/features/lms/components/lms-ui.tsx`
- Modify: `src/features/lms/components/assign-homework-page.tsx`
- Modify: `src/features/lms/components/assign-homework-footer.tsx`
- Modify: `src/features/lms/components/assign-date-time-picker.tsx`
- Modify: `src/features/lms/components/attendance-panel.tsx`
- Modify: `src/features/lms/components/score/mobile-score-sheet-panel.tsx`
- Modify: `src/features/lms/components/reports-panel.tsx`
- Modify: `src/features/lms/components/teaching-schedule/teaching-schedule-event-dialog.tsx`
- Modify: `src/features/lms/classroom/components/*.tsx`
- Modify: `src/features/lms/weekly-class-log/components/weekly-class-log-page.tsx`
- Modify: `src/features/teaching-calendar/components/*.tsx`
- Test: existing tests under `src/features/lms/**` and `src/features/teaching-calendar/**`

- [ ] **Step 1: Add behavior assertions before migration**

Cover teacher scope selection, homework selection and scheduling, attendance/score context actions, central-calendar event detail, teacher schedule assignment/receipt states, dialog focus restoration, mobile sheet behavior, and weekly log editing.

- [ ] **Step 2: Run LMS tests and retain the failure output**

Run: `bunx vitest run src/features/lms src/features/teaching-calendar`

Expected: new accessibility/MUI assertions fail while existing business assertions retain their baseline result.

- [ ] **Step 3: Migrate teacher and classroom surfaces**

Apply the migration contract to every scanner violation under `src/features/lms` and `src/features/teaching-calendar`. Preserve TanStack Query keys/mutations, virtualization, scroll containers, dnd-kit handlers, FullCalendar callbacks, and the `.lms-teacher-shell` semantic hook.

- [ ] **Step 4: Verify schedule and dense-data interaction**

Run focused tests for assignment commands, GraphQL schedule data, event actions, score, attendance, and homework. Then run `node scripts/check-legacy-ui.mjs src/features/lms` and `node scripts/check-legacy-ui.mjs src/features/teaching-calendar`.

Expected: scoped legacy scans PASS; no new test failures.

- [ ] **Step 5: Browser-check LMS desktop and mobile**

Run `bun run dev`, then `node scripts/playwright-ui-audit.mjs --portal lms --screenshots .artifacts/mui/lms`.

Expected: no missing styles, overlap, horizontal page scroll, stuck overlays, or abrupt sidebar/zoom/scroll motion.

- [ ] **Step 6: Commit LMS migration**

```powershell
git add src/features/lms src/features/teaching-calendar
git commit -m "refactor: migrate LMS and schedules to ERG MUI"
```

### Task 5: Migrate LMS resources, quiz player, and mobile shell

**Files:**
- Modify: `src/features/lms/learning-resources/components/*.tsx`
- Modify: `src/features/lms/mobile/components/*.tsx`
- Modify: `src/components/quiz/mobile-player-shell.tsx`
- Modify: `src/components/quiz/player-shell.tsx`
- Modify: `src/components/quiz/player-shell-parts.tsx`
- Modify: `src/components/quiz/question-navigator.tsx`
- Modify: `src/components/quiz/questions/*.tsx`
- Modify: `src/components/quiz/quiz-theme-surface.tsx`
- Modify: `src/components/quiz/quiz-welcome-screen.tsx`
- Test: existing quiz and resource tests

- [ ] **Step 1: Add quiz/resource regression assertions**

Cover PDF toolbar and zoom, slide/resource viewer focus and scrolling, mobile bottom sheets, quiz navigation, choice/sequence/drag interactions, and stable player layout at mobile/desktop breakpoints.

- [ ] **Step 2: Migrate resources and quiz components**

Use MUI controls and `sx` for chrome and layout. Keep PDF canvas class hooks, quiz theme hooks, dnd-kit transform math, pointer sensors, question state, and answer serialization unchanged.

- [ ] **Step 3: Treat Matching Question as visual-locked**

Replace only nonvisual primitive implementation in `src/components/quiz/questions/matching-question.tsx`. Keep connector DOM order, measurement refs, SVG/path geometry, active drag color, placeholder color, source/target dimensions, and practice/editor selectors exactly equivalent.

- [ ] **Step 4: Run tests, scoped scan, and visual checks**

Run:

```powershell
bunx vitest run src/components/quiz src/features/lms/learning-resources src/features/lms/mobile
node scripts/check-legacy-ui.mjs src/components/quiz
node scripts/check-legacy-ui.mjs src/features/lms/learning-resources
node scripts/check-legacy-ui.mjs src/features/lms/mobile
node scripts/playwright-ui-audit.mjs --portal quiz --screenshots .artifacts/mui/quiz
```

Expected: PASS; Matching screenshot dimensions and interaction colors match the checkpoint baseline.

- [ ] **Step 5: Commit resource and quiz-player migration**

```powershell
git add src/features/lms/learning-resources src/features/lms/mobile src/components/quiz
git commit -m "refactor: migrate LMS resources and quiz player to MUI"
```

### Task 6: Migrate LCMS shell, school management, and admin operations

**Files:**
- Modify: `src/features/lcms/components/lcms-portal-shell.tsx`
- Modify: `src/features/lcms/components/lcms-ui.tsx`
- Modify: `src/features/lcms/lcms-erg-portal-shell.tsx`
- Modify: `src/features/lcms/lcms-menu.tsx`
- Modify: `src/features/lcms/pages/*.tsx`
- Modify: `src/features/lcms/school-management/components/**/*.tsx`
- Modify: `src/features/lcms/school-management/screens/*.tsx`
- Modify: `src/features/lcms/admin-operations/components/*.tsx`
- Test: existing tests under `src/features/lcms/school-management/**` and `src/features/lcms/admin-operations/**`

- [ ] **Step 1: Add shell/admin behavior assertions**

Cover pruned menu content, current scope visibility, account card position, school flow navigation, import dialogs, access-control permission states, authoring tree selection, destructive confirmations, and drawer/dialog focus.

- [ ] **Step 2: Migrate LCMS shell and school-management UI**

Use the shared 280px shell and ERG wrappers. Preserve route registry, school context, form validation, table sorting/filtering, import mapping, query keys, and mutation invalidation.

- [ ] **Step 3: Migrate admin operations and split oversized UI files**

Move purely visual sub-sections out of files over 200 lines into sibling components without moving business hooks or changing public exports. Use MUI Table/TanStack Table patterns and one controlled menu/dialog instance for repeated rows.

- [ ] **Step 4: Verify LCMS operational surfaces**

Run:

```powershell
bunx vitest run src/features/lcms/school-management src/features/lcms/admin-operations src/features/lcms/lcms-menu-pruning.test.tsx
node scripts/check-legacy-ui.mjs src/features/lcms/school-management
node scripts/check-legacy-ui.mjs src/features/lcms/admin-operations
node scripts/playwright-ui-audit.mjs --portal lcms --screenshots .artifacts/mui/lcms-admin
```

Expected: scoped scans PASS; no new test or visual regressions.

- [ ] **Step 5: Commit LCMS operational migration**

```powershell
git add src/features/lcms
git commit -m "refactor: migrate LCMS operations to ERG MUI"
```

### Task 7: Migrate LCMS question bank and quiz editor

**Files:**
- Modify: `src/features/lcms/quiz/question-bank/components/*.tsx`
- Modify: `src/features/lcms/quiz/question-type-demo/components/*.tsx`
- Modify: `src/features/lcms/quiz/quiz-editor/components/**/*.tsx`
- Modify: `src/features/lcms/quiz/quiz-editor/styles/classic-editor.css`
- Test: existing tests under `src/features/lcms/quiz/**`

- [ ] **Step 1: Add editor regression assertions**

Cover ribbon menus, text formatting, slide selection, context menu, properties dialog, preview dialog, question creation from bank, drag/drop authoring, keyboard focus, and save state.

- [ ] **Step 2: Migrate question-bank and editor chrome**

Use MUI AppBar/Toolbar/Tabs/Menu/Dialog/Drawer/Table/Input controls with path imports. Keep editor state hook contracts, slide transforms, authoring data model, undo history, preview serialization, and persisted drafts unchanged.

- [ ] **Step 3: Preserve specialized editor CSS only**

Remove utility-derived styling from `classic-editor.css`; retain named selectors required for canvas coordinate systems, Matching connectors, drag layers, printable/preview layout, and third-party integration. Replace hardcoded shared colors/spacing with CSS variables populated from the MUI theme.

- [ ] **Step 4: Run editor tests and visual regression**

Run:

```powershell
bunx vitest run src/features/lcms/quiz
node scripts/check-legacy-ui.mjs src/features/lcms/quiz
node scripts/playwright-ui-audit.mjs --portal quiz-editor --screenshots .artifacts/mui/quiz-editor
```

Expected: PASS; Matching editor/practice screenshot and drag behavior remain equivalent.

- [ ] **Step 5: Commit quiz authoring migration**

```powershell
git add src/features/lcms/quiz
git commit -m "refactor: migrate LCMS quiz authoring to MUI"
```

### Task 8: Migrate Elearning, auth, CRM, pages, and remaining shared UI

**Files:**
- Modify: `src/features/elearning/student-dashboard/components/**/*.tsx`
- Modify: `src/platform/auth/components/*.tsx`
- Modify: `src/features/crm/**/*.tsx`
- Modify: `src/pages/*.tsx`
- Modify: `src/app/pages/**/*.tsx`
- Modify: remaining scanner violations under `src/components` and `src/routes`
- Test: existing tests under those scopes

- [ ] **Step 1: Add student/auth regression assertions**

Cover mobile bottom navigation, announcements, assignments, scores, discussions, account actions, offline/loading states, auth form validation, access denied, SSO handoff, and responsive route shells.

- [ ] **Step 2: Migrate all remaining surfaces**

Apply the migration contract to every remaining scanner violation. Keep mobile tap targets at least 44px, preserve TanStack Query cache/persistence behavior, keep auth redirects/token handling unchanged, and replace blocking loading indicators with stable skeleton regions.

- [ ] **Step 3: Run scoped tests and policy scans**

Run:

```powershell
bunx vitest run src/features/elearning src/platform/auth src/features/crm src/pages src/app/pages
node scripts/check-legacy-ui.mjs src/features/elearning
node scripts/check-legacy-ui.mjs src/platform/auth
node scripts/check-legacy-ui.mjs src/features/crm
node scripts/check-legacy-ui.mjs src/pages
node scripts/check-legacy-ui.mjs src/app/pages
```

Expected: all scoped scans PASS and no new test failures.

- [ ] **Step 4: Browser-check student and auth surfaces**

Run:

```powershell
node scripts/playwright-ui-audit.mjs --portal elearning --screenshots .artifacts/mui/elearning
node scripts/playwright-ui-audit.mjs --portal auth --screenshots .artifacts/mui/auth
```

Expected: no overlap, clipped controls, missing focus state, or mobile horizontal scroll.

- [ ] **Step 5: Commit remaining surface migration**

```powershell
git add src/features/elearning src/platform/auth src/features/crm src/pages src/app/pages src/components src/routes
git commit -m "refactor: complete ERG MUI surface migration"
```

### Task 9: Remove Tailwind, shadcn, Radix, and lucide infrastructure

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json`
- Modify: `bun.lock`
- Modify: `src/styles/globals.css`
- Delete: unused files under `src/components/ui`
- Delete: `src/lib/utils.ts` if `cn` has zero consumers

- [ ] **Step 1: Run the repository-wide policy test before removal**

Run: `bun run audit:legacy-ui`

Expected: FAIL only for dependency/build/global stylesheet entries; no TS/TSX consumer violations remain.

- [ ] **Step 2: Remove build integration and dependencies**

Delete the Tailwind Vite import/plugin, Radix/lucide manual chunks, Tailwind directives, and packages `@tailwindcss/vite`, `tailwindcss`, `tailwind-merge`, `class-variance-authority`, `tw-animate-css`, `radix-ui`, `lucide-react`, and unused `cmdk`. Use `bun remove` so `package.json` and `bun.lock` stay synchronized.

- [ ] **Step 3: Remove dead compatibility code**

Use `rg` to prove zero consumers before deleting each legacy UI file. Keep only specialized semantic CSS for FullCalendar, PDF, DnD, quiz canvas, and Matching; it must contain no Tailwind directives or generated utility layer.

- [ ] **Step 4: Verify the zero-legacy gate passes**

Run:

```powershell
bun run audit:legacy-ui
bunx vitest run src/test/legacy-ui-policy.test.ts
rg -n "tailwind|lucide-react|radix-ui|@radix-ui|tailwind-merge|class-variance-authority|tw-animate" src package.json vite.config.ts
```

Expected: policy/test PASS and `rg` returns no matches.

- [ ] **Step 5: Commit dependency removal**

```powershell
git add package.json bun.lock vite.config.ts src/styles src/components/ui src/lib
git commit -m "refactor: remove legacy Tailwind UI stack"
```

### Task 10: Complete repository verification and visual sign-off

**Files:**
- Modify: `docs/refactors/erg-mui-baseline.md`
- Create: `docs/refactors/erg-mui-completion.md`
- Modify: tests or UI files only when verification identifies a migration regression

- [ ] **Step 1: Run static and automated verification**

Run:

```powershell
bun run audit:legacy-ui
bun run lint
bun run typecheck
bun run test
bun run build
```

Expected: audit, lint, typecheck, and build PASS. Compare test output with the recorded baseline; there must be no new failures.

- [ ] **Step 2: Run the complete browser audit**

Run: `node scripts/playwright-ui-audit.mjs --all --screenshots .artifacts/mui/final`

Expected: all registered routes load; no missing UI, uncaught page error, overflow, overlap, focus trap, stuck overlay, or broken navigation.

- [ ] **Step 3: Manually inspect protected/high-risk interactions**

Inspect sidebar open/close, zoom in/out, smooth scrolling, central calendar, teacher schedule assign/receive, homework assignment, score/attendance editing, PDF viewer, quiz player, quiz editor, Matching drag/connectors, mobile student dashboard, dialogs/drawers, loading/empty/error states.

- [ ] **Step 4: Measure final dependency and bundle state**

Record the final initial gzip bundle and largest route chunks in `docs/refactors/erg-mui-completion.md`. Compare against the checkpoint build and explain any delta over 5%. Confirm Tailwind usage/dependencies/plugin/directives are all zero.

- [ ] **Step 5: Commit completion evidence**

```powershell
git add docs/refactors/erg-mui-baseline.md docs/refactors/erg-mui-completion.md
git commit -m "docs: record ERG MUI migration verification"
```

- [ ] **Step 6: Push the completed branch**

Run: `git push -u origin codex/mui-system-refactor`

Expected: remote branch updated successfully after all verification gates pass.
