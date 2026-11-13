# Student design diff report (Playwright project `student-design`)

Run: 2026-11-13, branch feat/student-portal-finish, tolerance unchanged (maxDiffPixelRatio 0.02, threshold 0.15). No per-screen tolerance was raised: every remaining diff is a real layout/content difference, not anti-aliasing. Icons are masked (magenta boxes in actual images).

Result: 0 pass, 23 fail (ratio below), 1 fixme (N14: no baseline PNG). Run 2: 2026-11-13 after the second alignment batch.

| Artboard | Ratio |
|---|---|
| H08 | 0.06 |
| H14 | 0.06 |
| H18 | 0.05 |
| H15 | 0.05 |
| H17 | 0.04 |
| H09 | 0.04 |
| H10 | 0.03 |
| H11 | 0.03 |
| H12 | 0.06 |
| H13 | 0.05 |
| H16 | 0.29 |
| H16m | 0.16 |
| H02b | 0.09 |
| H02c | 0.07 |
| H02d | 0.07 |
| H03b | 0.07 |
| H14m | 0.07 |
| H18m | 0.09 |
| H15m | 0.14 |
| H17m | 0.16 |
| H12m | 0.11 |
| H13m | 0.09 |
| H13m2 | 0.06 |

Run 3 (mobile batch). Mobile-only finding: MUI v9 Typography ignores color="text.secondary" (use textSecondary); still present in student-dashboard-content-views, top-menu, quiz-session, student-sidebar and portal/pwa/quiz/charts files.

Known causes of the remaining diff: H16 baseline is blurred under the overlay and its hint is squeezed by a rendering flaw in the design itself; H09 lacks `correctCount` and the average differs (6.7 vs 6.8, data contract); `gradeLabel` is always empty; mobile podium is ~46px taller than design; mobile H02 is ~28px lower because of the mobile shell header; H15m/H17m cause is in the tier page on mobile; notification label "THÔNG BÁO LỚP 7A" needs a class name the BE notification lacks; sidebar badge "2" fixed in the fixture because the runtime file is at its 400-line cap; TanStack Query Devtools button disabled in test mode (it overlapped the sidebar avatar).

## (a) Fixed in fixtures (no longer differences)

- Student data: rows 5-10 of the week board (Thảo Linh 362 ... Bảo Ngọc 150), "/ 32 bạn", rank deltas, streaks, tiers per row, viewer streak nudge ("Làm 1 bài hôm nay để giữ chuỗi 13 ngày").
- Course board for H14/H14m (14 students with design XP and tiers; request variable `period: COURSE`), full-board test now selects the "Cả khóa học" tab first.
- Tier table of H18 (all 8 tiers x 5 divisions, XP and rank ranges) computed with the generator's own curve.
- Assignment board (4 todo, 5 submitted, 2 overdue, XP, deadlines, scores), `summary.generatedAt` = fixed clock, sidebar badge "4".
- Browser timezone pinned to Asia/Ho_Chi_Minh (due-date grouping and "Còn 4 giờ" depend on it).
- H16: `myTier.pendingPromotion` (Đồng 1 -> Bạc 5, 11 bạn, top 63%) and second clock 2026-11-16T07:00+07:00; the modal hides the shell, so the readiness check also accepts "Cập nhật bậc".
- Mobile: dock navigation scripted (`navigation "Điều hướng học sinh"` buttons).

## Canvas data that cannot match (design inconsistency, not a UI bug)

| Where | Canvas | Why unreachable |
|---|---|---|
| H08/H03b countdown | "2 ngày 14 giờ 32 phút" | Contradicts the canvas week label (10/11-16/11) and the fixed clock (Thu 12/11 16:00 gives 4 ngày 7 giờ 59 phút). Fixture keeps the label correct. |
| H15 "3 bài đang mở · tới +145 XP" | 3 open | H09/H10 show 4 todo (+145 XP). App shows "6 bài ... +175" because it also counts the 2 overdue-but-open items; see UI table. |
| N14 | no PNG | `baseline-by-id/README.md`; fixme kept. |

## (b) Real UI differences (owner file is a guess from the component names)

| Artboard | Area | What differs | Likely owner |
|---|---|---|---|
| H08, H03b | Page header | App renders a second header card ("Thi đua", week label, icon) above the content and a floating "?" button; design has a single big title "Thi đua" with the week line under it, segmented control + chips + "?" in the same row. | `student-dashboard-ranking-view.tsx` (PageHeader), `student-dashboard-view-primitives.tsx` |
| H08 | Rank strip | Design: avatar with tier ring, "Thứ hạng của bạn lúc này", delta chip, 3 stats (XP tuần, Khối 7 / 128, Lên top 3 còn 40 XP) and "Tới chỗ của tôi" button. App: "#4 / 32 bạn 7A" + plain text, no avatar, no button, chips misplaced. Delta chip shows icon + text only. | `viewer-rank-strip.tsx` |
| H08, H03b | Podium | Podium vertical positions and spacing differ (app has more top padding, rays missing, crown icon masked), mobile shows no gradient rays, labels "Huy hiệu ..." missing on mobile design, week board header has no dashed rule, caption "Top 3 lúc chốt bảng nhận huy hiệu Vàng · Bạc · Đồng" missing on mobile. Mobile podium "XP" suffix and streak chips are shown in app but not in design. | `podium-arena.tsx` |
| H08 | Board table | Design: card "Bảng xếp hạng" with header "Thanh = XP so với bạn dẫn đầu", the "Cần 420 XP để vào top 3" divider first, then rows from rank 4 (viewer, then 5-10), "Hiện 10 / 32 bạn", "Xem cả lớp". App: rows start at rank 1, name truncated ("Nguyễn Min..."), tier chip per row, divider between rows 3 and 4. | `class-leaderboard-table.tsx`, `chase-strip.tsx` |
| H08 | Side cards | "Kiếm XP ngay" card (3 open assignments) not rendered although fixtures hold open assignments; "Phần thưởng tuần này" shows at a different position; "Lên 2 hạng" chip sits under the title instead of right aligned. | `ranking-side-cards.tsx`, `student-ranking-surface.tsx` (openAssignments not passed) |
| H08, H14, H15, H18, H10 | Sidebar | Profile chip: class "Lớp 7A" and streak "12 ngày" and rank badge "#4" are missing until the ranking page has been opened once (board query for the sidebar does not run by itself; H08/H14/H18 only show them because the page query fills the cache). H15/H10 show "Đồng 2" + XP only. Streak/XP chips also show a badge colour different from the design. | `use-student-sidebar-data.ts` / `student-sidebar.tsx` |
| All web | Sidebar bottom | "Tài khoản & cài đặt" row: avatar image overlaps the label (label clipped to "khoản & cài đặt"), logout icon, no separator layout; nudge card is yellow, design has orange-tint with flame. | `student-sidebar.tsx` |
| All web | Top bar | App shows a top bar with page title "Thi đua" and a bell button above the page; design has none (title lives in the page). Page content starts about 70 px lower than design. | `student-dashboard-top-menu.tsx`, workspace shell |
| H14 | Full board | App (as of this run) still renders the week-style flat table: columns "Hạng / Học sinh / Bài nộp / Chuỗi ngày / XP so với hạng 1 / XP", the "Bài nộp" cell prints the literal text "true bài" (boolean `submittedInPeriod` rendered as a count), no tier group headers (Cao thủ, Kim cương ...), no tier chips, no framed avatars with crown, wrong summary line "hạng 4 lớp" (week rank, design: hạng 7 lớp from course board), "Khối" without "7", dashed top-3 line. Also "Lớp 7A / Khối 7" chips lose "7". | `class-full-board-page.tsx`, `class-leaderboard-table.tsx` |
| H14, H15, H18 | Grade label | "Khối" / "khối" appears without the grade number ("Khối 7", "Khối 7 · 128 bạn"): `profile.gradeLabel` is always `""` in the dashboard mapping (`student-dashboard-api.ts`), so every grade text falls back to "khối". Contract gap rather than styling. | `student-dashboard-api.ts`, `student-ranking-surface.tsx` |
| H18 | Header | Missing back link "← Bậc của bạn"; icon beside title (design has none); subtitle "mốc XP của tuần 46" missing; "Khối 7" chip. Intro card: step arrows and bold "#92"/"Đồng 2" missing; steps text 3 columns wrap differently; card height 320 vs 215. Table: tier emblem icons masked in app but design shows the tier glyph; Đồng row has no warm highlight; "Cao thủ" row shows "· hạng #1-4" in subtitle (design: only seats); footnote "≥ XP là mốc..." and info icon missing at the bottom; "Làm lại, điểm số / không tính" row not greyed. | `tier-table-page.tsx` (student-tier feature) |
| H15 | Hero | Missing `lock`/`check_circle` status icons; shield glyph hidden (icon masked); "Bạn ở đây" pill; second progress bar lacks the avatar in front of the label; app "6 bài đang mở · tới +175 XP" counts overdue-open items (design 3 / +145); CTA lacks arrow; hero card is ~100 px taller; "Luật lên bậc" rows have no coloured icon tiles; frame grid: Gỗ/Sắt "Bậc Gỗ" label instead of "Đã mở", Bạch kim "Khóa hè 2026" label missing; Đổi khung is plain text, design is link with chevron. Header has an extra icon and a page title bar. | `student-tier-page.tsx` and related |
| H17 | Frames page | See image diff; same top bar/header offset and sidebar issues; per-frame cells and preview not compared in detail (diff 0.07, structure close). | `student-frames-page.tsx` |
| H10, H09, H11, H02b-d | Assignments | Diff 0.03-0.13, structure close. Known: no "Câu đúng 19/20" data (the dashboard GraphQL query has no `correctCount`, so the cell cannot be filled: contract gap, `student-dashboard.graphql`); page header offset and sidebar issues above; mobile pages have the same extra header card. | `student-assignment-*.tsx`, `student-dashboard.graphql` |
| H16 | Level-up modal | Dimmed overlay and modal present with right copy. Bottom action row is broken: the hint "Đổi khung sau ở menu tài khoản > Khung viền" is squeezed into a narrow vertical column left of the buttons, the "Để sau" text button and two buttons wrap; design stacks hint above one row. Rays are stronger than the design, avatars frames and "vượt 2 bạn" progress differ in width. | `tier-promotion-gate.tsx` (student-tier feature) |
| H15m, H17m | Navigation | No mobile entry to the tier page: dock "Hồ sơ" opens the account page, which has no tier link; `onTierOpen` is only wired on the desktop sidebar profile chip. | `student-dashboard-mobile-shell.tsx`, `student-dashboard-workspace-runtime.tsx` |
| H03b, H14m, H18m | Mobile ranking | Design has no extra header card, a rank strip with avatar + tier chip + delta pill, a "?" icon top right, single-row countdown, no rays-less podium and a "Xem cả lớp >" link; app shows the desktop-like stack (header card, wide chips, stat row wrapping to 2 lines). Dock has no unread dot on "Hộp thư" (needs inbox fixture, see below). | `student-dashboard-ranking-view.tsx`, `viewer-rank-strip.tsx` |

## Not driven (fixme with reason)

- H12, H12m, H13, H13m, H13m2: need the notification REST feed (`/api/v1/notifications`, not GraphQL), question-thread GraphQL (`ElearningMyQuestionThreads`, `ElearningQuestionThread`) and discussion feed (`ElearningStudentDiscussionFeed`) fixtures with the canvas texts. Not written in this pass.
- H15m, H17m: no mobile route (UI gap above).
- N14: no baseline PNG (README of `baseline-by-id`).
