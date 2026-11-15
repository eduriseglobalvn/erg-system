---
title: "Teaching schedule redesign: owner's answers on Excel, cancel, load limits, batch rename and assistants"
author: Vuong
date: 2026-11-14
branch: feat/student-assignment-correct-count
cost: { minutes: 34, tokens: 474642 }
id: l-3d6372a0
scope: repo
status: active
src: agent
touches:
  - KE_HOACH_LICH_DAY.md
---

## Decided
Owner answered the 7 open questions of the teaching-schedule redesign on 14/11/2026:
1. Excel: export only this round; import waits for a real sample file (hide the import button).
2. Cancelling a published batch cancels only periods not yet taught (keeps history for payroll).
3. Periods 5/10 merge into the nearest slot of the same session and show «+1» in the per-teacher overview.
4. Weekly load thresholds 18 warn / 24 max are one tenant-wide setting, editable in Settings — not per teacher contract.
5. Batch rename is in scope now (desktop only, DRAFT and PUBLISHED, no re-publish, no notification).
6. Editing travel settings and load thresholds needs `lms.schedule.manage`.
7. Assistants are full participants: notified on publish, granted class access, assistant periods count toward weekly load and conflicts, and get their own UI (assistant picker, «TG» marking, role tabs on the teacher calendar).

## Tried and ruled out
- Per-teacher load limits from contracts: no contract data, owner wanted one global setting.
- Leaving rename for later: owner asked to design and plan it now.
- Assistants as a plain text field without notifications/access: owner noticed no assistant UI existed and asked for it.

## Watch out
- One person cannot be both main teacher and assistant of the same period (`ASSISTANT_SAME_AS_TEACHER`).
- The teacher calendar query must return periods where the user is assistant too (`teacher_id = me OR assistant_id = me`) — verify the current filter before changing it.
- Batch label is unique per school among non-cancelled batches, case-insensitive.

In the code:
- Plan: KE_HOACH_LICH_DAY.md sections 2.3, 2.4, 4.1 (V145 `teaching_schedule_settings`), 4.2 (`renameTeachingScheduleBatch`, `TeachingScheduleRole`, load settings), B4, B8, B9, 6.15–6.17, F4–F10, section 10.
