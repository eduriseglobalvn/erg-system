---
title: "Do not raise a dialog's z-index above 1300: its dropdown menus open behind it"
author: Vuong
date: 2026-11-19
branch: fix/student-import-codes
cost: { minutes: 30, tokens: 225753 }
id: l-2ab98c5b
scope: repo
status: active
src: agent
touches:
  - src/features/lcms/school-management/components/student-import-utils.test.ts
  - src/features/lcms/school-management/components/student-import-utils.ts
  - src/features/lms/components/exercise-bank/create-exercise-dialog.tsx
  - src/features/lms/components/exercise-bank/exercise-question-detail-dialog.tsx
  - src/features/lms/components/exercise-bank/create-exercise/setup-preview.tsx
---

## Decided
Dialogs stay at MUI's default modal z-index (1300). In the exercise-bank create dialog, the selects (subject, level, type, difficulty, status) looked broken: clicking flipped the arrow but no list appeared. The cause was the dialog set to zIndex 1400. MUI Select/Menu popovers also mount as modals at 1300, so the list was rendered behind the dialog.

## Watch out
If something on the page really needs to sit above a dialog, raise that element instead. Or give the menus inside the dialog a matching z-index (MenuProps slotProps root sx). Never lift the dialog by itself.

In the code: removed `sx={{ zIndex: 1400 }}` from create-exercise-dialog.tsx and exercise-question-detail-dialog.tsx (src/features/lms/components/exercise-bank/).
