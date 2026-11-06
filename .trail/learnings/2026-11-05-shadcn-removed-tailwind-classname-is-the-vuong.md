---
title: "shadcn removed; Tailwind className is the next phase, done per feature area"
author: Vuong
date: 2026-11-05
branch: codex/mui-system-refactor
cost: { minutes: 71, tokens: 814151 }
id: l-3ab65ada
scope: repo
status: active
src: agent
touches:
  - src/platform/auth/components/teacher-onboarding-workspace.test.tsx
  - src/platform/auth/components/teacher-onboarding/password-step.tsx
  - src/platform/auth/components/teacher-onboarding-workspace.tsx
  - src/features/question-bank/components/quiz-builder-panel.tsx
  - src/features/lms/components/assign-homework-mobile-view.tsx
  - src/features/lms/learning-resources/components/library-page/mobile-explorer.tsx
  - src/features/lms/mobile/components/lms-mobile-top-bar.tsx
  - src/features/question-bank/components/question-bank-copy.ts
  - src/features/question-bank/components/question-bank-workspace-shell.tsx
  - src/features/question-bank/components/question-library.tsx
---

## Decided
- The shadcn/Radix layer is gone. Shared components live only in the MUI wrapper folder; the two MUI pieces that sat in the old folder (select, TanStack form helpers) were moved, not rewritten.
- Tailwind itself stays installed for now: about 220 files still use `className`. Migrate them per feature area in separate sessions, not in one sweep.
- Table headers are sentence case (no uppercase, no letter-spacing), keeping the neutral-50 band CLAUDE.md asks for; the table card has a 1px border and no shadow.

## Tried and ruled out
- The shared MUI table (`ErgTable`) was not used for the class list at first because it had uppercase headers and hard-coded rgba; it is now fixed, so new tables should use it.

## Watch out
- The old shadcn folder was excluded from the design-token count. Moving a file out of it makes its hex/fontSize literals count for the first time; fix them to tokens, or add the file's old counts to the baseline when the colours are deliberate (the quiz player navy in the select).
- `audit:legacy-ui` is not part of verify/CI and its baseline is badly stale (~5000 "new" items); do not treat its failure as caused by your change.

In the code: src/components/erg-mui/{app-select,tanstack-form,erg-toaster,erg-table}.tsx, src/themes/erg-enterprise-theme.tsx (MuiTableCell.head), scripts/design-token-baseline.json
