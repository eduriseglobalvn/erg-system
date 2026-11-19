---
title: "A schedule batch has exactly one subject, and the backend refuses to save lessons without it"
author: Vuong
date: 2026-11-18
branch: fix/student-profile-direct-url
cost: { minutes: 29, tokens: 122799 }
id: l-cfd2d4a2
scope: repo
status: active
src: agent
touches:
  - src/features/teaching-calendar/components/main/use-calendar-main.ts
  - src/features/teaching-calendar/components/mobile/admin-mobile-day.tsx
  - src/features/teaching-calendar/components/mobile/admin-mobile-sheet.tsx
  - src/features/teaching-calendar/components/mobile/use-admin-mobile-add.ts
  - src/features/teaching-calendar/components/schedule-grid/use-schedule-draft.ts
  - src/features/teaching-calendar/components/schedule-grid/schedule-header.tsx
---

## Decided
- Every screen that saves a draft schedule (web grid, «Thêm tiết» sheet on mobile) must send subjectId/levelId. The backend rejects rows without a subject (SUBJECT_REQUIRED, «Chọn môn trước khi lưu lịch.») and writes the input's subject onto EVERY lesson in the batch.
- So when adding to a draft batch that already has lessons, keep that batch's subject (mobile locks the picker). Use the newly picked subject only when the batch is still empty.
- Web: when rows exist but no subject is picked, do not send the save; show the status «Chọn Môn · Chương trình để lưu» (needsSubject) and block leaving the page so the lessons are not lost.

## Watch out
- Mobile «Thêm vào nháp» used to fail every time because it never sent a subject; the user saw only «Chưa lưu được».

In the code: erg-spring TeachingScheduleDraftService.validate/persist; FE use-admin-mobile-add.ts, admin-mobile-sheet.tsx, schedule-grid/use-schedule-draft.ts (needsSubject).
