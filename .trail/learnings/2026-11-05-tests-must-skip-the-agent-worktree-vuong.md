---
title: Tests must skip the agent worktree folder or hooks crash with a null React
author: Vuong
date: 2026-11-05
branch: codex/mui-system-refactor
cost: { minutes: 1, tokens: 1373 }
id: l-c0e6472e
scope: repo
status: active
src: agent
touches:
  - CLAUDE.md
  - index.html
  - public/manifest.webmanifest
  - public/offline.html
  - src/app/pages/shared/desktop-workspace-entry-page.tsx
  - src/components/erg-mui/charts/erg-chart-theme.ts
  - src/components/erg-mui/charts/erg-chart.test.tsx
  - src/components/learning-resources/explorer-ui.tsx
  - src/components/portal/ErgPortalSidebar.tsx
  - src/components/portal/portal-header-actions.tsx
---

## Decided
Vitest excludes everything under the .claude folder.

## Tried and ruled out
Reading the failures as real bugs. In a full run, dozens of quiz editor and auth tests failed with "Cannot read properties of null (reading 'useRef')". Every failing file lived in an old agent worktree inside .claude/worktrees. That worktree is a full copy of the repo with its own node_modules, so it loads a second React. The same tests pass in src.

## Watch out
If a full test run shows hook errors (null useRef, invalid hook call), check the failing file paths before debugging the code. A new nested checkout or tool folder needs the same exclude.

In the code: vite.config.ts test.exclude ("**/.claude/**").
