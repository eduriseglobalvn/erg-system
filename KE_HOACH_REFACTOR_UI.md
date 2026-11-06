# Kế hoạch refactor UI 3 portal (admin · giáo viên · học sinh)

> Ngày quét: 05/11/2026 · Nhánh: `codex/mui-system-refactor` · Môi trường: `https://lms.erg.edu.local:3001`, tài khoản admin (xem cả 3 portal ở chế độ xem trước)
> Phương pháp: chụp màn hình 1440×900 và 375×812, đo DOM bằng script (tiêu đề, nút, bo góc, bóng, font, class Tailwind, icon), đối chiếu code (`src/components/portal`, theme, `erg-mui`, `dashboard`) và bộ quy tắc app-screen của skill `design-taste-frontend`.
> Giới hạn: tài khoản admin không có dữ liệu học sinh/lớp, nên phần lớn trang giáo viên/học sinh chỉ thấy trạng thái trống.

---

## 1. Mục tiêu

**Một hệ thống, ba mật độ.** Cả 3 portal dùng chung một "ngôn ngữ vật liệu" lấy từ menu admin vừa làm lại (thẻ nổi bo lớn, thẻ con nâng nhẹ, hàng 44px, mục chọn primary chữ trắng), và chỉ khác nhau ở mật độ:

| Portal | Người dùng | Mật độ | Tính cách |
|---|---|---|---|
| Admin | nhân sự vận hành, phiên dài | dày (bảng, lọc) | bình tĩnh, chính xác |
| Giáo viên | giáo viên trẻ, thao tác nhanh giữa giờ | vừa | nhanh, rõ việc cần làm tiếp |
| Học sinh | học sinh, nhiều trên điện thoại cũ (iPhone 7 / Safari 15) | thưa, chữ to | ấm, có phản hồi khi hoàn thành |

"Sang trọng" ở đây là: một bộ cỡ chữ, một bộ bo góc, một kiểu thẻ, chuyển động ngắn và nhất quán, màu chỉ dùng cho dữ liệu, trạng thái và đúng một hành động chính. Không phải thêm gradient, glow hay icon màu.

---

## 2. Kết quả quét: những chỗ đang lệch nhau

### 2.1 Lệch hệ thống (ảnh hưởng mọi trang)

| # | Vấn đề | Đo được | Nơi gây ra |
|---|---|---|---|
| S1 | **Tiêu đề trang có 5 cỡ**: 14, 16, 23.2, 24, 30px; 5 trang không có `h1` | admin/calendar 14 (breadcrumb là h1), quiz-bank/questions/class-log/teacher home 16, schools 23.2, employees 24, student 30 (h4) | Không có một PageHeader chung: `ErgPageHeader` (10 file), `DashboardPageShell` (8), `PageHeader` riêng của học sinh (4), 6 header riêng, 33 file tự render h1 |
| S2 | **4 bộ bo góc card**: 8, 12, 14, 16 (+ sidebar 20/12) | schools/list 14+16, reports 16+12, employees 16+8, teacher/reports 8 | token `radius` xs6–xl18 nhưng sidebar dùng 20/12 viết tay; `shape.borderRadius` 8 |
| S3 | **Card có bóng khi đứng yên** trên đa số trang admin và học sinh (`0 2px 8–12px rgba(0,0,0,.02–.03)`) | 6/7 trang admin có card | trái quy định "card chỉ viền" trong CLAUDE.md |
| S4 | **Portal học sinh không dùng shell chung**: aside 196/204px, nền `surfaceMuted`, logo ảnh ngoài, primary `#2563EB` ≠ token `#0F6CBD` | ảnh desktop học sinh | `student-dashboard-top-menu.tsx`, `student-dashboard-workspace-styles.tsx` |
| S5 | **Không có token chuyển động**: chỉ `160ms ease` viết cứng trên ButtonBase; sidebar tự định nghĩa `200ms cubic-bezier(0.16,1,0.3,1)` | | `erg-enterprise-theme.tsx:94`, `portal-sidebar-motion.ts` |
| S6 | **Mục menu không phải link**: `div role=button`, không `href` → không mở tab mới, không chuột giữa, không copy link | cả 3 portal | `portal-sidebar-leaf-item.tsx` |
| S7 | **4 kiểu chrome điện thoại khác nhau**: admin (hamburger + breadcrumb), giáo viên (top bar + bộ chọn lớp + dock 88px), học sinh (app bar + dock 5 mục), banner xếp chồng | ảnh 375px | `lms-mobile-shell`, `student-dashboard-mobile-shell`, `ErgPortalLayout` |
| S8 | **Thẻ KPI có icon trong ô màu** (xanh, tím, lục, cam) | admin/schools/reports, teacher/reports, student home | `DashboardMetricCard` và bản tự viết |
| S9 | **Thẻ lồng thẻ** cho trạng thái trống (khung nét đứt trong card) | teacher home, teacher/reports | `ErgEmptyState` đặt trong `DashboardSectionCard` |
| S10 | **Hai lớp component trùng nhau** | `DashboardMetricCard` vs `ErgMetricStrip`; `DashboardPageShell` vs `ErgPageSurface`+`ErgPageHeader`; `DashboardStatusBadge` vs `ErgStatusChip`; `ErgSelect` vs `AppSelect` | `src/components/dashboard`, `src/components/erg-mui` |
| S11 | **Nợ cũ còn hiển thị**: 3.259 class Tailwind ở 150 file feature, 71 file `lucide-react`, `#696CFF` ở 10 file (gồm chuông thông báo và thanh loading `route-feedback.tsx`) | trang Tài nguyên: 130 class Tailwind + 14 icon lucide | |
| S12 | **Chip trạng thái màu đặc chữ trắng** và tiêu đề bảng IN HOA giãn chữ | admin/calendar ("Đã xuất bản"), admin/schools/reports ("LỚP · KHỐI · SỐ HỌC SINH") | |

### 2.2 Lỗi nội dung thấy ngay trên giao diện

| Trang | Lỗi |
|---|---|
| `/admin/calendar` | Banner lỗi tiếng Anh "calendar date range must be between 1 and 31 days"; danh sách trường hiện UUID thô `01a171e6-…`; nhãn "DANH SÁCH TRƯỜNG" in hoa |
| `/admin/content/questions` | Tiêu đề dính chữ "Ngân hàngcâu hỏi" |
| `/admin/schools/reports` | Lộ ngôn ngữ dev: "lấy trực tiếp từ schoolOperations và chịu scope của phiên quản trị backend", "Số lượng do backend trả về", "Backend chưa trả điểm" |
| `/admin/learning-outcomes` | Tiêu đề phụ `fontWeight 850` (ngoài bộ 400/500/600/700) |
| `/student` | "Chưa có bài nào được giao" và "Tất cả bài tập đã được nộp. Tuyệt vời!" cùng lúc; thẻ "Thảo luận lớp" trống không một câu |
| `/student` (phone) | Thanh trên ghi "Quản trị viên" trong portal học sinh; 3 banner xếp chồng (xem trước, cài app, mạng yếu) đẩy nội dung xuống ~40% màn hình; nhãn KPI bị cắt "Bài đang …" |
| `/teacher` (phone) | 3 nút full-width xếp chồng (một nút bị vô hiệu "Chọn lớp") trước nội dung |
| `/teacher/score`, `/teacher/attendance` | Không có h1; bảng trống không có câu nào giải thích; tiêu đề 14px chen trong thanh công cụ |
| `/teacher/reports` | Hai tiêu đề chồng nhau ("Lớp học" trong thẻ + "Báo cáo lớp" h1 bên dưới) |
| `/admin/employees` (phone) | Tên người bị cắt "Trầ…" trong khi chip trạng thái chiếm chỗ |
| `/admin/content/quiz-editor`, `/admin/schools/students` | Vẫn trống sau 2,5 giây (cần kiểm tra là lỗi hay tải chậm) |

### 2.3 Cái đang tốt, giữ lại
- Menu admin/giáo viên (thẻ nổi, nhóm xổ trong thẻ con, thu gọn có flyout, ô tìm ⌘K, hàng người dùng).
- Một họ font Be Vietnam Pro được tải đúng trên mọi trang.
- `/teacher/reports` đã đúng hướng: card bo 8, không bóng.
- Thanh loading 3px duy nhất, `ContentPendingSkeleton`.
- PWA đã có nền tốt: `registerType: "prompt"` + `skipWaiting: false` (không tự thay phiên bản giữa bài thi), `use-service-worker-update.ts`, `use-install-prompt.ts`, hàng đợi offline (`OfflineShellStatus`, `OutboxQuarantineNotice`), shortcuts, file handler `.ergquiz`, `viewport-fit=cover`, `overscroll-behavior-y: none`, tắt tap highlight.

### 2.4 PWA (app cài trên điện thoại/máy tính)

| # | Vấn đề | Chi tiết |
|---|---|---|
| P1 | **3 tên cho một app** | manifest "ERG Learning", iOS "ERG LMS", tiêu đề trang "Hệ thống ôn luyện trực tuyến MOS & IC3"; shortcut lẫn Anh–Việt ("Teacher Workspace", "Student Workspace") và "Học viên" trong khi app dùng "Học sinh" |
| P2 | **Icon iOS lấy từ CDN ngoài** (`media.erg.edu.vn/logo/pwa.png`) | CDN chậm/sập là icon Màn hình chính hỏng; 4 shortcut dùng chung 1 icon; chưa có icon `monochrome` cho Android 13+ |
| P3 | **iOS không có màn khởi động** (`apple-touch-startup-image` không có) | mở app trên iPhone thấy màn trắng trước khi thanh boot hiện |
| P4 | **Banner chồng nhau** trên phone: "Cài đặt ERG Learning…", "Kết nối không ổn định", "Bạn đang xem với tư cách giáo viên" | lời mời cài app hiện ngay lần đầu, trước khi người dùng thấy giá trị |
| P5 | **Window Controls Overlay khai báo nhưng chưa dùng** | manifest bật `window-controls-overlay`, `globals.css` định nghĩa `--wco-*` nhưng không component nào dùng → bản cài trên Windows/Mac có thể để nút cửa sổ đè lên header (cần thử trên bản cài thật) |
| P6 | **Không có `screenshots` trong manifest** | Chrome Android/desktop chỉ hiện hộp cài đặt tối giản thay vì hộp có ảnh xem trước |
| P7 | **Trang offline (`public/offline.html`) tự viết style riêng** | không cùng hệ với app |
| P8 | **`start_url: "/"`** | mở app luôn đi qua trang chuyển hướng/đăng nhập thay vì vào thẳng portal lần trước |

---

## 3. Hướng thiết kế

Skill chia 2 phong cách hợp với LMS này (`draw.mjs --app --kind workspace --keep palette,type`):
- **Admin + giáo viên → "achromatic ledger"**: chrome không màu, màu primary chỉ ở mục menu đang chọn, nút chính và phần tử dữ liệu chính của trang; số liệu bằng mực đen, đổi màu chỉ khi tốt/xấu.
- **Trang chủ học sinh → "editorial greeting"**: lời chào là h1 trong cột giữa, số liệu chữ thường trên panel tông nhạt, một thẻ trắng duy nhất cho phần quan trọng nhất (bài cần làm hôm nay).

Giữ nguyên quyết định của dự án: primary `#0F6CBD`, Be Vietnam Pro, mỗi trang đúng 1 nút `contained`, mục menu đang chọn là nút primary chữ trắng.

### 3.1 Thang đo duy nhất (token mới/sửa trong `erg-enterprise-tokens.ts`)

**Chữ** (4 cỡ làm việc + 1 cỡ chào):
| Vai trò | Cỡ/độ đậm |
|---|---|
| Tiêu đề trang (h1) | 24/600 (phone 20/600) |
| Tiêu đề khối (h2) | 16/600 |
| Body, ô bảng, menu | 14/400 (menu 14/500) |
| Nhãn, meta, tiêu đề cột | 12/500, chữ thường, xám đạt 4.5:1 |
| Số KPI | 24/600, `tabular-nums` |
| Lời chào học sinh | 28/600 (phone 22) — ngoại lệ duy nhất |

**Bo góc** — rút từ menu (xem Quyết định D1):
| Token | Giá trị | Dùng cho |
|---|---|---|
| `radius.shell` | 20 | thẻ sidebar nổi, sheet điện thoại |
| `radius.card` | 14 | card nội dung, thẻ nhóm menu, dialog |
| `radius.control` | 10 | nút, ô nhập, hàng menu 44px (đang 12 → đổi hoặc giữ 12 cho cả control) |
| `radius.chip` | 999 | chip trạng thái, huy hiệu số |

**Bề mặt**: nền trang `surfaceSubtle`, card trắng + viền 1px `border`, **không bóng**. Bóng chỉ cho: sidebar nổi, menu, popover, dialog, toast, thanh dock điện thoại.

**Chuyển động** (`motion` trong tokens + `theme.transitions`):
| Token | Giá trị | Dùng cho |
|---|---|---|
| `duration.instant` | 100ms | nhấn nút, đổi màu hover |
| `duration.fast` | 160ms | hover, focus, chip, tooltip |
| `duration.base` | 220ms | mở menu/popover, xổ nhóm sidebar, đổi tab |
| `duration.slow` | 320ms | dialog, drawer, sheet điện thoại |
| `easing.standard` | `cubic-bezier(0.2, 0, 0, 1)` | phần lớn |
| `easing.emphasized` | `cubic-bezier(0.16, 1, 0.3, 1)` (đường cong sidebar đang dùng) | mở ra, xuất hiện |
| `easing.exit` | `cubic-bezier(0.3, 0, 1, 1)` | đóng, biến mất (ngắn hơn ~30%) |

### 3.2 Ý tưởng: "Văn phòng số sáng sủa"

ERG dạy **MOS và IC3**, tức là dạy chính các công cụ văn phòng số; primary `#0F6CBD` lại đúng là màu xanh của hệ Office. Thay vì trông như một template dashboard, LMS nên có cảm giác **của một bộ công cụ văn phòng hiện đại, sáng, chính xác**, và nhận ra được là của ERG qua 3 thứ chỉ ERG có:

1. **Môn học như những "ứng dụng".** Mỗi môn/chứng chỉ có một ô chữ cái cố định và một tông nhạt riêng: Word `W` (xanh dương), Excel `X` (xanh lá), PowerPoint `P` (cam), IC3 (xanh ngọc), Tiếng Anh (tím than sẫm, không dùng tím), Scratch/Python (vàng đất). Dùng ở thẻ bài tập, tên lớp, bộ lọc, cây tài nguyên. Đây là "danh tính" chứ không phải dữ liệu: chỉ tông nhạt, không đi vào biểu đồ. Học sinh nhìn màu là biết bài môn gì, như nhận ra icon app.
2. **Lộ trình chứng chỉ.** Với học sinh, câu hỏi lớn là "mình còn bao xa nữa thì thi được?". Trang chủ học sinh có một thanh lộ trình theo các mốc chuẩn đầu ra (đã có `/learning-outcomes`): mốc đã đạt tô đặc, mốc hiện tại có vòng, mốc sau rỗng. Đây là phần tử đặc trưng của sản phẩm, thay cho 4 thẻ KPI chung chung.
3. **"Hôm nay" của giáo viên.** Một dải thời gian các tiết dạy hôm nay với vạch "bây giờ", ngay dưới tiêu đề. Bên cạnh là hàng đợi "Cần chấm · Cần điểm danh · Sắp hết hạn", mỗi mục có nút làm ngay. Giáo viên trẻ mở app giữa hai tiết: 3 giây là biết việc tiếp theo.

### 3.3 Màu: một dải tông đầy đủ thay vì vài mã rời

- **Dải primary 10 bậc** sinh từ `#0F6CBD` (50 `#EEF5FC` → 900 `#0A3B66`). Hover, nền chọn nhạt, viền focus, nền biểu đồ đều lấy từ dải này, không pha `alpha()` tuỳ chỗ.
- **Trung tính hơi lạnh** (ánh xanh rất nhẹ, không phải slate/navy): nền `#F5F7FA`, card `#FFFFFF`, nền phụ `#F9FAFC`, viền `#E6EAF0`, vạch trong card `#EEF1F5`, chữ `#0E1726` / phụ `#4A5568` / meta `#667085` (đều ≥ 4.5:1).
- **Trạng thái**: chip nền nhạt + chữ đậm cùng sắc (đã có `statusTint`); đỏ chỉ cho cái thật sự quá hạn/lỗi, mỗi đối tượng tối đa một dấu đỏ.
- **Màu "thành tích" cho học sinh**: một màu vàng hổ phách duy nhất, chỉ cho chuỗi ngày học và huy hiệu đạt mốc. Không dùng ở admin/giáo viên.
- **Đỏ thương hiệu ERG** chỉ ở logo.

### 3.4 Chiều sâu: 3 lớp, không hơn

| Lớp | Vật liệu | Ví dụ |
|---|---|---|
| Nền | `#F5F7FA` phẳng | vùng nội dung |
| Mặt | trắng + viền 1px, không bóng | card, bảng, khung lọc |
| Nổi | trắng + bóng 2 tầng `0 1px 2px rgba(16,24,40,.04), 0 12px 32px rgba(16,24,40,.08)` | thẻ sidebar (đặc trưng của menu mới), menu, popover, dialog, dock điện thoại, toast |

Thẻ sidebar là vật nổi duy nhất đứng yên trên màn hình, nên nó nổi bật. Đó là lý do card nội dung phải phẳng.

### 3.5 Những chi tiết nhỏ làm nên cảm giác "đắt"

- **Tiếng Việt có dấu chồng** ("Ểễ", "Ửữ"): line-height body 1.5, tiêu đề ≥ 1.25, không bao giờ `overflow:hidden` sát dòng chữ. Tiêu đề 24px tracking `-0.01em`.
- **Số liệu**: `tabular-nums` mọi nơi có số; căn phải trong bảng; đơn vị nhỏ hơn và xám ("8,5 /10", "12 phút").
- **Icon**: chỉ một bộ `@mui/icons-material` biến thể **Rounded** (khớp bo góc mềm), 20px ở menu, 18px trong dòng, màu xám `#5B6576`; không icon trong ô màu.
- **Avatar**: chữ cái đầu trên tông nhạt cố định theo người (băm từ id), các người cạnh nhau lệch sắc ≥ 60°.
- **Focus**: vòng 2px primary-500 cách 2px, giống nhau ở nút, ô nhập, hàng menu, thẻ. Bàn phím đi hết mọi trang.
- **Thanh cuộn** mảnh 8px, chỉ hiện khi rê chuột; vùng chọn chữ màu primary-100.
- **Skeleton** đúng kích thước thật, tông `#EEF1F5`, không nhảy layout khi dữ liệu về.
- **Trạng thái trống** của học sinh (lần đầu, chưa có bài) dùng một bộ 6 hình minh hoạ nhỏ vẽ phẳng bằng chính bảng màu (bàn học, laptop mở Word, chứng chỉ, lịch…). Chỉ ở trạng thái trống toàn trang và màn "nộp bài xong", không rải vào mọi card. Admin/giáo viên: chỉ một câu + một hành động.
- **Văn bản**: tiêu đề là danh từ ("Bảng điểm"), mô tả nói về dữ liệu ("IC3 GS6 · 32 học sinh · cập nhật 09:14"), không nói về giao diện hay backend.

### 3.6 Ba màn hình mẫu (làm trước, các trang khác chép theo)

**Học sinh — Tổng quan (phone trước, desktop sau)**
```
┌────────────────────────────────┐
│ ERG  Tổng quan            🔔 (A)│  top bar 56px, safe-area
├────────────────────────────────┤
│ Chào Minh Anh,                 │  h1 22/600
│ hôm nay còn 2 bài.             │
│ ┌────────────────────────────┐ │  thẻ trắng duy nhất
│ │ [X] Excel · Hàm VLOOKUP    │ │  ô môn học tông xanh lá
│ │ Hạn 21:00 hôm nay · 15 câu │ │
│ │ [ Làm bài ]  (contained)   │ │
│ └────────────────────────────┘ │
│ Lộ trình MOS Excel             │
│ ●━━━●━━━◉───○───○  3/5 mốc     │  phần tử đặc trưng
│ Chuỗi học 6 ngày  ▮▮▮▮▮▮▯      │  màu hổ phách
│ Bài khác hôm nay   ›           │  danh sách 2 dòng
├────────────────────────────────┤
│ Tổng quan Bài tập Thảo luận …  │  dock 5 mục + safe-area
└────────────────────────────────┘
```

**Giáo viên — Trang chủ (desktop)**: h1 "Hôm nay, Thứ Năm 05/11" + bộ chọn lớp bên phải → dải tiết dạy với vạch "bây giờ" (2/3 chiều rộng) + hàng đợi việc cần làm (1/3) → bảng "Bài đang mở" với tỉ lệ nộp dạng thanh mảnh 1 màu.

**Admin — Giám sát đào tạo**: h1 + chọn trường + dấu cập nhật → một dải KPI chia vạch (không icon) → bảng lớp với tiêu đề cột chữ thường, số căn phải, cột "Cần chú ý" chỉ đỏ ở dòng có vấn đề.

---

## 4. Lộ trình (7 đợt gồm đợt PWA, mỗi đợt một PR, có thể dừng sau bất kỳ đợt nào)

Thứ tự: 0 → 1 → 2 → (3 ∥ PWA) → 4 → 5 (bắt đầu bằng 3 màn hình mẫu mục 3.6) → 6. Tổng khoảng 15–22 ngày công.

### Đợt 0 — Sửa lỗi nội dung (½ ngày, rủi ro thấp)
Toàn bộ bảng 2.2: dịch lỗi lịch sang tiếng Việt và hiện ngay dưới bộ chọn ngày; tên trường thay UUID; "Ngân hàng câu hỏi"; bỏ chữ backend/scope trên trang báo cáo; empty-state học sinh đúng nghĩa; nhãn "Học sinh" trên app bar học sinh; kiểm tra 2 trang trống.

### Đợt 1 — Nền móng: token + theme (1–2 ngày)
- Thêm token chữ/bo góc/chuyển động mục 3.1; đưa `NAV_*` radius/shadow và width 264 (đang lệch token 280) về token.
- Theme: `MuiCard`/`MuiPaper` (variant outlined) bỏ bóng; `transitions` dùng token; `ButtonBase` dùng `duration.fast`.
- Bảng: tiêu đề cột 12/500 chữ thường, không nền; số căn phải `tabular-nums`.
- `MuiChip` trạng thái: nền nhạt + chữ đậm cùng sắc (`statusTint` đã có).
- Lint/verify: chặn `boxShadow` trên Card, `fontWeight` ngoài 400–700, thêm `#696CFF` vào danh sách cấm. Hạ baseline token.
- **Kiểm tra**: `bun run verify`, chụp lại 6 trang mẫu so trước/sau.

### Đợt 2 — Một shell cho cả 3 portal (2–3 ngày)
- **Học sinh chuyển sang `ErgPortalLayout`** với biến thể `variant="student"`: cùng thẻ nổi, cùng hàng 44px, cùng mục chọn primary; menu phẳng 4–5 mục, không nhóm; logo dùng `PortalSidebarWorkspaceHeader` như admin. Xoá `TopMenuShell` và bảng màu riêng `MUI_PRIMARY #2563EB`.
- **Mục menu thành link thật**: `ListItemButton component={Link}` (TanStack `Link`) — có `href`, mở tab mới, giữ `aria-current`.
- **Học sinh có URL cho từng tab** (`/student/assignments`, `/student/discussions`, `/student/notifications`) để nút Back và chia sẻ link hoạt động; mục menu là link như trên.
- **Chrome điện thoại thống nhất** cho giáo viên + học sinh: top bar 56px (tên trang + 1 hành động) + dock 5 mục cùng một component; admin giữ drawer. **Một khe thông báo duy nhất** dưới top bar: chỉ hiện banner ưu tiên cao nhất (xem trước › mất mạng › cài app), các cái khác gom vào chuông.
- Giữ shell < 200 dòng (quy tắc CLAUDE.md).

### Đợt 3 — Bộ component chung (2–3 ngày)
- **Một `ErgPageHeader`** cho mọi trang: không breadcrumb ở trang cấp menu (sidebar đã cho biết đang ở đâu; breadcrumb chỉ dùng ở trang chi tiết như một trường, một lớp, một bài), h1 24/600, 1 dòng mô tả xám về dữ liệu (không mô tả giao diện), hành động bên phải (tối đa 1 contained), dấu thời gian cập nhật nếu có. Thay `DashboardPageShell`, `PageHeader` học sinh, 6 header riêng; 33 file tự render h1 chuyển dần trong đợt 4–5.
- **Một `ErgMetricStrip`**: một card chia cột bằng vạch 1px, nhãn trên số, không icon ô màu, không sparkline; delta ghi rõ mốc so sánh; 0 là "0", thiếu là "—" xám. Xoá `DashboardMetricCard`.
- **`ErgEmptyState` có 2 kiểu**: trong khối (1 câu + 1 hành động chữ, không khung lồng) và toàn trang (lần đầu sử dụng). Bảng trống luôn có 1 câu trong khung bảng.
- **`ErgSectionCard`** (gộp `DashboardSectionCard`): tiêu đề khối 16/600 + hành động "Xem tất cả" bên phải, padding 20/24, không bóng.
- Gộp `DashboardStatusBadge`→`ErgStatusChip`, `ErgSelect`↔`AppSelect` (giữ một).
- Trang `ui-kit` (`/admin/ui-kit` đã có route) làm nơi xem mọi component ở mọi trạng thái.

### Đợt 4 — Chuyển động (1–2 ngày, không thêm thư viện)
Dùng `Fade`/`Grow`/`Collapse` của MUI + CSS keyframes; chỉ `transform` và `opacity`; mọi chuyển động có nhánh `prefers-reduced-motion` (theme đã có công tắc).

| Ở đâu | Chuyển động | Thông số |
|---|---|---|
| Đổi trang (vùng nội dung) | mờ dần + nâng 4px | 180ms, `emphasized`; không chạy cho từng phần tử con |
| Skeleton → dữ liệu | crossfade, không nhảy layout | 160ms; skeleton đúng kích thước thật |
| Nhóm sidebar xổ/thu | `Collapse` cao + mũi tên xoay 180° | 220ms |
| Sidebar thu gọn/mở rộng | width + nhãn mờ dần | 220ms (đang có, đưa về token) |
| Nút | nhấn `scale(0.98)`; hover đổi nền | 100ms / 160ms |
| Hàng bảng / thẻ bấm được | hover nền `surfaceSubtle`; thẻ học sinh viền chuyển primary + nâng 1px (không bóng) | 160ms |
| Menu, popover, select | `Grow` từ gốc neo | 220ms vào / 150ms ra |
| Dialog, sheet điện thoại | dialog scale 0.96→1 + mờ; sheet trượt từ dưới | 320ms |
| Hàng mới thêm / xoá | hàng mới tô nền primary nhạt rồi tắt dần; hàng xoá thu chiều cao | 600ms / 220ms |
| Tab | thanh chỉ báo trượt (MUI Tabs có sẵn) | 220ms |
| **Học sinh — nộp bài xong** | dấu tích vẽ nét (SVG `stroke-dashoffset`) + vòng tiến độ tăng tới giá trị thật | 600ms, một lần |
| **Học sinh — số liệu** | số đếm lên khi vào trang lần đầu trong phiên | 400ms |

Tránh (Safari 15): View Transitions API, scroll-driven animations, `@container`. Không confetti, không parallax, không hiệu ứng xuất hiện lần lượt cho mọi phần tử ở admin/giáo viên.

### Đợt 5 — Làm lại từng trang theo thứ tự lượt dùng (4–6 ngày)
Mỗi trang: một câu hỏi chính ở trên cùng, một hành động chính cách 1 cú bấm, dùng component đợt 3.

**Học sinh** (ưu tiên 1 — người dùng đông nhất, nhiều trên điện thoại)
1. Tổng quan: lời chào h1 → "Bài cần làm hôm nay" là khối lớn nhất (thẻ trắng duy nhất, có hạn nộp và nút Làm bài); KPI dạng strip chữ; thảo luận có câu trống đúng nghĩa.
2. Bài tập: danh sách 2 dòng trên phone (tên + hạn / môn · số câu), lọc dạng chip 1 hàng.
3. Làm bài/kết quả: màn hình nộp xong có phản hồi (đợt 4).
4. Thảo luận, Thông báo, Hồ sơ.

**Giáo viên** (ưu tiên 2)
1. Trang chủ: h1 24 (không phải lời chào 16px); hàng hành động phone gộp còn 1 nút chính + menu "⋯"; KPI strip; bỏ khung lồng ở trạng thái trống.
2. Bảng điểm & Điểm danh: thêm h1 + mô tả lớp; thanh công cụ 1 hàng; chú thích Có mặt/Muộn/Vắng/Có phép thành chip nhạt cùng hệ; bảng trống có câu hướng dẫn; cột ngày hôm nay đánh dấu bằng 1 đường primary.
3. Báo cáo lớp: bỏ thẻ "Lớp học" trùng tiêu đề, KPI strip, biểu đồ 1 màu primary.
4. Hoạt động học tập (6 trang con), Lịch làm việc, Sổ đầu bài.

**Admin** (ưu tiên 3 — đã gần chuẩn nhất)
1. Tài nguyên (dùng chung với giáo viên): bỏ Tailwind + lucide, toolbar MUI, cây thư mục dùng icon outline xám, khu chọn có trạng thái hover/selected cùng hệ menu.
2. Giám sát đào tạo, Danh sách trường, Lịch trung tâm.
3. Ngân hàng bài tập/câu hỏi, Tạo Quiz, Nhân sự, Quyền & nhóm quyền, Chuẩn đầu ra, Tích hợp.

**Kiểm tra mỗi trang**: chụp 1440/768/390, `node .claude/skills/design-taste-frontend/scripts/inspect.mjs --app <url>` (0 FAIL), dữ liệu thật và trạng thái trống/lỗi/đang tải, bàn phím đi hết được.

### Đợt PWA — App cài đặt cảm giác như app thật (2–3 ngày, chạy song song từ sau đợt 2)

Mục tiêu: mở từ Màn hình chính thì không thấy dấu hiệu "đây là trang web".

**Danh tính & cài đặt**
- Một tên: **"ERG Learning"** (manifest, `apple-mobile-web-app-title`, `<title>` dạng "Tên trang · ERG Learning"). Shortcut tiếng Việt, đúng chữ "Học sinh", mỗi shortcut một icon riêng (glyph trắng trên ô primary).
- Icon tự host trong `public/`: apple-touch-icon 180, maskable kiểm tra vùng an toàn 80%, thêm `monochrome`.
- iOS splash: bộ `apple-touch-startup-image` (các cỡ iPhone 7 → 15 Pro Max, dọc) nền `#F5F7FA` + logo giữa, khớp đúng màn boot trong `index.html` để chuyển cảnh liền mạch.
- `screenshots` trong manifest (2 ảnh `narrow` học sinh/giáo viên, 1 ảnh `wide`) để có hộp cài đặt có ảnh.
- `start_url` → `/?source=pwa` vẫn giữ, nhưng trang gốc chuyển thẳng tới portal dùng lần cuối nếu còn phiên (không hiện trang đăng nhập rồi mới nhảy).

**Lời mời cài đặt đúng lúc**
- Không hiện ở lần mở đầu. Hiện một thẻ nhỏ trong nội dung (không phải banner trên cùng) sau khi học sinh nộp bài đầu tiên / giáo viên giao bài đầu tiên, hoặc ở lần ghé thứ 3. Đóng là im 14 ngày.
- iOS (không có `beforeinstallprompt`): bottom sheet 3 bước có hình "Chia sẻ → Thêm vào MH chính".
- Đã cài (`display-mode: standalone`) thì ẩn mọi lời mời.

**Khung app khi chạy standalone**
- Safe area: top bar cộng `env(safe-area-inset-top)`, dock cộng `env(safe-area-inset-bottom)`; nội dung cuộn không bị dock che (padding đáy = chiều cao dock + inset).
- Chỉ vùng nội dung cuộn, top bar và dock đứng yên; giữ vị trí cuộn từng tab khi chuyển qua lại trong dock.
- `user-select: none` cho dock, menu, nút (không cho nội dung); phản hồi nhấn tức thì (`:active` trong 100ms) vì người dùng chạm, không rê chuột.
- Kéo để làm mới tự làm cho danh sách bài tập/thông báo (vì `overscroll-behavior: none` đã tắt cái của trình duyệt): vòng xoay nhỏ trong top bar, chỉ `transform`.
- Desktop cài đặt: dùng `--wco-*` để top bar nằm đúng vùng tiêu đề cửa sổ và kéo được (`-webkit-app-region: drag`), nút vẫn bấm được (`no-drag`). Nếu không kịp làm thì bỏ `window-controls-overlay` khỏi `display_override`.
- `theme-color` theo chế độ standalone để thanh trạng thái iOS/Android cùng màu top bar (trắng), không phải xanh.

**Một khe thông báo duy nhất** (dùng chung với đợt 2), theo thứ tự ưu tiên: đang xem trước › mất mạng/đang gửi bài chờ › có phiên bản mới › mời cài. Mỗi lúc chỉ một dòng, cao 36px, gọn trong top bar; phần còn lại vào chuông thông báo.
- **Ngoại tuyến**: chip trong top bar "Ngoại tuyến · 2 bài chờ gửi" (dùng `OfflineShellStatus`), bấm mở danh sách chờ. Khi có mạng lại: chip chuyển xanh "Đã gửi 2 bài" 3 giây rồi biến mất.
- **Cập nhật**: "Có phiên bản mới · Cập nhật" chỉ hiện khi không ở trong bài làm/thi; bấm thì tải lại có thanh boot 3px, không màn trắng.
- **Thông báo đẩy**: chỉ xin quyền khi người dùng bật "Nhắc hạn nộp" (học sinh) hoặc "Báo khi lớp nộp bài" (giáo viên), không xin khi mở app.
- **Trang offline** (`offline.html`) làm lại cùng token: logo, "Bạn đang ngoại tuyến", danh sách bài đã lưu để làm tiếp, nút "Thử lại".

**Hiệu năng trên iPhone 7 / 3G**
- Preload Be Vietnam Pro 400/600 subset vietnamese; 500/700 tải sau.
- Không `backdrop-filter`, không bóng động trên phần tử cuộn; chuyển động chỉ `transform`/`opacity`.
- Mục tiêu: chạm vào dock → trang mới hiện khung trong < 100ms (skeleton từ cache), LCP < 2,5s trên 3G nhanh.

**Kiểm tra**: Lighthouse PWA/Best practices trên bản build, cài thật trên 1 Android + 1 iPhone (iOS 15 nếu có) + Chrome Windows; thử bật chế độ máy bay giữa lúc làm bài.

### Đợt 6 — Dọn nợ (song song đợt 5)
Gỡ `lucide-react` (71 file) và `tailwindcss` khỏi `package.json` khi số file về 0; xoá `#696CFF` (10 file); xoá `src/components/dashboard` sau khi không còn import.

---

## 5. Đo thành công

| Chỉ số | Hiện tại | Mục tiêu |
|---|---|---|
| Số cỡ tiêu đề trang | 5 | 1 (24, phone 20) |
| Trang thiếu h1 | ≥ 5 | 0 |
| Số giá trị bo góc card | 4 | 1 |
| Card có bóng khi đứng yên | phần lớn admin/học sinh | 0 |
| Shell khác nhau | 2 desktop + 3 phone | 1 desktop + 1 phone (+ drawer admin) |
| Thẻ KPI có icon ô màu | ≥ 3 trang | 0 |
| Class Tailwind / file lucide | 3.259 / 71 | 0 / 0 |
| Chuyển động viết tay ngoài token | nhiều | 0 |
| `inspect.mjs --app` | chưa chạy | 0 FAIL trên mọi trang đã làm |
| Banner hiện cùng lúc trên phone | 3 | tối đa 1 |
| Tên app khác nhau | 3 | 1 |
| Màn trắng khi mở app iOS | có | không (splash khớp màn boot) |
| Lighthouse PWA / Best practices (bản build) | chưa đo | đạt hết mục cài đặt; ≥ 95 |

---

## 6. Quyết định cần chủ dự án chốt

- **D1 — Bo góc.** Menu mới dùng họ "mềm" (20 / 14 / 12) nhưng CLAUDE.md đang ghi card 8px, nút 6px. Để khớp menu, đề xuất chuyển cả hệ sang họ mềm (shell 20, card 14, control 10, chip tròn) và cập nhật CLAUDE.md. Nếu giữ 8/6 thì phải làm lại menu cho khớp.
- **D2 — Mục menu đang chọn.** Code hiện là gradient primary + bóng màu; CLAUDE.md ghi "nút primary đặc". Đề xuất về primary đặc, giữ bóng nhẹ (thẻ menu là vật nổi) — nhìn gần như cũ, bỏ được gradient duy nhất trong hệ.
- **D3 — URL cho tab học sinh** (đợt 2): thay đổi route, cần thêm dòng trong `ROUTE_PERMISSION_MATRIX`.
- **D4 — Màu môn học** (mục 3.2): bảng màu cho từng môn/chứng chỉ, và việc dùng chữ cái W/X/P gợi nhắc Office (chỉ là chữ cái trên tông màu, không dùng logo Microsoft).
- **D5 — Minh hoạ cho học sinh** (mục 3.5): đồng ý bộ 6 hình vẽ phẳng cho trạng thái trống/nộp bài xong, hay chỉ dùng chữ.
- **D6 — Tên app**: "ERG Learning" hay tên khác.
