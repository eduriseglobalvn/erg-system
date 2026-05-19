# Quiz Runtime Mobile + Bookmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the learner quiz runtime into distinct web and mobile shells and add local-only bookmarks for question review.

**Architecture:** Shared attempt/bookmark state lives under `src/features/quiz-runtime`, while `src/components/quiz` gets separate web and mobile presentation shells. Bookmark persistence is stored inside the local attempt session and stays out of submission payloads.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Vitest, Testing Library

---

### Task 1: Add Test Tooling

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`

- [ ] Add `vitest`, `jsdom`, `@testing-library/react`, and `@testing-library/jest-dom`.
- [ ] Add a `test` script and Vitest config.
- [ ] Add a shared test setup file for DOM assertions.

### Task 2: Lock Bookmark Persistence

**Files:**
- Modify: `src/features/quiz-runtime/types/quiz-runtime-types.ts`
- Modify: `src/features/quiz-runtime/api/local-quiz-attempt-store.ts`
- Create: `src/features/quiz-runtime/api/local-quiz-attempt-store.test.ts`

- [ ] Write failing tests for default bookmark state, bookmark persistence after reload, and legacy-session fallback.
- [ ] Add the minimal session type/store changes to make those tests pass.

### Task 3: Extract Shared Runtime Controller

**Files:**
- Create: `src/features/quiz-runtime/hooks/use-quiz-player-runtime.ts`
- Create: `src/features/quiz-runtime/types/quiz-player-view-model.ts`
- Modify: `src/features/quiz-runtime/index.ts`
- Modify: `src/components/quiz/player-shell.tsx`

- [ ] Move shared loading, draft, submit, timer, and bookmark actions into a dedicated controller hook.
- [ ] Shrink `player-shell.tsx` into a shell selector that chooses mobile vs web UI.

### Task 4: Build Dedicated Mobile Shell

**Files:**
- Create: `src/components/quiz/mobile-player-shell.tsx`
- Create: `src/components/quiz/mobile-question-sheet.tsx`
- Modify: `src/components/quiz/questions/matching-question.tsx`

- [ ] Write failing UI tests for mobile shell selection and bookmark visibility.
- [ ] Implement a mobile-first shell with its own header, question list sheet, and sticky footer navigation.
- [ ] Add a mobile-specific matching presentation that favors stacked cards and selects over desktop drag emphasis.

### Task 5: Upgrade Web Shell Bookmark UX

**Files:**
- Create: `src/components/quiz/web-player-shell.tsx`
- Modify: `src/components/quiz/player-shell.tsx`

- [ ] Move the current desktop layout into a dedicated web shell component.
- [ ] Add bookmark controls and bookmarked-state styling to the outline/sidebar and active question header.

### Task 6: Verify

**Files:**
- Modify as needed from previous tasks

- [ ] Run `npm test`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Manually verify desktop and mobile quiz flows in the browser if time allows.
