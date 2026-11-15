---
title: "Teaching schedule redesign: assigning a lesson must grant the teacher access to that class and school"
author: Vuong
date: 2026-11-14
branch: feat/student-assignment-correct-count
cost: { minutes: 1, tokens: 1743 }
id: l-942cf990
scope: repo
status: active
src: agent
---

## Decided
- The owner wants the teaching-schedule flow (admin /admin/calendar, teacher /teacher/calendar, web + mobile PWA) redesigned, with audit bugs fixed inside the redesign rather than as separate patches. Mockup approved first, code after.
- Creating a schedule should feel like the school's Excel timetable: rows Thứ / Buổi / Tiết 1–10, columns Lớp, Phòng máy, GV, Trợ giảng, Ghi chú. Lớp and Giáo viên are dropdowns, not free text.
- A conflict must say exactly who/where it clashes with: teacher or room, the other class, room, school, batch, status, creator, weeks affected.
- Publishing a schedule should grant the teacher access to that class and school. Proposed: derive access from PUBLISHED calendar events so it is revoked automatically when the batch ends or is cancelled; homeroom access stays untouched.
- Reusing a week for following weeks creates drafts, skips holidays, and does not copy clashing lessons.
- The calendar view is compact like Google Calendar. The existing sidebar menu is NOT to be redesigned.

## Tried and ruled out
- Granting class access only from homeroom or from who assigned homework: the owner rejected it, a scheduled teacher must be able to open their own class.

## Watch out
- The Excel import service is prototype-profile only and does not match the school template. A bell-schedule model (tiết → giờ) is needed; periodStart / periodCount exist on events.

In the code: ClassroomRepository.findTeacherClassOptions (erg-spring), CalendarEventMutationUseCase, CalendarExcelImportService (@Profile("prototype")).
