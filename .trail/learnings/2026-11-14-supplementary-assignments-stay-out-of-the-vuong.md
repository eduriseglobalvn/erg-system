---
title: "Supplementary assignments stay out of the main average and overdue lists, and their XP is capped at 50 a week"
author: Vuong
date: 2026-11-14
branch: feat/student-assignment-correct-count
cost: { minutes: 1, tokens: 1781 }
id: l-bbd16f64
scope: repo
status: active
src: agent
touches:
  - src/features/lms/components/assign-homework-desktop-view/setup-card.tsx
  - src/features/lms/components/assign-homework-mobile/schedule-options-sections.tsx
  - src/features/lms/api/lms-assignment-command-api.ts
  - src/features/lms/components/assign-homework-recipient.ts
---

## Decided
- A teacher can flag an assignment as supplementary (extra work, e.g. for a strong group). Supplementary work:
  - does not count as missing or late;
  - does not trigger the low-score risk alert;
  - is left out of the class average and the student dashboard average.
- Hand-ins on supplementary work earn at most 50 XP per student per ISO week. The cap applies to both the class leaderboard and student tiers, so assigning extra work to one group cannot skew the ranking.
- Students still see supplementary work in their own to-do and pending counts, because they are meant to do it.
- The idempotency key only includes the flag when it is on, so keys for existing assignments do not change.

## Tried and ruled out
- A separate "advanced" average: not built. For now only the card shows the flag.

## Watch out
- The flag is set at creation only. The update API does not change it.
- The weekly cap is filled in the order rows are read. A week's total is right, but which day gets the XP depends on that order.
- Deploy the database column migration (erg-spring V144) before the backend that reads it.

In the code:
- FE:
  - The supplementary switch is in src/features/lms/components/assign-homework-desktop-view/setup-card.tsx and src/features/lms/components/assign-homework-mobile/schedule-options-sections.tsx.
  - The flag is sent by createLmsAssignment in src/features/lms/api/lms-assignment-command-api.ts.
  - createAssignmentIdempotencyKey in src/features/lms/components/assign-homework-recipient.ts takes supplementary.
- BE (erg-spring):
  - LeaderboardXp.capSupplementary, used by ClassLeaderboardService and StudentTierService.readXp.
  - The exclusions are in StudentRepository, AttemptRepository and AssignmentRepository.
