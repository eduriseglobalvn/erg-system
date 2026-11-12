# Cổng học sinh: Bài tập, Thi đua, Bậc & Khung viền, Hộp thư, Thảo luận — Spec triển khai

> Ngày viết: 12/11/2026 · Nhánh gốc: `main` · Trạng thái: **chờ chủ dự án duyệt**
> Nguồn sự thật DUY NHẤT về giao diện: canvas **https://claude.ai/artifact/8JtLGs4xSsSCM8ZNsoUbNu**, trang **"4 · Học sinh"**, **bản 92**.
> Bản chép mã nguồn artboard nằm trong repo: `docs/design/student-portal/source/` (HTML + `erg.css`) và `docs/design/student-portal/generators/` (script sinh ra các artboard, chứa dữ liệu mẫu).
> Nếu canvas sau này có bản mới hơn: spec này KHÔNG tự đổi theo. Chủ dự án phải duyệt bản mới, chép lại `source/` + `baseline/`, rồi ghi số bản mới vào dòng trên.

---

## 0. Đọc trước khi làm (bắt buộc)

1. Mọi màn hình trong spec phải giống artboard tương ứng: cùng bố cục, chữ, màu, cỡ chữ, độ đậm, bo góc, khoảng cách, icon, thứ tự phần tử. Cách đo "giống" ở **mục 9** — đó là cổng chặn, không phải gợi ý.
2. Không tự "cải tiến" giao diện. Thấy thiết kế có vấn đề (thiếu trạng thái, chữ tràn, khó dùng) thì **dừng, ghi vào mục 12 "Câu hỏi mở"** và hỏi chủ dự án. Chủ dự án sửa canvas trước, rồi code theo.
3. Không đụng `F:\ERG\erg-spring` khi chủ dự án đang dùng repo đó cho việc khác. Hỏi trước khi bắt đầu phần backend.
4. Trước mỗi commit chạy đủ bảng kiểm trong `CLAUDE.md` (typecheck, eslint, verify, test) **và** `bun run e2e:student-design` (mục 9).

---

## 1. Mục tiêu

- Học sinh **muốn** làm bài tập vì thấy rõ: làm bài → được XP → lên hạng tuần, lên bậc cả khóa, mở khung viền.
- Học sinh thấy **điểm chính xác** và **số câu đúng / tổng câu** của từng bài đã nộp.
- Ba tab Bài tập (Cần làm / Đã nộp / Quá hạn), menu học sinh gọn, Hộp thư và Thảo luận dùng được trên điện thoại và máy tính.

### Không làm (non-goals)
- Không xếp hạng theo điểm số. Không bao giờ hiện điểm của học sinh này cho học sinh khác.
- Không làm nhiệm vụ ngày, mục tiêu ngày +50 XP, thử thách lớp (đã nêu trong ý tưởng cũ, chưa có thiết kế).
- Không đổi màn làm bài (L01–L09, WL1–WL6) trong spec này.
- Không cho học sinh mua / đổi XP lấy khung. Khung chỉ mở bằng bậc.

### Anti-goals (làm ra mà thế này là hỏng, dù chạy được)
- Màn hình lệch thiết kế mà vẫn merge.
- Học sinh đoán được điểm của bạn khác (qua XP, qua bậc, qua bất kỳ số nào).
- Học sinh tụt bậc chỉ vì nghỉ 1 tuần.
- Trên iPhone 7 / Safari 15 khung viền tròn hiện thành ô vuông, hoặc bục 3D vỡ.

---

## 2. Đã có trên production (không làm lại)

| Phần | Ở đâu | Ghi chú |
|---|---|---|
| Bảng thi đua theo XP (tuần/tháng/học kỳ, lớp/khối, ẩn tên) | FE `src/features/elearning/class-leaderboard/*`, `student-dashboard-ranking-view.tsx`; BE `LeaderboardXp.java`, `ClassLeaderboardService.java`, `V139__leaderboard_xp.sql` | Learning `l-72b22e35`. Công thức XP giữ nguyên (mục 5.1). |
| Đã nộp = graded / needs_review / …, điểm lấy lần nộp gần nhất | `student-dashboard-api.ts` (`HANDED_IN_STATES`, `mapAssignment`) | Learning `l-c2d87be8`. |
| Thảo luận trả lời 2 cấp, trang kiểm duyệt cho GV/Admin | `student-dashboard-discussion-*.tsx`, `discussion-moderation/*` | Commit `d34c8c0`. |
| Token huy chương | `erg-enterprise-tokens.ts` → `medal` | **Đổi giá trị** theo mục 4. |

---

## 3. Ràng buộc chung (áp cho mọi màn)

| Ràng buộc | Giá trị | Nguồn |
|---|---|---|
| UI | MUI v9 + Emotion, ưu tiên `src/components/erg-mui/*`. Import theo path, không barrel. Không shadcn/Tailwind mới. | CLAUDE.md |
| Font | Một họ **Be Vietnam Pro** 400/500/600/700 | CLAUDE.md, `erg.css` dòng 7 |
| Icon | `@mui/icons-material`. Bảng đổi tên ở **mục 8** — không dùng icon khác bảng. | — |
| Màu, cỡ chữ, độ đậm | Chỉ qua token. Không hex / `fontSize` / `fontWeight` số mới trong component (`check-design-token-baseline.mjs` chặn). | CLAUDE.md |
| Nút | Mỗi `<Button>` ghi `variant`. **Tối đa 1 nút `contained` mỗi màn** — số nút contained từng màn ở mục 7, test ở mục 9.4. | CLAUDE.md, ESLint |
| Loading | Chỉ `ContentPendingSkeleton` / skeleton `wave`; spinner chỉ trong nút. Không loader toàn màn. | CLAUDE.md |
| Ngày giờ | `formatDateVi` / `formatDateTimeVi`, `dd/MM/yyyy`, 24h, múi `Asia/Ho_Chi_Minh`. Không `toISOString().split("T")[0]`. | CLAUDE.md |
| Số | Dấu chấm phân cách nghìn (`1.240`), dấu phẩy thập phân (`6,8`). Dùng `Intl.NumberFormat("vi-VN")`. | Thiết kế |
| API | Đường dẫn mới thêm vào `src/lib/api/api-endpoints.ts`. GraphQL: sửa `contracts/backend/schema.graphqls` + lock + codegen. | CLAUDE.md, learning `l-c2d87be8` |
| Route | Route/view mới có dòng trong `ROUTE_PERMISSION_MATRIX`. Chỉ vai trò học sinh. | CLAUDE.md |
| Thiết bị thấp nhất | iPhone 7, iOS 15.8, Safari 15. Xem mục 3.1. | CLAUDE.md |
| Học sinh | Không onboarding, không bắt đổi mật khẩu, chỉ cổng học sinh. | memory |

### 3.1 Bẫy Safari 15 trong thiết kế này (bắt buộc xử lý)
- `outline` trên phần tử bo tròn **không bo theo** ở Safari < 16.4 → vòng quanh ảnh đại diện (bục Top 3, dải "Thứ hạng của bạn", xem trước khung) phải làm bằng `box-shadow: 0 0 0 Npx <màu>`, **không** dùng `outline`.
- `mask` cần thêm `-webkit-mask` (tia sáng sau bục).
- `clip-path: polygon(...)` (huy hiệu khiên), `conic-gradient`, `repeating-conic-gradient`, `inset`, flex `gap`, `perspective` + `rotateX`: dùng được từ Safari 15.
- Không dùng `:has()`, `color-mix()`, container queries, `@layer`, `text-wrap: balance`.

---

## 4. Token mới / sửa (thêm vào `src/themes/erg-enterprise-tokens.ts`)

Lấy **đúng** giá trị dưới đây (chép từ `erg.css` và `generators/tiers.js`). Component chỉ đọc token.

### 4.1 Sửa
| Token | Cũ | Mới (theo canvas) |
|---|---|---|
| `medal.gold` | `#C9A227` | `#C98A04` |
| `medal.silver` | `#9A9AA3` | `#8A94A6` |
| `medal.bronze` | `#B5743D` | `#B4632B` |

### 4.2 Thêm
| Token | Giá trị |
|---|---|
| `streak.fire` | `#EA580C` (icon lửa) ; nền nhắc chuỗi `#FFF7ED`, viền `#FED7AA`, chữ `#9A3412`, chip `#FFEDD5` |
| `podium.goldFace` | `linear-gradient(#F9E3A0,#EFC85E)`; lid `linear-gradient(#FFF8E1,#FBE7A8)`; chữ `#7A5A00` |
| `podium.silverFace` | `linear-gradient(#E3E7ED,#CDD3DC)`; lid `linear-gradient(#F7F8FA,#E6E9EE)`; chữ `#5B6474` |
| `podium.bronzeFace` | `linear-gradient(#F3D6C1,#E5B593)`; lid `linear-gradient(#FDF1E8,#F4D9C5)`; chữ `#7C3A12` |
| `podium.crown` | `#E2A400`, bóng `#8F6200` |
| `podium.rays` | `rgba(201,138,4,.10)` |
| `tier.<key>.frame` | 8 gradient khung, chép nguyên văn `generators/tiers.js` → `.fr.t-*` |
| `tier.<key>.emblem` | 8 gradient khiên, chép nguyên văn `.emb.t-*` |
| `tier.<key>.chip` | 8 nền chip, chép nguyên văn `.g-*` (+ `.tchip.t-bac`) |
| `tier.<key>.glow` | `box-shadow` của Vàng, Bạch kim, Kim cương, Cao thủ như trong `tiers.js` |

`key` ∈ `go | sat | dong | bac | vang | bk | kc | ct`. Sau khi thêm, chạy `node scripts/check-design-token-baseline.mjs` — số hex trong component **không được tăng**.

---

## 5. Luật nghiệp vụ

### 5.1 XP (đã có, giữ nguyên)
- Mỗi bài tính **một lần**, ở lần nộp đầu: `min(40, 10 + round(1,5 × số câu))`.
- Nộp trước hạn: **+10**.
- Chuỗi ≥ 7 ngày liên tiếp (giờ VN) có nộp bài: XP của **kỳ** đó × 1,2.
- Làm lại, điểm số: không cộng XP.

### 5.2 Kỳ thi đua
| Kỳ | Phạm vi | Ghi chú |
|---|---|---|
| Tuần này | Thứ Hai 00:00 → Chủ nhật 23:59:59 (VN) | Đã có |
| Tháng | Ngày 1 → cuối tháng | Đã có. Nhãn: "Tháng 11" theo tháng hiện tại |
| **Cả khóa** (mới, thay "Học kỳ I") | Năm học của lớp: 01/09 → 31/08 | Thay `TERM` trên giao diện học sinh. Backend thêm `COURSE`. `TERM` giữ cho GV/Admin. |

**Quyết định của người viết spec (chủ dự án duyệt):** "khóa học" = năm học của lớp, vì hệ thống chưa có thực thể khóa học gắn lớp. Nếu sau này có, đổi nguồn ngày bắt đầu/kết thúc, giao diện không đổi.

XP cả khóa = tổng XP từng tuần trong năm học; hệ số chuỗi 1,2 áp theo từng tuần.

### 5.3 Bậc (8 bậc) — theo tỉ lệ trong khối
Xếp **mọi học sinh cùng trường, cùng khối, cùng năm học** đã nộp **≥ 3 bài trong khóa** theo XP cả khóa giảm dần (bằng XP: ai đạt mốc XP đó sớm hơn đứng trên). Chia theo tỉ lệ, tính từ trên xuống:

| # | Bậc (`key`) | Tỉ lệ | Với khối 128 bạn | Icon khiên |
|---|---|---|---|---|
| 1 | Cao thủ (`ct`) | Top 3% | 4 | `crown` |
| 2 | Kim cương (`kc`) | 3–12% | 12 | `diamond` |
| 3 | Bạch kim (`bk`) | 12–25% | 17 | `auto_awesome` |
| 4 | Vàng (`vang`) | 25–45% | 25 | `star` |
| 5 | Bạc (`bac`) | 45–65% | 26 | `shield` |
| 6 | Đồng (`dong`) | 65–82% | 22 | `shield` |
| 7 | Sắt (`sat`) | 82–94% | 15 | `hardware` |
| 8 | Gỗ (`go`) | 6% cuối | 7 | `forest` |

- Số chỗ mỗi bậc = `round(tỉ lệ × N)`; phần dư dồn cho Gỗ để tổng = N. Cao thủ tối thiểu 1 chỗ khi N ≥ 10.
- Học sinh chưa đủ 3 bài: không có bậc. Giao diện hiện trạng thái "Nộp thêm X bài để được xếp bậc" (thiết kế **chưa có** → câu hỏi mở Q3).

### 5.4 Cấp trong bậc — 5 → 1
- Mỗi bậc (trừ Cao thủ) chia **5 cấp**: **5 thấp nhất (mới vào) → 1 cao nhất (sắp lên bậc)**.
- Chia đều theo số chỗ; chỗ dư cho cấp cao trước. Ví dụ Đồng 22 chỗ: cấp 1 = 5, cấp 2 = 5, cấp 3 = 4, cấp 4 = 4, cấp 5 = 4 (khối 128: Đồng 1 = hạng #85–89 … Đồng 5 = #103–106).
- Cao thủ không chia cấp; các bạn Cao thủ xếp theo XP.
- Hiển thị: "Đồng 2", "Bạc 5", "Cao thủ". Không dùng số La Mã.

### 5.5 Mốc XP tuần này
Mốc XP của một cấp = XP của **người cuối cùng** trong cấp đó lúc cập nhật. Giao diện luôn hiện "mốc tuần này" vì mốc đổi theo cả khối.

### 5.6 Cập nhật & bảo vệ
- Job chạy **00:00 thứ Hai (VN)**. Giữa tuần bậc không đổi; XP và hạng tuần vẫn cập nhật trực tiếp.
- **Lên** bậc/cấp: có hiệu lực ngay lần cập nhật đó.
- **Xuống** bậc/cấp: chỉ khi ở dưới mốc **2 lần cập nhật liên tiếp**. Lần đầu dưới mốc: giữ bậc, đánh dấu `protected = true` (thiết kế chưa có chỗ hiện → Q4).
- Sang năm học mới: tính lại từ đầu; khung đã mở giữ mãi.

### 5.7 Khung viền
- Mỗi lần học sinh **đạt** một bậc (kể cả năm học trước) thì khung bậc đó được mở **vĩnh viễn**. Lưu ngày mở và năm học.
- Học sinh chọn 1 khung đã mở hoặc "Không dùng". Mặc định: khung của bậc hiện tại, cho tới khi học sinh tự chọn.
- Khung chỉ trang trí. Nhãn bậc thật (chip "Đồng 2") luôn hiện cạnh tên.
- Học sinh bật "Ẩn tên": trên bảng của người khác hiện "Bạn ẩn tên", avatar "?" viền nét đứt xám, **không** khung, **không** chip bậc.

### 5.8 Màn "Lên bậc"
- Hiện **một lần** cho mỗi lần lên bậc (không hiện khi chỉ lên cấp), ở lần mở app đầu tiên sau job thứ Hai.
- Có nhiều lần lên bậc chưa xem: chỉ hiện lần cao nhất.
- "Dùng khung X" → đặt khung, đóng. "Để sau" / "Đóng" → chỉ đánh dấu đã xem.

### 5.9 Thi đua tuần
- "Chốt bảng sau" đếm tới Chủ nhật 23:59:59 VN. Hiện "N ngày M giờ" (mobile) / "N ngày M giờ K phút" (web). Dưới 1 ngày: "M giờ K phút".
- Top 3 lúc chốt nhận huy hiệu tuần Vàng/Bạc/Đồng. Huy hiệu "Bền bỉ" = chuỗi 7 ngày; "Bứt phá" = lên ≥ 3 hạng trong tuần. Phần huy hiệu cần bảng mới ở backend (mục 6.4).
- Mũi tên lên/xuống trên bảng tuần = so với **hôm qua** (snapshot 00:00 hằng ngày).

---

## 6. Hợp đồng backend (đề xuất tên; builder chốt theo quy ước erg-spring)

> Kiểm tra API có sẵn trước khi thêm. Với mỗi mục ghi rõ trong PR: "đã có" hay "thêm mới".

### 6.1 Thẻ bài tập học sinh (`StudentDashboardAssignmentCardResponse`, `StudentDashboardCards.java:65`)
Thêm field:
| Field | Kiểu | Dùng ở |
|---|---|---|
| `subjectName` | String | mọi tab |
| `teacherName` | String | H10/H11 meta |
| `questionCount` | Int | mọi tab ("20 câu") |
| `estimatedMinutes` | Int? | H10 "khoảng 15 phút" |
| `kind` | `PRACTICE \| TEST` | "làm 1 lần" cho TEST |
| `answeredCount` | Int? | H10 "Đang làm 12/20" |
| `score` | Decimal? | điểm gốc của lần nộp gần nhất |
| `maxScore` | Decimal? | thang gốc (100, 10, 25…) |
| `correctCount` | Int? | "Đúng 16/22 câu" |
| `totalQuestions` | Int? | mẫu số câu đúng |
| `attemptCount` | Int | "2 lần" |
| `submittedAt` | Instant? | đã có |
| `onTime` / `minutesBeforeDue` | Boolean / Long | "Trước hạn 4 ngày" |
| `xpReward` | Int | XP còn nhận được nếu nộp bây giờ (H10, H11) |
| `lateSubmitUntil` | Instant? | H11 "Còn mở" · "đến 15/11 21:00" |
| `closed` | Boolean | H11 "Đã đóng" |
| `iconKey` | String? | xem mục 8 (theo môn) |

Điểm hệ 10 trên giao diện = `round(score / maxScore × 10, 2)`, hiện bằng dấu phẩy, bỏ số 0 thừa (`7,25`, `9,5`, `6,8`). Dòng phụ hiện điểm gốc "72,5/100 điểm".

FE: sửa `mapAssignment` (đang đặt `totalQuestions = null`, `maxScore = 100`) — learning `l-c2d87be8`.

### 6.2 Thi đua
- Thêm kỳ `COURSE` (mục 5.2).
- Mỗi dòng bảng thêm: `streakDays`, `rankDelta` (so với hôm qua), `submittedInPeriod`, `xpToday`, `tierKey`, `division`, `frameKey` (null nếu ẩn tên hoặc "Không dùng"), `hidden`.
- Thêm `me`: `{ rank, size, xp, gradeRank, gradeSize, xpToNextRank, nextRankName }` cho dải "Thứ hạng của bạn" và "Còn 40 XP lên hạng 3".

### 6.3 Bậc
Bảng mới (Flyway `V1xx__student_tier.sql`):
- `student_tier_week(student_id, school_id, grade, school_year, week_start, course_xp, grade_rank, grade_size, tier_key, division, below_count, protected)` — một dòng / học sinh / tuần.
- `student_tier_cutoff(school_id, grade, school_year, week_start, tier_key, division, rank_from, rank_to, min_xp)`.
- `student_frame(student_id, tier_key, unlocked_at, school_year)` — khóa chính `(student_id, tier_key)`.
- `student_frame_choice(student_id, tier_key NULL)` — NULL = không dùng.
- `student_tier_seen(student_id, week_start)` — đã xem màn lên bậc.

Job `@Scheduled` 00:00 thứ Hai `Asia/Ho_Chi_Minh` theo mục 5.3–5.7. Idempotent theo `(school, grade, year, week_start)`.

GraphQL (học sinh, chỉ dữ liệu của chính mình + bảng mốc của khối mình):
```graphql
type MyTier { tierKey: String, division: Int, gradeRank: Int, gradeSize: Int, courseXp: Int!,
  eligible: Boolean!, submittedCount: Int!, protected: Boolean!,
  nextDivision: TierStep, nextTier: TierStep, pendingPromotion: TierPromotion }
type TierStep { tierKey: String!, division: Int, minXp: Int!, studentsToPass: Int! }
type TierPromotion { weekStart: Date!, fromKey: String!, fromDivision: Int, toKey: String!, toDivision: Int, studentsPassed: Int!, gradePercentile: Int! }
type TierTableRow { tierKey: String!, share: String!, seats: Int!, divisions: [TierCell!]! }
type TierCell { division: Int, rankFrom: Int!, rankTo: Int!, minXp: Int! }
type Frame { tierKey: String!, unlocked: Boolean!, unlockedAt: Date, schoolYear: String, studentsToPass: Int }
query { myTier: MyTier!  tierTable(weekStart: Date): [TierTableRow!]!  myFrames: MyFrames! }
type MyFrames { selected: String, frames: [Frame!]! }
mutation { selectFrame(tierKey: String): MyFrames!  acknowledgeTierPromotion(weekStart: Date!): Boolean! }
```
`selectFrame` từ chối khung chưa mở (lỗi nghiệp vụ, không 500).

### 6.4 Huy hiệu tuần
`student_badge(student_id, badge_key, week_start, awarded_at)`; `badge_key ∈ WEEK_GOLD | WEEK_SILVER | WEEK_BRONZE | STREAK_7 | BREAKTHROUGH_3`. Trao lúc chốt tuần.

### 6.5 Hộp thư — hỏi giáo viên theo câu
Kiểm tra `student-inbox-view.tsx` và API hiện có. Cần: hội thoại học sinh ↔ giáo viên gắn `assignmentId`, `questionIndex`, `studentAnswerText`, `correctAnswerText` (chỉ trả `correctAnswerText` khi bài đã cho xem đáp án), tin nhắn, ảnh đính kèm, trạng thái "Đã trả lời". Hai nút nhanh "Làm lại câu N" (mở bài luyện tập ở câu đó, chỉ với `PRACTICE`) và "Cảm ơn cô" (gửi tin "Em cảm ơn cô ạ!").

### 6.6 Thảo luận
Đã có trả lời 2 cấp và kiểm duyệt. Thêm: `pinned` (GV ghim), `acceptedReplyId` (GV chọn lời giải → nhãn **"Giáo viên"** có dấu tích), `subject`, bộ lọc `unanswered` / `mine`, theo dõi chủ đề (`follow` → thông báo vào Hộp thư).

---

## 7. Màn hình

Ký hiệu: **W** = web ≥ 1024px (artboard 1440), **M** = mobile < 768px (artboard 390). 768–1023px: dùng bố cục W, sidebar thu gọn (hành vi hiện tại). Số đo dưới đây lấy từ `source/*.dc.html` + `erg.css`; nếu lệch nhau, **file HTML thắng**.

### 7.0 Khung chung

**Sidebar học sinh W** (mọi màn H08–H18, nguồn `generators/sidebar.js`):
- Thẻ nổi trắng rộng **232px**, bo 20, bóng `--sh`, padding 14/10/10.
- Logo 34×34 bo 10 nền primary + "ERG Học tập" (t-h3) / "Cổng học sinh" (t-m).
- Thẻ học sinh: nền `--bg2`, viền `--dv`, bo 14, padding 12. Avatar 36 trong **khung bậc** + tên (b6) + chip bậc "Đồng 2" + "Lớp 7A". Hàng chip: "⚡ 1.240 XP" (nền `--pss`, chữ `--inx`) và "🔥 12 ngày" (nền `#FFEDD5`, chữ `#9A3412`), cao 26, chữ 12/700.
- Nhóm "HỌC TẬP": Tổng quan, Bài tập [số bài cần làm], Điểm số. Nhóm "LỚP CỦA TÔI": Thi đua [#hạng tuần], Thảo luận, Hộp thư [số chưa đọc, nền đỏ].
- Mục: cao 40, bo 10, chữ 14/500 `#3A3A3C`, icon 20 `--tx3`. Mục đang chọn: nền primary, chữ trắng 600, icon đặc trắng, huy hiệu số nền `rgba(255,255,255,.22)`.
- Đáy: ô nhắc chuỗi "Làm 1 bài hôm nay để giữ chuỗi 13 ngày" (chỉ hiện khi hôm nay chưa nộp và chuỗi ≥ 1) + hàng "Tài khoản & cài đặt" với nút đăng xuất 36×36.
- Bấm thẻ học sinh hoặc "Tài khoản & cài đặt" → menu có mục **"Khung viền"** → H17.

**Dock M** (nguồn `generators/gen-mobile.js` → `dock`): viên thuốc trắng nổi cách đáy 20, 5 ô: Trang chủ, Bài tập, Thi đua, Hộp thư (chấm đỏ khi có tin chưa đọc), ảnh đại diện **trong khung bậc** 26px → Hồ sơ. Ô đang chọn: nền primary, icon đặc + nhãn. Ô khác chỉ icon.

**Nền trang**: `--bg` `#F5F5F7`. Card: trắng, viền 1px `--bd`, bo 14, **không bóng**. Bóng chỉ cho sidebar, dock, thanh ghim, hộp thoại.

### 7.1 Bài tập — Cần làm · H10 (W) / H02c (M)
Header W: "Bài tập" 28/600 + "Thứ Năm, 12/11 · 4 bài cần làm · làm xong nhận tới +145 XP"; ô tìm 280×40 "Tìm bài tập" + phím "Ctrl K".
Thanh: segmented 480px "Cần làm [4] / Đã nộp [5] / Quá hạn [2 đỏ]" + chip môn "Tất cả / Toán / Ngữ văn / Tiếng Anh / KHTN".
- **Thẻ "Đang làm dở"** (chỉ khi có bài `answeredCount > 0` chưa nộp, chọn bài hạn gần nhất): nền primary, chữ trắng, padding 24. "ĐANG LÀM DỞ · TOÁN" 12/600, tên bài 22/600, dòng phụ "Đã làm 12/20 câu · còn khoảng 6 phút · hạn 20:00 hôm nay · cô Trần Thị Hạnh", thanh tiến độ trắng trên nền `rgba(255,255,255,.25)`. Phải: nhãn "+50 XP nếu nộp trước 20:00" + nút **"Làm tiếp"** nền trắng chữ primary (đây là nút `contained` duy nhất của màn, đổi màu bằng `sx`).
- **Bảng nhóm**: tiêu đề cột "Bài · Hạn nộp · Trạng thái · Thưởng"; nhóm "HÔM NAY" / "TUẦN NÀY" (/ "SAU NÀY") kèm tổng "2 bài · +90 XP". Dòng: icon môn 32 + tên + meta; chip hạn ("Còn 4 giờ" nền `--wnt` nếu < 24h, xám nếu còn lâu) + giờ hạn; trạng thái "Đang làm 12/20"/"Chưa làm" + thanh 6px; nhãn "+40 XP"; nút outlined "Bắt đầu"/"Làm tiếp".
- Chú thích cuối: "Nộp trước hạn được thêm +10 XP. Bài kiểm tra chỉ làm 1 lần; bài luyện tập làm lại được nhưng chỉ tính XP lần nộp đầu."
- M: như W nhưng thẻ "Đang làm dở" padding 16, tên 17/600, nút "Làm tiếp" bên phải nhãn "+50 XP"; các bài là thẻ riêng (icon + tên + meta, hàng dưới: chip hạn + XP + nút outlined sm).
- Rỗng: (thiết kế chưa có → Q5).

### 7.2 Bài tập — Đã nộp · H09 (W) / H02b (M)
- W: 4 thẻ KPI: "Điểm trung bình" (vòng tròn 64 + "6,8/10" + "5 bài · lần nộp gần nhất"), "Câu trả lời đúng" ("74/112 câu" + thanh xanh + "66% số câu của 5 bài"), "Bài cao nhất" ("9,5/10" xanh + tên bài · đúng 19/20 câu), "Nộp đúng hạn" ("5/5 bài" + "Được +10 XP mỗi bài nộp trước hạn").
- Bảng: Bài (icon + tên + "Môn · N câu") · Nộp lúc ("11/11 20:14" + "Trước hạn 4 ngày" xanh / "Trễ …" đỏ) · Câu đúng ("19/20" + thanh 6px + "95%") · Điểm (số hệ 10 **22/700** màu theo dải + "/10" + dòng phụ điểm gốc) · Lần làm · nút outlined **"Xem bài làm"**.
- Dải màu điểm: ≥ 8 → `--ok`; 5 ≤ x < 8 → primary; < 5 → `--er`. Thanh câu đúng: ≥ 8 xanh lá, < 5 cam (`--wn`), còn lại primary.
- Không có nút contained trên màn này (Q6).
- M (H02b): thẻ tổng (vòng 60 + "6,8/10" + chip "Đúng 74/112 câu"); mỗi bài là thẻ bấm được: tên, meta "Môn · N câu · K lần làm", "✓ Đúng 16/22 câu · 73%", thanh, ô điểm 64×56 bo 12 (nền theo dải: ok/in/er) "7,25 /10"; hàng dưới "🕑 Nộp 10/11 19:02 · 72,5/100 điểm" + link "Xem bài làm ›".

### 7.3 Bài tập — Quá hạn · H11 (W) / H02d (M)
- Hộp đỏ nhạt (`--ert`, viền `#F6C9C3`): icon `event_busy` + "2 bài đã quá hạn" + "Bài còn mở thì vẫn nộp muộn được và vẫn nhận XP hoàn thành, chỉ mất +10 XP nộp trước hạn. Bài đã đóng thì hỏi giáo viên."
- Dòng: tên + meta (môn · số câu · giáo viên); chip đỏ "Quá 2 ngày" + giờ hạn; "Còn mở" (xanh) + "đến 15/11 21:00" **hoặc** "Đã đóng" (đỏ) + "giáo viên đã chốt điểm"; nhãn XP ("+30 XP" xanh dương / "Không còn XP" xám); nút **outlined** "Nộp muộn" (còn mở) hoặc outlined "💬 Hỏi cô" (đã đóng → mở H12 soạn tin cho GV của bài).
- Chú thích: "Quá hạn không làm mất chuỗi ngày: chuỗi chỉ cần mỗi ngày nộp ít nhất 1 bài bất kỳ."
- Không có nút contained (đã sửa ở canvas bản 92).

### 7.4 Thi đua · H08 (W) / H03b (M)
Thứ tự từ trên xuống (W):
1. Header "Thi đua" 28/600 + "Tuần 46 · 10/11 – 16/11 · Lớp 7A · 32 bạn"; segmented 330px **"Tuần này / Tháng 11 / Cả khóa học"**; chip "Lớp 7A / Khối 7"; nút tròn `help` → H18.
2. **Dải "Thứ hạng của bạn lúc này"** (card padding 14/20, viền `#CFE3FB`, nền `linear-gradient(90deg, --pss, #fff 70%)`): avatar 52 nền primary + vòng trắng 3 + vòng primary 2 (box-shadow, mục 3.1) · "#4" 28/700 primary · "/ 32 bạn lớp 7A" · chip xanh "↑ Lên 2 hạng so với hôm qua" · phải: "XP tuần ⚡380", "Khối 7 #12 / 128", "Lên top 3" / "còn 40 XP" (2 dòng), nút outlined sm "📍 Tới chỗ của tôi" (cuộn tới dòng của mình, nháy nền 1 lần).
3. **Thẻ Top 3** (nền `linear-gradient(180deg,#F7FAFF 0,#fff 55%)`, tia sáng xoay quanh tâm, 6 mảnh confetti cố định vị trí như HTML):
   - Tiêu đề "Top 3 tuần này" + "Ai đứng trên bục lúc chốt bảng sẽ nhận huy hiệu tuần"; phải: "Chốt bảng sau" + 3 ô số 34×34 bo 10 (`2` ngày `14` giờ `32` phút). Lớp CSS đếm ngược KHÔNG được tên `.cd` (trùng ô lịch; đã gây lỗi xếp dọc).
   - Bục 3 cột, thứ tự **2 – 1 – 3**, max-width 660. Hạng 1 rộng gấp 1,15. Mỗi cột: đồng xu (hạng 2/3: 40px, gradient tròn + bóng dày 4px) hoặc vương miện 40px (hạng 1); avatar 72 (hạng 1: 96, vòng sáng `0 0 0 12px rgba(242,201,76,.22)`) có lớp bóng kính; tên 15/600; XP 22/700 (hạng 1: 28) + "XP"; dòng phụ: hạng 2 chip "↑ +120 hôm nay", hạng 1 "🔥 15 ngày · ×1,2", hạng 3 chip vàng "Sắp bị vượt" (khi người hạng 4 cách < 50 XP); khối bục 3D: mặt trên cao 30 `perspective(380px) rotateX(52deg)`, mặt trước cao **104 / 140 / 84**, số hạng 34/700 + nhãn "Huy hiệu Bạc/Vàng/Đồng"; bóng elip dưới chân.
   - Dải đuổi theo: avatar "MA" + "Bạn đang #4 · 380 XP" + "Còn **40 XP** là lên bục, vượt Gia Bảo" + thanh 10px tới đồng xu "3" + nút **contained** "Làm 1 bài để lên bục →" (nút contained duy nhất). Học sinh đang trong top 3: thay bằng "Giữ vị trí: hơn hạng 4 N XP" (thiết kế chưa có → Q7).
4. Hai cột: **Bảng xếp hạng** (trái, flex 2) — tiêu đề + "Thanh = XP so với bạn dẫn đầu"; vạch nét đứt "Cần 420 XP để vào top 3"; dòng lưới `36 44 40 1.2fr 1.6fr 64`: vòng hạng 32, mũi tên ± số, avatar **trong khung bậc**, tên + pill "Bạn", "🔥 N ngày", thanh, XP; dòng của mình nền `--pss` + vạch trái 4px primary; chân "Hiện 10 / 32 bạn" + link "Xem cả lớp ›" → H14.
   Cột phải (flex 1): "Vị trí của bạn" (vòng 96 conic "#4/32", "Còn 40 XP lên hạng 3", 3 ô số liệu), "Kiếm XP ngay" (3 bài mở, bài đầu nền `--pss` + nút **outlined** "Làm ngay"), "Phần thưởng tuần này" (3 ô Top 3 tuần / Bền bỉ / Bứt phá + dòng luật XP "Không hiện điểm số của ai").
- M (H03b): dải thứ hạng (avatar 40 trong khung + "Thứ hạng tuần" + chip "Đồng 2" + "#4 / 32 · Khối #12" + chip "↑2") → segmented "Tuần này / Tháng 11 / Cả khóa" → chip lớp/khối → thẻ Top 3 (tiêu đề + đếm ngược 28×28 "2 ngày 14 giờ" một hàng, bục thu nhỏ: avatar 54/70, mặt trước 64/90/48, ghi chú "Top 3 lúc chốt bảng nhận huy hiệu Vàng · Bạc · Đồng" ngắt dòng trong thẻ) → thẻ "Còn 40 XP là lên bục" + nút contained toàn chiều rộng → bảng 5 dòng (avatar trong khung bậc) + "Xem cả lớp ›" → chú thích XP. Mọi con của vùng nội dung `flex-shrink: 0` (đã gây lỗi đè chữ).

### 7.5 Xem cả lớp · H14 (W) / H14m (M)
- Link "← Thi đua"; tiêu đề "Bảng xếp hạng cả lớp 7A" + "Mùa 1 · khóa 2026–2027 · xếp theo bậc, cùng bậc thì ai nhiều XP hơn đứng trên"; segmented (mặc định đang chọn **Cả khóa học** khi vào từ H15; vào từ H08 thì giữ kỳ đang chọn ở H08).
- Thanh của tôi (nổi, bóng `--sh`): khiên Đồng 36 + "Bạn đang Đồng 2 · #92 / 128 khối · hạng 7 lớp · 1.240 XP" + "Mốc tuần này: Đồng 1 1.325 XP (+85) · Bạc 1.480 XP (+240)" + ô tìm 220 + nút outlined "Tới chỗ của tôi".
- **Kỳ Cả khóa**: bảng chia nhóm theo bậc từ Cao thủ xuống Gỗ. Đầu nhóm (nền `--bg2`): khiên 26 + tên bậc + "Top 3% khối" + "N bạn" (nhóm trống: "Chưa ai đạt — bạn sẽ là người đầu tiên?"). Cột W: Hạng · ± · Học sinh (avatar 30 trong khung) · Bậc (chip "Kim cương 3") · Chuỗi ngày · thanh XP so với hạng 1 · XP cả khóa. Dòng cao 56.
- **Kỳ Tuần / Tháng**: một danh sách liền, cột: Hạng (top 3 ô số màu huy chương) · ± · Học sinh · Chuỗi · Bài nộp · thanh · XP; vạch vàng nét đứt dưới hạng 3.
- Phân trang: 16 dòng/trang W, 14 dòng + "Xem tiếp 18 bạn" M. M: thanh "Đồng 2 · hạng 7 / +85 XP lên Đồng 1 / Tới chỗ tôi" ghim trên dock (bottom 92).
- Chú thích: "Bạn bật Ẩn tên hiện là "Bạn ẩn tên" và không hiện khung viền."

### 7.6 Bậc của bạn · H15 (W) / H15m (M)
Vào từ: chip bậc ở sidebar/dải thứ hạng, segmented "Thi đua tuần / **Bậc cả khóa**" trên H15.
- Thẻ hero (nền `linear-gradient(120deg,#FBF1E9 0,#fff 55%)` + quầng tròn góc phải): khiên 110 · "BẬC HIỆN TẠI" · "Đồng 2" 34/700 màu `#8A431A` · "1.240 XP cả khóa · #92 / 128 khối 7 · top 72%" · thanh **5 đoạn** (4 đoạn tô `#B4632B`) · "Đồng 5 → 4 → 3 → **2** → 1". Phải: "Vượt 3 bạn trong khối lên Đồng 1 · mốc tuần này 1.325 XP" + thanh 12px; "[khung Bạc 26] Vượt 8 bạn lên Bạc, mở khung viền Bạc · mốc tuần này 1.480 XP" + thanh bạc; nút **contained** "Làm bài lấy XP →" + "3 bài đang mở · tới +145 XP".
- "8 bậc trong mùa": lưới 8 cột, đường nối tô màu tới bậc hiện tại; mỗi cột khiên 64, tên, "Top 3% · 4 bạn", khung xem trước 30, trạng thái "✓ Đã qua" / pill "Bạn ở đây" / "🔒 Chưa mở". Bậc chưa mở: `grayscale(.85)` + `opacity .5`.
- "Luật lên bậc" (3 dòng, chữ y như HTML) + "Khung viền của bạn" (lưới 4×2, link "Đổi khung ›" → H17).
- M: hero dọc (khiên 84, "Đồng 2" 28/700, thanh 5 đoạn 180px, 2 thanh tiến độ, nút contained toàn chiều rộng) → "8 BẬC TRONG MÙA" danh sách từ Cao thủ xuống Gỗ (dòng Đồng nền `#FBF1E9`) → thẻ luật.

### 7.7 Bảng bậc & cấp · H18 (W) / H18m (M)
Vào từ nút `help` ở H08/H03b và từ H15.
- "Bậc và cấp được tính thế nào?": 3 bước có số tròn primary 28: "Cộng XP cả khóa" → "Xếp hạng trong khối" ("Bạn đang **#92** với 1.240 XP") → "Tra bảng ra bậc, cấp" ("Hạng #90–94 là **Đồng 2**. Cấp 5 thấp nhất, cấp 1 cao nhất.").
- "XP đến từ đâu": Hoàn thành bài (lần nộp đầu) **+10 – 40** · Nộp trước hạn **+10** · Chuỗi từ 7 ngày liên tiếp **×1,2** · Làm lại, điểm số *không tính*.
- Bảng: cột "Bậc" 220 + 5 cột **"Cấp 5 · mới vào / Cấp 4 / Cấp 3 / Cấp 2 / Cấp 1 · sắp lên bậc"**. Ô: "Cấp N" · "≥ 1.185 XP" · "hạng #90–94". Ô của mình: nền `--pss`, viền primary, vòng `#CFE3FB`, pill "Bạn". Hàng của mình nền `#FBF6F1`. Cao thủ một ô gộp 5 cột "Không chia cấp · các bạn Cao thủ xếp theo XP".
- Dữ liệu từ `tierTable` (mục 6.3). Chip "Tuần trước" xem bảng tuần trước.
- M: 3 bước gọn → danh sách bậc thu gọn (khiên 30, tên, "Top 65–82% · hạng #85–106", "≥ 905", mũi tên mở) — bậc của mình mở sẵn với lưới 5 ô "5/4/3/2/1" + XP → chú thích.

### 7.8 Lên bậc · H16 (W hộp thoại) / H16m (M toàn màn)
- Nền `linear-gradient(180deg,#F3F5F8 0,#fff 60%)`, tia sáng màu của bậc mới, quầng trắng, 8 mảnh confetti cố định.
- Nhãn "🎉 Cập nhật bậc · thứ Hai 16/11" → khiên bậc mới **128px** → "Lên bậc Bạc!" 34/700 → "Tuần qua bạn vượt **11 bạn** trong khối 7 · giờ ở top 63%" → thẻ "Đồng 1 → Bạc 5" (khiên 40 → 48) → thẻ "Khung viền Bạc đã mở" (avatar 56 trong khung mới) → "Tiếp: Bạc 4 [thanh] vượt 2 bạn".
- Nút: M — contained toàn chiều rộng "Dùng khung Bạc", text "Để sau", dòng "Đổi khung bất cứ lúc nào ở Hồ sơ › Khung viền". W — hộp thoại 520px bo 20 trên scrim `rgba(29,29,31,.38)`; nút Đóng (X) góc phải; chân: chữ "Đổi khung sau ở menu tài khoản › Khung viền" + text "Để sau" + outlined "Xem bậc của tôi" + contained "Dùng khung Bạc".
- W dùng `ErgDialog`; focus vào nút contained khi mở; Esc = "Để sau".
- Có `prefers-reduced-motion`: không chuyển động (thiết kế tĩnh, nếu thêm hiệu ứng vào thì chỉ khi không bật reduced-motion và phải được duyệt — Q8).

### 7.9 Khung viền của tôi · H17 (W) / H17m (M)
- W: header "Khung viền ảnh đại diện" + "Mở từ menu tài khoản › Khung viền, hoặc từ trang Bậc của bạn. Đổi bất cứ lúc nào." + text "Hủy" + contained "Lưu khung".
- Cột trái 360: "XEM TRƯỚC" + avatar 112 trong khung đang chọn + tên + chip bậc + 2 thẻ xem trước (dòng bảng xếp hạng; tác giả bài Thảo luận).
- Cột phải: "Khung của bạn" + "4 / 8 đã mở · khung đã mở giữ mãi, kể cả khi tụt bậc hay sang khóa mới"; lưới 5 cột: ô "Không dùng" (vòng nét đứt + icon `block`) + 8 ô khung. Ô đang chọn: viền primary + vòng `#CFE3FB` + dấu tích góc. Ô chưa mở: nền `--bg2`, khung xám mờ, "🔒" + lý do ("Lên Bạc để mở · còn vượt 8 bạn"). Ô mở từ năm trước: "Đã đạt ở khóa hè 2026".
- Ghi chú: "Khung chỉ là trang trí, không đổi bậc hay XP. Bậc thật luôn hiện ở nhãn cạnh tên."
- M: back "Hồ sơ", tiêu đề "Khung viền" + "Hồ sơ › Khung viền · 4 / 8 đã mở"; thẻ xem trước (avatar 84); "CHỌN KHUNG" lưới 3 cột; nút contained "Lưu khung Đồng" ghim trên dock (chữ đổi theo khung đang chọn; "Lưu: không dùng khung").
- Chưa đổi gì → nút Lưu disabled. Lưu xong: toast sonner "Đã đổi khung viền".

### 7.10 Hộp thư · H12 (W) / N14 + H12m (M)
- W: header "Hộp thư" + mô tả + ô tìm 260 + contained "✎ Hỏi giáo viên". Card chia 2 cột (380 | còn lại), cao 820.
  - Trái: chip "Tất cả [2] / Hỏi giáo viên [1] / Thông báo / Thi đua"; "Hôm nay" + link "Đánh dấu đã đọc hết"; dòng tin: icon 32 + nhãn loại IN HOA 11/700 màu theo loại + giờ + tiêu đề (đậm nếu chưa đọc) + trích; chấm xanh 8px nếu chưa đọc; dòng đang mở nền `--pss` + vạch trái 3px.
  - Phải: đầu (avatar GV, tên, "Toán · Lớp 7A · thường trả lời trong buổi tối", chip "✓ Đã trả lời", nút ⋯) → thẻ dẫn câu ("Luyện tập: Phương trình bậc nhất · Câu 7" / "2x + 5 = 13 · bạn chọn x = 9 · đáp án x = 4" / link "Mở câu hỏi") → nhãn ngày → bong bóng (của mình: primary chữ trắng, góc trên phải 6; của cô: `--bg2` viền `--dv`, góc trên trái 6; rộng tối đa 76%) → nút nhanh "Làm lại câu 8" / "Cảm ơn cô" → ô soạn (ảnh, ô nhập bo 12, outlined "Gửi").
- M: danh sách = artboard **N14-HS-HopThu** (trang "1 · Menu mobile") với chip "Thông báo / Hỏi giáo viên / Thảo luận lớp"; mở tin → **H12m** (back, avatar GV, thẻ dẫn câu, bong bóng rộng 80%, chip nhanh, ô nhập tròn 22 + nút gửi tròn primary).

### 7.11 Thảo luận · H13 (W) / H13m + H13m2 (M)
- W: header "Thảo luận lớp 7A" + "Hỏi bạn, giúp bạn. Giáo viên xem và duyệt mọi bài viết." + ô tìm 240 + contained "+ Đặt câu hỏi". Card 2 cột (400 | còn lại).
  - Trái: chip "Mới nhất / Chưa có trả lời [2] / Của tôi" + chip môn. Dòng chủ đề: avatar 28, "📌 Cô ghim" (nếu ghim), tiêu đề 14/600, chip môn + "tác giả · thời gian", "💬 N ❤ N ✓ Đã có lời giải".
  - Phải: đầu (chip môn + tiêu đề + text "🔔 Theo dõi"); bài gốc (avatar 36, tên + pill "Bạn", nội dung 15/1.55, reactions); trả lời thụt 52px + vạch trái 2px `--dv`; **lời giải GV chọn** trong khung nền `--okt` viền `#BFE3CC` bo 14 + nhãn "✓ Giáo viên chọn là lời giải hay"; trả lời cấp 2 thụt thêm 40px; ô trả lời "Viết trả lời… (lịch sự, đúng chủ đề)".
- M: H13m danh sách (bài ghim nền `#FFFBEF` viền `#F6DDA0`, nút nổi contained "+ Đặt câu hỏi" bottom 92) → H13m2 chủ đề (lời giải GV: nhãn **"✓ Giáo viên"**, trả lời thụt 18 + vạch 2px, cấp 2 thụt 10, ô nhập tròn + nút gửi).
- **Câu hỏi mở Q1**: trên mobile vào Thảo luận từ đâu (dock chỉ 5 ô). Tạm thời: chip "Thảo luận lớp" trong Hộp thư (N14) + thẻ trên Trang chủ.

### 7.12 Bảng tổng hợp nút contained
| Màn | Nút contained | Màn | Nút contained |
|---|---|---|---|
| H10 / H02c | "Làm tiếp" (thẻ đang làm dở) | H15 / H15m | "Làm bài lấy XP" |
| H09 / H02b | — (Q6) | H16 / H16m | "Dùng khung Bạc" |
| H11 / H02d | — (Q6) | H17 / H17m | "Lưu khung" |
| H08 / H03b | "Làm 1 bài để lên bục" | H18 / H18m | — |
| H14 / H14m | — | H12 | "Hỏi giáo viên" |
| H13 / H13m | "Đặt câu hỏi" | H12m, H13m2 | — (nút gửi là icon button) |

---

## 8. Bảng icon (Material Symbols trên canvas → `@mui/icons-material`)
Ký hiệu `.f` (đặc) trên canvas → biến thể `Rounded`; không `.f` → `Outlined`.

| Canvas | MUI | Canvas | MUI |
|---|---|---|---|
| school | School | home | Home |
| assignment | Assignment | grade | Grade |
| emoji_events | EmojiEvents | forum | Forum |
| inbox | Inbox | logout | Logout |
| local_fire_department | LocalFireDepartment | bolt | Bolt |
| search | Search | help | HelpOutline |
| timer | Timer | arrow_upward / arrow_downward | ArrowUpward / ArrowDownward |
| remove | Remove | chevron_right | ChevronRight |
| my_location | MyLocation | calculate | Calculate |
| quiz | Quiz | translate | Translate |
| science | Science | menu_book | MenuBook |
| schedule | Schedule | history | History |
| event_busy | EventBusy | chat | Chat |
| play_circle | PlayCircle | workspace_premium | WorkspacePremium |
| military_tech | MilitaryTech | crown | *(không có trong MUI)* → dùng `WorkspacePremium` **hoặc** SVG riêng trong `src/components/erg-mui/icons/` — Q2 |
| auto_awesome | AutoAwesome | star | Star |
| diamond | Diamond | shield | Shield |
| hardware | Hardware | forest | Forest |
| stairs | Stairs | verified_user | VerifiedUser |
| verified | Verified | groups | Groups |
| lock | Lock | block | Block |
| check_circle | CheckCircle | celebration | Celebration |
| arrow_forward / arrow_back | ArrowForward / ArrowBack | close | Close |
| edit | Edit | more_horiz | MoreHoriz |
| add_photo_alternate | AddPhotoAlternate | send | Send |
| replay | Replay | thumb_up | ThumbUp |
| push_pin | PushPin | favorite | Favorite |
| chat_bubble | ChatBubble | notifications | Notifications |
| add | Add | expand_more / expand_less | ExpandMore / ExpandLess |
| trending_up | TrendingUp | info | InfoOutlined |
| campaign | Campaign | | |

Kiểm tra trước: biến thể nào không tồn tại trong bản `@mui/icons-material` đang cài thì ghi vào PR và dùng `Outlined`/gốc gần nhất — không tự chọn icon khác.

---

## 9. Kiểm tra bám thiết kế — BẮT BUỘC, chạy liên tục

> "Không khác 1 tí nào" được hiểu đo được như sau. Pixel tuyệt đối giữa HTML canvas và app MUI là không thể (khử răng cưa font, trình duyệt), nên dùng **3 lớp kiểm**: số đo DOM (không dung sai với chữ/màu, ±1px với kích thước), ảnh chụp so với thiết kế (ngưỡng nhỏ), và ảnh chụp so với chính app đã duyệt (gần như 0). Lớp nào đỏ → không merge.

### 9.1 Ảnh gốc thiết kế (làm một lần, trước khi code màn đầu tiên)
- Mở canvas bản 92 bằng trình duyệt có sẵn, chụp **từng artboard** ở tỉ lệ 1:1 đúng kích thước `$preview` của nó (web 1440 × h, mobile 390 × h), lưu `docs/design/student-portal/baseline/<ArtboardId>.png`. Danh sách: H02b, H02c, H02d, H03b, H08, H09, H10, H11, H12, H12m, H13, H13m, H13m2, H14, H14m, H15, H15m, H16, H16m, H17, H17m, H18, H18m, N14.
- Commit cùng `baseline/README.md` ghi: số bản canvas, ngày chụp, trình duyệt, kích thước từng ảnh.
- Ảnh gốc chỉ thay khi chủ dự án duyệt bản canvas mới (mục đầu file).

### 9.2 Dữ liệu cố định (fixture) = dữ liệu mẫu trên canvas
- Tạo `src/test/e2e/fixtures/student-design-fixtures.ts`: học sinh **Nguyễn Minh Anh**, lớp 7A, THCS Cầu Giấy, 1.240 XP cả khóa, chuỗi 12 ngày, hạng tuần #4/32 (380 XP), khối #12/128 tuần, #92/128 cả khóa, Đồng 2; danh sách bạn, bài tập, tin nhắn, chủ đề, mốc bậc **chép đúng từng số/chữ** từ `docs/design/student-portal/generators/*.js` và `source/*.html`.
- Đồng hồ giả: `page.clock.setFixedTime(new Date("2026-11-12T16:00:00+07:00"))` (Thứ Năm 12/11, khớp "còn 4 giờ tới 20:00", "chốt sau 2 ngày …"). Màn H16 dùng `2026-11-16T07:00:00+07:00`.
- Mọi request GraphQL/REST của học sinh trả fixture qua `page.route` (theo mẫu `timekeeping-punch.spec.ts`). Không gọi backend thật.
- Tắt chuyển động: `reducedMotion: "reduce"` + CSS `*{transition:none!important;animation:none!important;caret-color:transparent}` chèn khi test. Chờ `document.fonts.ready`.

### 9.3 Playwright project `student-design` (thêm vào `playwright.config.ts`)
- Script `package.json`: `"e2e:student-design": "playwright test --project=student-design"`.
- File `src/test/e2e/student-design.spec.ts`; mỗi artboard một `test(<ArtboardId>)`, viewport = kích thước artboard (web 1440 × h, mobile 390 × h, `isMobile`/`hasTouch` cho mobile).
- Mỗi test làm 3 việc:
  1. **Số đo DOM (lớp 1, dung sai 0 với chữ & màu)**: mỗi phần tử quan trọng có `data-design="<ArtboardId>.<tên>"` (danh sách tối thiểu ở 9.5). Đọc `getComputedStyle` + `getBoundingClientRect` và so với `docs/design/student-portal/manifest/<ArtboardId>.json`. So: `textContent` (khớp tuyệt đối), `color`, `background-color`/`background-image`, `font-size`, `font-weight`, `font-family` chứa "Be Vietnam Pro", `border-radius`, `border-color/width`, `width`, `height` (±1px), `x`/`y` so với khung chứa (±2px), `box-shadow` (khớp chuỗi).
  2. **So với ảnh thiết kế (lớp 2)**: `expect(page).toHaveScreenshot` với ảnh từ 9.1 làm chuẩn: `maxDiffPixelRatio: 0.02`, `threshold: 0.15`, che (mask) icon (vì font icon khác bộ) bằng `mask: [page.locator("svg[data-testid$='Icon']")]`. Lưu ảnh khác biệt vào report.
  3. **So với app đã duyệt (lớp 3)**: sau khi chủ dự án duyệt màn đó, chụp app làm `src/test/e2e/__screenshots__/student-design/<ArtboardId>-app.png`; từ đó `maxDiffPixels: 0`, `threshold: 0.05`. Đây là lớp bắt lệch về sau (sửa CSS chung, nâng MUI…).
- **Manifest** sinh tự động một lần từ canvas: script `scripts/extract-design-manifest.mjs` chạy trong trình duyệt trên từng artboard (qua canvas), đọc các phần tử theo selector liệt kê ở 9.5, xuất JSON. Không gõ tay số đo.

### 9.4 Kiểm tra tĩnh (vitest, chạy trong `bun run test`)
- `student-design-coverage.policy.test.ts`: mọi ArtboardId trong bảng 9.1 phải có đúng 1 test trong `student-design.spec.ts`, có manifest, có ảnh gốc. Thiếu → đỏ.
- `student-contained-button.policy.test.ts`: render từng màn (testing-library) với fixture, đếm `.MuiButton-contained` = số ở bảng 7.12.
- `student-tier-math.test.ts`: chia bậc/cấp theo mục 5.3–5.4 với N = 128, 32, 10, 9, 1; tổng chỗ = N; Đồng 22 chỗ → 5/5/4/4/4; #92 → Đồng 2; bảo vệ 2 lần.
- `student-number-format.test.ts`: `1240 → "1.240"`, `7.25 → "7,25"`, `6.8 → "6,8"`, `9.5 → "9,5"`, `72.5/100 → "72,5/100 điểm"`.
- Mở rộng `scripts/check-design-token-baseline.mjs`: các thư mục `features/elearning/student-dashboard`, `class-leaderboard`, và thư mục mới của bậc/khung không được thêm hex/fontSize/fontWeight số.

### 9.5 Phần tử bắt buộc có `data-design` (tối thiểu)
- Mọi màn: tiêu đề trang, mô tả dưới tiêu đề, nút contained, segmented (từng nút), chip lọc, ô tìm, avatar + khung, chip bậc, mỗi badge số.
- H08/H03b: dải thứ hạng (avatar, "#4", chip), 3 ô đếm ngược, 3 cột bục (đồng xu/vương miện, avatar, tên, XP, mặt trước khối), dải đuổi theo, dòng bảng của mình, vạch "Cần 420 XP…".
- H09/H02b: 4 KPI, mỗi ô "Câu đúng", "Điểm" (số, "/10", dòng phụ), ô điểm mobile.
- H10/H02c: thẻ đang làm dở (nhãn, tên, dòng phụ, thanh, nhãn XP, nút), tiêu đề nhóm, chip hạn.
- H11/H02d: hộp cảnh báo, chip "Quá N ngày", "Còn mở/Đã đóng", nút.
- H14: đầu nhóm bậc, ô bậc, thanh của tôi. H15: khiên hero, tên bậc, thanh 5 đoạn, 2 thanh tiến độ, 8 cột thang. H16: khiên 128, tiêu đề, thẻ đổi bậc, thẻ khung mới. H17: avatar xem trước, từng ô khung. H18: từng ô bảng, ô của mình. H12/H13: dòng đang chọn, bong bóng, nhãn lời giải GV.

### 9.6 Cổng CI & quy trình
- CI (`.github/workflows/ci.yml`, action ghim SHA): thêm job `student-design` chạy `bun run e2e:student-design` khi PR đổi file trong `src/features/elearning/**`, `src/components/portal/**`, `src/themes/**`, `src/components/erg-mui/**`, `docs/design/student-portal/**`. Đỏ = chặn merge. Đính kèm `playwright-report` (ảnh khác biệt) vào artifact của job.
- Mỗi PR có màn học sinh: mô tả PR phải có bảng "ArtboardId | ảnh thiết kế | ảnh app | diff" (lấy từ report) để người duyệt nhìn cạnh nhau.
- Không được sửa ảnh chuẩn lớp 3 trong cùng PR đổi giao diện mà không có dòng "Chủ dự án đã duyệt thay đổi giao diện: <link canvas bản mới>".
- Chạy lại toàn bộ `e2e:student-design` sau mỗi lần nâng MUI / đổi theme / đổi token.

### 9.7 Một màn chỉ "xong" khi
1. Ba lớp kiểm 9.3 xanh, policy 9.4 xanh.
2. Chạy được trên Safari 15 (BrowserStack hoặc máy thật iPhone 7) với ảnh chụp đính kèm PR: khung tròn, bục 3D, khiên hiển thị đúng.
3. Đủ trạng thái: đang tải (skeleton), rỗng, lỗi (banner thử lại), ngoại tuyến (dữ liệu cache + nhãn hiện có của PWA). Trạng thái nào thiết kế chưa có → đã hỏi (mục 12) và chủ dự án đã thêm vào canvas trước khi làm.
4. Bàn phím: Tab tới được mọi nút; segmented/chip dùng `role="tab"`/`aria-pressed`; ảnh/khiên có `aria-label` như HTML.
5. Chủ dự án duyệt ảnh app → lưu ảnh lớp 3.

---

## 10. Thứ tự làm

| Giai đoạn | Nội dung | Phụ thuộc |
|---|---|---|
| 0 | Ảnh gốc 9.1, manifest 9.3, fixture 9.2, project `student-design`, policy 9.4 (để đỏ trước) | — |
| 1 | Token mục 4, khung + khiên + chip bậc thành component `erg-mui` (`ErgTierFrame`, `ErgTierEmblem`, `ErgTierChip`) | 0 |
| 2 | Sidebar W + dock M mới (7.0) | 1 |
| 3 | BE 6.1 → FE Bài tập 3 tab (7.1–7.3) | 2 |
| 4 | BE 6.2 → FE Thi đua + Cả lớp (7.4–7.5) | 2 |
| 5 | BE 6.3, 6.4 → FE Bậc, Bảng bậc, Lên bậc, Khung (7.6–7.9) | 4 |
| 6 | BE 6.5, 6.6 → FE Hộp thư, Thảo luận (7.10–7.11) | 2 |
| 7 | Safari 15, trạng thái thiếu, a11y, duyệt ảnh lớp 3 | mỗi giai đoạn |

Mỗi giai đoạn một PR. Không gộp.

---

## 11. Quyết định người viết spec đã chốt (chủ dự án xem lại)
1. "Cả khóa" = năm học của lớp (01/09–31/08).
2. XP cả khóa = tổng XP tuần, hệ số chuỗi theo tuần.
3. Bằng XP thì ai đạt mốc trước đứng trên.
4. Học sinh cần ≥ 3 bài để được xếp bậc.
5. Mặc định dùng khung của bậc hiện tại cho tới khi tự chọn.
6. Màn "Lên bậc" chỉ khi lên **bậc**, không khi lên cấp; nhiều lần chưa xem thì chỉ hiện lần cao nhất.
7. Token huy chương đổi theo canvas (khác token đang có).
8. "Nộp muộn" (H11/H02d) và "Làm ngay" (H08) là outlined — đã sửa trên canvas bản 92 để mỗi màn tối đa 1 nút contained.

## 12. Câu hỏi mở (phải trả lời trước giai đoạn liên quan)
- **Q1** Mobile: vào Thảo luận từ đâu? (dock chỉ 5 ô)
- **Q2** Vương miện: MUI không có icon `crown` — dùng `WorkspacePremium` hay vẽ SVG riêng giống canvas?
- **Q3** Học sinh chưa đủ 3 bài: màn Bậc / chip bậc hiện gì? (thiết kế chưa có)
- **Q4** Đang trong tuần bảo vệ (sắp tụt): có báo cho học sinh không, ở đâu?
- **Q5** Trạng thái rỗng từng tab Bài tập, bảng thi đua đầu tuần (0 XP), Hộp thư rỗng, Thảo luận rỗng.
- **Q6** Màn Đã nộp, Quá hạn, Cả lớp, Bảng bậc không có nút contained — chấp nhận "tối đa 1" thay cho "đúng 1"?
- **Q7** Học sinh đang ở top 3: dải "đuổi theo" và nút contained của H08 đổi thành gì?
- **Q8** Màn Lên bậc có hiệu ứng (confetti rơi, khiên phóng to) không, hay giữ tĩnh như canvas?
- **Q9** Tablet 768–1023px: chưa có artboard. Dùng bố cục web thu gọn được không?
