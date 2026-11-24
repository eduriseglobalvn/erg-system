---
title: "The middle layer of a subject is called Module on screen, but stays level in code and API"
author: Vuong
date: 2026-11-24
branch: feat/excel-import-all-topics
id: l-e42d1614
scope: repo
status: active
src: agent
touches:
  - src/components/shared/teaching-schedule-dialog.tsx
  - src/config/seo.ts
  - src/features/help/guides/teacher-guide.ts
  - src/features/lcms/admin-content/admin-content-route.ts
  - src/features/lcms/admin-content/components/admin-content-overview.tsx
  - src/features/lcms/admin-menu.tsx
  - src/features/lcms/admin-operations/components/curriculum-roadmap-view.test.tsx
  - src/features/lcms/admin-operations/components/curriculum-roadmap-view.tsx
  - src/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-stage.tsx
  - src/features/lcms/admin-operations/components/curriculum-roadmap/roadmap-summary-bar.tsx
---

## Decided
Owner request (24/11/2026): the layer under a subject, which used to show as "Level" / "Chặng học", is shown as "Module" everywhere in the UI, including buttons. The reason is that "Level" only fits IC3 (Level 1/2/3). For MOS the modules are Excel, PowerPoint and Word, so "Level" reads wrong.
Only the visible text changed. Type names, the `level` role/kind, `levelId`, GraphQL/REST paths and backend tables keep "level", so the backend needs no change.

## Watch out
- A module the user named "Level 1" stays as it is. That is data, not a label.
- New UI text must say "module", not level / chặng / cấp độ.
- Error messages returned by the backend (erg-spring) were not checked and may still say "level".

In the code: labels live in src/features/lcms/admin-operations/components (curriculum-roadmap/*, learning-resource-authoring-*, curriculum-explorer-*), quiz-list titlebar/move dialog, question-bank-copy.ts, class-students-workspace.copy.ts, school-subject-assign-dialog.tsx, teaching-schedule-dialog.tsx.
