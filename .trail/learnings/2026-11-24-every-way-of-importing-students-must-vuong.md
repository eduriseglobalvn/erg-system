---
title: Every way of importing students must also create their login accounts
author: Vuong
date: 2026-11-24
branch: feat/excel-import-all-topics
id: l-f513e317
scope: repo
status: active
src: agent
touches:
  - src/config/seo.ts
  - src/features/lcms/admin-content/admin-content-route.ts
  - src/features/lcms/admin-menu.tsx
  - src/features/lcms/quiz/quiz-editor/components/quiz-editor-workspace.tsx
  - src/features/lcms/quiz/quiz-editor/components/quiz-list/question-excel-import-dialog.tsx
  - src/features/lcms/quiz/quiz-editor/components/quiz-list/question-excel-import.test.ts
  - src/features/lcms/quiz/quiz-editor/components/quiz-list/question-excel-import.ts
  - src/features/lcms/quiz/quiz-editor/components/quiz-list/question-table.tsx
  - src/features/lcms/school-management/components/setup/school-structure-step.tsx
  - src/features/lcms/school-management/components/setup/school-students-step.tsx
---

## Decided
Every student import screen creates the logins along with the students, through one shared hook. Before this, only the school setup step "Danh sách học sinh" did. The other three screens created students with no login: the setup step that imports classes plus students, the "Lớp học" screen and the "Người học" screen. On production, 655 students imported at 00:43 on 19/11/2026 had no account. Their teachers saw "Chưa có tài khoản" and the students could not sign in.

To repair students who already exist, re-import the same sheet. The backend matches each row to the existing student (by code, or by name plus class or birthday) and attaches a login only where none exists. Students that already have a login come back as replayed and are left alone.

## Watch out
- The class-structure step moves on to the students step after an import. It now waits until the credentials dialog is closed: moving on at once unmounted the dialog, and the passwords are only shown that one time.
- The earlier vitest failures in this session were not caused by this change. The final run passed 99/99.

In the code: src/features/lcms/school-management/hooks/use-student-import-with-accounts.tsx (buildStudentLogins + account on each row + StudentCredentialsDialog); backend LmsOperationalCommandService.importStudents attaches an account to an existing student when the row has a username or password.
