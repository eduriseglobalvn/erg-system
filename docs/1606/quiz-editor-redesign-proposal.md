# Quiz Editor v2 — UI Critique & Redesign Proposal

> **Author:** Senior FE Engineer (50y experience)  
> **Date:** 2026-06-16  
> **Screenshots referenced:** `docs/1606/current-ui-v2-*.png`  

---

## 1. Current UI Assessment — What's Wrong

After scanning the live quiz editor at `https://lcms.erg.edu.local:3001/quiz-editor`, I see a **Phase 0/1 scaffold** that has structural improvements over the old overlay-based UI, but still has critical UX problems that make it **NOT clean, NOT intuitive, and hard to use**.

### 1.1 Visual Noise — Three-Column Overload

The current layout uses a 3-panel layout:

```
| Outline (250px) | Data Grid (flex) | Inspector (320px) |
```

**Problems:**
- **All three panels fight for attention.** The outline shows the same data as the grid rows (slide titles, types, groups). This is redundant.
- **The inspector panel shows "Inspector scaffold" placeholder text** with no actual editing capability. It wastes 320px of horizontal space for nothing.
- **The Data Grid is a traditional spreadsheet** — fine for data entry, terrible for creative authoring. Teachers don't think in rows and columns. They think in **slides and questions**.
- **No visual hierarchy.** Everything is the same visual weight — outline items, grid rows, filter chips, status badges all use the same density.

### 1.2 The "Slide Manager" Table Is Anti-Authoring

Looking at the Data Grid:

| Column | Problem |
|--------|---------|
| Checkbox | Select-for-what? Bulk operations don't exist yet. |
| Type | A plain text label like "drag and drop" — should be an icon or color-coded chip. |
| Title | Clickable but just opens the same inspector scaffold. |
| Feedback | "Correct + incorrect" — not actionable, just a status tag. |
| Group | "Nhóm câu hỏi 1" — useful, but duplicated in outline. |
| Score | All "10" — not useful at a glance without knowing max. |
| Media | "9 items" or "hotspot-mock.svg" — cryptic, not a thumbnail. |
| Status | "Ready" or "Draft intro" — good concept, poor visual treatment. |
| Actions | Edit/Duplicate/Delete per row — 3 icon buttons per row × 16 rows = 48 buttons. Visual clutter. |

**The fundamental problem:** This table treats questions like **database rows** when teachers need to treat them like **cards on a canvas**.

### 1.3 The Outline Panel Is Redundant

The left outline panel shows:
- Quiz title
- Search bar
- Filter chips (All 16, Questions 14, Intro 2, Needs feedback 0, Media 3)
- Group tree with slide items

**Problems:**
- The tree duplicates the Data Grid 1:1. Seeing "1. Món nào sau đây..." in both the tree and the grid adds zero value.
- The filter chips are useful but belong in a **toolbar**, not a persistent sidebar.
- Collapsing/expanding groups in the tree doesn't sync meaningfully with the grid.
- **Worst of all:** The tree is **not draggable**. You can't reorder slides by dragging in the outline. That's the #1 use case for an outline!

### 1.4 Adding Questions Is Hidden Behind a Button

The "Add" button in the outline header is small and non-discoverable. There's no **add question** button in the main content area. Teachers should see a prominent "+" or "Add question" card in the grid area.

### 1.5 Where Do You Edit a Question?

Clicking "Edit" on a row → the inspector panel still shows:

> **"Inspector scaffold"**  
> **heading:** "Đây là bài kiểm tra mẫu Copy"  
> **"Content, feedback, and option editors will mount here in the next phase."**

**This is the #1 critical gap.** Without a question editor, the entire UI is just a database viewer. The question editing experience is where 80% of teacher time is spent. It MUST be:

1. **Inline / side-by-side** — not hidden behind a modal or a separate page.
2. **WYSIWYG** — teachers should see what students see AND edit it directly.
3. **Contextual** — when I select a multiple-choice question, I want to see choices immediately, not a blank "inspector scaffold."

### 1.6 The Settings Tab Is Better But Needs Work

The Settings tab with 7 sub-tabs (General, Behavior, Results, Scheduling, Assignment, Security, Defaults) is **well-organized**. But:

- The left outline panel is **still visible** in Settings mode — it's irrelevant when configuring quiz-wide settings. It should hide.
- The inspector panel is also visible in Settings mode — it should be replaced by a settings detail area.
- "Scheduling" and "Assignment" appear to be scaffolds with no real content yet.

### 1.7 Missing Core Interaction: Drag-and-Drop Question Adding

The user asked specifically: **"có thể nào chúng ta dùng tính năng kéo thả để thêm câu hỏi"**

**Answer: YES, absolutely.** This is how modern quiz builders (like Google Forms, Typeform, Canvas) work:

- A **question type palette** on the left or top with draggable cards:
  - Multiple Choice, True/False, Short Answer, etc.
- Teachers **drag a card** from the palette into the slide list.
- The new question appears immediately with a default template.
- Teachers edit inline.

---

## 2. Redesign Proposal — "Clean Canvas" Architecture

### 2.1 Layout Principle: Context-Switching, Not Information Overload

```
MODE: Build → Show Outline + Canvas + Inspector
MODE: Settings → Show Full-Width Settings (no outline, no inspector)
MODE: Preview → Show Player (full-width, device frame)
MODE: Publish → Show Publish Panel
MODE: Results → Show Analytics Dashboard
```

### 2.2 Build Mode — New Layout

```
+------------------------------------------------------------------+
|  Breadcrumb: LCMS > Quizzes > Title   | Draft | Auto-save | ... |
+------------------------------------------------------------------+
|  Mode Tabs: Build | Design | Settings | Preview | Publish | ...  |
+------------------------------------------------------------------+
|           |                              |                        |
| OUTLINE   |      CANVAS (Slide Cards)    |    INSPECTOR           |
| (240px)   |      (flex-grow)             |    (360px)             |
|           |                              |                        |
| Drag to   |  +---+ +---+ +---+ +---+    |  [Selected question   |
| reorder   |  | 1 | | 2 | | 3 | | 4 |    |   editing form]        |
|           |  |MC | |TF | |SA | |DD |    |                        |
| Search    |  +---+ +---+ +---+ +---+    |  Question: ________    |
| Filter    |                              |  Choices:             |
|           |  +---+ +---+ +---+ +---+    |    □ Option A ______   |
| Groups    |  | 5 | | 6 | | 7 | | 8 |    |    □ Option B ______   |
| ----      |  |MA | |SQ | |FB | |SL |    |    □ Option C ______   |
| Group 1   |  +---+ +---+ +---+ +---+    |    + Add choice        |
| Group 2   |                              |                        |
|           |  +---+ +---+                |  Feedback:             |
|           |  | 9 | | 10|                 |    ✓ Correct: _____    |
|           |  |LK | |ES|                 |    ✗ Incorrect: _____   |
|           |  +---+ +---+                 |                        |
|           |                              |  Options:              |
| + Add     |  + Add Question  +          |    Score: [10]         |
| Question  |  Drag a type or click      |    Shuffle: [on]        |
| Type      |  to add                     |    Attempts: [1]       |
| --------  |                             +------------------------+
| [MC] [TF] |                             | [Content][Feedback]    |
| [SA] [DD] |                             | [Options]              |
+-----------+-----------------------------------------------------+
|  Status bar: 16 slides | 2 groups | Selected: Q4 | Auto-saved  |
+------------------------------------------------------------------+
```

### 2.3 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Slide Cards, not Data Grid** | Teachers see questions as visual cards with type icon, title preview, status. Like Google Forms. |
| **Drag-and-Drop from Type Palette** | "+" button in outline reveals question type palette. Drag from palette to canvas or click to insert at end. |
| **Inspector IS the editor** | When you select a question, the right panel shows the full editing form for that question type. No modal needed. |
| **Outline syncs with Canvas** | Clicking a card in canvas highlights it in outline. Dragging in outline reorders in canvas. |
| **Outline hides in non-Build modes** | Settings, Preview, Publish, Results — all full-width. No wasted sidebar. |
| **Data Grid available but secondary** | A "Table view" toggle in the toolbar switches from card view to table view for bulk operations. |
| **Real-time WYSIWYG preview inside Inspector** | A small "Student view" toggle inside the inspector shows a live preview of how the student sees it. |

### 2.4 Adding Questions — The Drag-and-Drop Experience

**From the type palette** (bottom-left of outline):

```
+------------------------+
|  ADD QUESTION          |
|  ┌────────┐ ┌────────┐ |
|  │ ✅ MC  │ │ ✅ TF  │ |
|  └────────┘ └────────┘ |
|  ┌────────┐ ┌────────┐ |
|  │ 📝 SA  │ │ 🔢 NUM │ |
|  └────────┘ └────────┘ |
|  ┌────────┐ ┌────────┐ |
|  │ ↔️ MA  │ │ 🔗 MT  │ |
|  └────────┘ └────────┘ |
|  ┌────────┐ ┌────────┐ |
|  │ ↔️ SEQ │ │ 📦 FB  │ |
|  └────────┘ └────────┘ |
|  ┌────────┐ ┌────────┐ |
|  │ 📋 SL  │ │ ↔️ DW  │ |
|  └────────┘ └────────┘ |
|  ┌────────┐ ┌────────┐ |
|  │ 🎯 HS  │ │ 📊 LK  │ |
|  └────────┘ └────────┘ |
|  ┌────────┐ ┌────────┐ |
|  │ 📝 ES  │ │ 📄 DD  │ |
|  └────────┘ └────────┘ |
|                        |
|  14 question types     |
+------------------------+
```

Teachers can:
1. **Click** a type card → new question appended at end.
2. **Drag** a type card → drop it at a specific position in the canvas.
3. **Search** types by name if they don't see the one they want.

### 2.5 Question Editing — Inspector-as-Editor

When a question card is selected in the canvas, the inspector transforms into a **type-specific editor**:

```
+----------------------------+
| EDITING: Multiple Choice    |
| ─────────────────────────── |
| Question *                  |
| ┌──────────────────────────┐|
| │ Món nào sau đây là...    ─││ ← Rich text editor
| └──────────────────────────┘|
|                             |
| Choices                     |
| ┌─┬────────────────────┬─┐ |
| │✓│ Rau cải             │×│ |
| │✓│ Bơ                   │×│ |
| │✗│ Bánh quy             │×│ |
| │✗│ Gà rán               │×│ |
| │ │ + Add choice          │ │ |
| └─┴────────────────────┴─┘ |
|                             |
| ▶ Student Preview           |
| ┌────────────────────────┐  |
| │ Món nào sau đây là...  │  |
| │ ○ Rau cải  ○ Bơ         │  |
| │ ○ Bánh quy  ○ Gà rán    │  |
| └────────────────────────┘  |
|                             |
| ┌────────┐ ┌────────┐      |
| │Content │ │Feedback│      |
| │  tab   │ │  tab   │      |
| └────────┘ └────────┘      |
| ┌────────┐ ┌────────┐      |
| │Options │ │Media   │      |
| │  tab   │ │  tab   │      |
| └────────┘ └────────┘      |
+----------------------------+
```

**Key UX principles:**
- **Form fields are always visible** — no "expand section" needed for common fields.
- **Student Preview toggle** — one click to see how the student views it.
- **Tab navigation** for less-frequent sections (feedback, options, media).
- **Type-specific fields** appear/disappear based on question type. Multiple choice shows choices; drag-drop shows item boxes; essay shows a rubric builder.

### 2.6 Settings Mode — Full-Width

When switching to Settings tab:
- **Outline panel collapses to icon** (or hides completely).
- **Inspector panel hides.**
- **Canvas becomes full-width settings page.**

```
+------------------------------------------------------------------+
| Settings                                                          |
+------------------------------------------------------------------+
|  General | Behavior | Results | Scheduling | Assignment | Securi..|
+------------------------------------------------------------------+
|                                                                   |
|  Quiz title:  [Đây là bài kiểm tra mẫu_____________]              |
|  Author:       [ERG Teacher Hub_________]                         |
|  Course:       [IC3 GS6 Level 2_________]                         |
|  Version:      [Version 1.0___________]                           |
|                                                                   |
|  Introduction                                                     |
|  ┌─────────────────────────────────────────────────────────────┐   |
|  │ Dùng bài kiểm tra này để dẫn dắt người học...                │   |
|  └─────────────────────────────────────────────────────────────┘   |
|                                                                   |
|  [✓] Show introduction page                                       |
|  [✓] Show quiz statistics                                          |
|                                                                   |
+------------------------------------------------------------------+
```

### 2.7 Preview Mode — Full-Width Player

```
+------------------------------------------------------------------+
| Preview ▶ | Device: [Desktop▼] [Tablet] [Mobile] | Persona: [▼]  |
+------------------------------------------------------------------+
|                                                                   |
|  ┌──────────────────────────────────────────────────────────┐      |
|  │                    ERG E-LEARNING                         │      |
|  │  ─────────────────────────────────────────────             │      |
|  │  Món nào sau đây là nguồn chất xơ?                       │      |
|  │                                                           │      |
|  │  □ Rau cải    □ Bơ        □ Bánh quy   □ Gà rán         │      |
|  │                                                           │      |
|  │            [Câu trước]  [Câu tiếp theo]                   │      |
|  └──────────────────────────────────────────────────────────┘      |
|                                                                   |
|  ◀ 2/14 ▶  |  Answer Key: [Off] [On]  |  Time Limit: [Off] [On] |
+------------------------------------------------------------------+
```

---

## 3. Implementation Priorities

### Phase 2 — Card Canvas + Inspector Editor (NEXT)

This is the most critical phase. Without question editing, the quiz editor is useless.

1. **Replace Data Grid with Card Canvas view** (keep table view as toggle).
2. **Implement Question Type Palette** with drag-and-drop.
3. **Build Inspector-as-Editor** for at least 3 question types (MC, TF, Short Answer) first.
4. **Add "Student Preview" toggle** inside inspector.
5. **Outline–Canvas sync**: clicking a card scrolls to it; selecting in outline highlights the card.

### Phase 3 — Settings & Design Modes

6. **Full-width settings page** (hide outline and inspector).
7. **7 settings sub-tabs** with real form fields.
8. **Design mode**: layout presets, theme colors, typography.

### Phase 4 — Preview & Publishing

9. **Preview mode**: device frame, persona selector, answer key toggle.
10. **Publish mode**: version notes, environment selector, share links.
11. **Assignment**: class/student picker.

### Phase 5 — Results & Analytics

12. **Results dashboard**: summary cards, attempt grid, item analysis.
13. **Charts**: score distribution, per-question breakdown.

### Phase 6 — Drag-and-Drop Complete

14. **Full drag-and-drop** reordering in both outline and canvas.
15. **Drag from question bank** palette.
16. **Bulk operations**: multi-select, bulk move, bulk delete.

---

## 4. Specific Code-Level Recommendations

### 4.1 Components to Build Next

```
src/features/lcms/quiz/quiz-editor-v2/components/
├── build/
│   ├── build-mode.tsx              ← Main 3-panel Build layout
│   ├── slide-outline.tsx           ← Left panel with drag-and-drop tree
│   ├── question-type-palette.tsx   ← Bottom-left palette with drag cards
│   ├── slide-canvas.tsx            ← Center: card grid / table toggle
│   ├── slide-card.tsx              ← Individual question card (icon, title, status)
│   └── slide-card-grid.tsx         ← Responsive grid of slide cards
├── editor/
│   ├── question-inspector.tsx      ← Right panel: question editing form
│   ├── choice-editor.tsx           ← MC/MA/TF choice editor
│   ├── text-response-editor.tsx    ← Short answer, essay, numeric
│   ├── matching-editor.tsx         ← Matching pairs editor
│   ├── sequence-editor.tsx          ← Ordering editor
│   ├── fill-blank-editor.tsx       ← Fill-in-the-blank editor
│   ├── drag-drop-editor.tsx         ← Drag-and-drop item editor
│   ├── hotspot-editor.tsx           ← Hotspot image+zone editor
│   ├── likert-editor.tsx            ← Likert scale editor
│   ├── feedback-tab.tsx             ← Per-question feedback tab
│   ├── options-tab.tsx              ← Per-question options tab
│   ├── media-tab.tsx                ← Per-question media tab
│   └── student-preview-toggle.tsx   ← Mini preview inside inspector
└── ...
```

### 4.2 Drag-and-Drop Architecture

Use `@dnd-kit/core` (already in project deps) for:
- Reordering slides within the outline tree.
- Reordering slides within the card canvas.
- Dragging a question type from the palette to the canvas (creates a new slide).

```typescript
// DndContext setup in BuildMode
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  useSensor(KeyboardSensor)
);

<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SlideOutline />
  <SlideCanvas />
  <QuestionTypePalette />
</DndContext>
```

### 4.3 State Management

Use Zustand store with slices:

```typescript
interface QuizEditorStore {
  // Project
  project: QuizEditorProjectV2;
  
  // UI
  mode: 'build' | 'design' | 'settings' | 'preview' | 'publish' | 'results';
  selectedSlideId: string | null;
  canvasView: 'cards' | 'table';
  inspectorTab: 'content' | 'feedback' | 'options' | 'media';
  
  // History
  undoStack: QuizEditorProjectV2[];
  redoStack: QuizEditorProjectV2[];
  
  // Actions
  addSlide(type: QuestionType, position?: number): void;
  deleteSlide(id: string): void;
  duplicateSlide(id: string): void;
  moveSlide(fromIndex: number, toIndex: number): void;
  updateSlide(id: string, patch: Partial<QuizEditorSlide>): void;
  // ...
}
```

---

## 5. Comparison — Before vs After

| Aspect | Current (Phase 0/1 scaffold) | Proposed Redesign |
|--------|-------------------------------|-------------------|
| **Question management** | Data Grid with rows | Card Canvas with drag-and-drop |
| **Adding questions** | Small "Add" button in outline | Draggable type palette + "Add Question" card |
| **Editing questions** | Inspector shows "scaffold" placeholder | Inspector transforms into full type-specific editor |
| **Preview** | Separate dialog, loses context | Inline preview toggle inside inspector + full Preview mode |
| **Outline** | Redundant tree syncing 1:1 with grid | Interactive drag tree that IS the primary navigation |
| **Settings** | Mixed into same 3-panel layout | Full-width tabbed page |
| **Visual hierarchy** | Everything equal weight | Cards → Editor → Preview layered by frequency of use |
| **Mobile** | Not usable | Card view is responsive; table view desktop-only |
| **Status** | "Ready" text badge | Color-coded progress chip (✅ Ready, ⚠️ Draft, ❌ Incomplete) |

---

## 6. One-Session Sketch — What to Build FIRST

If I had one sprint to make the UI usable, I'd build:

1. **Card Canvas** — Replace Data Grid with slide cards. Each card shows: type icon, truncated title, status chip, score badge. Clicking selects it.
2. **Question Type Palette** — Expandable palette with 14 type cards. Click to add.
3. **Choice Editor in Inspector** — For MC/MA/TF only. This covers the most common question types (80%+ of all questions). Fields: title, choices list, correct answer toggle, score.
4. **Inspector Tabs** — Content (default), Feedback, Options, Media. Only Content tab needs to be functional initially.

This would make the editor **actually usable** for creating multiple-choice quizzes — which is the 80% use case.

---

## 7. TL;DR — The 3 Fixes That Matter Most

1. **🚫 No more Data Grid as primary view.** Use compact slide cards with type icons, status, and drag reordering.
2. **🚫 No more "scaffold" inspector.** When you select a question, the inspector MUST show a real editing form for that question type.
3. **✅ Drag-and-drop question adding.** A type palette on the left where teachers drag question types into the canvas — like adding blocks in Notion or Typeform.

Without these three changes, the quiz editor is a "database viewer with a TODO inspector."