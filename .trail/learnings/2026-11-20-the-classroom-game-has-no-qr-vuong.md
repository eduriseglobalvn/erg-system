---
title: "The classroom game has no QR code: students join with the 4-digit room code only"
author: Vuong
date: 2026-11-20
branch: claude/game
id: l-17d1013f
scope: repo
status: active
src: agent
---

## Decided
The project owner removed the QR code from every game screen (teacher lobby, projector, student join) on 2026-11-21: in practice students are already logged into the LMS and type the 4-digit code, so a QR adds nothing. Do not add it back.

The exercise bank's "last game" column calls the game sources endpoint without a class, so the backend treats classId as optional there; class size and class wrong count come back null without it.

## Watch out
The backend game room service sits at the class-size ratchet limit; new endpoints go in their own service class (as the sources list did) instead of raising the ceiling.

In the code: src/features/games/teacher/use-last-games.ts calls GET /api/v1/lms/games/sources with no classId; backend GameSourceService (erg-spring, branch claude/game); designs in wayground/design and the game artifact no longer show a QR.
