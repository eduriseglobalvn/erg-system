# Hoclieu Add Content Design

**Goal:** Refactor the `+` add-content flow in LMS authoring so users first choose a content type, then get a dedicated form for structure, lecture, or exercise content.

**Scope:**
- Keep the existing taxonomy creation flow for `Nhóm học liệu`, `Chủ đề / Bài học`, `Học phần / Unit / Lesson`, and `Bộ sách / Chương trình`.
- Add two new content branches inside the same dialog: `Bài giảng` and `Bài tập`.
- Prioritize Google Slides links for `Bài giảng` instead of file upload in this flow.
- Mock the `Bài tập` selector in frontend only, with filtering by current subject/topic/lesson context.

**Design:**
- Replace the single-form taxonomy dialog with a two-step dialog.
- Step 1 is a type picker that separates structure items from learning content items.
- Step 2 renders a dedicated form:
  - Structure items reuse the existing taxonomy creation payload flow.
  - Lecture items collect display name, short note, and Google Slides URL. The dialog stores them as local mock attachments for now.
  - Exercise items show a searchable mock list filtered by current context and allow multi-select before attaching.
- Mock lecture and exercise attachments are displayed together with uploaded resources in the right-side attachment panel so teachers can distinguish them clearly.

**Boundaries:**
- Keep backend resource upload flow unchanged.
- Keep new mock content logic inside `src/features/admin-operations`.
- Extract pure helper logic and mock datasets into separate files so the main workspace file becomes easier to reason about.
