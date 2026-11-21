---
title: "In the game lobby, changing the question set is also how the teacher cancels the room"
author: Vuong
date: 2026-11-21
branch: claude/game
id: l-24fd5891
scope: repo
status: active
src: agent
---

## Decided
The lobby design has no cancel button, only "Đổi bộ câu hỏi" next to the start button. That button asks for confirmation, ends the room (host.end, so it goes to CANCELLED), then opens the create-room page again with the same class and quiz. Keep this as the only way to cancel from the lobby, so a cancel stays possible without adding a button the design doesn't have.

## Tried and ruled out
Adding the settings line "6 câu khó nhất giữ làm khóa bảo mật". It only makes sense once hacking exists. In wave 1 allowHack is always false and the backend doesn't hold back hard questions, so the line would promise something that doesn't happen. Add it in the hack wave.

## Watch out
In the code: host-room.tsx `repick` builds /teacher/games/new?classId=&quizId=; the route's validateSearch already accepts both. The dev preview (preview-teacher.tsx) passes a no-op onChangeQuestions.
