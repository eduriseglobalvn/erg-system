---
title: "Quiz editor publishes a whole quiz, and each topic is its own quiz"
author: Vuong
date: 2026-11-05
branch: codex/mui-system-refactor
cost: { minutes: 16, tokens: 84624 }
id: l-b66f09c1
scope: repo
status: active
src: agent
touches:
  - docs/superpowers/specs/2026-11-05-quiz-question-editor-design.md
---

## Decided
- Publishing works on the whole quiz and is blocked until every question is ready. Quiz status (Draft / Published / Edited since publish) belongs to the quiz, not to each question. The owner chose this on 2026-11-05.
- Each subject + level + topic is one quiz, as the data already works. The topic list in the editor opens that topic's quiz. There is no "add topic" button in the quiz editor; topics are managed in the question bank and curriculum.
- The new matching layout (pieces separated until joined, equal widths per side, swap instead of insert, keyboard) and the sequence layout (numbers outside the card) also apply to the real learner exam, not only to the editor preview.

## Tried and ruled out
- Publishing single questions: the server compiles every question in the draft and never reads per-question status. It would need a backend compile filter plus a stored published copy of each question.
- A topic per question inside one quiz per level: it needs a new field, merging the existing per-topic quizzes, and changes to publishing and the question bank.

## Watch out
The current UI lets you tick questions and marks only those as published, but the server publishes them all. Questions you did not tick are live for learners while still labelled draft.

In the code:
- Spec: docs/superpowers/specs/2026-11-05-quiz-question-editor-design.md, sections 4 and 8.
- Publish on the frontend: use-quiz-editor-save-publish.ts.
- Which quiz opens for a topic: findScopeMatchingDraft in quiz-editor-workspace-utils.ts.
- Server compile: erg-spring QuizCompileService.
