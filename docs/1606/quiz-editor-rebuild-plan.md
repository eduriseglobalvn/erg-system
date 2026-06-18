# Quiz Editor — MUI v9 Rebuild Plan

> **Goal:** Rebuild the LCMS quiz editor (`/quiz-editor`) into a beautiful, complete, enterprise-grade quiz authoring experience using **Material UI v9** as the design system.  
> **Audience:** Teachers, content authors, and instructional designers creating quizzes for many students.  
> **Reference audit:** `quiz-editor-audit.md`  
> **Planned start:** After plan approval  
> **Target:** Phase 1 MVP within 4–6 sprints; full feature parity + enterprise add-ons in 8–10 sprints.

---

## 1. Guiding Principles

1. **Single source of truth:** MUI v9 components only. No `classic-editor.css`, no mixed shadcn/MUI shells.
2. **Author-first layout:** Content on the left/center, properties on the right, navigation/outline on the far left.
3. **Progressive disclosure:** Simple default view; advanced settings behind accordions or tabs.
4. **Live WYSIWYG:** Preview is always one click away; side-by-side where possible.
5. **Enterprise workflow:** Draft → Review → Publish → Assign → Analyze.
6. **Accessibility first:** WCAG 2.2 AA, keyboard navigation, focus management.
7. **Mobile-responsive authoring:** Minimum usable on tablet; desktop-optimized.
8. **Preserve & version data:** Keep existing `QuizEditorSlide` / `QuizProjectSettings` schemas; add version field.

---

## 2. Technology Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| UI library | **@mui/material v9** | Enterprise density, mature patterns, excellent Data Grid |
| Icons | **@mui/icons-material** + custom SVG when needed | Consistent icon language |
| Layout/Grid | MUI `Grid2`, `Stack`, `Box` | Responsive, theme-aware |
| Tables | **MUI X Data Grid Premium** (or Pro) | Sort/filter/select/reorder/group/pagination |
| Forms | **TanStack Form v1** + MUI inputs | Already used in project |
| Date/time | **MUI X Date Pickers v9** | Scheduling, availability |
| Charts | **MUI X Charts** or **Recharts** | Analytics dashboards |
| Rich text | **TipTap** or **MUI + Plate** | Question stems, feedback, essay rubrics |
| Drag & drop | **@dnd-kit/core** (already adopted) | Reordering slides, choices, groups |
| State | **Zustand** or keep `useQuizEditorState` | Global editor state |
| Routing | TanStack Router (existing) | Deep-link to quiz, question, settings |
| Theming | MUI theme with CSS variables | Dark/light mode, ERG brand |

**Note on CLAUDE.md conflict:** Global instructions currently forbid MUI. Because the user explicitly requested MUI v9, this plan proposes a project-memory update documenting the intentional exception for the quiz editor module.

---

## 3. New Information Architecture

### 3.1 Top-level app shell

```
+-------------------------------------------------------------+
|  LCMS App Bar (existing)                                    |
+-------------------------------------------------------------+
|  Sidebar |  Quiz Editor Work Area                           |
|  (nav)   |                                                |
|          |  +-------------------------------------------+  |
|          |  | Quiz Header (title, status, actions)      |  |
|          |  +-------------------------------------------+  |
|          |  | Mode Tabs: Build | Settings | Preview |    |  |
|          |  +-------------------------------------------+  |
|          |  |                                           |  |
|          |  |   Active mode content                     |  |
|          |  |                                           |  |
|          |  +-------------------------------------------+  |
|          |  | Status bar (question count, save state)   |  |
|          |  +-------------------------------------------+  |
+-------------------------------------------------------------+
```

### 3.2 Mode tabs (persistent top navigation)

| Tab | Purpose |
|-----|---------|
| **Build** | Manage slides, groups, question bank import, bulk operations |
| **Design** | Player template, theme, layout, typography |
| **Settings** | Quiz-level settings, scheduling, assignment, security |
| **Preview** | Student experience simulator with persona picker |
| **Publish** | Draft/staging/live workflow, version notes, URL/QR |
| **Results** | Attempts, analytics, item analysis, export |

### 3.3 Build mode layout

```
+-------------------------------------------------------------+
|  Slide Outline (left)  |  Slide Canvas (center)  |  Inspector (right) |
|  - quiz title          |  - selected slide         |  - properties      |
|  - groups as trees     |  - WYSIWYG edit           |  - choices         |
|  - drag reorder        |  - inline preview         |  - feedback        |
|  - filters/search      |                           |  - options         |
+------------------------+---------------------------+--------------------+
```

---

## 4. Component-by-Component Rebuild Plan

### 4.1 Quiz Header Bar

**Current:** Title “Quản lý câu hỏi” + stats + 3 action buttons.

**Rebuild:**
- Editable quiz title (click-to-edit `Typography` with `TextField` on focus).
- Status chip: `Draft` | `In Review` | `Published` | `Archived`.
- Last saved indicator with auto-save toggle.
- Primary actions: **Preview**, **Publish**, **Assign**.
- Secondary actions: **Undo / Redo / History**, **Settings**, **Import / Export**.
- Breadcrumb: LCMS > Quizzes > `{quizTitle}`.

**MUI components:** `AppBar`, `Toolbar`, `Chip`, `Button`, `IconButton`, `TextField`, `Tooltip`, `Menu`.

### 4.2 Mode Tabs

Replace the current ribbon with **MUI Tabs** anchored below the header.

- Each tab has a clear icon + label.
- Tab state syncs with URL query param (`?tab=build`).
- Unsaved changes guard when leaving tab.

### 4.3 Slide Outline (left)

**Current:** Flat type filters + search.

**Rebuild:**
- **MUI Tree View** (`@mui/x-tree-view`) showing groups → slides.
- Each node shows:
  - Drag handle.
  - Slide number.
  - Type icon (14 distinct icons).
  - Title truncated.
  - Score badge.
  - Status dot (draft / has feedback / has media).
- Right-click context menu: duplicate, delete, move to group, copy link.
- Search/filter bar with chips for type, group, missing feedback, missing answer.
- “Add slide” button at top opens a MUI Speed Dial or Menu with all slide types.

### 4.4 Slide Canvas (center)

**Current:** Table manager or full-screen dialog.

**Rebuild:**
- Default view: **Data Grid** list of slides when no slide selected.
- When a slide selected: **split canvas**.
  - Top: live learner preview (scaled iframe or component).
  - Bottom: form-based editor (or toggle to WYSIWYG).
- For choice questions: inline choice cards with check/radio, rich text, delete, drag handle.
- For drag-drop: visual drop zones + item palette.
- For hotspot: image upload + polygon/rectangle hotspot drawing.
- For matching: two-column drag pairing.

**MUI components:** `DataGridPremium`, `Card`, `Paper`, `Tabs`, `TextField`, `Checkbox`, `Radio`, `Switch`, `Slider`, `ButtonGroup`, `Divider`, `Accordion`.

### 4.5 Inspector (right)

**Current:** Dialog sidebar with 4 collapsed sections.

**Rebuild:**
- Fixed-width right drawer (`MUI Drawer`) with 3 tabs:
  1. **Content** — media, question stem, choices, answer key.
  2. **Feedback** — correct/incorrect/attempt-specific feedback, branching.
  3. **Options** — time limit, attempts, shuffle, partial credit, accessibility alt text.
- Use `MUI Accordion` for sections.
- Every field has a helper tooltip.
- “Apply to all slides of this type” action where appropriate.

### 4.6 Question Type UIs

Rebuild each question type as a dedicated MUI form module:

| Type | Key UI Elements |
|------|-----------------|
| Multiple choice | Radio group cards, rich-text choices, “add choice” button, shuffle toggle |
| Multiple response | Checkbox group cards, partial credit rules |
| True / False | Two large toggle cards |
| Short answer | Text field + accepted answers list |
| Numeric | Number input + tolerance + unit |
| Sequence | Draggable ordered list (`@dnd-kit` + MUI `List`) |
| Matching | Two-column editable pairs |
| Fill in the blanks | Sentence editor with `[blank]` tokens |
| Select from lists | Dropdowns embedded in rich text |
| Drag the words | Word bank + sentence drop targets |
| Hotspot | Image canvas + shape tools |
| Drag and drop | Category bins + draggable item cards |
| Likert scale | Statement + 5/7-point radio scale |
| Essay | Rich text prompt + rubric builder |

### 4.7 Settings Mode

Consolidate all quiz-wide settings into one page with **MUI Stepper** or **Tabs**:

1. **General** — title, description, language, cover image, instructions.
2. **Behavior** — passing score, time limit, attempts, navigation, shuffle, resume.
3. **Results** — feedback mode, pass/fail messages, certificate, redirect links.
4. **Scheduling** — open/close dates, timezone, availability windows.
5. **Assignment** — classes, student groups, individual students, enrollment rules.
6. **Security** — password, domain whitelist, IP restrictions, honor code.
7. **Defaults** — question defaults, fonts, feedback text.

### 4.8 Design Mode (Player Template)

- Layout presets as selectable cards.
- Theme picker with ERG brand presets.
- Color pickers for primary, secondary, background, text.
- Typography scale selector.
- Header/footer toggles.
- Sound on/off.
- Corner radius and shadow presets.
- Live preview updates instantly.

### 4.9 Preview Mode

- Device selector: Desktop / Tablet / Mobile.
- Persona selector: First attempt / Retry / Time-limited / Screen reader.
- Show answer key toggle for authors.
- Navigation between questions, submit simulation, result page preview.
- Split screen: preview on left, current editor state on right.

### 4.10 Publish Mode

- Version notes field.
- Environment selector: Staging / Production.
- Publish action creates immutable version.
- Public link, QR code, embed code, LMS LTI link.
- Unpublish / rollback previous version.

### 4.11 Results Mode

- Summary cards: attempts, average score, pass rate, median time.
- Data Grid of attempts with filter/search/export.
- Per-question item analysis: p-value, discrimination, distractor breakdown.
- Student performance distribution chart.
- Export to CSV / Excel / PDF.

---

## 5. Data & State Strategy

### 5.1 Preserve

Keep existing types but wrap in a versioned container:

```ts
interface QuizEditorProjectV2 {
  id: string;
  version: 2;
  title: string;
  status: 'draft' | 'in_review' | 'published' | 'archived';
  settings: QuizProjectSettings;
  playerTemplate: QuizPlayerTemplate;
  groups: QuizEditorGroup[];
  resultSlide: QuizEditorSlide;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
```

### 5.2 State management

- Use **Zustand** store: `useQuizEditorStore`.
- Slices: `project`, `ui`, `history`, `clipboard`, `preview`, `publishing`.
- History slice supports undo/redo with action labels.
- Auto-save debounced to backend or local storage.

### 5.3 Migration

- Add migration utility `migrateQuizProject(v1) -> v2`.
- Keep runtime player unchanged initially; it already consumes the slide model.

---

## 6. Backend/API Requirements

| Feature | Endpoint need |
|---------|---------------|
| Auto-save | `PUT /api/quizzes/{id}` |
| Publish | `POST /api/quizzes/{id}/publish` |
| Versions | `GET /api/quizzes/{id}/versions` |
| Assignments | `POST /api/quizzes/{id}/assignments` |
| Attempts | `GET /api/quizzes/{id}/attempts` |
| Analytics | `GET /api/quizzes/{id}/analytics` |
| Media library | `POST /api/media`, `GET /api/media` |
| Import QTI/GIFT | `POST /api/quizzes/{id}/import` |
| Export | `GET /api/quizzes/{id}/export?format=qti\|gift\|csv` |

If backend is not ready, mock endpoints and flag with TODOs.

---

## 7. Implementation Phases

### Phase 0 — Foundation (1 sprint)
- Install MUI v9 + X packages.
- Create `quiz-editor-v2/` feature folder.
- Set up MUI theme with ERG brand tokens.
- Write base layout shell: header, mode tabs, outline, canvas, inspector.
- Project-memory update: document MUI v9 exception.

### Phase 1 — Slide Manager (1–2 sprints)
- Tree view outline with groups.
- Data Grid manager with multi-select, reorder, bulk actions.
- Add / duplicate / delete / move slides.
- Search and filter chips.

### Phase 2 — Question Editor Core (2 sprints)
- Choice question forms (multiple choice, multiple response, true/false).
- Inspector tabs: Content / Feedback / Options.
- Rich text editor integration.
- Media upload placeholder.

### Phase 3 — Advanced Question Types (2 sprints)
- Sequence, matching, fill blanks, select from lists, drag words.
- Hotspot, drag-and-drop, Likert, essay, numeric, short answer.

### Phase 4 — Settings, Design, Preview (1–2 sprints)
- Settings mode with all 7 sections.
- Design mode with theme/layout presets.
- Preview mode with device/persona selectors.

### Phase 5 — Publish & Results (1–2 sprints)
- Publish workflow and version history.
- Assignment UI.
- Results dashboard and item analysis.

### Phase 6 — Polish & Enterprise Hardening (1 sprint)
- Keyboard shortcuts, a11y audit.
- Mobile responsiveness.
- Import/export QTI & GIFT.
- Performance: virtualization, lazy question type bundles.
- E2E tests with Playwright.

---

## 8. File Structure (proposed)

```
src/features/lcms/quiz/quiz-editor-v2/
├── index.ts
├── components/
│   ├── quiz-editor-shell.tsx
│   ├── quiz-editor-header.tsx
│   ├── quiz-mode-tabs.tsx
│   ├── build/
│   │   ├── build-mode.tsx
│   │   ├── slide-outline.tsx
│   │   ├── slide-manager.tsx
│   │   └── add-slide-menu.tsx
│   ├── editor/
│   │   ├── slide-editor.tsx
│   │   ├── inspector/
│   │   │   ├── inspector-panel.tsx
│   │   │   ├── content-tab.tsx
│   │   │   ├── feedback-tab.tsx
│   │   │   └── options-tab.tsx
│   │   └── question-forms/
│   │       ├── choice-question-form.tsx
│   │       ├── matching-question-form.tsx
│   │       ├── sequence-question-form.tsx
│   │       ├── drag-drop-question-form.tsx
│   │       ├── hotspot-question-form.tsx
│   │       ├── text-question-form.tsx
│   │       ├── likert-question-form.tsx
│   │       └── essay-question-form.tsx
│   ├── settings/
│   │   ├── settings-mode.tsx
│   │   ├── general-settings.tsx
│   │   ├── behavior-settings.tsx
│   │   ├── result-settings.tsx
│   │   ├── scheduling-settings.tsx
│   │   ├── assignment-settings.tsx
│   │   ├── security-settings.tsx
│   │   └── defaults-settings.tsx
│   ├── design/
│   │   ├── design-mode.tsx
│   │   ├── theme-gallery.tsx
│   │   └── layout-gallery.tsx
│   ├── preview/
│   │   ├── preview-mode.tsx
│   │   ├── device-toolbar.tsx
│   │   └── persona-picker.tsx
│   ├── publish/
│   │   ├── publish-mode.tsx
│   │   ├── version-history.tsx
│   │   └── share-links.tsx
│   └── results/
│       ├── results-mode.tsx
│       ├── attempts-grid.tsx
│       ├── analytics-cards.tsx
│       └── item-analysis.tsx
├── hooks/
│   ├── use-quiz-editor-store.ts
│   ├── use-slide-actions.ts
│   ├── use-undo-redo.ts
│   └── use-auto-save.ts
├── theme/
│   └── quiz-editor-theme.ts
├── types/
│   └── quiz-editor-v2-types.ts
└── utils/
    ├── migrate-quiz-project.ts
    └── export-utils.ts
```

---

## 9. Acceptance Criteria

### MVP (Phase 0–2)
- [ ] MUI v9 shell replaces classic editor for `/quiz-editor`.
- [ ] Slide outline tree + Data Grid manager functional.
- [ ] Add/edit/delete multiple-choice, multiple-response, true/false.
- [ ] Quiz settings page covers info, behavior, results.
- [ ] Preview mode opens student player.
- [ ] Auto-save and undo/redo.

### Full Release (all phases)
- [ ] All 14 question types editable.
- [ ] Groups with randomization rules.
- [ ] Publish with version history.
- [ ] Assignment to classes/students.
- [ ] Results dashboard with item analysis.
- [ ] Import/export QTI + GIFT.
- [ ] WCAG 2.2 AA pass.
- [ ] Mobile/tablet usable.

---

## 10. Open Questions / Decisions Needed

1. **MUI X license:** Will the project use Data Grid **Premium** (paid) or stay with **Pro / Community** + custom grouping?
2. **Rich text library:** TipTap (flexible, MIT) vs MUI-integrated Plate?
3. **Backend availability:** Which endpoints exist today? Should we build against mocks first?
4. **Route migration:** Replace `/quiz-editor` in-place or create `/quiz-editor-v2` during development?
5. **Runtime player:** Reuse existing `components/quiz` player or rebuild with MUI v9 for consistency?

---

## 11. Appendices

### A. Screenshot mapping
All screenshots referenced in `quiz-editor-audit.md` are stored alongside this plan in `docs/1606/`.

### B. Reference files to keep
- `src/lib/quiz.ts` — scoring logic.
- `src/components/quiz/questions/*` — runtime renderers (keep or wrap).
- `src/features/lcms/quiz/quiz-runtime/*` — attempt runtime.
- `src/features/lcms/quiz/quiz-theme/theme-catalog.ts` — theme presets.

### C. Files to deprecate
- `src/features/lcms/quiz/quiz-editor/styles/classic-editor.css`
- `src/features/lcms/quiz/quiz-editor/components/classic-editor-art.tsx`
- Custom ribbon primitives once MUI AppBar/Tabs/Toolbar are in place.
