---
title: Offline exam files are locked by a teacher password only; the Player no longer asks who the student is
author: Vuong
date: 2026-11-17
branch: feat/role-consolidation
cost: { minutes: 10, tokens: 110108 }
id: l-a9fbe326
scope: repo
status: active
src: agent
touches:
  - src/features/elearning/portable-exam/api/portable-exam-password.ts
  - src/features/elearning/portable-exam/api/portable-exam-password.test.ts
  - src/features/elearning/portable-exam/types/portable-exam-types.ts
  - src/features/portable-package-export/components/portable-package-export-dialog.tsx
  - src/features/elearning/portable-exam/components/portable-password-step.tsx
  - src/features/elearning/portable-exam/components/portable-artifact-app.tsx
  - src/features/elearning/portable-exam/components/portable-artifact-app.test.ts
---

## Decided
- The owner (18/11/2026) only needs a password so students cannot open exams they were not given. They do not care which student took it: exams go out over NetSupport and students report their own score, or the teacher types it in.
- The teacher types an optional "open password" when exporting the .ergquiz. Only a SHA-256 hash of "packageId:password" is stored, in an unsigned top-level field of the envelope. The Player asks for the password only when that field is present.
- Every launch is a fresh attempt id, because lab PCs are shared.

## Tried and ruled out
- Class code + student code screen (with optional roster) and the "export result file" button: removed, because the owner does not need per-student results.
- Signing the password into the package: that needs a backend change, so it was not done.

## Watch out
- The field sits outside the Ed25519-signed payload, so anyone who edits the file can remove it. Answers are in the file anyway. Treat it as a gate against opening by mistake, not as security.
- Closing the app mid-exam starts over.
- The teacher-side portable result import card now has nothing producing result files. Removing it is a follow-up.

In the code: src/features/elearning/portable-exam/api/portable-exam-password.ts, components/portable-password-step.tsx, components/portable-artifact-app.tsx (attemptAccountId), src/features/portable-package-export/components/portable-package-export-dialog.tsx; envelope field accessPasswordHash.
