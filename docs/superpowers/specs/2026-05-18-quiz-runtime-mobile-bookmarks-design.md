# Quiz Runtime Mobile + Bookmark Design

**Context**

The current quiz runtime is centered in `src/components/quiz/player-shell.tsx`, where desktop layout, responsive behavior, and attempt state are mixed together. That makes mobile-specific evolution difficult, especially for a future PWA path where mobile interaction patterns should be allowed to diverge from web.

**Goals**

- Build a dedicated mobile quiz runtime UI instead of inheriting the desktop shell.
- Preserve the current visual language of the product rather than introducing a new style system.
- Add per-question bookmarks for review on both mobile and web.
- Keep bookmarks local to the learner device/session and out of backend submit payloads.

**Non-goals**

- No backend bookmark API.
- No redesign of the student dashboard shell outside the quiz session entry point.
- No grading or answer-format behavior changes.

**Architecture**

- Extract shared runtime state and actions out of `player-shell.tsx` into a focused quiz runtime controller hook/module.
- Keep two distinct presentation shells:
  - `web` shell for the current wide-layout experience.
  - `mobile` shell with its own header, question navigation sheet, and fixed footer controls.
- Keep shared question rendering where possible, but allow question-type components to branch for mobile-specific presentation when needed.
- Store bookmark ids on the local quiz attempt session so reload persists state naturally with the rest of the attempt draft.

**Mobile Experience**

- Compact top bar with back affordance, progress label (`Question x of y`), bookmark toggle, and question list trigger.
- Question list opens as a full-screen sheet optimized for thumb navigation.
- Matching questions render as stacked prompt cards with a dedicated mobile answer selector pattern instead of the current drag-focused desktop composition.
- Bottom action bar stays fixed with `Prev` and `Next`, matching the behavior pattern from the reference while preserving current ERG colors, borders, and spacing.

**Web Experience**

- Keep the current desktop shell and sidebar orientation.
- Add bookmark affordance in the active question header and outline/sidebar items.
- Add quick visibility of bookmarked questions in the sidebar state styling.

**Data Model**

- Extend `LocalQuizAttemptSession` with `bookmarkedQuestionIds: string[]`.
- Add store helpers for toggling bookmarks without touching answer payloads or final submit payloads.
- Keep legacy sessions compatible by defaulting missing bookmark data to an empty array.

**Testing**

- Add a lightweight Vitest setup for unit/component tests.
- Cover bookmark persistence in the local session store first.
- Cover shell-level rendering for bookmark state and mobile shell selection.

**Implementation Notes**

- Follow the repository’s feature-first direction by keeping runtime state in `src/features/quiz-runtime` and leaving page-level composition thin.
- Preserve the mock teacher account in the dashboard sidebar; this work should not disturb that area.
