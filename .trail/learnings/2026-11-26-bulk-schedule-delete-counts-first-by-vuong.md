---
title: "Bulk schedule delete counts first by reading the calendar 42 days at a time, and never deletes taught periods"
author: Vuong
date: 2026-11-26
branch: feat/schedule-bulk-delete
id: l-512adb27
scope: repo
status: active
replaces: l-99c67c1f
src: agent
touches:
  - src/features/teaching-calendar/components/bulk-delete/range-delete-dialog.tsx
---

## Decided
- Deleting a whole batch or a date range uses existing backend mutations (cancel batch, delete teacher schedule). The confirm dialog counts the periods itself by reading the calendar workspace: the backend has no preview endpoint, and the owner wanted to see how many periods and which teachers are affected first.
- Published periods that have already started are history for payroll and teaching hours, and are never deleted. Owner, 26/11/2026: "Chặn xoá tiết đã qua ở backend luôn". Cancelling a batch keeps them, and since erg-spring-boot#51 a range delete does too: published periods are looked up from max(dateFrom, now). Drafts in the range are always all removed.

## Watch out
- The workspace query refuses ranges longer than 42 days, ends included. Longer ranges are read in pieces, one after another to spare the small production server.
- The FE counts "kept" using the same rule (PUBLISHED and startAt < now). If the backend rule changes, change both.
- Range delete needs a teacher and at least one school, and covers at most 1 year.

In the code: src/features/teaching-calendar/components/bulk-delete/ (bulk-delete-model.ts, batch-delete-dialog.tsx, range-delete-dialog.tsx). BE: CalendarEventMutationUseCase.deleteTeacherSchedule (publishedFrom), CalendarWorkspaceQueryUseCase.MAX_WORKSPACE_DAYS = 42.
