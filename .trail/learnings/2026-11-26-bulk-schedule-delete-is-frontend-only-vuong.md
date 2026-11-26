---
title: "Bulk schedule delete is frontend-only: count first by reading the calendar 42 days at a time; range delete also erases past periods"
author: Vuong
date: 2026-11-26
branch: feat/schedule-bulk-delete
id: l-99c67c1f
scope: repo
status: active
src: agent
---

## Decided
- Deleting a whole batch or a date range uses two backend mutations that already existed (cancel batch, delete teacher schedule). No backend change.
- The backend has no "preview count" endpoint. The confirm dialog counts the periods itself by reading the calendar workspace, because the owner wanted to see how many periods and which teachers are affected before deleting.
- Cancelling a published batch removes only future periods (startAt >= now) and keeps the taught ones for payroll. The count shown follows the same rule.

## Watch out
- The workspace query refuses ranges longer than 42 days, ends included. Longer ranges must be read in pieces, one after another to spare the small production server.
- Range delete removes DRAFT and PUBLISHED periods in the range, including ones already taught. This goes against the "keep history for payroll" decision. For now the dialog only warns in red; blocking deletion of the past needs a backend change.
- Range delete needs a teacher and at least one school, and covers at most 1 year.

In the code: src/features/teaching-calendar/components/bulk-delete/ (bulk-delete-model.ts rangeChunks/loadEventsInRange, batch-delete-dialog.tsx, range-delete-dialog.tsx); BE CalendarWorkspaceQueryUseCase.MAX_WORKSPACE_DAYS = 42, CalendarEventMutationUseCase.deleteTeacherSchedule, CalendarBatchLifecycleUseCase.cancelBatch.
