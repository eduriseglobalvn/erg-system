---
title: Quiz scoring uses per-question points and partial credit with deduction; theme dialog only uses existing player fields
author: Vuong
date: 2026-11-05
branch: codex/mui-system-refactor
cost: { minutes: 4, tokens: 92451 }
id: l-ae385924
scope: repo
status: active
src: agent
touches:
  - scripts/design-token-baseline.json
  - src/features/question-bank/components/question-bank-copy.ts
  - src/features/question-bank/components/question-bank-page-header.tsx
  - src/features/question-bank/components/question-bank-primitives.tsx
  - src/features/question-bank/components/question-bank-questions-view.tsx
  - src/features/question-bank/components/question-bank-topic-list.tsx
  - src/features/question-bank/components/question-bank-workspace-shell.tsx
---

## Decided
- Points: each question can have its own points ("Tự đặt từng câu"). The quiz max score is the sum. Questions without points keep the old equal split, so existing quizzes do not change. The backend publish step must read per-question points; the old rule always split 1000 points equally.
- Partial scoring (acceptPartial, multi-answer questions): the question's points are split equally across the correct options. Each correct pick earns one share and each extra wrong pick deducts one share, with a minimum of 0. With the switch off, all picks must be right to earn any points.
- Theme (A7): a library of 9 templates plus customization of the fields QuizPlayerTemplate already has (layout, backgroundTone, accentColor, highlightColor, playerSize, roundedCorners, textLabels, soundEffect). No new fields, no backend.
- The editor and runner screens (A3/A4/B3–B6) belong to the session "Quiz editor UI refactor". The question-bank work does not edit src/features/lcms/quiz/quiz-editor/.

## Tried and ruled out
- Points per answer option: dropped because it makes setup too heavy for teachers. An equal split per correct answer is enough.
- Keeping the 1000-point equal split (the old spec section 10): dropped because the owner wants to set points per question.
- Adding new theme fields (fonts, images, ...): dropped because it would need a backend change and a player change.

## Watch out
- Grading changes are in erg-spring QuizCompileService (points) and GradingEngine (partial scoring). The frontend writes points to questionSetSettings.points on each slide.

In the code: src/features/question-bank/api/question-bank-to-quiz.ts, src/features/lcms/quiz/quiz-theme/, erg-spring lcms/quiz/publish/QuizCompileService.java, lms/internal/quiz/runtime/GradingEngine.java
